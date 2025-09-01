// src/cli.js
import { crawlAndSort } from "./scrape.js";
import { filterByMinAgeMinutes, sortByAgeAscending } from "./parse.js";
import { formatPretty, formatJSON, formatCSV } from "./format.js";

function parseArgs(argv) {
  const args = {
    pages: 4,
    format: "pretty",
    headful: false,
    minAge: 0,
    target: 100,
    timeout: 15000,
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i].toLowerCase();
    if (a.startsWith("--pages=")) args.pages = parseInt(a.split("=")[1], 10);
    else if (a.startsWith("--format=")) args.format = a.split("=")[1];
    else if (a.startsWith("--min-age=")) args.minAge = parseInt(a.split("=")[1], 10);
    else if (a.startsWith("--target=")) args.target = parseInt(a.split("=")[1], 10);
    else if (a === "--headful") args.headful = true;
    else if (a.startsWith("--timeout=")) args.timeout = parseInt(a.split("=")[1], 10);
    else if (a === "--help" || a === "-h" || a === "help" || a === "h") args.help = true;
  }
  return args;
}

function printHelp() {
  console.log(`
Usage:
  node src/cli.js [--target=N] [--pages=N] [--format=pretty|json|csv] [--min-age=MIN] [--headful] [--timeout=MS]
  node src/cli.js help | h

Examples:
  node src/cli.js                 # fetches 100 posts by default
  node src/cli.js --target=50     # fetch exactly 50 posts
  node src/cli.js --target=200 --format=json
  node src/cli.js help            # show this help
  node src/cli.js h               # show this help (short alias)
`);
}

(async function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    printHelp();
    process.exit(0); // <- ensure no crawling happens after help
  }

  let collected = [];
  let pagesScanned = 0;

  while (collected.length < opts.target) {
    // We still crawl one page at a time but we'll do a GLOBAL sort later.
    const batch = await crawlAndSort({
      pagesToScan: 1,
      headless: !opts.headful,
      navTimeout: opts.timeout,
    });
    collected.push(...batch);
    pagesScanned++;

    if (pagesScanned >= opts.pages && collected.length < opts.target) {
      console.warn(`⚠️ Only ${collected.length} items found after ${opts.pages} pages (target ${opts.target}).`);
      break;
    }
  }

  // Filter (if any), then GLOBAL sort, then slice to exact target.
  const filtered = filterByMinAgeMinutes(collected, opts.minAge);
  const globallySorted = sortByAgeAscending(filtered);
  const finalItems = globallySorted.slice(0, opts.target);

  let out = "";
  switch ((opts.format || "pretty").toLowerCase()) {
    case "json":
      out = formatJSON(finalItems);
      break;
    case "csv":
      out = formatCSV(finalItems);
      break;
    default:
      out = formatPretty(finalItems);
  }
  process.stdout.write(out);
})().catch((e) => {
  console.error("ERROR:", e?.message || e);
  process.exit(1);
});
