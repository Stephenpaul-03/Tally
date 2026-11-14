const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { loader } = require('../../../../scripts/test-support/load-ts.cjs');
const { getFinanceDatabaseRuntime, initializeFinanceDatabaseRuntime } = loader()('modules/Core/Repository/databaseRuntime.ts');

test('Fast Refresh reuses the connection and skips startup writes while the database is in use', () => {
  const statements = [];
  let opens = 0;
  const open = () => { opens += 1; return { execSync: sql => statements.push(sql) }; };
  const first = getFinanceDatabaseRuntime(open);
  initializeFinanceDatabaseRuntime(first, () => statements.push('seed'));
  const refreshed = getFinanceDatabaseRuntime(open);
  initializeFinanceDatabaseRuntime(refreshed, () => { throw new Error('database is locked'); });
  assert.equal(first, refreshed);
  assert.equal(opens, 1);
  assert.deepEqual(statements, ['PRAGMA busy_timeout = 3000;', 'PRAGMA journal_mode = WAL;', 'seed']);
});

test('a failed startup is retryable instead of being marked initialized', () => {
  const runtime = getFinanceDatabaseRuntime(() => ({ execSync() {} }));
  assert.throws(() => initializeFinanceDatabaseRuntime(runtime, () => { throw new Error('database is locked'); }));
  assert.equal(runtime.initialized, false);
  initializeFinanceDatabaseRuntime(runtime, () => {});
  assert.equal(runtime.initialized, true);
});

test('reloading the actual repository does not reseed or normalize existing data', () => {
  const sqlite = new DatabaseSync(':memory:');
  let writes = 0;
  const db = {
    execSync: sql => { writes += 1; sqlite.exec(sql); },
    getFirstSync: (sql, params = []) => sqlite.prepare(sql).get(...params),
    getAllSync: (sql, params = []) => sqlite.prepare(sql).all(...params),
    runSync: (sql, params = []) => sqlite.prepare(sql).run(...params),
  };
  const openDatabaseSync = () => db;
  const load = () => loader({ 'expo-sqlite': { openDatabaseSync } })('modules/Core/Repository/SQLiteRepo.ts');
  try {
    const first = load();
    sqlite.exec("UPDATE workspaces SET name = 'My workspace' WHERE id = 'personal'");
    const before = writes;
    const refreshed = load();
    assert.equal(first.financeDb, refreshed.financeDb);
    assert.equal(writes, before);
    assert.equal(sqlite.prepare("SELECT name FROM workspaces WHERE id = 'personal'").get().name, 'My workspace');
  } finally { sqlite.close(); }
});
