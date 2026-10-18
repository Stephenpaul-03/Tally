const { DatabaseSync } = require('node:sqlite');
const { loader } = require('./load-ts.cjs');
function repository() {
  const sqlite = new DatabaseSync(':memory:');
  const db = {
    execSync: sql => sqlite.exec(sql),
    getFirstSync: (sql, args = []) => sqlite.prepare(sql).get(...args),
    getAllSync: (sql, args = []) => sqlite.prepare(sql).all(...args),
    runSync: (sql, args = []) => sqlite.prepare(sql).run(...args),
    getFirstAsync: async (sql, args = []) => sqlite.prepare(sql).get(...args),
    getAllAsync: async (sql, args = []) => sqlite.prepare(sql).all(...args),
    runAsync: async (sql, args = []) => {
      const result = sqlite.prepare(sql).run(...args);
      return { ...result, lastInsertRowId: Number(result.lastInsertRowid) };
    },
    withExclusiveTransactionAsync: async action => {
      sqlite.exec('BEGIN IMMEDIATE');
      try { await action(db); sqlite.exec('COMMIT'); } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
  };
  const load = loader({ 'expo-sqlite': { openDatabaseSync: () => db } });
  const { SQLiteFinanceRepository } = load('modules/Core/Repository/SQLiteRepo.ts');
  return { sqlite, repo: new SQLiteFinanceRepository('personal') };
}

module.exports = { repository };
