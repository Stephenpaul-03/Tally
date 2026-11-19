const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loader } = require("../../../scripts/test-support/load-ts.cjs");
const { tabletTransactionSections } = loader()("modules/Main/tabletTransactionSections.ts");

test("tablet columns partition rows without losing group order, collapse keys or currency metadata", () => {
  const sections = [
    { key: "2026-11-18", total: 9, totalLabel: "mixed", transactions: [
      { id: "a", type: "income", amount: 90.25, currencyCode: "USD" },
      { id: "b", type: "expense", amount: -12.5, currencyCode: "INR" },
      { id: "c", type: "income", amount: 4, currencyCode: "INR" },
    ] },
    { key: "2026-11-17", total: 20, transactions: [{ id: "d", type: "expense", amount: 20 }] },
  ];
  const original = JSON.stringify(sections);
  const income = tabletTransactionSections(sections, "income");
  const expense = tabletTransactionSections(sections, "expense");
  assert.deepEqual(income.map(group => group.key), ["2026-11-18"]);
  assert.deepEqual(expense.map(group => group.key), ["2026-11-18", "2026-11-17"]);
  assert.deepEqual(income[0].transactions.map(row => row.id), ["a", "c"]);
  assert.equal(income[0].total, 94.25);
  assert.equal(expense[0].total, 12.5);
  assert.equal(income[0].metric, "earned");
  assert.equal(expense[0].metric, "spent");
  assert.equal(income[0].totalLabel, undefined);
  assert.equal(income[0].transactions[0].currencyCode, "USD");
  assert.equal(JSON.stringify(sections), original);
  assert.equal(income.flatMap(group => group.transactions).length + expense.flatMap(group => group.transactions).length, 4);
});

test("drafts remain in their matching column and empty sides have no phantom sections", () => {
  const sections = [{ key: "draft", total: 0, transactions: [{ id: "draft1", type: "expense", amount: 5, isDraft: true }] }];
  assert.deepEqual(tabletTransactionSections(sections, "income"), []);
  const expense = tabletTransactionSections(sections, "expense");
  assert.equal(expense[0].totalLabel, "Drafts");
  assert.equal(expense[0].transactions[0].isDraft, true);
  assert.deepEqual(tabletTransactionSections([], "expense"), []);
});

test("two columns are limited to tablet landscape, including after rotation", () => {
  let dimensions = { width: 1280, height: 800 };
  const { useTabletLandscape } = loader({
    "react-native": { useWindowDimensions: () => dimensions },
  })("hooks/use-tablet-landscape.ts");
  assert.equal(useTabletLandscape(), true);
  dimensions = { width: 800, height: 1280 };
  assert.equal(useTabletLandscape(), false);
  dimensions = { width: 844, height: 390 };
  assert.equal(useTabletLandscape(), false);
  dimensions = { width: 390, height: 844 };
  assert.equal(useTabletLandscape(), false);
});
