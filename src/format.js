// src/format.js
export function formatPretty(items) {
  const lines = [];
  lines.push(`Collected ${items.length} post(s). Oldest → newest:\n`);
  items.forEach((it, idx) => {
    lines.push(
      `${String(idx + 1).padStart(3, " ")}. ${it.title}\n` +
      `     url: ${it.url}\n` +
      `     age: ${it.ageText} | score: ${it.score || "0 points"} | by: ${it.by || "unknown"} | ${it.commentsText || "0 comments"}`
    );
  });
  return lines.join("\n") + "\n";
}

export function formatJSON(items) {
  return JSON.stringify(items, null, 2) + "\n";
}

// Zero-dep CSV (simple, safe fields with quotes)
function csvEscape(s = "") {
  const str = String(s);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}
export function formatCSV(items) {
  const headers = ["title", "url", "ageText", "score", "by", "commentsText"];
  const rows = [
    headers.join(","),
    ...items.map((it) => headers.map((h) => csvEscape(it[h] || "")).join(",")),
  ];
  return rows.join("\n") + "\n";
}
