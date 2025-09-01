// test/parse.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAgeToEpoch } from "../src/parse.js";

function within(ms, tolerance) {
  return Math.abs(ms) <= tolerance;
}

test("parse minutes", () => {
  const before = Date.now();
  const r = parseAgeToEpoch("5 minutes ago");
  const delta = (Date.now() - r.epoch) - (5 * 60_000);
  assert.ok(within(delta, 500)); // ±0.5s
});

test("parse hours", () => {
  const r = parseAgeToEpoch("2 hours ago");
  const delta = (Date.now() - r.epoch) - (120 * 60_000);
  assert.ok(within(delta, 800));
});

test("parse days", () => {
  const r = parseAgeToEpoch("3 days ago");
  const delta = (Date.now() - r.epoch) - (3 * 24 * 60 * 60_000);
  assert.ok(within(delta, 1200));
});

test("fallback for unexpected text", () => {
  const r = parseAgeToEpoch("yesterday-ish");
  // Fallback gives 'now' — i.e., very small minutesAgo
  assert.ok(r.minutesAgo >= 0);
});
