import type { SQLiteDatabase } from "expo-sqlite";

type Opener = (name: string) => SQLiteDatabase;
type Runtime = { database: SQLiteDatabase; initialized: boolean };
const runtimeHost = globalThis as typeof globalThis & {
  __tallyDatabaseRuntimes?: WeakMap<Opener, Runtime>;
};

/** Fast Refresh must reuse the connection and avoid rerunning startup writes. */
export function getFinanceDatabaseRuntime(open: Opener): Runtime {
  const runtimes = runtimeHost.__tallyDatabaseRuntimes ??= new WeakMap();
  let runtime = runtimes.get(open);
  if (!runtime) {
    runtime = { database: open("finance.db"), initialized: false };
    runtimes.set(open, runtime);
  }
  return runtime;
}

export function initializeFinanceDatabaseRuntime(runtime: Runtime, initialize: () => void) {
  if (runtime.initialized) return;
  runtime.database.execSync("PRAGMA busy_timeout = 3000;");
  runtime.database.execSync("PRAGMA journal_mode = WAL;");
  initialize();
  // A failed initialization remains retryable; never mark partial setup ready.
  runtime.initialized = true;
}
