const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { loader } = require('../../../../scripts/test-support/load-ts.cjs');
const { restoreWorkspaceSelection, saveWorkspaceSelection } = loader()('modules/Core/Repository/workspaceSelection.ts');
function database() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec("CREATE TABLE workspaces (id TEXT PRIMARY KEY, last_used_at TEXT); CREATE TABLE app_metadata (key TEXT PRIMARY KEY, value TEXT); INSERT INTO workspaces VALUES ('personal', NULL), ('family', '2026-01-01')");
  return { getFirstSync: (sql, params = []) => sqlite.prepare(sql).get(...params), runSync: (sql, params = []) => sqlite.prepare(sql).run(...params), sqlite };
}
test('restores explicit choice across repository recreation, including personal', () => {
  const db = database();
  assert.equal(restoreWorkspaceSelection(db, 'personal'), 'family');
  saveWorkspaceSelection(db, 'personal');
  assert.equal(restoreWorkspaceSelection(db, 'personal'), 'personal');
  saveWorkspaceSelection(db, 'family');
  assert.equal(restoreWorkspaceSelection(db, 'personal'), 'family');
});
test('deleted selections fall back to an existing workspace; invalid switches do not replace the saved choice', () => {
  const db = database();
  saveWorkspaceSelection(db, 'family');
  assert.throws(() => saveWorkspaceSelection(db, 'missing'));
  assert.equal(restoreWorkspaceSelection(db, 'personal'), 'family');
  db.sqlite.exec("DELETE FROM workspaces WHERE id = 'family'");
  assert.equal(restoreWorkspaceSelection(db, 'personal'), 'personal');
});
