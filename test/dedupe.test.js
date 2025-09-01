// test/dedupe.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { sortByAgeAscending, isSortedByAgeAscending, ensureAges } from "../src/parse.js";

// Simulate two pages where one story appears on both pages
const page1 = [
  { id: "424242", title: "A", ageText: "2 days ago" },
  { id: "111111", title: "B", ageText: "3 hours ago" },
];

const page2 = [
  { id: "424242", title: "A (dup)", ageText: "2 days ago" }, // duplicate id
  { id: "222222", title: "C", ageText: "30 minutes ago" },
];

function dedupeById(items) {
  const seen = new Map();
  for (const it of items) {
    if (!seen.has(it.id)) seen.set(it.id, it);
  }
  return Array.from(seen.values());
}

test("dedupe by id across pages and globally sort", () => {
  const concatenated = [...page1, ...page2]; // has duplicate id "424242"
  const deduped = dedupeById(concatenated);

  // Expect 3 unique items after dedupe
  assert.equal(deduped.length, 3);
  assert.ok(deduped.find((it) => it.id === "424242"));
  assert.ok(deduped.find((it) => it.id === "111111"));
  assert.ok(deduped.find((it) => it.id === "222222"));

  const withAges = ensureAges(deduped);
  const sorted = sortByAgeAscending(withAges);
  assert.equal(isSortedByAgeAscending(sorted), true);

  // Oldest should be "2 days ago"
  assert.equal(sorted[0].id, "424242");
});
