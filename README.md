# QA Wolf Take-Home Assignment – Question 1

This project is my submission for **QA Wolf’s QA Engineer take-home assignment**.  
The task: use **Playwright** to scrape Hacker News (“newest” page) and print articles sorted by **age (oldest → newest)**.  

I extended the baseline solution into a small **CLI tool** that is:
- ✅ **Deterministic** – always sorts globally, not page-by-page.  
- ✅ **Flexible** – multiple output formats (pretty, JSON, CSV).  
- ✅ **Configurable** – flags for target size, page depth, filtering, and more.  
- ✅ **Tested** – includes unit tests for age parsing and global sort validation.  

---

## 🚀 Features
- Crawl Hacker News “newest” posts using Playwright.
- Collect across multiple pages (with retry handling).
- Compute ages (minutes/hours/days → epoch) for reliable sorting.
- Global sort (oldest → newest) applied before output.
- Configurable output:  
  - `pretty` (human-readable console)  
  - `json` (machine-readable, structured)  
  - `csv` (for spreadsheets / data pipelines)  
- CLI flags:
  - `--target=N` → fetch exactly **N posts** (default: 100).  
  - `--pages=N` → maximum number of pages to crawl (default: 4, extends automatically if needed).  
  - `--format=pretty|json|csv` → output format.  
  - `--min-age=MIN` → filter to posts at least MIN minutes old.  
  - `--headful` → run browser with UI (default is headless).  
  - `--timeout=MS` → navigation/wait timeout in ms (default: 15000).  
  - `help` / `h` → show usage info.  

---

## 🛠️ Setup

Requires **Node.js ≥18**.

```bash
git clone https://github.com/patrickdoane/qa-wolf-take-home.git
cd qa-wolf-take-home
npm install
