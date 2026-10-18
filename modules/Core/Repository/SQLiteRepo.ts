import { sortCategories } from "@/utils/category-order";
import { validateImport, needsReview, type ImportRow } from "@/modules/Core/import/validation";
import { initializeOnboarding, isOnboardingComplete, resetOnboarding, saveOnboarding, getTourProgress, saveTourProgress, type OnboardingSetup } from "../../Onboarding/storage";
import * as SQLite from "expo-sqlite";
import { createSampleTransactions, SAMPLE_ID_PREFIX } from "../../Insights/sampleData";
import { createTransaction, formatAccountLabel } from "../../../utils/Helpers";
import {
    Account,
    DEFAULT_EXPENSE_CATEGORIES,
    DEFAULT_INCOME_CATEGORIES,
    Transaction,
    TransactionFormData,
} from "../../../utils/Types";
import { schema } from "../DB/Schema";
import { BudgetSettings, Category, FinanceRepository } from "./Interface";

export type Workspace = {
  id: string;
  name: string;
  icon: string;
  color: string;
  ownerName?: string;
  currencyCode: string;
  currencySymbol: string;
  currencyName: string;
  createdAt?: string;
  lastUsedAt?: string;
  lastBackupAt?: string;
  lastBackupKind?: "full" | "month" | "range";
};

export type WorkspaceInput = {
  name: string;
  icon?: string;
  color?: string;
  ownerName?: string;
  currencyCode?: string;
  currencySymbol?: string;
  currencyName?: string;
  seedDefaults?: boolean;
};

export type DatabaseBackup = {
  exportedAt: string;
  workspaces: Workspace[];
  categories: any[];
  accounts: any[];
  budgets: any[];
  categoryBudgets: any[];
  transactions: any[];
};

export type WorkspaceSetupInput = {
  incomeCategories: { name: string; icon?: string; color?: string }[];
  expenseCategories: { name: string; icon?: string; color?: string }[];
  accounts: { name: string; icon?: string; color?: string }[];
  overallBudget?: number;
  categoryBudgets?: { categoryName: string; amount: number }[];
};

export const DEFAULT_WORKSPACE_ID = "personal";

export const DEFAULT_WORKSPACES: Workspace[] = [
  {
    id: "personal",
    name: "Personal",
    icon: "account-outline",
    color: "#6366F1",
    currencyCode: "INR",
    currencySymbol: "₹",
    currencyName: "Indian Rupee",
  },
  {
    id: "family",
    name: "Family",
    icon: "account-group-outline",
    color: "#F59E0B",
    currencyCode: "INR",
    currencySymbol: "₹",
    currencyName: "Indian Rupee",
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
  currency_code: string | null;
  currency_symbol: string | null;
  currency_name: string | null;
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
  owner_name: string | null;
  currency_code: string | null;
  currency_symbol: string | null;
  currency_name: string | null;
  created_at: string;
  last_used_at: string | null;
  last_backup_at: string | null;
  last_backup_kind: string | null;
}

interface CategoryBudgetRow {
  category_id: number;
  category: string;
  amount: number;
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
  currencyCode: row.currency_code ?? undefined,
  currencySymbol: row.currency_symbol ?? undefined,
  currencyName: row.currency_name ?? undefined,
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
  ownerName: row.owner_name ?? undefined,
  currencyCode: row.currency_code ?? "INR",
  currencySymbol: row.currency_symbol ?? "₹",
  currencyName: row.currency_name ?? "Indian Rupee",
  createdAt: row.created_at,
  lastUsedAt: row.last_used_at ?? undefined,
  lastBackupAt: row.last_backup_at ?? undefined,
  lastBackupKind:
    row.last_backup_kind === "full" ||
    row.last_backup_kind === "month" ||
    row.last_backup_kind === "range"
      ? row.last_backup_kind
      : undefined,
});

const mapBudgetRows = (
  overallBudget: number,
  rows: CategoryBudgetRow[],
): BudgetSettings => ({
  overallBudget,
  categoryBudgets: rows.map((row) => ({
    categoryId: row.category_id,
    category: row.category,
    amount: row.amount,
  })),
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

// New installations start with one workspace. Existing workspaces are preserved.
const INITIAL_WORKSPACES = DEFAULT_WORKSPACES.slice(0, 1);
const seedWorkspacesSql = INITIAL_WORKSPACES.map(
  (workspace) =>
    `('${workspace.id}', '${workspace.name}', '${workspace.icon}', '${workspace.color}', '${workspace.currencyCode}', '${workspace.currencySymbol}', '${workspace.currencyName}')`,
).join(",\n      ");

const ensureWorkspaceSchema = () => {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        owner_name TEXT,
        currency_code TEXT NOT NULL DEFAULT 'INR',
        currency_symbol TEXT NOT NULL DEFAULT '₹',
        currency_name TEXT NOT NULL DEFAULT 'Indian Rupee',
        last_used_at TEXT,
        last_backup_at TEXT,
        last_backup_kind TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (error) {
    console.error("Failed to initialize workspace schema:", error);
  }
};

const addWorkspaceMetadataColumns = () => {
  const columns = [
    "owner_name TEXT",
    "currency_code TEXT",
    "currency_symbol TEXT",
    "currency_name TEXT",
    "last_used_at TEXT",
    "last_backup_at TEXT",
    "last_backup_kind TEXT",
    "created_at TEXT",
  ];

  for (const column of columns) {
    try {
      db.execSync(`ALTER TABLE workspaces ADD COLUMN ${column};`);
    } catch {
      // Ignore duplicate-column failures for existing databases.
    }
  }

  try {
    db.execSync(`
      UPDATE workspaces
      SET
        currency_code = COALESCE(currency_code, 'INR'),
        currency_symbol = COALESCE(currency_symbol, '₹'),
        currency_name = COALESCE(currency_name, 'Indian Rupee'),
        created_at = COALESCE(created_at, CURRENT_TIMESTAMP);
    `);
  } catch {
    // Ignore backfill failures; workspace reads still provide JS defaults.
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

const getTableColumns = (tableName: string) => {
  try {
    const rows = db.getAllSync<{ name: string }>(`PRAGMA table_info(${tableName});`);
    return new Set(rows.map((row) => row.name));
  } catch {
    return new Set<string>();
  }
};

const sqlString = (value: string) => `'${value.replace(/'/g, "''")}'`;

const workspaceColumnExpr = (
  columns: Set<string>,
  columnName: keyof WorkspaceRow,
  fallbackSql: string,
) =>
  columns.has(columnName)
    ? `COALESCE(${columnName}, ${fallbackSql}) AS ${columnName}`
    : `${fallbackSql} AS ${columnName}`;

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
  async isOnboardingComplete() {
    return isOnboardingComplete(db);
  }

  async completeOnboarding(input: OnboardingSetup) {
    saveOnboarding(db, input);
  }

  async getOnboardingTourProgress() {
    return getTourProgress(db);
  }

  async saveOnboardingTourProgress(step: number | null) {
    await saveTourProgress(db, step);
  }

  async getWorkspaces(): Promise<Workspace[]> {
    const columns = getTableColumns("workspaces");
    const createdOrder = columns.has("created_at") ? "created_at ASC," : "";
    const selectColumns = [
      workspaceColumnExpr(columns, "id", sqlString(DEFAULT_WORKSPACE_ID)),
      workspaceColumnExpr(columns, "name", "'Workspace'"),
      workspaceColumnExpr(columns, "icon", "'briefcase-outline'"),
      workspaceColumnExpr(columns, "color", "'#6366F1'"),
      workspaceColumnExpr(columns, "owner_name", "NULL"),
      workspaceColumnExpr(columns, "currency_code", "'INR'"),
      workspaceColumnExpr(columns, "currency_symbol", sqlString("₹")),
      workspaceColumnExpr(columns, "currency_name", "'Indian Rupee'"),
      workspaceColumnExpr(columns, "created_at", "CURRENT_TIMESTAMP"),
      workspaceColumnExpr(columns, "last_used_at", "NULL"),
      workspaceColumnExpr(columns, "last_backup_at", "NULL"),
      workspaceColumnExpr(columns, "last_backup_kind", "NULL"),
    ].join(", ");

    const rows = await db.getAllAsync<WorkspaceRow>(
      `SELECT ${selectColumns}
       FROM workspaces
       ORDER BY
        CASE id
          WHEN 'personal' THEN 0
          WHEN 'family' THEN 1
          ELSE 2
        END,
        ${createdOrder}
        name ASC`,
      [],
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
    const ownerName = input.ownerName?.trim() || null;
    const currencyCode = input.currencyCode?.trim() || "INR";
    const currencySymbol = input.currencySymbol?.trim() || "₹";
    const currencyName = input.currencyName?.trim() || "Indian Rupee";

    await db.runAsync(
      "INSERT INTO workspaces (id, name, icon, color, owner_name, currency_code, currency_symbol, currency_name, last_used_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
      [
        workspaceId,
        name,
        icon,
        color,
        ownerName,
        currencyCode,
        currencySymbol,
        currencyName,
      ],
    );

    if (input.seedDefaults !== false) {
      await seedDefaultCategoriesForWorkspace(workspaceId);
      await seedDefaultAccountsForWorkspace(workspaceId);
    }

    const row = await db.getFirstAsync<WorkspaceRow>(
      "SELECT id, name, icon, color, owner_name, currency_code, currency_symbol, currency_name, created_at, last_used_at, last_backup_at, last_backup_kind FROM workspaces WHERE id = ?",
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
      "SELECT id, name, icon, color, owner_name, currency_code, currency_symbol, currency_name, created_at, last_used_at, last_backup_at, last_backup_kind FROM workspaces WHERE id = ?",
      [id],
    );
    if (!current) {
      throw new Error(`Workspace '${id}' not found`);
    }

    const name = data.name?.trim() || current.name;
    const icon = data.icon?.trim() || current.icon;
    const color = data.color?.trim() || current.color;
    const ownerName =
      data.ownerName !== undefined ? data.ownerName.trim() || null : current.owner_name;
    const currencyCode = data.currencyCode?.trim() || current.currency_code || "INR";
    const currencySymbol =
      data.currencySymbol?.trim() || current.currency_symbol || "₹";
    const currencyName =
      data.currencyName?.trim() || current.currency_name || "Indian Rupee";

    await db.runAsync(
      "UPDATE workspaces SET name = ?, icon = ?, color = ?, owner_name = ?, currency_code = ?, currency_symbol = ?, currency_name = ? WHERE id = ?",
      [name, icon, color, ownerName, currencyCode, currencySymbol, currencyName, id],
    );

    const updated = await db.getFirstAsync<WorkspaceRow>(
      "SELECT id, name, icon, color, owner_name, currency_code, currency_symbol, currency_name, created_at, last_used_at, last_backup_at, last_backup_kind FROM workspaces WHERE id = ?",
      [id],
    );
    if (!updated) {
      throw new Error(`Workspace '${id}' not found after update`);
    }
    return mapWorkspaceRow(updated);
  }

  async markWorkspaceUsed(id: string): Promise<void> {
    await db.runAsync(
      "UPDATE workspaces SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id],
    );
  }

  async markWorkspaceBackedUp(
    id: string,
    kind: "full" | "month" | "range",
  ): Promise<void> {
    await db.runAsync(
      "UPDATE workspaces SET last_backup_at = CURRENT_TIMESTAMP, last_backup_kind = ? WHERE id = ?",
      [kind, id],
    );
  }

  async deleteWorkspace(id: string): Promise<void> {
    const countRow = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) AS count FROM workspaces",
    );
    if ((countRow?.count ?? 0) <= 1) {
      throw new Error("Tally needs at least one workspace.");
    }

    await db.runAsync("DELETE FROM transactions WHERE workspace_id = ?", [id]);
    await db.runAsync("DELETE FROM category_budgets WHERE workspace_id = ?", [
      id,
    ]);
    await db.runAsync("DELETE FROM budgets WHERE workspace_id = ?", [id]);
    await db.runAsync("DELETE FROM categories WHERE workspace_id = ?", [id]);
    await db.runAsync("DELETE FROM accounts WHERE workspace_id = ?", [id]);
    await db.runAsync("DELETE FROM workspaces WHERE id = ?", [id]);
  }

  async copyWorkspaceSetup(fromWorkspaceId: string, toWorkspaceId: string) {
    if (fromWorkspaceId === toWorkspaceId) return;

    const source = await db.getFirstAsync<{ id: string }>(
      "SELECT id FROM workspaces WHERE id = ?",
      [fromWorkspaceId],
    );
    const target = await db.getFirstAsync<{ id: string }>(
      "SELECT id FROM workspaces WHERE id = ?",
      [toWorkspaceId],
    );

    if (!source || !target) {
      throw new Error("Workspace setup copy needs valid workspaces.");
    }

    await db.withTransactionAsync(async () => {
      await db.runAsync("DELETE FROM category_budgets WHERE workspace_id = ?", [
        toWorkspaceId,
      ]);
      await db.runAsync("DELETE FROM budgets WHERE workspace_id = ?", [
        toWorkspaceId,
      ]);
      await db.runAsync("DELETE FROM categories WHERE workspace_id = ?", [
        toWorkspaceId,
      ]);
      await db.runAsync("DELETE FROM accounts WHERE workspace_id = ?", [
        toWorkspaceId,
      ]);

      await db.runAsync(
        `INSERT INTO accounts (workspace_id, name, icon, color, sort_order, is_deleted)
         SELECT ?, name, icon, color, sort_order, is_deleted
         FROM accounts
         WHERE workspace_id = ?
         ORDER BY sort_order ASC, id ASC`,
        [toWorkspaceId, fromWorkspaceId],
      );

      await db.runAsync(
        `INSERT INTO categories (workspace_id, name, type, icon, color, is_deleted)
         SELECT ?, name, type, icon, color, is_deleted
         FROM categories
         WHERE workspace_id = ?
         ORDER BY type ASC, id ASC`,
        [toWorkspaceId, fromWorkspaceId],
      );

      await db.runAsync(
        `INSERT INTO budgets (workspace_id, monthly_amount)
         SELECT ?, monthly_amount
         FROM budgets
         WHERE workspace_id = ?`,
        [toWorkspaceId, fromWorkspaceId],
      );

      const sourceBudgets = await db.getAllAsync<{
        categoryName: string;
        amount: number;
      }>(
        `SELECT c.name AS categoryName, cb.amount AS amount
         FROM category_budgets cb
         JOIN categories c ON c.id = cb.category_id AND c.workspace_id = cb.workspace_id
         WHERE cb.workspace_id = ?`,
        [fromWorkspaceId],
      );

      for (const budget of sourceBudgets) {
        const targetCategory = await db.getFirstAsync<{ id: number }>(
          "SELECT id FROM categories WHERE workspace_id = ? AND name = ? AND type = 'expense'",
          [toWorkspaceId, budget.categoryName],
        );
        if (!targetCategory) continue;

        await db.runAsync(
          "INSERT OR REPLACE INTO category_budgets (workspace_id, category_id, amount) VALUES (?, ?, ?)",
          [toWorkspaceId, targetCategory.id, budget.amount],
        );
      }
    });
  }

  async getDatabaseBackup(): Promise<DatabaseBackup> {
    const [
      workspaces,
      categories,
      accounts,
      budgets,
      categoryBudgets,
      transactions,
    ] = await Promise.all([
      this.getWorkspaces(),
      db.getAllAsync(
        "SELECT * FROM categories ORDER BY workspace_id, type, id",
      ),
      db.getAllAsync(
        "SELECT * FROM accounts ORDER BY workspace_id, sort_order, id",
      ),
      db.getAllAsync("SELECT * FROM budgets ORDER BY workspace_id, id"),
      db.getAllAsync(
        "SELECT * FROM category_budgets ORDER BY workspace_id, category_id",
      ),
      db.getAllAsync(
        "SELECT * FROM transactions ORDER BY workspace_id, date DESC",
      ),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      workspaces,
      categories,
      accounts,
      budgets,
      categoryBudgets,
      transactions,
    };
  }
}

// --- Initialize Database ---
// execSync is safe here because this runs once at module load before any
// component mounts, and the schema DDL is fast.
ensureWorkspaceSchema();
addWorkspaceMetadataColumns();
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

try {
  db.execSync("ALTER TABLE transactions ADD COLUMN currency_code TEXT;");
} catch {
  // Ignore duplicate-column failures for existing databases.
}

try {
  db.execSync("ALTER TABLE transactions ADD COLUMN currency_symbol TEXT;");
} catch {
  // Ignore duplicate-column failures for existing databases.
}

try {
  db.execSync("ALTER TABLE transactions ADD COLUMN currency_name TEXT;");
} catch {
  // Ignore duplicate-column failures for existing databases.
}

ensureWorkspaceSchema();
addWorkspaceMetadataColumns();
migrateWorkspaceUniqueConstraints();

try {
  db.execSync(schema);
} catch (error) {
  console.error("Failed to finalize database schema:", error);
}

ensureWorkspaceSchema();
addWorkspaceMetadataColumns();

try {
  const countRow = db.getFirstSync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM workspaces;",
  );
  const count = countRow?.count ?? 0;
  initializeOnboarding(db, count);
  if (count === 0) {
    db.execSync(`
      INSERT OR IGNORE INTO workspaces (id, name, icon, color, currency_code, currency_symbol, currency_name) VALUES
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
        t.account, t.currency_code, t.currency_symbol, t.currency_name,
        t.notes, t.tags, t.created_by, t.is_deleted,
        t.created_at, t.updated_at
       FROM transactions t
       JOIN categories c ON t.category_id = c.id AND c.workspace_id = t.workspace_id
       WHERE ${whereClause}
       ORDER BY t.date DESC`,
      params,
    );

    return rows.map(mapTransactionRow);
  }

  // Import the reviewed batch atomically, including explicitly requested new items.
  async importReviewedTransactions(rows: ImportRow[]): Promise<number> {
    if (!rows.length) throw new Error("No transactions to import.");
    await db.withExclusiveTransactionAsync(async transaction => {
      const income = await transaction.getAllAsync<{ name: string }>("SELECT name FROM categories WHERE workspace_id = ? AND type = 'income' AND is_deleted = 0", [this.workspaceId]);
      const expense = await transaction.getAllAsync<{ name: string }>("SELECT name FROM categories WHERE workspace_id = ? AND type = 'expense' AND is_deleted = 0", [this.workspaceId]);
      const accounts = await transaction.getAllAsync<{ name: string }>("SELECT name FROM accounts WHERE workspace_id = ? AND is_deleted = 0", [this.workspaceId]);
      const catalog = { incomeCategories: income.map(c => c.name), expenseCategories: expense.map(c => c.name), accounts: accounts.map(a => a.name) };
      validateImport(rows.map(row => row.transaction), catalog);
      if (rows.some(row => needsReview(row, catalog))) throw new Error("Some categories or payment accounts still need review. Nothing was imported.");
      for (const row of rows) {
        const tx = row.transaction;
        try {
          if (row.createCategory) {
            await transaction.runAsync("INSERT INTO categories (workspace_id, name, type, is_deleted) VALUES (?, ?, ?, 0) ON CONFLICT(workspace_id, name, type) DO UPDATE SET is_deleted = 0", [this.workspaceId, tx.category, tx.type]);
          }
          if (row.createAccount && tx.account) {
            await transaction.runAsync("INSERT INTO accounts (workspace_id, name, is_deleted) VALUES (?, ?, 0) ON CONFLICT(workspace_id, name) DO UPDATE SET is_deleted = 0", [this.workspaceId, tx.account]);
          }
          const category = await transaction.getFirstAsync<{ id: number }>("SELECT id FROM categories WHERE workspace_id = ? AND name = ? AND type = ? AND is_deleted = 0", [this.workspaceId, tx.category, tx.type]);
          if (!category) throw new Error("Category no longer exists.");
          const data = createTransaction({ ...tx, category_id: category.id });
          await transaction.runAsync(`INSERT INTO transactions
            (id, workspace_id, title, amount, date, category_id, type, account, currency_code, currency_symbol, currency_name, notes, tags, created_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [data.id, this.workspaceId, data.title, data.amount, data.date, category.id, data.type, data.account || null,
              data.currencyCode ?? null, data.currencySymbol ?? null, data.currencyName ?? null, data.notes ?? null, serializeTags(data.tags), data.createdBy, data.createdAt, data.updatedAt]);
        } catch (error) {
          throw new Error(`Row ${row.rowNumber}: ${error instanceof Error ? error.message : "Could not save transaction"}. Nothing was imported.`);
        }
      }
    });
    return rows.length;
  }

  // --- Insert a new transaction ---
  async addTransaction(txData: TransactionFormData): Promise<Transaction> {
    const categoryId = await this.getCategoryId(txData.category, txData.type);
    const newTransaction = createTransaction({
      ...txData,
      category_id: categoryId,
    });

    await db.runAsync(
      `INSERT INTO transactions
        (id, workspace_id, title, amount, date, category_id, type, account, currency_code, currency_symbol, currency_name, notes, tags, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newTransaction.id,
        this.workspaceId,
        newTransaction.title,
        newTransaction.amount,
        newTransaction.date,
        categoryId,
        newTransaction.type,
        newTransaction.account,
        newTransaction.currencyCode ?? null,
        newTransaction.currencySymbol ?? null,
        newTransaction.currencyName ?? null,
        newTransaction.notes ?? null,
        serializeTags(newTransaction.tags),
        newTransaction.createdBy,
        newTransaction.createdAt,
        newTransaction.updatedAt,
      ],
    );

    return newTransaction;
  }

  async setInsightsSampleData(enabled: boolean): Promise<number> {
    if (!__DEV__) throw new Error("Sample data is available in development builds only.");
    const workspace = await db.getFirstAsync<Workspace>(
      `SELECT currency_code AS currencyCode, currency_symbol AS currencySymbol,
       currency_name AS currencyName FROM workspaces WHERE id = ?`, [this.workspaceId],
    );
    if (!workspace) throw new Error("Workspace not found");
    const categories = enabled ? await db.getAllAsync<Category>(
      "SELECT id, name, type FROM categories WHERE workspace_id = ? AND is_deleted = 0 ORDER BY id",
      [this.workspaceId],
    ) : [];
    const accounts = enabled ? await this.getAccounts() : [];
    const samples = enabled ? createSampleTransactions({
      incomeCategories: categories.filter(row => row.type === "income").map(row => row.name),
      expenseCategories: categories.filter(row => row.type === "expense").map(row => row.name),
      accounts: accounts.map(row => row.name), currency: workspace,
    }) : [];
    // Replace in one transaction so retries never duplicate samples or leave half a dataset.
    await db.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.runAsync(
        "DELETE FROM transactions WHERE workspace_id = ? AND substr(id, 1, ?) = ?",
        [this.workspaceId, SAMPLE_ID_PREFIX.length, SAMPLE_ID_PREFIX],
      );
      for (const [index, sample] of samples.entries()) {
        const category = categories.find(row => row.name === sample.category && row.type === sample.type)!;
        await transaction.runAsync(
          `INSERT INTO transactions
           (id, workspace_id, title, amount, date, category_id, type, account,
            currency_code, currency_symbol, currency_name, notes, tags, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [SAMPLE_ID_PREFIX + this.workspaceId + ":" + index, this.workspaceId,
            sample.title, sample.amount, sample.date, category.id, sample.type, sample.account,
            sample.currencyCode!, sample.currencySymbol!, sample.currencyName!,
            sample.notes!, JSON.stringify(sample.tags), "Sample data"],
        );
      }
    });
    return samples.length;
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
    if (data.currencyCode !== undefined)
      columnMap["currency_code"] = data.currencyCode ?? null;
    if (data.currencySymbol !== undefined)
      columnMap["currency_symbol"] = data.currencySymbol ?? null;
    if (data.currencyName !== undefined)
      columnMap["currency_name"] = data.currencyName ?? null;
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
        t.account, t.currency_code, t.currency_symbol, t.currency_name,
        t.notes, t.tags, t.created_by, t.is_deleted,
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

  async clearTransactionsForDateRange(
    startDate: string,
    endDate: string,
  ): Promise<void> {
    await db.runAsync(
      "DELETE FROM transactions WHERE workspace_id = ? AND date >= ? AND date <= ?",
      [this.workspaceId, startDate, endDate],
    );
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
      return sortCategories(newRows, row => row.name);
    }

    return sortCategories(rows, row => row.name);
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
    const deleted = await db.getFirstAsync<
      CategoryRow & { is_deleted: number }
    >(
      "SELECT * FROM categories WHERE workspace_id = ? AND name = ? AND type = ? AND is_deleted = 1",
      [this.workspaceId, name, type],
    );

    if (deleted) {
      await db.runAsync(
        "UPDATE categories SET is_deleted = 0, icon = ?, color = ? WHERE id = ? AND workspace_id = ?",
        [
          icon ?? deleted.icon ?? null,
          color ?? deleted.color ?? null,
          deleted.id,
          this.workspaceId,
        ],
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

  async getCategoryUsage(type: "income" | "expense"): Promise<{ name: string; count: number }[]> {
    const rows = await db.getAllAsync<{ name: string; count: number }>(
      `SELECT c.name, COUNT(t.id) AS count FROM categories c LEFT JOIN transactions t
       ON t.category_id = c.id AND t.workspace_id = c.workspace_id AND t.type = c.type
       WHERE c.workspace_id = ? AND c.type = ? AND c.is_deleted = 0 GROUP BY c.id`, [this.workspaceId, type]);
    return sortCategories(rows, row => row.name);
  }

  async deleteCategories(type: "income" | "expense", names: string[], destination?: string): Promise<void> {
    const selected = [...new Set(names)];
    if (!selected.length) throw new Error("Select at least one category.");
    const fallback = type === "income" ? "Other Income" : "Other Expense";
    if (selected.includes(fallback)) throw new Error(`${fallback} is kept as your fallback category.`);
    await db.withExclusiveTransactionAsync(async transaction => {
      const rows = await transaction.getAllAsync<{ id: number; name: string }>(
        "SELECT id, name FROM categories WHERE workspace_id = ? AND type = ? AND is_deleted = 0", [this.workspaceId, type]);
      const deleting = rows.filter(row => selected.includes(row.name));
      if (deleting.length !== selected.length) throw new Error("Some categories changed. Refresh the list and try again.");
      const counts = await transaction.getAllAsync<{ category_id: number; count: number }>(
        "SELECT category_id, COUNT(*) AS count FROM transactions WHERE workspace_id = ? AND type = ? GROUP BY category_id", [this.workspaceId, type]);
      const affected = counts.filter(row => deleting.some(category => category.id === row.category_id)).reduce((sum, row) => sum + row.count, 0);
      const target = rows.find(row => row.name === destination && !selected.includes(row.name));
      if (affected && !target) throw new Error("Choose a remaining category for the existing transactions. Nothing was deleted.");
      for (const category of deleting) {
        if (target) await transaction.runAsync("UPDATE transactions SET category_id = ? WHERE workspace_id = ? AND category_id = ? AND type = ?", [target.id, this.workspaceId, category.id, type]);
        await transaction.runAsync("DELETE FROM category_budgets WHERE workspace_id = ? AND category_id = ?", [this.workspaceId, category.id]);
        await transaction.runAsync("UPDATE categories SET is_deleted = 1 WHERE workspace_id = ? AND id = ?", [this.workspaceId, category.id]);
      }
    });
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
        [
          icon ?? deleted.icon ?? null,
          color ?? deleted.color ?? null,
          deleted.id,
          this.workspaceId,
        ],
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

  async getBudget(): Promise<BudgetSettings> {
    const budgetRow = await db.getFirstAsync<{ monthly_amount: number }>(
      "SELECT monthly_amount FROM budgets WHERE workspace_id = ?",
      [this.workspaceId],
    );
    const categoryRows = await db.getAllAsync<CategoryBudgetRow>(
      `SELECT cb.category_id, c.name AS category, cb.amount
       FROM category_budgets cb
       INNER JOIN categories c ON c.id = cb.category_id
       WHERE cb.workspace_id = ?
         AND c.workspace_id = ?
         AND c.type = 'expense'
         AND c.is_deleted = 0
       ORDER BY c.id ASC`,
      [this.workspaceId, this.workspaceId],
    );

    return mapBudgetRows(budgetRow?.monthly_amount ?? 0, categoryRows);
  }

  async upsertOverallBudget(amount: number): Promise<BudgetSettings> {
    const safeAmount = Math.max(0, Number.isFinite(amount) ? amount : 0);
    await db.runAsync(
      "INSERT OR IGNORE INTO budgets (workspace_id, monthly_amount) VALUES (?, 0)",
      [this.workspaceId],
    );
    await db.runAsync(
      "UPDATE budgets SET monthly_amount = ? WHERE workspace_id = ?",
      [safeAmount, this.workspaceId],
    );
    return this.getBudget();
  }

  async upsertCategoryBudget(
    categoryName: string,
    amount: number,
  ): Promise<BudgetSettings> {
    const categoryId = await this.getCategoryId(categoryName, "expense");
    const safeAmount = Math.max(0, Number.isFinite(amount) ? amount : 0);
    await db.runAsync(
      "INSERT OR IGNORE INTO category_budgets (workspace_id, category_id, amount) VALUES (?, ?, 0)",
      [this.workspaceId, categoryId],
    );
    await db.runAsync(
      "UPDATE category_budgets SET amount = ? WHERE workspace_id = ? AND category_id = ?",
      [safeAmount, this.workspaceId, categoryId],
    );
    return this.getBudget();
  }

  async upsertCategoryBudgets(
    entries: { categoryName: string; amount: number }[],
  ): Promise<BudgetSettings> {
    for (const entry of entries) {
      await this.upsertCategoryBudget(entry.categoryName, entry.amount);
    }
    return this.getBudget();
  }

  async replaceWorkspaceSetup(data: WorkspaceSetupInput): Promise<void> {
    const uniqueByName = <T extends { name: string }>(items: T[]) => {
      const seen = new Set<string>();
      return items
        .map((item) => ({ ...item, name: item.name.trim() }))
        .filter((item) => {
          if (!item.name) return false;
          const key = item.name.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
    };

    const accounts = uniqueByName(data.accounts);
    const incomeCategories = uniqueByName(data.incomeCategories);
    const expenseCategories = uniqueByName(data.expenseCategories);
    const overallBudget = Math.max(
      0,
      Number.isFinite(data.overallBudget ?? 0) ? (data.overallBudget ?? 0) : 0,
    );

    await db.withTransactionAsync(async () => {
      await db.runAsync("DELETE FROM category_budgets WHERE workspace_id = ?", [
        this.workspaceId,
      ]);
      await db.runAsync("DELETE FROM budgets WHERE workspace_id = ?", [
        this.workspaceId,
      ]);
      await db.runAsync("DELETE FROM categories WHERE workspace_id = ?", [
        this.workspaceId,
      ]);
      await db.runAsync("DELETE FROM accounts WHERE workspace_id = ?", [
        this.workspaceId,
      ]);

      for (let index = 0; index < accounts.length; index += 1) {
        const account = accounts[index];
        await db.runAsync(
          "INSERT INTO accounts (workspace_id, name, icon, color, sort_order) VALUES (?, ?, ?, ?, ?)",
          [
            this.workspaceId,
            account.name,
            account.icon ?? null,
            account.color ?? null,
            index,
          ],
        );
      }

      for (const category of incomeCategories) {
        await db.runAsync(
          "INSERT INTO categories (workspace_id, name, type, icon, color) VALUES (?, ?, 'income', ?, ?)",
          [
            this.workspaceId,
            category.name,
            category.icon ?? null,
            category.color ?? null,
          ],
        );
      }

      for (const category of expenseCategories) {
        await db.runAsync(
          "INSERT INTO categories (workspace_id, name, type, icon, color) VALUES (?, ?, 'expense', ?, ?)",
          [
            this.workspaceId,
            category.name,
            category.icon ?? null,
            category.color ?? null,
          ],
        );
      }

      if (overallBudget > 0) {
        await db.runAsync(
          "INSERT INTO budgets (workspace_id, monthly_amount) VALUES (?, ?)",
          [this.workspaceId, overallBudget],
        );
      }

      for (const entry of data.categoryBudgets ?? []) {
        const amount = Math.max(
          0,
          Number.isFinite(entry.amount) ? entry.amount : 0,
        );
        if (amount <= 0) continue;
        const category = await db.getFirstAsync<{ id: number }>(
          "SELECT id FROM categories WHERE workspace_id = ? AND name = ? AND type = 'expense'",
          [this.workspaceId, entry.categoryName],
        );
        if (!category) continue;
        await db.runAsync(
          "INSERT INTO category_budgets (workspace_id, category_id, amount) VALUES (?, ?, ?)",
          [this.workspaceId, category.id, amount],
        );
      }
    });
  }

  async resetWorkspaceData(): Promise<void> {
    await db.withTransactionAsync(async () => {
      await db.runAsync("DELETE FROM transactions");
      await db.runAsync("DELETE FROM category_budgets");
      await db.runAsync("DELETE FROM budgets");
      await db.runAsync("DELETE FROM categories");
      await db.runAsync("DELETE FROM accounts");
      await db.runAsync("DELETE FROM workspaces");
      db.execSync(`
        INSERT INTO workspaces (id, name, icon, color, currency_code, currency_symbol, currency_name) VALUES
          ${seedWorkspacesSql};
      `);
      for (const workspace of INITIAL_WORKSPACES) {
        await seedDefaultCategoriesForWorkspace(workspace.id);
        await seedDefaultAccountsForWorkspace(workspace.id);
      }
      resetOnboarding(db);
    });
  }

  // Intentional no-op: Redux-to-SQLite migration is handled at the app
  // bootstrap layer before this repository is instantiated.
  async migrateFromRedux(_data: unknown): Promise<void> {
    return Promise.resolve();
  }
}
