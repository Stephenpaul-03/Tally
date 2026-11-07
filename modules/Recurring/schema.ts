export const recurringSchema = `
CREATE TABLE IF NOT EXISTS recurring_transactions (
 id TEXT PRIMARY KEY,
 workspace_id TEXT NOT NULL REFERENCES workspaces(id),
 source_transaction_id TEXT NOT NULL,
 category_id INTEGER NOT NULL REFERENCES categories(id),
 account_id INTEGER REFERENCES accounts(id),
 data_json TEXT NOT NULL,
 frequency TEXT NOT NULL CHECK(frequency IN ('weekly','monthly','yearly')),
 start_date TEXT NOT NULL,
 next_date TEXT NOT NULL,
 paused INTEGER NOT NULL DEFAULT 0,
 deleted INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_recurring_workspace ON recurring_transactions(workspace_id);
-- An empty source means a standalone schedule, with no initial ledger entry.
DROP INDEX IF EXISTS idx_recurring_source;
CREATE UNIQUE INDEX IF NOT EXISTS idx_recurring_source_v2 ON recurring_transactions(workspace_id,source_transaction_id) WHERE deleted=0 AND source_transaction_id<>'';
CREATE TABLE IF NOT EXISTS recurring_occurrences (
 template_id TEXT NOT NULL REFERENCES recurring_transactions(id),
 due_date TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('pending','confirmed','skipped','missed')),
 transaction_id TEXT,
 resolved_at TEXT,
 PRIMARY KEY(template_id,due_date)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_recurring_link ON recurring_occurrences(transaction_id) WHERE transaction_id IS NOT NULL;
`;
