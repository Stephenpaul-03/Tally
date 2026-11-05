import type {
  DailyFinanceReminderConfig,
  MonthlyInsightPromptConfig,
} from "@/src/services/notifications/notification.types";
import type { DatabaseBackup } from "@/modules/Core/Repository/SQLiteRepo";
import { validGoal, type Goal } from "@/modules/Goals/model";
import type { TransactionDraft } from "@/utils/Types";
export const BACKUP_SECTIONS = [
  "transactions",
  "catalogs",
  "budgets",
  "goals",
  "workspaces",
  "preferences",
  "drafts",
] as const;
export type BackupSection = (typeof BACKUP_SECTIONS)[number];
export const SECTION_LABELS: Record<BackupSection, string> = {
  transactions: "Transactions",
  catalogs: "Categories and accounts",
  budgets: "Budgets and defaults",
  goals: "Goals",
  workspaces: "Workspaces",
  preferences: "Appearance and preferences",
  drafts: "Unfinished drafts",
};
export const PREFERENCE_KEYS = [
  "appThemeId",
  "appThemeTrueBlack",
  "themeModePreference",
  "tally.mainDesign.v1",
  "tally.insightsStyle.v1",
  "appTabBarMode",
  "appTabBarEnabled",
  "appHideControlLabels",
  "addonsGuidedChatEnabled",
  "addonsBetterAnalyticsEnabled",
  "addonsMinimalIconsEnabled",
  "addonsTonalSettingsCardsEnabled",
  "summaryWorkspaceEnabled",
  "addonsInteractionHintsEnabled",
  "addonsAnimationsEnabled",
  "addonsInsightsCardOrder",
  "addonsLabsNoticeDismissed",
  "tally.homeWelcomeName.v1",
  "transactionsDatePickerCalendarMode",
  "tallyNotificationPreferences",
  "biometricLockTimeoutMs",
  "biometricLockEnabled",
];
export type AppBackup = {
  format: "tally-backup";
  version: 1;
  exportedAt: string;
  sections: BackupSection[];
  activeWorkspaceId?: string;
  database: Partial<DatabaseBackup>;
  preferences: Record<string, string>;
  goals?: Goal[];
  reminders?: {
    daily: DailyFinanceReminderConfig;
    monthly: MonthlyInsightPromptConfig;
  };
  drafts?: { workspaceId: string; entries: TransactionDraft[] };
};
const str = (v: unknown) => typeof v === "string" && v.length > 0;
const numeric = (v: unknown) => typeof v === "number" && Number.isFinite(v);
const date = (v: unknown) =>
  str(v) &&
  /^\d{4}-\d{2}-\d{2}$/.test(v as string) &&
  Number.isFinite(new Date(`${v}T12:00:00`).getTime()) &&
  new Date(`${v}T12:00:00`).toISOString().slice(0, 10) === v;
export function validateBackup(raw: unknown): AppBackup {
  if (!raw || typeof raw !== "object") throw Error("Not a Tally backup");
  const b = raw as AppBackup;
  if (b.format !== "tally-backup" || b.version !== 1)
    throw Error("Unsupported Tally backup version");
  if (
    !Array.isArray(b.sections) ||
    !b.sections.length ||
    new Set(b.sections).size !== b.sections.length ||
    b.sections.some((s) => !BACKUP_SECTIONS.includes(s))
  )
    throw Error("Invalid backup sections");
  if (
    !b.database ||
    typeof b.database !== "object" ||
    !b.preferences ||
    typeof b.preferences !== "object" ||
    Array.isArray(b.preferences)
  )
    throw Error("Incomplete backup");
  const db = b.database;
  for (const key of [
    "workspaces",
    "categories",
    "accounts",
    "transactions",
    "budgets",
    "categoryBudgets",
  ] as const)
    if (db[key] !== undefined && !Array.isArray(db[key]))
      throw Error(`Invalid ${key}`);
  const workspaceIds = new Set((db.workspaces || []).map((w) => w.id));
  if (
    workspaceIds.size !== (db.workspaces || []).length ||
    (db.workspaces || []).some(
      (w) =>
        ![
          w.id,
          w.name,
          w.icon,
          w.color,
          w.currencyCode,
          w.currencySymbol,
          w.currencyName,
        ].every(str),
    )
  )
    throw Error("Invalid workspaces");
  if (b.activeWorkspaceId && !workspaceIds.has(b.activeWorkspaceId))
    throw Error("Invalid active workspace");
  const validWorkspace = (row: any) =>
    row && workspaceIds.has(row.workspace_id);
  const categories = new Map(
    (db.categories || []).map((c) => [`${c.workspace_id}:${c.id}`, c]),
  );
  if (
    (db.categories || []).some(
      (c) =>
        !validWorkspace(c) ||
        !Number.isInteger(c.id) ||
        !str(c.name) ||
        !["income", "expense"].includes(c.type) ||
        (c.is_deleted !== 0 && c.is_deleted !== 1),
    )
  )
    throw Error("Invalid categories");
  if (
    (db.accounts || []).some(
      (a) =>
        !validWorkspace(a) ||
        !str(a.name) ||
        !numeric(a.sort_order ?? 0) ||
        (a.is_deleted !== 0 && a.is_deleted !== 1),
    )
  )
    throw Error("Invalid accounts");
  if (
    (db.transactions || []).some((t) => {
      const category = categories.get(`${t.workspace_id}:${t.category_id}`);
      return (
        !validWorkspace(t) ||
        !str(t.id) ||
        typeof t.title !== "string" ||
        !numeric(t.amount) ||
        Math.abs(t.amount) >= 1e15 ||
        !date(t.date) ||
        !["income", "expense"].includes(t.type) ||
        !category ||
        category.type !== t.type ||
        (t.is_deleted !== 0 && t.is_deleted !== 1)
      );
    })
  )
    throw Error("Invalid transaction or missing category/workspace");
  if (
    (db.budgets || []).some(
      (r) =>
        !validWorkspace(r) ||
        !numeric(r.monthly_amount) ||
        r.monthly_amount < 0,
    )
  )
    throw Error("Invalid budgets");
  if (
    (db.categoryBudgets || []).some(
      (r) =>
        !validWorkspace(r) ||
        !numeric(r.amount) ||
        r.amount < 0 ||
        categories.get(`${r.workspace_id}:${r.category_id}`)?.type !==
          "expense",
    )
  )
    throw Error("Invalid category budgets");
  for (const [key, value] of Object.entries(b.preferences)) {
    if (key === "tally.insightsStyle.v1" && value !== "classic" && value !== "sage")
      throw Error(`Invalid preference: ${key}`);
    if (
      ![...PREFERENCE_KEYS, "tallyWorkspaceDefaults"].includes(key) ||
      typeof value !== "string"
    )
      throw Error("Unsupported backup preference");
    if (
      [
        "tally.mainDesign.v1",
        "tallyWorkspaceDefaults",
        "addonsInsightsCardOrder",
        "tallyNotificationPreferences",
      ].includes(key)
    ) {
      try {
        const parsed = JSON.parse(value);
        if (!parsed || typeof parsed !== "object") throw Error();
      } catch {
        throw Error(`Invalid preference: ${key}`);
      }
    }
  }
  if (b.reminders !== undefined) {
    const d = b.reminders.daily,
      m = b.reminders.monthly;
    const time = (h: number, min: number) =>
      Number.isInteger(h) &&
      h >= 0 &&
      h < 24 &&
      Number.isInteger(min) &&
      min >= 0 &&
      min < 60;
    if (
      !d ||
      !m ||
      typeof d.enabled !== "boolean" ||
      !Array.isArray(d.reminders) ||
      d.reminders.length > 20 ||
      d.reminders.some((r) => !time(r.hour, r.minute)) ||
      !Array.isArray(d.weekdays) ||
      d.weekdays.some((v) => !Number.isInteger(v) || v < 0 || v > 6) ||
      !["daily", "weekdays", "weekends"].includes(d.frequency) ||
      !["gentle", "direct", "minimal", "fun"].includes(d.tone) ||
      !d.quietHours ||
      typeof d.quietHours.enabled !== "boolean" ||
      !time(d.quietHours.startHour, d.quietHours.startMinute) ||
      !time(d.quietHours.endHour, d.quietHours.endMinute) ||
      typeof m.enabled !== "boolean" ||
      !time(m.hour, m.minute) ||
      !["start-of-month", "end-of-month"].includes(m.timing)
    )
      throw Error("Invalid reminder preferences");
  }
  if (
    b.goals !== undefined &&
    (!Array.isArray(b.goals) ||
      !b.goals.every((g) => validGoal(g) && workspaceIds.has(g.workspaceId)))
  )
    throw Error("Invalid goals");
  if (
    b.drafts !== undefined &&
    (!str(b.drafts.workspaceId) ||
      !workspaceIds.has(b.drafts.workspaceId) ||
      !Array.isArray(b.drafts.entries) ||
      b.drafts.entries.some(
        (d) =>
          !str(d.id) ||
          d.isDraft !== true ||
          typeof d.amountInput !== "string" ||
          !numeric(d.amount) ||
          !date(d.date) ||
          !["income", "expense"].includes(d.type) ||
          typeof d.title !== "string" ||
          typeof d.category !== "string" ||
          typeof d.account !== "string",
      ))
  )
    throw Error("Invalid drafts");
  if (
    (db.transactions && !b.sections.includes("transactions")) ||
    ((db.budgets ||
      db.categoryBudgets ||
      b.preferences.tallyWorkspaceDefaults) &&
      !b.sections.includes("budgets")) ||
    (b.goals && !b.sections.includes("goals")) ||
    (b.drafts && !b.sections.includes("drafts")) ||
    (b.reminders && !b.sections.includes("preferences")) ||
    (Object.keys(b.preferences).some(
      (key) => key !== "tallyWorkspaceDefaults",
    ) &&
      !b.sections.includes("preferences"))
  )
    throw Error("Backup data does not match its sections");
  const ids = (db.transactions || []).map((t) => t.id);
  if (new Set(ids).size !== ids.length)
    throw Error("Duplicate transaction IDs");
  return b;
}
export function selectBackupSections(
  source: AppBackup,
  sections: BackupSection[],
): AppBackup {
  const includes = (s: BackupSection) => sections.includes(s);
  const catalog =
    includes("catalogs") || includes("transactions") || includes("budgets");
  const preferences = Object.fromEntries(
    Object.entries(source.preferences).filter(([key]) =>
      key === "tallyWorkspaceDefaults"
        ? includes("budgets")
        : includes("preferences"),
    ),
  );
  return {
    format: "tally-backup",
    version: 1,
    exportedAt: source.exportedAt,
    sections,
    ...(includes("workspaces")
      ? { activeWorkspaceId: source.activeWorkspaceId }
      : {}),
    database: {
      workspaces: source.database.workspaces,
      ...(catalog
        ? {
            categories: source.database.categories,
            accounts: source.database.accounts,
          }
        : {}),
      ...(includes("transactions")
        ? { transactions: source.database.transactions }
        : {}),
      ...(includes("budgets")
        ? {
            budgets: source.database.budgets,
            categoryBudgets: source.database.categoryBudgets,
          }
        : {}),
    },
    preferences,
    ...(includes("preferences") && source.reminders
      ? { reminders: source.reminders }
      : {}),
    ...(includes("goals") ? { goals: source.goals || [] } : {}),
    ...(includes("drafts") ? { drafts: source.drafts } : {}),
  };
}
export function backupItemCount(b: AppBackup) {
  return (
    Object.values(b.database).reduce(
      (sum: number, values) =>
        sum + (Array.isArray(values) ? values.length : 0),
      0,
    ) +
    Object.keys(b.preferences).length +
    (b.goals?.length || 0) +
    (b.drafts?.entries.length || 0)
  );
}
