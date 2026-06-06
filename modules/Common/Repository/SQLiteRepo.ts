import * as SQLite from "expo-sqlite";
import { schema } from "../DB/Schema";
import { createTransaction, formatAccountLabel } from "../Utils/Helpers";
import {
    Account,
    DEFAULT_EXPENSE_CATEGORIES,
    DEFAULT_INCOME_CATEGORIES,
    Transaction,
    TransactionFormData,
} from "../Utils/Types";
import { Category, FinanceRepository } from "./Interface";

export type Workspace = {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt?: string;
};

export type WorkspaceInput = {
  name: string;
  icon?: string;
  color?: string;
  seedDefaults?: boolean;
};

export type DatabaseBackup = {
  exportedAt: string;
  workspaces: Workspace[];
  categories: any[];
  accounts: any[];
  transactions: any[];
};

export const DEFAULT_WORKSPACE_ID = "personal";

export const DEFAULT_WORKSPACES: Workspace[] = [
  {
    id: "personal",
    name: "Personal",
    icon: "account-outline",
    color: "#6366F1",
  },
  {
    id: "family",
    name: "Family",
    icon: "account-group-outline",
    color: "#F59E0B",
  },
];

const DEFAULT_ACCOUNT_DETAILS = [
  { name: "Card", icon: "credit-card-outline", color: "#6366F1" },
  { name: "Cash", icon: "cash", color: "#22C55E" },
  { name: "UPI", icon: "bank-outline", color: "#06B6D4" },
];

// --- Types ---
// Row shape returned by SELECT queries that JOIN categories
interface TransactionRow {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: string;
  type: "income" | "expense";
  account: string;
  notes: string | null;
  tags: string | null;
  created_by: string;
  is_deleted: number;
  created_at: string;
  updated_at: string;
}

interface CategoryRow {
  id: number;
  name: string;
  type: "income" | "expense";
  icon?: string;
  color?: string;
}

interface AccountRow {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  sort_order?: number;
}

interface WorkspaceRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  created_at: string;
}

// --- Helpers ---
// SQLiteBindValue only accepts string | number | null | Uint8Array.
// Tags are stored as a JSON string in the DB and parsed back on read.
const serializeTags = (
  tags: string[] | string | null | undefined,
): string | null => {
  if (tags == null) return null;
  if (Array.isArray(tags)) return JSON.stringify(tags);
  return tags; // already a serialized string
};

const parseTags = (tags: string | null): string[] | undefined => {
  if (!tags) return undefined;

  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
};

const mapTransactionRow = (row: TransactionRow): Transaction => ({
  id: row.id,
  title: row.title,
  amount: row.amount,
  date: row.date,
  category: row.category,
  type: row.type,
  account: formatAccountLabel(row.account) as Transaction["account"],
  notes: row.notes ?? undefined,
  tags: parseTags(row.tags),
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  deleted: row.is_deleted === 1,
});

const mapAccountRow = (row: AccountRow): Account => ({
  id: String(row.id),
  name: row.name,
  icon: row.icon,
  color: row.color,
  createdAt: new Date().toISOString(),
});

const mapWorkspaceRow = (row: WorkspaceRow): Workspace => ({
  id: row.id,
  name: row.name,
  icon: row.icon,
  color: row.color,
  createdAt: row.created_at,
});

const createWorkspaceSlug = (name: string) => {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || `workspace-${Date.now()}`;
};

const seedDefaultCategoriesForWorkspace = async (workspaceId: string) => {
  for (const name of DEFAULT_INCOME_CATEGORIES) {
    await db.runAsync(
      "INSERT OR IGNORE INTO categories (workspace_id, name, type) VALUES (?, ?, ?)",
      [workspaceId, name, "income"],
    );
  }

  for (const name of DEFAULT_EXPENSE_CATEGORIES) {
    await db.runAsync(
      "INSERT OR IGNORE INTO categories (workspace_id, name, type) VALUES (?, ?, ?)",
      [workspaceId, name, "expense"],
    );
  }
};

const seedDefaultAccountsForWorkspace = async (workspaceId: string) => {
  for (let index = 0; index < DEFAULT_ACCOUNT_DETAILS.length; index += 1) {
    const account = DEFAULT_ACCOUNT_DETAILS[index];
    await db.runAsync(
      "INSERT OR IGNORE INTO accounts (workspace_id, name, icon, color, sort_order) VALUES (?, ?, ?, ?, ?)",
      [workspaceId, account.name, account.icon, account.color, index],
    );
  }
};

const shouldAutoSeedWorkspace = (workspaceId: string) =>
  DEFAULT_WORKSPACES.some((workspace) => workspace.id === workspaceId);

// --- Database Connection ---
// expo-sqlite v2: openDatabaseSync replaces the deprecated openDatabase
const db = SQLite.openDatabaseSync("finance.db");

// Export db for debugging purposes
export const financeDb = db;

const seedWorkspacesSql = DEFAULT_WORKSPACES.map(
  (workspace) =>
    `('${workspace.id}', '${workspace.name}', '${workspace.icon}', '${workspace.color}')`,
).join(",\n      ");

const ensureWorkspaceSchema = () => {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (error) {
    console.error("Failed to initialize workspace schema:", error);
  }
};

const addWorkspaceColumn = (tableName: string) => {
  try {
    db.execSync(
      `ALTER TABLE ${tableName} ADD COLUMN workspace_id TEXT NOT NULL DEFAULT '${DEFAULT_WORKSPACE_ID}';`,
    );
  } catch {
    // Ignore duplicate-column failures for existing databases.
  }
};

const getTableSql = (tableName: string): string => {
  const row = db.getFirstSync<{ sql: string | null }>(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?",
    [tableName],
  );
  return row?.sql ?? "";
};

const migrateWorkspaceUniqueConstraints = () => {
  const accountsSql = getTableSql("accounts");
  const categoriesSql = getTableSql("categories");
  const normalizedAccountsSql = accountsSql.toLowerCase().replace(/\s+/g, "");
  const normalizedCategoriesSql = categoriesSql
    .toLowerCase()
    .replace(/\s+/g, "");
  const shouldRebuildAccounts =
    normalizedAccountsSql.includes("nametextnotnullunique") ||
    !normalizedAccountsSql.includes("unique(workspace_id,name)");
  const shouldRebuildCategories =
    normalizedCategoriesSql.includes("unique(name,type)") ||
    !normalizedCategoriesSql.includes("unique(workspace_id,name,type)");

  if (!shouldRebuildAccounts && !shouldRebuildCategories) return;

  try {
    db.execSync("PRAGMA foreign_keys = OFF;");

    if (shouldRebuildAccounts) {
      db.execSync(`
        DROP TRIGGER IF EXISTS update_accounts_updated_at;
        CREATE TABLE accounts_workspace_migration (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          workspace_id TEXT NOT NULL DEFAULT '${DEFAULT_WORKSPACE_ID}',
          name TEXT NOT NULL,
          icon TEXT,
          color TEXT,
          sort_order INTEGER DEFAULT 0,
          is_deleted INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(workspace_id, name),
          FOREIGN KEY(workspace_id) REFERENCES workspaces(id)
        );
        INSERT OR IGNORE INTO accounts_workspace_migration
          (id, workspace_id, name, icon, color, sort_order, is_deleted, created_at, updated_at)
        SELECT
          id,
          COALESCE(workspace_id, '${DEFAULT_WORKSPACE_ID}'),
          name,
          icon,
          color,
          COALESCE(sort_order, 0),
          COALESCE(is_deleted, 0),
          COALESCE(created_at, CURRENT_TIMESTAMP),
          COALESCE(updated_at, CURRENT_TIMESTAMP)
        FROM accounts;
        DROP TABLE accounts;
        ALTER TABLE accounts_workspace_migration RENAME TO accounts;
      `);
    }

    if (shouldRebuildCategories) {
      db.execSync(`
        DROP TRIGGER IF EXISTS update_categories_updated_at;
        CREATE TABLE categories_workspace_migration (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          workspace_id TEXT NOT NULL DEFAULT '${DEFAULT_WORKSPACE_ID}',
          name TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
          icon TEXT,
          color TEXT,
          is_deleted INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(workspace_id, name, type),
          FOREIGN KEY(workspace_id) REFERENCES workspaces(id)
        );
        INSERT OR IGNORE INTO categories_workspace_migration
          (id, workspace_id, name, type, icon, color, is_deleted, created_at, updated_at)
        SELECT
          id,
          COALESCE(workspace_id, '${DEFAULT_WORKSPACE_ID}'),
          name,
          type,
          icon,
          color,
          COALESCE(is_deleted, 0),
          COALESCE(created_at, CURRENT_TIMESTAMP),
          COALESCE(updated_at, CURRENT_TIMESTAMP)
        FROM categories;
        DROP TABLE categories;
        ALTER TABLE categories_workspace_migration RENAME TO categories;
      `);
    }
  } catch (error) {
    console.error("Failed to migrate workspace unique constraints:", error);
  } finally {
    try {
      db.execSync("PRAGMA foreign_keys = ON;");
    } catch {
      // Ignore PRAGMA failures.
    }
  }
};

export class SQLiteWorkspaceRepository {
  async getWorkspaces(): Promise<Workspace[]> {
    const rows = await db.getAllAsync<WorkspaceRow>(
      `SELECT id, name, icon, color, created_at
       FROM workspaces
       ORDER BY
        CASE id
          WHEN 'personal' THEN 0
          WHEN 'family' THEN 1
          ELSE 2
        END,
        created_at ASC,
        name ASC`,
    );
    return rows.map(mapWorkspaceRow);
  }

  async createWorkspace(input: WorkspaceInput): Promise<Workspace> {
    const name = input.name.trim();
    if (!name) {
      throw new Error("Workspace name is required");
    }

    const baseId = createWorkspaceSlug(name);
    let workspaceId = baseId;
    let suffix = 2;
    while (
      await db.getFirstAsync<{ id: string }>(
        "SELECT id FROM workspaces WHERE id = ?",
        [workspaceId],
      )
    ) {
      workspaceId = `${baseId}-${suffix}`;
      suffix += 1;
    }

    const icon = input.icon?.trim() || "briefcase-outline";
    const color = input.color?.trim() || "#6366F1";

    await db.runAsync(
      "INSERT INTO workspaces (id, name, icon, color) VALUES (?, ?, ?, ?)",
      [workspaceId, name, icon, color],
    );

    if (input.seedDefaults !== false) {
      await seedDefaultCategoriesForWorkspace(workspaceId);
      await seedDefaultAccountsForWorkspace(workspaceId);
    }

    const row = await db.getFirstAsync<WorkspaceRow>(
      "SELECT id, name, icon, color, created_at FROM workspaces WHERE id = ?",
      [workspaceId],
    );
    if (!row) {
      throw new Error("Failed to create workspace");
    }
    return mapWorkspaceRow(row);
  }

  async updateWorkspace(
    id: string,
    data: Partial<WorkspaceInput>,
  ): Promise<Workspace> {
    const current = await db.getFirstAsync<WorkspaceRow>(
      "SELECT id, name, icon, color, created_at FROM workspaces WHERE id = ?",
      [id],
    );
    if (!current) {
      throw new Error(`Workspace '${id}' not found`);
    }

    const name = data.name?.trim() || current.name;
    const icon = data.icon?.trim() || current.icon;
    const color = data.color?.trim() || current.color;

    await db.runAsync(
      "UPDATE workspaces SET name = ?, icon = ?, color = ? WHERE id = ?",
      [name, icon, color, id],
    );

    const updated = await db.getFirstAsync<WorkspaceRow>(
      "SELECT id, name, icon, color, created_at FROM workspaces WHERE id = ?",
      [id],
    );
    if (!updated) {
      throw new Error(`Workspace '${id}' not found after update`);
    }
    return mapWorkspaceRow(updated);
  }

  async deleteWorkspace(id: string): Promise<void> {
    const countRow = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM workspaces",
    );
    if ((countRow?.count ?? 0) <= 1) {
      throw new Error("Tally needs at least one workspace.");
    }

    await db.runAsync("DELETE FROM transactions WHERE workspace_id = ?", [id]);
    await db.runAsync("DELETE FROM categories WHERE workspace_id = ?", [id]);
    await db.runAsync("DELETE FROM accounts WHERE workspace_id = ?", [id]);
    await db.runAsync("DELETE FROM workspaces WHERE id = ?", [id]);
  }

  async getDatabaseBackup(): Promise<DatabaseBackup> {
    const [workspaces, categories, accounts, transactions] = await Promise.all([
      this.getWorkspaces(),
      db.getAllAsync("SELECT * FROM categories ORDER BY workspace_id, type, id"),
      db.getAllAsync("SELECT * FROM accounts ORDER BY workspace_id, sort_order, id"),
      db.getAllAsync("SELECT * FROM transactions ORDER BY workspace_id, date DESC"),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      workspaces,
      categories,
      accounts,
      transactions,
    };
  }
}

// --- Initialize Database ---
// execSync is safe here because this runs once at module load before any
// component mounts, and the schema DDL is fast.
ensureWorkspaceSchema();
addWorkspaceColumn("transactions");
addWorkspaceColumn("categories");
addWorkspaceColumn("accounts");

try {
  db.execSync(schema);
} catch (error) {
  console.error("Failed to initialize database schema:", error);
}

try {
  db.execSync("ALTER TABLE categories ADD COLUMN color TEXT;");
} catch {
  // Ignore duplicate-column failures for existing databases.
}

try {
  db.execSync("ALTER TABLE accounts ADD COLUMN sort_order INTEGER DEFAULT 0;");
} catch {
  // Ignore duplicate-column failures for existing databases.
}

ensureWorkspaceSchema();
migrateWorkspaceUniqueConstraints();

try {
  db.execSync(schema);
} catch (error) {
  console.error("Failed to finalize database schema:", error);
}

ensureWorkspaceSchema();

try {
  const countRow = db.getFirstSync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM workspaces;"
  );
  const count = countRow?.count ?? 0;
  if (count === 0) {
    db.execSync(`
      INSERT OR IGNORE INTO workspaces (id, name, icon, color) VALUES
        ${seedWorkspacesSql};
    `);
    db.execSync(
      `
      INSERT OR IGNORE INTO accounts (workspace_id, name, icon, color) VALUES
        ('${DEFAULT_WORKSPACE_ID}', '${DEFAULT_ACCOUNT_DETAILS[0].name}', '${DEFAULT_ACCOUNT_DETAILS[0].icon}', '${DEFAULT_ACCOUNT_DETAILS[0].color}'),
        ('${DEFAULT_WORKSPACE_ID}', '${DEFAULT_ACCOUNT_DETAILS[1].name}', '${DEFAULT_ACCOUNT_DETAILS[1].icon}', '${DEFAULT_ACCOUNT_DETAILS[1].color}'),
        ('${DEFAULT_WORKSPACE_ID}', '${DEFAULT_ACCOUNT_DETAILS[2].name}', '${DEFAULT_ACCOUNT_DETAILS[2].icon}', '${DEFAULT_ACCOUNT_DETAILS[2].color}');
      `,
    );
  }
} catch (error) {
  console.error("Failed to seed default workspaces and accounts:", error);
}

try {
  db.execSync(
    `
    UPDATE accounts
    SET sort_order = CASE LOWER(name)
      WHEN 'card' THEN 0
      WHEN 'cash' THEN 1
      WHEN 'upi' THEN 2
      ELSE COALESCE(sort_order, id + 100)
    END
    WHERE sort_order = 0 OR sort_order IS NULL;
    `,
  );
} catch (error) {
  console.error("Failed to normalize account sort order:", error);
}

// --- Repository Implementation ---
export class SQLiteFinanceRepository implements FinanceRepository {
  constructor(private readonly workspaceId = DEFAULT_WORKSPACE_ID) {}

  // --- Private helper: resolve a category name+type to its numeric ID ---
  private async getCategoryId(
    name: string,
    type: "income" | "expense",
  ): Promise<number> {
    const row = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM categories WHERE workspace_id = ? AND name = ? AND type = ? AND is_deleted = 0",
      [this.workspaceId, name, type],
    );
    if (!row) {
      throw new Error(`Category '${name}' not found for type '${type}'`);
    }
    return row.id;
  }

  // --- Fetch transactions, with optional filters ---
  async getTransactions(filters?: {
    type?: "income" | "expense";
    startDate?: string;
    endDate?: string;
  }): Promise<Transaction[]> {
    const conditions: string[] = ["t.workspace_id = ?", "t.is_deleted = 0"];
    const params: (string | number)[] = [this.workspaceId];

    if (filters?.type) {
      conditions.push("t.type = ?");
      params.push(filters.type);
    }
    if (filters?.startDate) {
      conditions.push("t.date >= ?");
      params.push(filters.startDate);
    }
    if (filters?.endDate) {
      conditions.push("t.date <= ?");
      params.push(filters.endDate);
    }

    const whereClause = conditions.join(" AND ");

    const rows = await db.getAllAsync<TransactionRow>(
      `SELECT
        t.id, t.title, t.amount, t.date, c.name AS category, t.type,
        t.account, t.notes, t.tags, t.created_by, t.is_deleted,
        t.created_at, t.updated_at
       FROM transactions t
       JOIN categories c ON t.category_id = c.id AND c.workspace_id = t.workspace_id
       WHERE ${whereClause}
       ORDER BY t.date DESC`,
      params,
    );

    return rows.map(mapTransactionRow);
  }

  // --- Insert a new transaction ---
  async addTransaction(txData: TransactionFormData): Promise<Transaction> {
    console.log("[addTransaction] Input:", txData);
    const categoryId = await this.getCategoryId(txData.category, txData.type);
    console.log("[addTransaction] Category ID:", categoryId);
    const newTransaction = createTransaction({
      ...txData,
      category_id: categoryId,
    });
    console.log("[addTransaction] Created:", newTransaction);

    await db.runAsync(
      `INSERT INTO transactions
        (id, workspace_id, title, amount, date, category_id, type, account, notes, tags, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newTransaction.id,
        this.workspaceId,
        newTransaction.title,
        newTransaction.amount,
        newTransaction.date,
        categoryId,
        newTransaction.type,
        newTransaction.account,
        newTransaction.notes ?? null,
        serializeTags(newTransaction.tags),
        newTransaction.createdBy,
        newTransaction.createdAt,
        newTransaction.updatedAt,
      ],
    );

    return newTransaction;
  }

  // --- Update an existing transaction ---
  async updateTransaction(
    id: string,
    data: Partial<TransactionFormData>,
  ): Promise<Transaction> {
    // Resolve category_id first, outside the transaction
    let categoryId: number | undefined;
    if (data.category && data.type) {
      categoryId = await this.getCategoryId(data.category, data.type);
    }

    // Build an explicit DB-column -> value map to avoid any camelCase/snake_case mismatch.
    // Values must be SQLiteBindValue-compatible: string | number | null only (no undefined).
    const columnMap: Record<string, string | number | null> = {};
    if (data.title !== undefined) columnMap["title"] = data.title;
    if (data.amount !== undefined) columnMap["amount"] = data.amount;
    if (data.date !== undefined) columnMap["date"] = data.date;
    if (data.type !== undefined) columnMap["type"] = data.type;
    if (data.account !== undefined) columnMap["account"] = data.account;
    if (data.notes !== undefined) columnMap["notes"] = data.notes ?? null;
    // tags is string[] | string | null — must be serialized to string for SQLite
    if (data.tags !== undefined) columnMap["tags"] = serializeTags(data.tags);
    if (categoryId !== undefined) columnMap["category_id"] = categoryId;

    if (Object.keys(columnMap).length > 0) {
      const setClauses = Object.keys(columnMap)
        .map((key) => `${key} = ?`)
        .join(", ");
      // All values are string | number | null here — safe for SQLiteBindParams
      const params: (string | number | null)[] = [
        ...Object.values(columnMap),
        id,
      ];

      await db.runAsync(
        `UPDATE transactions SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        params,
      );
    }

    // Return the full updated row with category name joined
    const updated = await db.getFirstAsync<TransactionRow>(
      `SELECT
        t.id, t.title, t.amount, t.date, c.name AS category, t.type,
        t.account, t.notes, t.tags, t.created_by, t.is_deleted,
        t.created_at, t.updated_at
       FROM transactions t
       JOIN categories c ON t.category_id = c.id AND c.workspace_id = t.workspace_id
       WHERE t.id = ?`,
      [id],
    );

    if (!updated) {
      throw new Error(`Transaction '${id}' not found after update`);
    }

    return mapTransactionRow(updated);
  }

  // --- Soft-delete (hide) a transaction ---
  async softDeleteTransaction(id: string): Promise<void> {
    await db.runAsync("UPDATE transactions SET is_deleted = 1 WHERE id = ?", [
      id,
    ]);
  }

  // --- Restore a soft-deleted transaction ---
  async restoreTransaction(id: string): Promise<void> {
    await db.runAsync("UPDATE transactions SET is_deleted = 0 WHERE id = ?", [
      id,
    ]);
  }

  // --- Permanently remove a transaction ---
  async permanentDeleteTransaction(id: string): Promise<void> {
    await db.runAsync("DELETE FROM transactions WHERE id = ?", [id]);
  }

  // --- Clear all transactions (hard delete) ---
  async clearAllTransactions(): Promise<void> {
    await db.runAsync("DELETE FROM transactions WHERE workspace_id = ?", [
      this.workspaceId,
    ]);
  }

  // --- Fetch categories by type ---
  async getCategories(type: "income" | "expense"): Promise<Category[]> {
    const rows = await db.getAllAsync<CategoryRow>(
      "SELECT * FROM categories WHERE workspace_id = ? AND type = ? AND is_deleted = 0",
      [this.workspaceId, type],
    );

    // If no categories exist, seed defaults
    if (rows.length === 0 && shouldAutoSeedWorkspace(this.workspaceId)) {
      await seedDefaultCategoriesForWorkspace(this.workspaceId);
      // Re-fetch after seeding
      const newRows = await db.getAllAsync<CategoryRow>(
        "SELECT * FROM categories WHERE workspace_id = ? AND type = ? AND is_deleted = 0",
        [this.workspaceId, type],
      );
      return newRows;
    }

    return rows;
  }

  // --- Get category by name ---
  async getCategoryByName(
    name: string,
    type: "income" | "expense",
  ): Promise<Category | null> {
    const row = await db.getFirstAsync<CategoryRow>(
      "SELECT * FROM categories WHERE workspace_id = ? AND name = ? AND type = ? AND is_deleted = 0",
      [this.workspaceId, name, type],
    );
    return row || null;
  }

  // --- Add a new category ---
  async addCategory(
    name: string,
    type: "income" | "expense",
    icon?: string,
    color?: string,
  ): Promise<Category> {
    const deleted = await db.getFirstAsync<CategoryRow & { is_deleted: number }>(
      "SELECT * FROM categories WHERE workspace_id = ? AND name = ? AND type = ? AND is_deleted = 1",
      [this.workspaceId, name, type],
    );

    if (deleted) {
      await db.runAsync(
        "UPDATE categories SET is_deleted = 0, icon = ?, color = ? WHERE id = ? AND workspace_id = ?",
        [icon ?? deleted.icon ?? null, color ?? deleted.color ?? null, deleted.id, this.workspaceId],
      );
      return {
        id: deleted.id,
        name: deleted.name,
        type: deleted.type,
        icon: icon ?? deleted.icon,
        color: color ?? deleted.color,
      };
    }

    const result = await db.runAsync(
      "INSERT INTO categories (workspace_id, name, type, icon, color) VALUES (?, ?, ?, ?, ?)",
      [this.workspaceId, name, type, icon ?? null, color ?? null],
    );

    if (!result.lastInsertRowId) {
      throw new Error("Failed to insert category");
    }

    return { id: result.lastInsertRowId, name, type, icon, color };
  }

  // --- Update a category's name and/or icon ---
  async updateCategory(
    id: number,
    newName: string,
    icon?: string,
    color?: string,
  ): Promise<Category> {
    await db.runAsync(
      "UPDATE categories SET name = ?, icon = ?, color = ? WHERE id = ? AND workspace_id = ?",
      [newName, icon ?? null, color ?? null, id, this.workspaceId],
    );

    const updated = await db.getFirstAsync<CategoryRow>(
      "SELECT * FROM categories WHERE id = ? AND workspace_id = ?",
      [id, this.workspaceId],
    );

    if (!updated) {
      throw new Error(`Category '${id}' not found after update`);
    }

    return updated;
  }

  // --- Soft-delete a category ---
  async reassignCategoryTransactions(
    fromCategoryId: number,
    toCategoryId: number,
    type: "income" | "expense",
  ): Promise<void> {
    await db.runAsync(
      "UPDATE transactions SET category_id = ? WHERE workspace_id = ? AND category_id = ? AND type = ?",
      [toCategoryId, this.workspaceId, fromCategoryId, type],
    );
  }

  async softDeleteCategory(id: number): Promise<void> {
    await db.runAsync(
      "UPDATE categories SET is_deleted = 1 WHERE id = ? AND workspace_id = ?",
      [id, this.workspaceId],
    );
  }

  async getAccounts(): Promise<Account[]> {
    const rows = await db.getAllAsync<AccountRow>(
      "SELECT * FROM accounts WHERE workspace_id = ? AND is_deleted = 0 ORDER BY sort_order ASC, id ASC",
      [this.workspaceId],
    );

    if (rows.length === 0 && shouldAutoSeedWorkspace(this.workspaceId)) {
      await seedDefaultAccountsForWorkspace(this.workspaceId);
      const seededRows = await db.getAllAsync<AccountRow>(
        "SELECT * FROM accounts WHERE workspace_id = ? AND is_deleted = 0 ORDER BY sort_order ASC, id ASC",
        [this.workspaceId],
      );
      return seededRows.map(mapAccountRow);
    }

    return rows.map(mapAccountRow);
  }

  async getAccountByName(name: string): Promise<Account | null> {
    const row = await db.getFirstAsync<AccountRow>(
      "SELECT * FROM accounts WHERE workspace_id = ? AND name = ? AND is_deleted = 0",
      [this.workspaceId, name],
    );
    return row ? mapAccountRow(row) : null;
  }

  async addAccount(
    name: string,
    icon?: string,
    color?: string,
  ): Promise<Account> {
    const deleted = await db.getFirstAsync<AccountRow & { is_deleted: number }>(
      "SELECT * FROM accounts WHERE workspace_id = ? AND name = ? AND is_deleted = 1",
      [this.workspaceId, name],
    );

    if (deleted) {
      await db.runAsync(
        "UPDATE accounts SET is_deleted = 0, icon = ?, color = ? WHERE id = ? AND workspace_id = ?",
        [icon ?? deleted.icon ?? null, color ?? deleted.color ?? null, deleted.id, this.workspaceId],
      );
      return {
        id: String(deleted.id),
        name: deleted.name,
        icon: icon ?? deleted.icon,
        color: color ?? deleted.color,
        createdAt: new Date().toISOString(),
      };
    }

    const maxSortRow = await db.getFirstAsync<{ maxSort: number | null }>(
      "SELECT MAX(sort_order) AS maxSort FROM accounts WHERE workspace_id = ?",
      [this.workspaceId],
    );
    const nextSortOrder = (maxSortRow?.maxSort ?? -1) + 1;

    const result = await db.runAsync(
      "INSERT INTO accounts (workspace_id, name, icon, color, sort_order) VALUES (?, ?, ?, ?, ?)",
      [this.workspaceId, name, icon ?? null, color ?? null, nextSortOrder],
    );

    if (!result.lastInsertRowId) {
      throw new Error("Failed to insert account");
    }

    return {
      id: String(result.lastInsertRowId),
      name,
      icon,
      color,
      createdAt: new Date().toISOString(),
    };
  }

  async updateAccount(
    id: number,
    newName: string,
    icon?: string,
    color?: string,
  ): Promise<Account> {
    await db.runAsync(
      "UPDATE accounts SET name = ?, icon = ?, color = ? WHERE id = ? AND workspace_id = ?",
      [newName, icon ?? null, color ?? null, id, this.workspaceId],
    );

    const updated = await db.getFirstAsync<AccountRow>(
      "SELECT * FROM accounts WHERE id = ? AND workspace_id = ?",
      [id, this.workspaceId],
    );

    if (!updated) {
      throw new Error(`Account '${id}' not found after update`);
    }

    return {
      id: String(updated.id),
      name: updated.name,
      icon: updated.icon,
      color: updated.color,
      createdAt: new Date().toISOString(),
    };
  }

  async reassignAccountTransactions(
    fromName: string,
    toName: string,
  ): Promise<void> {
    await db.runAsync(
      "UPDATE transactions SET account = ? WHERE workspace_id = ? AND account = ?",
      [toName, this.workspaceId, fromName],
    );
  }

  async softDeleteAccount(id: number): Promise<void> {
    await db.runAsync(
      "UPDATE accounts SET is_deleted = 1 WHERE id = ? AND workspace_id = ?",
      [id, this.workspaceId],
    );
  }

  async updateAccountOrder(names: string[]): Promise<void> {
    for (let index = 0; index < names.length; index += 1) {
      await db.runAsync(
        "UPDATE accounts SET sort_order = ? WHERE workspace_id = ? AND name = ?",
        [index, this.workspaceId, names[index]],
      );
    }
  }

  // Intentional no-op: Redux-to-SQLite migration is handled at the app
  // bootstrap layer before this repository is instantiated.
  async migrateFromRedux(_data: unknown): Promise<void> {
    return Promise.resolve();
  }
}
