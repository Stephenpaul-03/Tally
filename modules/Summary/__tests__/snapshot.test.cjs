const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loader } = require('../../../scripts/test-support/load-ts.cjs');
const { workspaceSnapshot } = loader()('modules/Summary/snapshot.ts');
const row = (id, overrides = {}) => ({ id, date: '2026-01-10', type: 'expense', amount: 20, account: 'Cash', deleted: false, ...overrides });
test('summary counts recorded activity without mixing currencies, drafts or deleted entries', () => {
  const result = workspaceSnapshot([
    row('income', { type: 'income', amount: -100 }), row('expense'),
    row('usd', { currencyCode: 'USD', amount: 1000 }), row('deleted', { deleted: true }),
    row('draft', { isDraft: true }), row('invalid', { amount: NaN }),
  ], 'INR', 'INR');
  assert.deepEqual(result, { income: 100, spent: 20, balance: 80, count: 2, activeDays: 1, accounts: 1, expenseShare: 20 / 120 });
});
test('period filter and zero activity produce finite totals', () => {
  const result = workspaceSnapshot([row('old')], 'INR', 'INR', '2026-02');
  assert.equal(result.count, 0);
  assert.equal(result.expenseShare, 0);
  assert.equal(result.balance, 0);
});
