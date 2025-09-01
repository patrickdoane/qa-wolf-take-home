// src/scrape.js
import { chromium } from "playwright";
import { parseAgeToEpoch } from "./parse.js";

async function withRetries(fn, { attempts = 3, delayMs = 300 } = {}) {
  let err;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (e) {
      err = e;
      if (i < attempts - 1) await new Promise(r => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw err;
}

async function collectPageItems(page) {
  await page.waitForSelector("tr.athing", { timeout: 10_000 });
  return await page.$$eval("tr.athing", (rows) => {
    return rows.map((row) => {
      const id = row.getAttribute("id") || ""; // <-- canonical HN story id
      const titleLink = row.querySelector(".titleline a");
      const title = titleLink?.textContent?.trim() || "";
      const url = titleLink?.getAttribute("href") || "";

      const sub = row.nextElementSibling;
      const subtext = sub?.querySelector(".subtext");
      const ageLink = subtext?.querySelector(".age a");
      const ageText = ageLink?.textContent?.trim() || "";

      const score = subtext?.querySelector(".score")?.textContent?.trim() || "";
      const by = subtext?.querySelector(".hnuser")?.textContent?.trim() || "";
      const commentsText =
        Array.from(subtext?.querySelectorAll("a") || [])
          .map((a) => a.textContent?.trim() || "")
          .find((t) => /comment/.test(t)) || "";

      return { id, title, url, ageText, score, by, commentsText };
    });
  });
}

function dedupeById(items) {
  const seen = new Map(); // id -> item
  for (const it of items) {
    if (!it?.id) continue; // skip weird rows (shouldn't happen)
    if (!seen.has(it.id)) seen.set(it.id, it);
  }
  return Array.from(seen.values());
}

/**
 * Crawl forward through “newest” by clicking “More”, collecting unique items
 * until we reach `target` or run out of pages (maxPages).
 */
export async function crawlUntilTarget({
  target = 100,
  maxPages = 10,
  headless = true,
  navTimeout = 15_000,
} = {}) {
  const browser = await chromium.launch({ headless });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(navTimeout);
  page.setDefaultTimeout(navTimeout);

  try {
    await withRetries(() =>
      page.goto("https://news.ycombinator.com/newest", { waitUntil: "domcontentloaded" })
    );

    let all = [];
    for (let i = 0; i < maxPages; i++) {
      const items = await withRetries(() => collectPageItems(page));
      all = dedupeById(all.concat(items));
      if (all.length >= target) break;

      const more = page.locator("a.morelink");
      if (!(await more.count())) break;

      await withRetries(async () => {
        await more.first().click();
        await page.waitForLoadState("domcontentloaded");
      });
    }

    // enrich ages now (so CLI doesn’t need to) — still OK to re-ensure later
    const enriched = all.map((it) => ({ ...it, __age: parseAgeToEpoch(it.ageText) }));
    return enriched;
  } finally {
    await browser.close();
  }
}
