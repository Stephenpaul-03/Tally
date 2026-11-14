import * as SQLite from "expo-sqlite";

export type FinanceDatabase = SQLite.SQLiteDatabase;

export function openFinanceDatabase(): FinanceDatabase {
  return SQLite.openDatabaseSync("finance.db");
}
