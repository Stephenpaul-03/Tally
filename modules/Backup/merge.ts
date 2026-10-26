import { validateBackup, type AppBackup, type BackupSection } from "./model";
const stable = (value: unknown): string =>
  value && typeof value === "object"
    ? Array.isArray(value)
      ? `[${value.map(stable).join(",")}]`
      : `{${Object.entries(value)
          .filter(([, v]) => v !== undefined)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => `${k}:${stable(v)}`)
          .join(",")}}`
    : JSON.stringify(value);
/** Merge complete or per-section files before any writes. Reject ambiguous copies. */
export function mergeBackups(inputs: AppBackup[]): AppBackup {
  if (!inputs.length) throw Error("Choose at least one backup file");
  inputs.forEach(validateBackup);
  const combined: AppBackup = {
    format: "tally-backup",
    version: 1,
    exportedAt: inputs[0].exportedAt,
    sections: [],
    database: {},
    preferences: {},
  };
  const sections = new Set<BackupSection>();
  const mergeRows = (label: string, rows: any[], key: (row: any) => string) => {
    const result = new Map<string, any>();
    for (const row of rows) {
      const id = key(row);
      if (result.has(id) && stable(result.get(id)) !== stable(row))
        throw Error(
          `Conflicting ${label}: ${id}. Selected files contain different versions.`,
        );
      result.set(id, row);
    }
    return [...result.values()];
  };
  for (const b of inputs) {
    b.sections.forEach((s) => sections.add(s));
    for (const [key, value] of Object.entries(b.preferences)) {
      if (
        combined.preferences[key] !== undefined &&
        combined.preferences[key] !== value
      )
        throw Error(`Conflicting preference: ${key}`);
      combined.preferences[key] = value;
    }
    if (b.reminders) {
      if (
        combined.reminders &&
        stable(combined.reminders) !== stable(b.reminders)
      )
        throw Error("Conflicting reminder preferences");
      combined.reminders = b.reminders;
    }
    if (b.activeWorkspaceId) {
      if (
        combined.activeWorkspaceId &&
        combined.activeWorkspaceId !== b.activeWorkspaceId
      )
        throw Error("Conflicting active workspaces");
      combined.activeWorkspaceId = b.activeWorkspaceId;
    }
  }
  const keys = {
    workspaces: (r: any) => r.id,
    categories: (r: any) => `${r.workspace_id}:${r.id}`,
    accounts: (r: any) => `${r.workspace_id}:${r.name}`,
    transactions: (r: any) => r.id,
    budgets: (r: any) => r.workspace_id,
    categoryBudgets: (r: any) => `${r.workspace_id}:${r.category_id}`,
  };
  for (const key of Object.keys(keys) as (keyof typeof keys)[]) {
    const rows = inputs.flatMap((b) => b.database[key] || []);
    if (inputs.some((b) => b.database[key] !== undefined))
      combined.database[key] = mergeRows(key, rows, keys[key]);
  }
  if (inputs.some((b) => b.goals))
    combined.goals = mergeRows(
      "goal",
      inputs.flatMap((b) => b.goals || []),
      (r) => r.id,
    );
  const drafts = inputs.flatMap((b) => (b.drafts ? [b.drafts] : []));
  if (drafts.length) {
    if (new Set(drafts.map((d) => d.workspaceId)).size > 1)
      throw Error(
        "Draft files belong to different workspaces. Import these files separately.",
      );
    combined.drafts = {
      workspaceId: drafts[0].workspaceId,
      entries: mergeRows(
        "draft",
        drafts.flatMap((d) => d.entries),
        (r) => r.id,
      ),
    };
  }
  combined.sections = [...sections];
  return validateBackup(combined);
}
