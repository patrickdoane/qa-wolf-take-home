// src/cli.js
import { crawlUntilTarget } from "./scrape.js";
import { filterByMinAgeMinutes, sortByAgeAscending } from "./parse.js";
import { formatPretty, formatJSON, formatCSV } from "./format.js";

function parseArgs(argv) {
  const args = {
    pages: 10,        // allow up to 10 by default so we can hit the target reliably
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
`);
}

(async function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) { printHelp(); process.exit(0); }

  const items = await crawlUntilTarget({
    target: isNaN(opts.target) ? 100 : opts.target,
    maxPages: isNaN(opts.pages) ? 10 : opts.pages,
    headless: !opts.headful,
    navTimeout: isNaN(opts.timeout) ? 15000 : opts.timeout,
  });

  // Filter (optional), GLOBAL sort, then slice to exact target.
  const filtered = filterByMinAgeMinutes(items, opts.minAge);
  const globallySorted = sortByAgeAscending(filtered);
  const finalItems = globallySorted.slice(0, opts.target);

  let out = "";
  switch ((opts.format || "pretty").toLowerCase()) {
    case "json": out = formatJSON(finalItems); break;
    case "csv":  out = formatCSV(finalItems);  break;
    default:     out = formatPretty(finalItems);
  }
  process.stdout.write(out);
})().catch((e) => {
  console.error("ERROR:", e?.message || e);
  process.exit(1);
});
