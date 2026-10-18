import type { SQLiteDatabase } from "expo-sqlite";

export const ONBOARDING_DRAFT_KEY = "tallyOnboardingDraftV2";
const STATUS_KEY = "onboardingComplete";
const TOUR_KEY = "onboardingTourStep";
export type SetupItem = { name: string; icon: string; color: string };
export type OnboardingSetup = {
  name: string;
  icon: string;
  color: string;
  currencyCode: string;
  currencySymbol: string;
  currencyName: string;
  incomeCategories: SetupItem[];
  expenseCategories: SetupItem[];
  accounts: SetupItem[];
};

function validAppearance(icon: string, color: string) {
  return typeof icon === "string" && /^[a-z0-9-]{1,100}$/.test(icon)
    && typeof color === "string" && /^#[a-f0-9]{6}$/i.test(color);
}

export function normalizeSetupItems(items: SetupItem[], label: string): SetupItem[] {
  if (!Array.isArray(items) || !items.length) throw new Error(`Select at least one ${label}.`);
  const seen = new Set<string>();
  return items.map(item => {
    if (!item || typeof item.name !== "string" || !item.name.trim() || item.name.trim().length > 40) {
      throw new Error(`Each ${label} needs a name of 1–40 characters.`);
    }
    const name = item.name.trim();
    if (seen.has(name.toLowerCase())) throw new Error(`There’s already a ${label} named ${name}.`);
    seen.add(name.toLowerCase());
    if (!validAppearance(item.icon, item.color)) throw new Error(`Choose an icon and color for ${name}.`);
    return { name, icon: item.icon, color: item.color };
  });
}

export function initializeOnboarding(db: SQLiteDatabase, existingWorkspaceCount: number) {
  db.execSync("CREATE TABLE IF NOT EXISTS app_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
  db.runSync("INSERT OR IGNORE INTO app_metadata (key, value) VALUES (?, ?)",
    [STATUS_KEY, existingWorkspaceCount > 0 ? "true" : "false"]);
}

export async function isOnboardingComplete(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_metadata WHERE key = ?", [STATUS_KEY]);
  if (!row) throw new Error("Couldn't read setup status. Please try again.");
  return row.value === "true";
}

export function resetOnboarding(db: SQLiteDatabase) {
  db.runSync("INSERT OR REPLACE INTO app_metadata (key, value) VALUES (?, 'false')", [STATUS_KEY]);
  db.runSync("DELETE FROM app_metadata WHERE key = ?", [TOUR_KEY]);
}

export async function getTourProgress(db: SQLiteDatabase): Promise<number | null> {
  const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM app_metadata WHERE key = ?", [TOUR_KEY]);
  if (!row || row.value === "done") return null;
  const step = Number(row.value);
  return /^\d+$/.test(row.value) && Number.isSafeInteger(step) && step >= 0 && step < 100 ? step : null;
}

export async function saveTourProgress(db: SQLiteDatabase, step: number | null) {
  if (step !== null && (!Number.isInteger(step) || step < 0 || step >= 100)) throw new Error("Invalid tour step.");
  await db.runAsync("INSERT OR REPLACE INTO app_metadata (key, value) VALUES (?, ?)", [TOUR_KEY, step === null ? "done" : String(step)]);
}

// Setup and tour eligibility commit together. Existing entries are never rewritten.
export function saveOnboarding(db: SQLiteDatabase, input: OnboardingSetup) {
  const name = input.name.trim();
  const code = input.currencyCode.trim().toUpperCase();
  if (!name || name.length > 40) throw new Error("Enter a workspace name of 1–40 characters.");
  if (!/^[A-Z]{3}$/.test(code) || !input.currencySymbol.trim() || !input.currencyName.trim()) {
    throw new Error("Choose a currency to continue.");
  }
  if (!validAppearance(input.icon, input.color)) throw new Error("Choose a workspace icon and color.");
  const income = normalizeSetupItems(input.incomeCategories, "income category");
  const expenses = normalizeSetupItems(input.expenseCategories, "expense category");
  const accounts = normalizeSetupItems(input.accounts, "payment method");
  db.withTransactionSync(() => {
    const status = db.getFirstSync<{ value: string }>("SELECT value FROM app_metadata WHERE key = ?", [STATUS_KEY]);
    if (status?.value !== "false") throw new Error("Setup is already complete.");
    const entries = db.getFirstSync<{ count: number }>("SELECT COUNT(*) AS count FROM transactions");
    if (entries?.count) throw new Error("This installation already has transactions. Your data has been kept.");
    const result = db.runSync(
      "UPDATE workspaces SET name = ?, icon = ?, color = ?, currency_code = ?, currency_symbol = ?, currency_name = ? WHERE id = 'personal'",
      [name, input.icon, input.color, code, input.currencySymbol.trim(), input.currencyName.trim()]);
    if (result.changes !== 1) throw new Error("Couldn't find your workspace. Please try again.");
    for (const table of ["category_budgets", "budgets", "categories", "accounts"]) {
      db.runSync(`DELETE FROM ${table} WHERE workspace_id = 'personal'`);
    }
    for (const [type, items] of [["income", income], ["expense", expenses]] as const) {
      for (const item of items) db.runSync(
        "INSERT INTO categories (workspace_id, name, type, icon, color) VALUES ('personal', ?, ?, ?, ?)",
        [item.name, type, item.icon, item.color]);
    }
    accounts.forEach((item, index) => db.runSync(
      "INSERT INTO accounts (workspace_id, name, icon, color, sort_order) VALUES ('personal', ?, ?, ?, ?)",
      [item.name, item.icon, item.color, index]));
    db.runSync("INSERT OR REPLACE INTO app_metadata (key, value) VALUES (?, '0')", [TOUR_KEY]);
    db.runSync("UPDATE app_metadata SET value = 'true' WHERE key = ?", [STATUS_KEY]);
  });
}
