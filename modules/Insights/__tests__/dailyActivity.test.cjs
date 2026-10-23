const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loader } = require("../../../scripts/test-support/load-ts.cjs");
const load = loader();
const { dailyActivityDetail } = load("modules/Insights/dailyActivityDetail.ts");
const { resolveComparisonMonth } = load("modules/Insights/calculations.ts");
test("daily activity sheets keep income and expense entries and totals separate on a mixed day", () => {
  const day = {
    date: "2026-10-12",
    income: 1000,
    expense: 200,
    transactions: [
      { id: "salary", type: "income", amount: 1000 },
      { id: "food", type: "expense", amount: 100 },
      { id: "travel", type: "expense", amount: 100 },
    ],
  };
  const expense = dailyActivityDetail(day, "expense", String);
  assert.deepEqual(
    expense.transactions.map((row) => row.id),
    ["food", "travel"],
  );
  assert.deepEqual(expense.summary, { label: "Spent", value: "200" });
  assert.equal(expense.metrics, undefined);
  const income = dailyActivityDetail(day, "income", String);
  assert.deepEqual(
    income.transactions.map((row) => row.id),
    ["salary"],
  );
  assert.deepEqual(income.summary, { label: "Income", value: "1000" });
  assert.equal(day.transactions.length, 3);
});
test("month comparison accepts empty historical months and rejects invalid, current-selection and future periods", () => {
  assert.equal(
    resolveComparisonMonth("2024-02", "2026-10", "2026-10"),
    "2024-02",
  );
  for (const selected of [null, "2026-10", "2026-11", "2026-13", "invalid"])
    assert.equal(resolveComparisonMonth(selected, "2026-10", "2026-10"), null);
});
