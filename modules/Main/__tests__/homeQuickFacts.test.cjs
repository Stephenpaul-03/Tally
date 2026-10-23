const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loader } = require("../../../scripts/test-support/load-ts.cjs");
const { homeQuickFacts } = loader()("modules/Main/homeQuickFacts.ts");
const row = (id, amount, overrides = {}) => ({
  id,
  amount,
  type: "expense",
  date: "2026-10-10",
  createdAt: `2026-10-10T${id}:00:00`,
  currencyCode: "INR",
  ...overrides,
});
test("Home facts use elapsed days and posted selected-currency data; preview shows newest three", () => {
  const facts = homeQuickFacts(
    [
      row("10", 100),
      row("11", 200),
      row("12", 150, { type: "income" }),
      row("13", 300),
      row("14", 999, { deleted: true }),
      row("15", 999, { isDraft: true }),
      row("16", 999, { currencyCode: "USD" }),
      row("17", 999, { date: "2026-10-24" }),
      row("18", 999, { date: "2026-09-10" }),
      row("19", NaN),
    ],
    "2026-10",
    "INR",
    "2026-10-20",
  );
  assert.equal(facts.days, 20);
  assert.equal(facts.dailyAverage, 30);
  assert.equal(facts.entryCount, 4);
  assert.equal(facts.largest.id, "13");
  assert.deepEqual(
    facts.recent.map((row) => row.id),
    ["13", "12", "11"],
  );
});
test("past months use their full calendar length and empty states do not invent entries", () => {
  const facts = homeQuickFacts(
    [row("10", 280, { date: "2024-02-15" })],
    "2024-02",
    "INR",
    "2026-10-20",
  );
  assert.equal(facts.days, 29);
  assert.equal(facts.dailyAverage, 280 / 29);
  const empty = homeQuickFacts([], "2026-10", "INR", "2026-10-01");
  assert.equal(empty.dailyAverage, 0);
  assert.equal(empty.largest, null);
  assert.deepEqual(empty.recent, []);
});
