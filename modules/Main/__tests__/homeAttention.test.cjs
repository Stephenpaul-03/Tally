const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loader } = require("../../../scripts/test-support/load-ts.cjs");
const {
  latestHomeDraft,
  sortedHomeDrafts,
  homeBudgetNudges,
  homeBudgetPanel,
  budgetRisk,
} = loader()("modules/Main/homeAttentionModel.ts");
const mostUrgentNudge = (options) => homeBudgetNudges(options)[0] ?? null;
const expense = (overrides = {}) => ({
  type: "expense",
  category: "Food",
  amount: 80,
  date: "2026-10-12",
  currencyCode: "INR",
  ...overrides,
});
const base = {
  month: "2026-10",
  today: "2026-10-23",
  currency: "INR",
  workspaceCurrency: "INR",
  categoryBudgets: { Food: 100 },
  safeBelowPercent: 70,
  nearlyEmptyFromPercent: 70,
};
test("draft resumption chooses the most recently updated id without modifying the saved list", () => {
  const drafts = [
    { id: "older", updatedAt: "2026-10-10" },
    { id: "latest", updatedAt: "2026-10-23" },
  ];
  assert.equal(latestHomeDraft(drafts).id, "latest");
  assert.equal(drafts[0].id, "older");
  assert.equal(latestHomeDraft([]), null);
});
test("budget nudges are absent until configured limits and the user's threshold are reached", () => {
  assert.equal(
    mostUrgentNudge({ ...base, rows: [expense({ amount: 69 })] }),
    null,
  );
  assert.equal(
    mostUrgentNudge({
      ...base,
      rows: [],
      safeBelowPercent: 0,
      nearlyEmptyFromPercent: 0,
    }),
    null,
  );
  assert.equal(
    mostUrgentNudge({ ...base, rows: [expense()], categoryBudgets: {} }),
    null,
  );
  assert.equal(
    mostUrgentNudge({
      ...base,
      rows: [expense()],
      safeBelowPercent: 90,
      nearlyEmptyFromPercent: 90,
    }),
    null,
  );
  const nudge = mostUrgentNudge({ ...base, rows: [expense()] });
  assert.equal(nudge.remaining, 20);
  assert.equal(nudge.percent, 80);
});
test("nudges ignore deleted, draft, future, income and other-currency entries, and historical budget comparisons", () => {
  const rows = [
    expense({ amount: 10 }),
    expense({ deleted: true }),
    expense({ isDraft: true }),
    expense({ date: "2026-10-24" }),
    expense({ type: "income" }),
    expense({ currencyCode: "USD" }),
    expense({ amount: NaN }),
  ];
  assert.equal(mostUrgentNudge({ ...base, rows }), null);
  assert.equal(
    mostUrgentNudge({ ...base, rows: [expense()], month: "2026-09" }),
    null,
  );
  assert.equal(
    mostUrgentNudge({
      ...base,
      rows: [expense({ currencyCode: "USD" })],
      currency: "USD",
    }),
    null,
  );
});
test("the most urgent warning comes first and category totals stay separate", () => {
  const nudge = mostUrgentNudge({
    ...base,
    overallBudget: 1000,
    categoryBudgets: { Food: 50, Travel: 100 },
    rows: [expense(), expense({ category: "Travel", amount: 90 })],
  });
  assert.equal(nudge.label, "Food");
  assert.equal(nudge.remaining, -30);
  assert.equal(nudge.percent, 160);
  const empty = mostUrgentNudge({ ...base, rows: [expense({ amount: 100 })] });
  assert.equal(empty.remaining, 0);
});

test("both configured thresholds distinguish 50% from 80% without labeling safe budgets as nearly empty", () => {
  assert.equal(budgetRisk(50, 70, 90), "safe");
  assert.equal(budgetRisk(80, 70, 90), "watch");
  assert.equal(budgetRisk(90, 70, 90), "nearlyEmpty");
  assert.equal(budgetRisk(100, 70, 90), "empty");
  assert.equal(budgetRisk(101, 70, 90), "over");
  assert.equal(budgetRisk(80, 85, 95), "safe");
  assert.equal(budgetRisk(50, 40, 45), "nearlyEmpty");
  assert.equal(budgetRisk(70, 70, 70), "nearlyEmpty");
  const nudge = mostUrgentNudge({
    ...base,
    overallBudget: 1000,
    safeBelowPercent: 40,
    nearlyEmptyFromPercent: 90,
    categoryBudgets: { Food: 100, Travel: 100 },
    rows: [
      expense({ amount: 50 }),
      expense({ category: "Travel", amount: 80 }),
    ],
  });
  assert.equal(nudge.label, "Travel");
  assert.equal(nudge.percent, 80);
  assert.equal(nudge.risk, "watch");
  assert.equal(
    mostUrgentNudge({
      ...base,
      safeBelowPercent: 85,
      nearlyEmptyFromPercent: 95,
      rows: [expense()],
    }),
    null,
  );
});

test("draft selection exposes every saved id newest first without modifying the saved order", () => {
  const rows = [
    { id: "first", updatedAt: "2026-10-01" },
    { id: "third", updatedAt: "2026-10-23" },
    { id: "second", updatedAt: "2026-10-12" },
  ];
  assert.deepEqual(
    sortedHomeDrafts(rows).map((row) => row.id),
    ["third", "second", "first"],
  );
  assert.equal(rows[0].id, "first");
});

test("risk ranking excludes safe and unconfigured categories", () => {
  const nudges = homeBudgetNudges({
    ...base,
    overallBudget: 200,
    categoryBudgets: { Food: 100, Travel: 100, Safe: 100, Unset: 0 },
    rows: [
      expense({ amount: 80 }),
      expense({ category: "Travel", amount: 90 }),
      expense({ category: "Safe", amount: 20 }),
      expense({ category: "Unset", amount: 100 }),
    ],
  });
  assert.deepEqual(
    nudges.map((item) => item.label),
    ["Monthly budget", "Travel", "Food"],
  );
  assert.equal(nudges[0].category, null);
  assert.equal(nudges[1].category, "Travel");
  assert.equal(nudges[2].remaining, 20);
  assert.equal(new Set(nudges.map((item) => item.key)).size, nudges.length);
  assert.deepEqual(
    homeBudgetNudges({ ...base, rows: [], overallBudget: 0 }),
    [],
  );
});

test("a category named Monthly budget remains distinct from the overall budget", () => {
  const nudges = homeBudgetNudges({
    ...base,
    overallBudget: 20,
    categoryBudgets: { "Monthly budget": 10 },
    rows: [expense({ amount: 25, category: "Monthly budget" })],
  });
  assert.equal(nudges.length, 2);
  assert.equal(new Set(nudges.map((item) => item.key)).size, 2);
});

test("the budget panel prompts setup only when no valid limit is configured", () => {
  const empty = homeBudgetPanel({
    ...base,
    rows: [],
    overallBudget: 0,
    categoryBudgets: { Food: 0 },
  });
  assert.equal(empty.needsSetup, true);
  assert.equal(empty.overall, null);
  const categoriesOnly = homeBudgetPanel({
    ...base,
    rows: [],
    overallBudget: 0,
    categoryBudgets: { Food: 100 },
  });
  assert.equal(categoriesOnly.needsSetup, false);
  assert.equal(categoriesOnly.hasCategoryBudgets, true);
  assert.equal(categoriesOnly.overall.budget, 100);
});

test("overall remaining is the sum of category limits and includes all posted expenses", () => {
  const unused = homeBudgetPanel({ ...base, rows: [], overallBudget: 1000 });
  assert.equal(unused.overall.remaining, 100);
  assert.equal(unused.overall.percent, 0);
  assert.equal(unused.nudges[0].remaining, 100);
  const safe = homeBudgetPanel({
    ...base,
    rows: [
      expense({ amount: 50 }),
      expense({ category: "Unbudgeted", amount: 100 }),
    ],
    overallBudget: 1000,
    categoryBudgets: { Food: 100 },
  });
  assert.equal(safe.overall.remaining, -50);
  assert.equal(safe.overall.budget, 100);
  assert.equal(safe.overall.spent, 150);
  assert.equal(safe.nudges[0].remaining, 50);
});

test("derived overall preserves overspending while category data stays separate", () => {
  const panel = homeBudgetPanel({
    ...base,
    overallBudget: 100,
    categoryBudgets: { Food: 50 },
    rows: [expense({ amount: 150 })],
  });
  assert.equal(panel.overall.remaining, -100);
  assert.equal(panel.nudges.length, 1);
  assert.equal(panel.nudges[0].category, "Food");
  assert.ok(panel.nudges.every((item) => item.key !== "overall"));
  assert.equal(homeBudgetPanel({ ...base, rows: [], currency: "USD" }), null);
  assert.equal(homeBudgetPanel({ ...base, rows: [], month: "2026-09" }), null);
});

test("only active category limits contribute and partial coverage prompts completion", () => {
  const panel = homeBudgetPanel({
    ...base,
    rows: [],
    expenseCategories: ["Food", "Travel", "Healthcare"],
    categoryBudgets: { Food: 100, Travel: 0, Removed: 500, Healthcare: NaN },
  });
  assert.equal(panel.overall.budget, 100);
  assert.deepEqual(panel.unbudgetedCategories, ["Travel", "Healthcare"]);
  assert.deepEqual(
    panel.nudges.map((item) => item.category),
    ["Food"],
  );
  const complete = homeBudgetPanel({
    ...base,
    rows: [],
    expenseCategories: ["Food"],
  });
  assert.deepEqual(complete.unbudgetedCategories, []);
  const empty = homeBudgetPanel({
    ...base,
    rows: [],
    overallBudget: 999,
    expenseCategories: ["Food"],
    categoryBudgets: { Removed: 500 },
  });
  assert.equal(empty.needsSetup, true);
  assert.equal(empty.overall, null);
});
