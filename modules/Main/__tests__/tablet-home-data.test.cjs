const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loader } = require("../../../scripts/test-support/load-ts.cjs");
const { tabletHomeData } = loader()("modules/Main/tabletHomeData.ts");

test("tablet account net and previews respect month, currency, deleted, draft and future boundaries", () => {
  const row = (id, overrides = {}) => ({ id, type: "expense", amount: 10, currencyCode: "INR", account: "Cash", date: "2026-11-12", createdAt: "2026-11-12T12:00:00", ...overrides });
  const raw = [row("salary", { type: "income", amount: 100 }), row("purchase", { amount: -15.5 }),
    row("usd", { currencyCode: "USD", amount: 999 }), row("future", { date: "2026-11-20" }),
    row("deleted", { deleted: true }), row("draft", { isDraft: true }), row("old", { date: "2026-10-12" }),
    row("invalid", { amount: NaN }), row("legacy", { currencyCode: undefined, account: "Card", amount: 4 })];
  const result = tabletHomeData(raw, "2026-11", "INR", "2026-11-18", ["Cash", "Card", "UPI"]);
  assert.deepEqual(result.accounts.map(({ name, net }) => [name, net]), [["Cash", 84.5], ["Card", -4], ["UPI", 0]]);
  assert.deepEqual(result.posted.map(item => item.id), ["salary", "purchase", "legacy"]);
  assert.equal(result.accounts[0].rows.length, 2);
  assert.equal(result.recent.length, 3);
});

test("recent rows are deterministic and limited without mutating the source", () => {
  const raw = Array.from({ length: 7 }, (_, index) => ({ id: String(index), type: "income", amount: 1,
    account: "Cash", currencyCode: "INR", date: `2026-11-${10 + index}`, createdAt: "2026-11-18T12:00:00" }));
  const order = raw.map(item => item.id);
  const result = tabletHomeData(raw, "2026-11", "INR", "2026-11-18", ["Cash"]);
  assert.deepEqual(result.recent.map(item => item.id), ["6", "5", "4", "3"]);
  assert.deepEqual(raw.map(item => item.id), order);
  assert.equal(result.accounts[0].net, 7);
});
