const { test } = require('node:test');
const assert = require('node:assert/strict');
const { repository } = require('../../../../scripts/test-support/finance-db.cjs');
async function fixture() {
  const result = repository();
  await result.repo.addCategory('Food', 'expense');
  await result.repo.upsertCategoryBudget('Food', 100);
  await result.repo.upsertOverallBudget(100);
  result.sqlite.exec(`INSERT INTO workspaces(id,name,icon,color) VALUES ('other','Other','wallet','#123456'); INSERT INTO budgets(workspace_id,monthly_amount) VALUES ('other',500);`);
  return result;
}
test('clear budgets is scoped to the workspace and leaves catalogs intact', async () => {
  const { repo, sqlite } = await fixture();
  const categories = sqlite.prepare('SELECT COUNT(*) AS count FROM categories').get().count;
  const result = await repo.clearBudgets();
  assert.equal(result.overallBudget, 0);
  assert.equal(result.categoryBudgets.length, 0);
  assert.equal(sqlite.prepare("SELECT monthly_amount FROM budgets WHERE workspace_id='other'").get().monthly_amount, 500);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM categories').get().count, categories);
});
test('a failed budget clear rolls back category deletions', async () => {
  const { repo, sqlite } = await fixture();
  sqlite.exec("CREATE TRIGGER fail_clear BEFORE DELETE ON budgets WHEN OLD.workspace_id='personal' BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  await assert.rejects(repo.clearBudgets(), /storage failure/);
  const result = await repo.getBudget();
  assert.equal(result.overallBudget, 100);
  assert.equal(result.categoryBudgets[0].amount, 100);
});
