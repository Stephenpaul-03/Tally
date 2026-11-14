import type { SQLiteDatabase } from "expo-sqlite";

type SelectionDatabase = Pick<SQLiteDatabase, "getFirstSync" | "runSync">;
const KEY = "activeWorkspaceId";

export function restoreWorkspaceSelection(db: SelectionDatabase, fallback: string): string {
  const saved = db.getFirstSync<{ id: string }>(
    "SELECT w.id FROM workspaces w JOIN app_metadata m ON m.value = w.id WHERE m.key = ?", [KEY]);
  if (saved) return saved.id;
  const recent = db.getFirstSync<{ id: string }>(
    "SELECT id FROM workspaces WHERE last_used_at IS NOT NULL ORDER BY last_used_at DESC, id LIMIT 1");
  if (recent) return recent.id;
  return db.getFirstSync<{ id: string }>(
    "SELECT id FROM workspaces ORDER BY CASE WHEN id = ? THEN 0 ELSE 1 END, id LIMIT 1", [fallback])?.id ?? fallback;
}

export function saveWorkspaceSelection(db: SelectionDatabase, id: string) {
  if (!db.getFirstSync("SELECT id FROM workspaces WHERE id = ?", [id])) {
    throw new Error("This workspace no longer exists.");
  }
  db.runSync("INSERT OR REPLACE INTO app_metadata (key, value) VALUES (?, ?)", [KEY, id]);
}
