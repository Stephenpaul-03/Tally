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
const { calculateInsights, changeLabel, shiftMonth, daysInMonth, total,
  amountChangeLabel, getSpendingObservation } = calculationModule.exports;
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
  assert.equal(result.periodCaption, "Days 1–12");
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
  assert.equal(result.periodCaption, "Full month");
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

test("comparison context identifies both date ranges, including shorter previous months", () => {
  const result = calculateInsights([], "2024-03", "INR", "INR", true, new Date(2024, 2, 31));
  assert.match(result.periodLabel, /^1–31 /);
  assert.match(result.comparisonDescription, /1–31 .*1–29 /);
});
test("missing expense entries do not become a spending comparison or an observation", () => {
  const result = calculate([row("2026-09-01", 100), row("2026-08-01", 500, { type: "income" })]);
  assert.equal(result.hasPreviousSpending, false);
  assert.equal(getSpendingObservation(result, null), null);
  const incomeOnly = calculate([row("2026-09-01", 500, { type: "income" }), row("2026-08-01", 100)]);
  assert.equal(incomeOnly.hasSpending, false);
  assert.equal(getSpendingObservation(incomeOnly, null), null);
});
test("selects the largest absolute category change rather than a percentage or total", () => {
  const result = calculate([
    row("2026-09-01", 2000, { category: "Groceries" }), row("2026-08-01", 3500, { category: "Groceries" }),
    row("2026-09-01", 1000, { category: "Dining" }), row("2026-08-01", 10, { category: "Dining" }),
  ]);
  const observation = getSpendingObservation(result, null);
  assert.equal(observation.group.name, "Groceries");
  assert.equal(observation.kind, "decrease");
  assert.equal(observation.difference, 1500);
});
test("category budget overruns take priority even without prior spending entries", () => {
  const result = calculate([row("2026-09-01", 2000, { category: "Groceries" }),
    row("2026-09-01", 800, { category: "Dining" })]);
  const observation = getSpendingObservation(result, { Groceries: 1800, Dining: 500 });
  assert.equal(observation.group.name, "Dining");
  assert.equal(observation.kind, "overBudget");
  assert.equal(observation.difference, 300);
  assert.equal(getSpendingObservation(result, { Groceries: 0, Dining: NaN }), null);
});
test("comparison-only categories remain available to explain a spending decrease", () => {
  const result = calculate([row("2026-09-01", 100, { category: "Food" }),
    row("2026-08-01", 100, { category: "Food" }), row("2026-08-01", 1200, { category: "Travel" })]);
  const observation = getSpendingObservation(result, null);
  assert.equal(observation.group.name, "Travel");
  assert.equal(observation.group.count, 0);
  assert.equal(observation.group.previous, 1200);
});
test("matched days and currencies also govern which category change is selected", () => {
  const result = calculate([row("2026-09-01", 100), row("2026-08-01", 100),
    row("2026-08-20", 9000, { category: "Travel" }),
    row("2026-09-01", 10000, { category: "Shopping", currencyCode: "USD" }),
    row("2026-09-01", 10000, { category: "Shopping", deleted: true })]);
  assert.equal(getSpendingObservation(result, null), null);
});
test("history distinguishes absent entries from recorded zero and flags partial months", () => {
  const result = calculate([row("2026-09-01", 0), row("2026-08-31", 100)]);
  assert.equal(result.hasSpending, true);
  assert.equal(result.trend.at(-1).expenseCount, 1);
  assert.equal(result.trend.at(-1).isPartial, true);
  assert.equal(result.trend.at(-2).expenseCount, 1);
  assert.equal(result.trend.at(-2).isPartial, false);
  assert.equal(result.trend[0].expenseCount, 0);
});
test("currency comparisons work with a zero baseline and never require a percentage", () => {
  const money = value => `₹${value}`;
  assert.equal(amountChangeLabel(500, 0, money), "₹500 more than last month");
  assert.equal(amountChangeLabel(0, 500, money), "₹500 less than last month");
  assert.equal(amountChangeLabel(500, 500, money), "The same recorded amount as last month");
});

test("income position preserves shortfalls and does not divide by zero", () => {
  const { incomePosition } = calculationModule.exports;
  assert.deepEqual(incomePosition(100, 125), { remaining: -25, usedPercent: 125 });
  assert.deepEqual(incomePosition(0, 40), { remaining: -40, usedPercent: null });
  assert.deepEqual(incomePosition(0, 0), { remaining: 0, usedPercent: null });
  assert.equal(incomePosition(0.3, 0.1).remaining, 0.2);
});
test("hero position and category income shares use only the selected period and currency", () => {
  const result = calculate([row("2026-09-01", 1000, { type: "income", category: "Salary" }),
    row("2026-09-05", 250), row("2026-09-20", 500, { type: "income" }),
    row("2026-09-01", 2000, { type: "income", currencyCode: "USD" })]);
  assert.equal(result.remaining, 750);
  assert.equal(result.usedPercent, 25);
  assert.equal(result.expenseCategories[0].amount / result.income * 100, 25);
});
test("year overview covers January to December, separates income, and excludes future entries", () => {
  const result = calculate([
    row("2026-01-01", 1000, { type: "income" }), row("2026-01-31", 100),
    row("2026-09-12", 20), row("2026-09-13", 999), row("2026-12-01", 999),
    row("2025-12-31", 900), row("2026-02-01", 999, { deleted: true }),
    row("2026-02-01", 999, { currencyCode: "USD" }), row("2026-02-01", NaN),
  ]);
  assert.equal(result.year.months.length, 12);
  assert.equal(result.year.months[0].month, "2026-01");
  assert.equal(result.year.months[11].month, "2026-12");
  assert.equal(result.year.income, 1000);
  assert.equal(result.year.expense, 120);
  assert.equal(result.year.remaining, 880);
  assert.equal(result.year.months[8].isPartial, true);
  assert.equal(result.year.months[9].future, true);
  assert.equal(result.year.months[11].expenseCount, 0);
});
test("year totals stay consistent while browsing a past month in the current year", () => {
  const rows = [row("2026-01-01", 10), row("2026-09-12", 20), row("2026-09-13", 900)];
  const january = calculateInsights(rows, "2026-01", "INR", "INR", true, now);
  assert.equal(january.expense, 10);
  assert.deepEqual(january.year, calculate(rows).year);
});
test("completed years include December and distinguish missing entries from recorded zero", () => {
  const result = calculateInsights([row("2024-12-31", 25), row("2024-02-29", 0, { type: "income" })],
    "2024-02", "INR", "INR", true, now);
  assert.equal(result.year.isCurrent, false);
  assert.equal(result.year.expense, 25);
  assert.equal(result.year.months[1].incomeCount, 1);
  assert.equal(result.year.months[0].incomeCount, 0);
  assert.equal(result.year.months.some(month => month.future || month.isPartial), false);
});
