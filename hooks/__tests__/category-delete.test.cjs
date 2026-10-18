const test = require('node:test');
const assert = require('node:assert/strict');
const { repository } = require('../../scripts/test-support/finance-db.cjs');
const transaction = { title: 'Preserve me', type: 'expense', amount: 100, date: '2026-10-18', category: 'Food', account: 'Cash' };

test('multiple empty categories delete together without a destination', async () => {
  const { repo, sqlite } = repository();
  try {
    await repo.addCategory('Empty one', 'expense'); await repo.addCategory('Empty two', 'expense');
    await repo.deleteCategories('expense', ['Empty one', 'Empty two']);
    assert.equal(sqlite.prepare("SELECT COUNT(*) AS count FROM categories WHERE name IN ('Empty one', 'Empty two') AND is_deleted = 0").get().count, 0);
  } finally { sqlite.close(); }
});
test('categories with transactions require an unselected destination, without deleting any empty categories first', async () => {
  const { repo, sqlite } = repository();
  try {
    await repo.addCategory('Food', 'expense'); await repo.addCategory('Empty', 'expense');
    await repo.addTransaction(transaction);
    await assert.rejects(repo.deleteCategories('expense', ['Empty', 'Food']), /Choose a remaining category/);
    await assert.rejects(repo.deleteCategories('expense', ['Empty', 'Food'], 'Empty'), /Choose a remaining category/);
    assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM categories WHERE is_deleted = 1').get().count, 0);
    assert.equal((await repo.getTransactions()).length, 1);
  } finally { sqlite.close(); }
});
test('bulk deletion preserves active and trashed transactions and removes only deleted-category budgets', async () => {
  const { repo, sqlite } = repository();
  try {
    await repo.addCategory('Food', 'expense'); await repo.addCategory('Empty', 'expense'); await repo.addCategory('Other Expense', 'expense');
    const one = await repo.addTransaction(transaction);
    const two = await repo.addTransaction({ ...transaction, title: 'Trash entry' });
    await repo.softDeleteTransaction(two.id);
    await repo.upsertCategoryBudget('Food', 500);
    assert.equal((await repo.getCategoryUsage('expense')).find(row => row.name === 'Food').count, 2);
    await repo.deleteCategories('expense', ['Food', 'Empty'], 'Other Expense');
    const rows = sqlite.prepare('SELECT t.id, t.is_deleted, c.name FROM transactions t JOIN categories c ON c.id = t.category_id').all();
    assert.equal(rows.length, 2); assert.ok(rows.every(row => row.name === 'Other Expense'));
    assert.equal(rows.find(row => row.id === two.id).is_deleted, 1);
    assert.equal(rows.find(row => row.id === one.id).is_deleted, 0);
    assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM category_budgets').get().count, 0);
  } finally { sqlite.close(); }
});
test('fallback categories and missing categories cannot be deleted in a batch', async () => {
  const { repo, sqlite } = repository();
  try {
    await repo.addCategory('Other Expense', 'expense'); await repo.addCategory('Food', 'expense');
    await assert.rejects(repo.deleteCategories('expense', ['Food', 'Other Expense']), /fallback category/);
    await assert.rejects(repo.deleteCategories('expense', ['Food', 'Unknown']), /Some categories changed/);
    assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM categories WHERE is_deleted = 1').get().count, 0);
  } finally { sqlite.close(); }
});
test('a write failure rolls back moves and every category deletion in the batch', async () => {
  const { repo, sqlite } = repository();
  try {
    await repo.addCategory('Food', 'expense'); await repo.addCategory('Fail', 'expense'); await repo.addCategory('Other Expense', 'expense');
    await repo.addTransaction(transaction);
    sqlite.exec("CREATE TRIGGER fail_delete BEFORE UPDATE OF is_deleted ON categories WHEN OLD.name = 'Fail' BEGIN SELECT RAISE(ABORT, 'Simulated failure'); END;");
    await assert.rejects(repo.deleteCategories('expense', ['Food', 'Fail'], 'Other Expense'), /Simulated failure/);
    assert.equal((await repo.getTransactions())[0].category, 'Food');
    assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM categories WHERE is_deleted = 1').get().count, 0);
  } finally { sqlite.close(); }
});
test('deletion stays inside the specified workspace and transaction type', async () => {
  const { repo, sqlite } = repository();
  try {
    sqlite.prepare("INSERT INTO workspaces (id, name, icon, color) VALUES ('other', 'Other', 'home', '#000000')").run();
    const other = new repo.constructor('other');
    await repo.addCategory('Food', 'expense'); await repo.addCategory('Food', 'income'); await other.addCategory('Food', 'expense');
    await repo.deleteCategories('expense', ['Food']);
    assert.equal(sqlite.prepare("SELECT is_deleted FROM categories WHERE workspace_id = 'other' AND name = 'Food'").get().is_deleted, 0);
    assert.equal(sqlite.prepare("SELECT is_deleted FROM categories WHERE workspace_id = 'personal' AND name = 'Food' AND type = 'income'").get().is_deleted, 0);
  } finally { sqlite.close(); }
});
