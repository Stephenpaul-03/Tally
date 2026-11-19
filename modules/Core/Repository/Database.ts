import * as SQLite from "expo-sqlite";

export type FinanceDatabase = SQLite.SQLiteDatabase;

// Keep the native opener identity stable so Fast Refresh reuses startup state.
export const openFinanceDatabase = SQLite.openDatabaseSync;
