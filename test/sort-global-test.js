// test/sort-global.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { isSortedByAgeAscending, sortByAgeAscending } from "../src/parse.js";

const item = (title, ageText) => ({ title, ageText });

test("global sort across concatenated per-page batches", () => {
  // Batch 1: sorted oldest → newest (3h, 1h)
  const batch1 = [
    item("batch1-older", "3 hours ago"),
    item("batch1-newer", "1 hour ago"),
  ];

  // Batch 2: sorted oldest → newest (2 days, 30m)
  const batch2 = [
    item("batch2-older", "2 days ago"),
    item("batch2-newer", "30 minutes ago"),
  ];

  const concatenated = [...batch1, ...batch2];

  // Concatenation is not globally sorted.
  assert.equal(isSortedByAgeAscending(concatenated), false);

  // After global sort: should be sorted oldest → newest.
  const sorted = sortByAgeAscending(concatenated);
  assert.equal(isSortedByAgeAscending(sorted), true);

  // Sanity check on positions: "2 days ago" should be first (oldest).
  assert.equal(sorted[0].title, "batch2-older");
});
