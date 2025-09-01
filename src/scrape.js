// src/scrape.js
import { chromium } from "playwright";
import { parseAgeToEpoch } from "./parse.js";

// Utility: retry an async op with small backoff
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

// Extract items on the current page
async function collectPageItems(page) {
  await page.waitForSelector("tr.athing", { timeout: 10_000 });
  return await page.$$eval("tr.athing", (rows) => {
    return rows.map((row) => {
      const titleLink = row.querySelector(".titleline a");
      const title = titleLink?.textContent?.trim() || "";
      const url = titleLink?.getAttribute("href") || "";

      // subtext row is nextElementSibling
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

      return { title, url, ageText, score, by, commentsText };
    });
  });
}

export async function crawlAndSort({
  pagesToScan = 3,
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

    const all = [];
    for (let i = 0; i < pagesToScan; i++) {
      const items = await withRetries(() => collectPageItems(page));
      all.push(...items);

      const more = page.locator("a.morelink");
      const hasMore = await more.count();
      if (!hasMore) break;

      await withRetries(async () => {
        await more.first().click();
        await page.waitForLoadState("domcontentloaded");
      });
    }

    // enrich with age epoch/minutes to sort & filter
    const enriched = all.map((it) => {
      const parsed = parseAgeToEpoch(it.ageText);
      return { ...it, __age: parsed };
    });

    enriched.sort((a, b) => a.__age.epoch - b.__age.epoch); // oldest → newest
    return enriched;
  } finally {
    await browser.close();
  }
}
