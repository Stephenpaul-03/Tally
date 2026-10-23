const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loader } = require("../../../scripts/test-support/load-ts.cjs");
const { ledgerMoney, signedLedgerTotals } = loader()(
  "modules/Main/presentation.ts",
);
test("ledger totals preserve currency boundaries, signs and fractional purchases", () => {
  const rows = [
    { type: "income", amount: 1000, currencyCode: "INR", currencySymbol: "₹" },
    {
      type: "expense",
      amount: 74.25,
      currencyCode: "INR",
      currencySymbol: "₹",
    },
    { type: "expense", amount: 12.5, currencyCode: "USD", currencySymbol: "$" },
    { type: "expense", amount: 999, isDraft: true, currencyCode: "INR" },
  ];
  assert.equal(signedLedgerTotals(rows, "INR", "₹"), "+₹925.75 · −$12.5");
  assert.equal(ledgerMoney(73000, "INR", "₹"), "₹73,000");
  assert.equal(signedLedgerTotals([], "INR", "₹"), "₹0");
});

test("day headings show income and spending separately without netting currencies or drafts", () => {
  const { separateLedgerTotals } = loader()("modules/Main/presentation.ts");
  const rows = [
    { type: "income", amount: 1000, currencyCode: "INR", currencySymbol: "₹" },
    {
      type: "expense",
      amount: 74.25,
      currencyCode: "INR",
      currencySymbol: "₹",
    },
    { type: "expense", amount: 12.5, currencyCode: "USD", currencySymbol: "$" },
    { type: "income", amount: 999, isDraft: true, currencyCode: "INR" },
  ];
  assert.deepEqual(separateLedgerTotals(rows, "INR", "₹"), {
    income: "+₹1,000",
    expense: "−₹74.25 · −$12.5",
  });
  assert.deepEqual(separateLedgerTotals([], "INR", "₹"), {
    income: null,
    expense: "₹0",
  });
});

test("days without recorded income omit the income total", () => {
  const { separateLedgerTotals } = loader()("modules/Main/presentation.ts");
  assert.equal(
    separateLedgerTotals([{ type: "expense", amount: 100 }], "INR", "₹").income,
    null,
  );
  assert.equal(
    separateLedgerTotals(
      [{ type: "income", amount: 500, isDraft: true }],
      "INR",
      "₹",
    ).income,
    null,
  );
  assert.equal(
    separateLedgerTotals([{ type: "income", amount: 500 }], "INR", "₹").income,
    "+₹500",
  );
});

test("Home totals are monthly, posted and currency-separated", () => {
  const { homeOverview } = loader()("modules/Main/homeOverview.ts");
  const result = homeOverview(
    [
      {
        id: "a",
        date: "2026-10-01",
        amount: 1000,
        type: "income",
        currencyCode: "INR",
      },
      {
        id: "b",
        date: "2026-10-02",
        amount: -74.25,
        type: "expense",
        currencyCode: "INR",
      },
      {
        id: "c",
        date: "2026-10-03",
        amount: 10,
        type: "expense",
        currencyCode: "USD",
      },
      { id: "d", date: "2026-09-03", amount: 400, type: "expense" },
      {
        id: "e",
        date: "2026-10-03",
        amount: 50,
        type: "income",
        deleted: true,
      },
    ],
    "2026-10",
    "INR",
  );
  assert.equal(result.income, 1000);
  assert.equal(result.spent, 74.25);
  assert.equal(result.left, 925.75);
  assert.equal(result.entryCount, 3);
  assert.deepEqual(result.currencies, ["INR", "USD"]);
  assert.equal(homeOverview([], "2026-10", "INR").left, 0);
});
