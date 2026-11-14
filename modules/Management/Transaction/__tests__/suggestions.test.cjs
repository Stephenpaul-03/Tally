const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loader } = require('../../../../scripts/test-support/load-ts.cjs');
const { suggestTransactionDetails } = loader()('modules/Management/Transaction/suggestions.ts');
const options = { title: '  Coffee   Shop ', type: 'expense', currency: 'INR', fallbackCurrency: 'INR', categories: ['Food', 'Travel'], accounts: ['Cash', 'Bank'] };
const row = (id, extras = {}) => ({ id, title: 'coffee shop', date: '2026-01-10', category: 'Food', account: 'Cash', type: 'expense', ...extras });
test('ranks exact normalized titles by pair frequency, then recency', () => {
  const rows = [row('1'), row('2'), row('3', { category: 'Travel', date: '2026-02-01' })];
  assert.equal(suggestTransactionDetails(rows, options).category, 'Food');
  rows.push(row('4', { category: 'Travel', date: '2026-02-02' }));
  assert.equal(suggestTransactionDetails(rows, options).category, 'Travel');
});
test('ignores deleted, draft, foreign-currency and invalid entities and transaction types', () => {
  const rows = [row('1', { deleted: true }), row('2', { isDraft: true }), row('3', { currencyCode: 'USD' }),
    row('4', { category: 'Removed' }), row('5', { account: 'Removed' }), row('6', { type: 'income' })];
  assert.equal(suggestTransactionDetails(rows, options), null);
});
test('does not guess for empty titles or partial matches', () => {
  assert.equal(suggestTransactionDetails([row('1')], { ...options, title: '' }), null);
  assert.equal(suggestTransactionDetails([row('1')], { ...options, title: 'coffee' }), null);
});
