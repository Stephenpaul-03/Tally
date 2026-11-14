const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loader } = require('../../../scripts/test-support/load-ts.cjs');
const { groupInsightEntries } = loader()('modules/Insights/entryGrouping.ts');
const row = (id, overrides = {}) => ({ id, title: 'Hotel booking', date: '2026-01-10', createdAt: '2026-01-10T10:00:00Z',
  amount: 100, category: 'Travel', account: 'Bank', type: 'expense', deleted: false, ...overrides });
test('groups matching entries across dates, times and amounts while preserving their originals', () => {
  const rows = [row('1'), row('2', { title: '  HOTEL   booking ', date: '2026-02-12', amount: -250 })];
  const groups = groupInsightEntries(rows, true, 'INR');
  assert.equal(groups.length, 1);
  assert.equal(groups[0].amount, 350);
  assert.deepEqual(groups[0].transactions.map(row => row.id), ['1', '2']);
  assert.equal(rows[1].amount, -250);
});
test('never groups across account, category, type or currency boundaries', () => {
  const rows = [row('1'), row('2', { account: 'Cash' }), row('3', { category: 'Work' }),
    row('4', { type: 'income' }), row('5', { currencyCode: 'USD' })];
  assert.equal(groupInsightEntries(rows, true, 'INR').length, 5);
});
test('the switch off preserves one row per entry, and blank titles never collapse', () => {
  assert.equal(groupInsightEntries([row('1'), row('2')], false, 'INR').length, 2);
  assert.equal(groupInsightEntries([row('1', { title: '' }), row('2', { title: '' })], true, 'INR').length, 2);
});
test('excluded records do not affect counts or totals', () => {
  const groups = groupInsightEntries([row('1'), row('2', { deleted: true }), row('3', { isDraft: true }),
    row('4', { amount: Infinity })], true, 'INR');
  assert.equal(groups[0].amount, 100);
  assert.equal(groups[0].transactions.length, 1);
});
