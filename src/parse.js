// src/parse.js
// Robust conversion of HN "age" strings to epoch (ms).
// Handles: "1 minute ago", "2 hours ago", "3 days ago".
export function parseAgeToEpoch(ageText) {
  if (!ageText || typeof ageText !== "string") {
    return { epoch: Date.now(), minutesAgo: 0 };
  }
  const txt = ageText.trim().toLowerCase();
  const m = txt.match(/^(\d+)\s+(minute|minutes|hour|hours|day|days)\s+ago$/i);
  if (!m) return { epoch: Date.now(), minutesAgo: 0 };
  const count = parseInt(m[1], 10);
  const unit = m[2];

  let minutes = count;
  if (unit.startsWith("hour")) minutes = count * 60;
  if (unit.startsWith("day")) minutes = count * 24 * 60;

  const epoch = Date.now() - minutes * 60_000;
  return { epoch, minutesAgo: minutes };
}

// Ensure every item has __age; returns a NEW array with augmented items.
export function ensureAges(items) {
  return items.map((it) => {
    if (it && it.__age && typeof it.__age.epoch === "number") return it;
    const parsed = parseAgeToEpoch(it?.ageText || "");
    return { ...it, __age: parsed };
  });
}

// Global sort by age (oldest → newest). Returns a NEW array.
export function sortByAgeAscending(items) {
  const withAges = ensureAges(items);
  return withAges.slice().sort((a, b) => a.__age.epoch - b.__age.epoch);
}

// Predicate: is the entire list globally sorted oldest → newest?
export function isSortedByAgeAscending(items) {
  const withAges = ensureAges(items);
  for (let i = 1; i < withAges.length; i++) {
    if (withAges[i - 1].__age.epoch > withAges[i].__age.epoch) return false;
  }
  return true;
}

// Existing helpers (unchanged)
export function filterByMinAgeMinutes(items, minMinutes) {
  if (!minMinutes || isNaN(minMinutes) || minMinutes <= 0) return items;
  return ensureAges(items).filter((i) => i.__age.minutesAgo >= minMinutes);
}

export function capItems(items, max) {
  if (!max || isNaN(max) || max <= 0) return items;
  return items.slice(0, max);
}
