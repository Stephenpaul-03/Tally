const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loader } = require('../../../../scripts/test-support/load-ts.cjs');
const { groupTransactions } = loader()('modules/Management/Transaction/grouping.ts');
const row = (id, extra = {}) => ({ id, date: '2026-01-10', title: 'Lunch', category: 'Food', account: 'Cash', type: 'expense', amount: 20, ...extra });
test('category groups preserve records and separate income and currencies', () => {
  const groups = groupTransactions([row('1'), row('2', { date: '2026-01-11' }),
    row('3', { currencyCode: 'USD' }), row('4', { type: 'income' })], 'category', 'INR');
  assert.equal(groups.length, 3);
  assert.deepEqual(groups[0].transactions.map(row => row.id), ['1', '2']);
  assert.equal(groups[1].currencyCode, 'USD');
  assert.equal(groups[2].transactions[0].type, 'income');
});
test('matching details requires exact title, category and account without normalizing distinct text', () => {
  const rows = [row('1'), row('2'), row('3', { title: 'lunch' }), row('4', { account: 'Bank' }), row('5', { category: 'Other' })];
  const groups = groupTransactions(rows, 'matching', 'INR');
  assert.equal(groups.length, 4);
  assert.deepEqual(groups[0].transactions.map(row => row.id), ['1', '2']);
  assert.equal(groups.flatMap(group => group.transactions).length, rows.length);
});
test('date grouping retains day keys and skips drafts, invalid and deleted rows', () => {
  const groups = groupTransactions([row('1'), row('2', { type: 'income' }), row('3', { isDraft: true }),
    row('4', { deleted: true }), row('5', { amount: NaN })], 'date', 'INR');
  assert.equal(groups.length, 1);
  assert.equal(groups[0].key, '2026-01-10');
  assert.equal(groups[0].transactions.length, 2);
});
test('group keys cannot collide when field values contain separator characters', () => {
  const groups = groupTransactions([row('1', { title: 'A · B', category: 'C' }),
    row('2', { title: 'A', category: 'B · C' })], 'matching', 'INR');
  assert.equal(groups.length, 2);
});
