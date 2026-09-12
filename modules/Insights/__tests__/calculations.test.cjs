/* Run with: node --test modules/Insights/__tests__/calculations.test.cjs */
/* global __dirname */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const Module = require("node:module");

// Compile just the pure calculation module; no native runtime is required.
const filename = path.resolve(__dirname, "../calculations.ts");
const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const calculationModule = new Module(filename, module);
calculationModule._compile(compiled, filename);
const { calculateInsights, changeLabel, shiftMonth, daysInMonth, total } = calculationModule.exports;
const now = new Date(2026, 8, 12);
function row(date, amount, overrides = {}) {
  return { id: date + amount, date, amount, type: "expense", category: "Food",
    account: "Cash", title: "Transaction", ...overrides };
}
const calculate = (rows, matched = true) =>
  calculateInsights(rows, "2026-09", "INR", "INR", matched, now);

test("matched comparison excludes later prior-month days and future transactions", () => {
  const result = calculate([row("2026-09-12", 12), row("2026-09-13", 999),
    row("2026-08-12", 20), row("2026-08-13", 300)]);
  assert.equal(result.expense, 12);
  assert.equal(result.previousExpense, 20);
  assert.equal(result.days[12].future, true);
});
test("full previous month is available without counting future current entries", () => {
  const result = calculate([row("2026-09-20", 999), row("2026-08-31", 40)], false);
  assert.equal(result.expense, 0);
  assert.equal(result.previousExpense, 40);
});
test("separates currencies and ignores deleted and nonfinite transactions", () => {
  const result = calculate([row("2026-09-01", 10), row("2026-09-01", 50, { currencyCode: "USD" }),
    row("2026-09-01", 100, { deleted: true }), row("2026-09-01", NaN)]);
  assert.equal(result.expense, 10);
});
test("keeps categories present only in the comparison period", () => {
  const result = calculate([row("2026-08-01", 15, { category: "Travel" })]);
  assert.equal(result.expenseCategories[0].name, "Travel");
  assert.equal(result.expenseCategories[0].amount, 0);
  assert.equal(result.expenseCategories[0].previous, 15);
});
test("income and expense categories with identical names are separate", () => {
  const result = calculate([row("2026-09-01", 10), row("2026-09-01", 50, { type: "income" })]);
  assert.equal(result.incomeCategories[0].amount, 50);
  assert.equal(result.expenseCategories[0].amount, 10);
  assert.equal(result.accounts[0].income - result.accounts[0].expense, 40);
});
test("handles zero and negative comparison baselines", () => {
  assert.equal(changeLabel(5, 0), "No previous activity");
  assert.equal(changeLabel(0, 0), "No change");
  assert.match(changeLabel(-50, -100), /\+50.0%/);
});
test("month navigation and leap year calendars are correct", () => {
  assert.equal(shiftMonth("2026-01", -1), "2025-12");
  assert.equal(daysInMonth("2024-02"), 29);
  const result = calculateInsights([row("2024-02-29", 10)], "2024-03", "INR", "INR", true, new Date(2024, 2, 31));
  assert.equal(result.previousExpense, 10);
});
test("completed months include every day", () => {
  const result = calculateInsights([row("2026-07-31", 20)], "2026-07", "INR", "INR", true, now);
  assert.equal(result.expense, 20);
  assert.equal(result.days.filter(day => day.future).length, 0);
});
test("preserves fractional amounts and avoids basic floating point artifacts", () => {
  assert.equal(total([row("2026-09-01", 0.1), row("2026-09-01", 0.2)]), 0.3);
  assert.equal(total([row("2026-09-01", 1.234)]), 1.234);
});
test("empty workspace returns a complete empty calendar and trend", () => {
  const result = calculate([]);
  assert.equal(result.days.length, 30);
  assert.equal(result.trend.length, 6);
  assert.equal(result.income, 0);
  assert.deepEqual(result.accounts, []);
});
