const { chromium } = require("playwright");

function parseAgeToEpoch(ageText) {
  const m = ageText.trim().match(/^(\d+)\s+(minute|minutes|hour|hours|day|days)\s+ago$/i);
  if (!m) return Date.now();
  const num = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  let minutes = num;
  if (unit.startsWith("hour")) minutes = num * 60;
  if (unit.startsWith("day")) minutes = num * 24 * 60;
  return Date.now() - minutes * 60_000;
}

async function collectPageItems(page) {
  await page.waitForSelector("tr.athing");
  return await page.$$eval("tr.athing", (rows) => {
    return rows.map((row) => {
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
      return { title, url, ageText, score, by, commentsText };
    });
  });
}

async function sortHackerNewsArticlesManyPages(pagesToScan = 3) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("https://news.ycombinator.com/newest", { waitUntil: "domcontentloaded" });

  const all = [];
  for (let i = 0; i < pagesToScan; i++) {
    const items = await collectPageItems(page);
    all.push(...items);
    const more = page.locator("a.morelink");
    if (!(await more.count())) break;
    await more.first().click();
    await page.waitForLoadState("domcontentloaded");
  }

  const enriched = all.map((it) => ({ ...it, ageEpoch: parseAgeToEpoch(it.ageText) }));
  enriched.sort((a, b) => a.ageEpoch - b.ageEpoch);

  console.log(`Collected ${enriched.length} posts across ${pagesToScan} page(s). Oldest → newest:\n`);
  enriched.forEach((it, idx) => {
    console.log(
      `${String(idx + 1).padStart(3, " ")}. ${it.title}\n` +
      `     url: ${it.url}\n` +
      `     age: ${it.ageText} | score: ${it.score || "0 points"} | by: ${it.by || "unknown"} | ${it.commentsText || "0 comments"}\n`
    );
  });

  await browser.close();
}

(async () => {
  const pagesArg = parseInt(process.argv[2] || "3", 10);
  await sortHackerNewsArticlesManyPages(isNaN(pagesArg) ? 3 : pagesArg);
})();
