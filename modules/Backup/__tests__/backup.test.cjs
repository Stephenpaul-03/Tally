const { test } = require("node:test");
const assert = require("node:assert/strict");
const { repository } = require("../../../scripts/test-support/finance-db.cjs");
const { loader } = require("../../../scripts/test-support/load-ts.cjs");
const { validateBackup, selectBackupSections } = loader()(
  "modules/Backup/model.ts",
);
async function fixture() {
  const source = repository();
  await source.repo.addCategory("Trip", "expense", "airplane", "#123456");
  await source.repo.addTransaction({
    title: "Flight",
    amount: 150,
    date: "2026-10-25",
    type: "expense",
    category: "Trip",
    account: "Cash",
    currencyCode: "INR",
    currencySymbol: "₹",
  });
  await source.repo.upsertCategoryBudget("Trip", 500);
  return {
    source,
    backup: {
      format: "tally-backup",
      version: 1,
      exportedAt: "2026-10-25",
      sections: [
        "transactions",
        "catalogs",
        "budgets",
        "workspaces",
        "preferences",
        "goals",
      ],
      database: await source.workspaceRepo.getDatabaseBackup(),
      preferences: { appThemeId: "sakura", tallyWorkspaceDefaults: "{}", "tally.insightsStyle.v1": "classic" },
      goals: [],
    },
  };
}
test("complete and separate backups validate and retain required workspace/category references, excluding drafts unless selected", async () => {
  const { backup } = await fixture();
  assert.ok(validateBackup(backup));
  for (const section of backup.sections) {
    const part = selectBackupSections(backup, [section]);
    assert.ok(validateBackup(part));
    assert.equal(part.drafts, undefined);
    if (section === "transactions") {
      assert.ok(part.database.categories.length);
      assert.ok(part.database.workspaces.length);
      assert.equal(part.database.budgets, undefined);
      assert.deepEqual(part.preferences, {});
    }
  }
});
test("backup validation rejects missing references, invalid transactions, unknown preferences and inconsistent sections before writing", async () => {
  const { backup } = await fixture();
  for (const change of [
    (b) => (b.version = 5),
    (b) => (b.database.categories = []),
    (b) => (b.database.transactions[0].date = "2026-02-30"),
    (b) => (b.database.transactions[0].amount = Infinity),
    (b) => (b.preferences.password = "secret"),
    (b) => (b.preferences["tally.insightsStyle.v1"] = "invalid"),
    (b) => (b.sections = ["preferences"]),
    (b) => b.database.transactions.push(b.database.transactions[0]),
  ]) {
    const copy = structuredClone(backup);
    change(copy);
    assert.throws(() => validateBackup(copy));
  }
});
test("restore remaps foreign category IDs, round-trips data/budgets and is idempotent without deleting other entries", async () => {
  const { backup } = await fixture();
  const dest = repository();
  await dest.repo.addCategory("Extra first", "expense");
  await dest.workspaceRepo.restoreAppDatabase(validateBackup(backup).database);
  await dest.workspaceRepo.restoreAppDatabase(backup.database);
  const rows = await dest.repo.getTransactions();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].category, "Trip");
  assert.equal(rows[0].amount, 150);
  assert.ok(
    (await dest.repo.getCategories("expense")).some(
      (c) => c.name === "Extra first",
    ),
  );
  assert.equal(
    (await dest.repo.getBudget()).categoryBudgets.find(
      (b) => b.category === "Trip",
    ).amount,
    500,
  );
});
test("dependency-only catalogs do not overwrite existing category/account or workspace customization", async () => {
  const { backup } = await fixture();
  const dest = repository();
  await dest.repo.addCategory("Trip", "expense", "heart", "#ABCDEF");
  await dest.workspaceRepo.restoreAppDatabase(backup.database, {
    workspaces: false,
    catalogs: false,
  });
  assert.equal(
    (await dest.repo.getCategoryByName("Trip", "expense")).color,
    "#ABCDEF",
  );
});
test("SQL restoration rolls back all writes if any row fails", async () => {
  const { backup } = await fixture();
  const dest = repository();
  const before = (await dest.repo.getCategories("expense")).length;
  backup.database.transactions[0].category_id = -999;
  await assert.rejects(() =>
    dest.workspaceRepo.restoreAppDatabase(backup.database),
  );
  assert.equal((await dest.repo.getCategories("expense")).length, before);
  assert.equal((await dest.repo.getTransactions()).length, 0);
});
const {mergeBackups}=loader()('modules/Backup/merge.ts');
const {backupFailure}=loader()('modules/Backup/errors.ts');
test('batch imports merge per-section backups, deduplicate references and transactions, and restore atomically',async()=>{
 const {backup}=await fixture();const pieces=backup.sections.map(section=>selectBackupSections(backup,[section])); const combined=mergeBackups([...pieces,pieces[0]]);
 assert.equal(combined.database.transactions.length,backup.database.transactions.length);assert.equal(combined.database.categories.length,backup.database.categories.length);assert.deepEqual(new Set(combined.sections),new Set(backup.sections));
 const dest=repository();await dest.workspaceRepo.restoreAppDatabase(combined.database);assert.equal((await dest.repo.getTransactions())[0].category,'Trip');
});
test('conflicting copies are rejected with actionable reasons instead of silently picking a file',async()=>{
 const {backup}=await fixture();const changed=structuredClone(backup);changed.database.transactions[0].amount=999;
 assert.throws(()=>mergeBackups([backup,changed]),/Conflicting transactions/);
 const issue=backupFailure(new Error('Conflicting transactions'),'restore');assert.match(issue.recovery,/Remove one/);
 assert.match(backupFailure(new Error('ENOSPC'),'save').recovery,/storage/);assert.match(backupFailure(new Error('Permission denied'),'save').recovery,/folder/);
});
