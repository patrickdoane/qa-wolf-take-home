// test/order-slice.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { sortByAgeAscending } from "../src/parse.js";

// helper to fabricate items
const item = (title, ageText) => ({ title, ageText });

test("descending order picks newest N; ascending picks oldest N", () => {
  const items = [
    item("oldest", "3 days ago"),
    item("older",  "5 hours ago"),
    item("new",    "20 minutes ago"),
    item("newest", "1 minute ago"),
  ];

  const asc = sortByAgeAscending(items); // oldest → newest
  // Asc first 2 = oldest two:
  const ascFirst2 = asc.slice(0, 2).map(i => i.title);
  assert.deepEqual(ascFirst2, ["oldest", "older"]);

  // Desc first 2 (reverse then slice) = newest two:
  const descFirst2 = asc.slice().reverse().slice(0, 2).map(i => i.title);
  assert.deepEqual(descFirst2, ["newest", "new"]);
});
