import type { SQLiteDatabase } from "expo-sqlite";

export type FinanceDatabase = SQLiteDatabase;

type DesktopFinanceDatabase = {
  execSync(source: string): void;
  getFirstSync<T>(source: string, params?: unknown[]): T | null;
  getAllSync<T>(source: string, params?: unknown[]): T[];
  runSync(source: string, params?: unknown[]): { changes: number; lastInsertRowId: number };
  withTransactionSync(task: () => void): void;
  execAsync(source: string): Promise<void>;
  getFirstAsync<T>(source: string, params?: unknown[]): Promise<T | null>;
  getAllAsync<T>(source: string, params?: unknown[]): Promise<T[]>;
  runAsync(source: string, params?: unknown[]): Promise<{ changes: number; lastInsertRowId: number }>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
  withExclusiveTransactionAsync(task: (transaction: DesktopFinanceDatabase) => Promise<void>): Promise<void>;
};

declare global {
  interface Window {
    tallyDatabase?: {
      exec(source: string): void;
      get<T>(source: string, params?: unknown[]): T | null;
      all<T>(source: string, params?: unknown[]): T[];
      run(source: string, params?: unknown[]): { changes: number; lastInsertRowId: number };
    };
  }
}

export function openFinanceDatabase(): FinanceDatabase {
  const bridge = window.tallyDatabase;
  if (!bridge) {
    throw new Error("Tally's desktop SQLite bridge is unavailable. Open this app through Electron.");
  }

  const database: DesktopFinanceDatabase = {
    execSync: (source) => bridge.exec(source),
    getFirstSync: <T>(source: string, params: unknown[] = []) => bridge.get<T>(source, params),
    getAllSync: <T>(source: string, params: unknown[] = []) => bridge.all<T>(source, params),
    runSync: (source, params = []) => bridge.run(source, params),
    withTransactionSync: (task) => {
      bridge.exec("BEGIN");
      try {
        task();
        bridge.exec("COMMIT");
      } catch (error) {
        bridge.exec("ROLLBACK");
        throw error;
      }
    },
    execAsync: async (source) => bridge.exec(source),
    getFirstAsync: async <T>(source: string, params: unknown[] = []) => bridge.get<T>(source, params),
    getAllAsync: async <T>(source: string, params: unknown[] = []) => bridge.all<T>(source, params),
    runAsync: async (source, params = []) => bridge.run(source, params),
    withTransactionAsync: async (task) => {
      bridge.exec("BEGIN");
      try {
        await task();
        bridge.exec("COMMIT");
      } catch (error) {
        bridge.exec("ROLLBACK");
        throw error;
      }
    },
    withExclusiveTransactionAsync: async (task) => {
      bridge.exec("BEGIN IMMEDIATE");
      try {
        await task(database);
        bridge.exec("COMMIT");
      } catch (error) {
        bridge.exec("ROLLBACK");
        throw error;
      }
    },
  };

  return database as unknown as FinanceDatabase;
}
