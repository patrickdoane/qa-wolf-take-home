// src/cli.js
import { crawlUntilTarget } from "./scrape.js";
import { filterByMinAgeMinutes, sortByAgeAscending } from "./parse.js";
import { formatPretty, formatJSON, formatCSV } from "./format.js";

function parseArgs(argv) {
  const args = {
    pages: 10,
    format: "pretty",
    headful: false,
    minAge: 0,
    target: 100,
    timeout: 15000,
    order: "desc", // NEW: default newest first to match what you see on HN
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const al = a.toLowerCase();
    if (al.startsWith("--pages=")) args.pages = parseInt(a.split("=")[1], 10);
    else if (al.startsWith("--format=")) args.format = a.split("=")[1];
    else if (al.startsWith("--min-age=")) args.minAge = parseInt(a.split("=")[1], 10);
    else if (al.startsWith("--target=")) args.target = parseInt(a.split("=")[1], 10);
    else if (al.startsWith("--order=")) args.order = a.split("=")[1].toLowerCase(); // asc|desc
    else if (al === "--headful") args.headful = true;
    else if (al.startsWith("--timeout=")) args.timeout = parseInt(a.split("=")[1], 10);
    else if (al === "--help" || al === "-h" || al === "help" || al === "h") args.help = true;
  }
  return args;
}

function printHelp() {
  console.log(`
Usage:
  node src/cli.js [--target=N] [--pages=N] [--format=pretty|json|csv] [--order=asc|desc] [--min-age=MIN] [--headful] [--timeout=MS]
  node src/cli.js help | h

Defaults:
  --target=100  --order=desc (newest first)  --pages=10  --format=pretty

Examples:
  node src/cli.js
  node src/cli.js --order=asc            # oldest first
  node src/cli.js --target=50 --format=json
  node src/cli.js --target=200 --pages=12 --min-age=120 --format=csv
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

  // Filter → global sort ascending → apply order → slice to EXACT target
  const filtered = filterByMinAgeMinutes(items, opts.minAge);
  const asc = sortByAgeAscending(filtered);
  const ordered = opts.order === "asc" ? asc : asc.slice().reverse();
  const finalItems = ordered.slice(0, opts.target);

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
