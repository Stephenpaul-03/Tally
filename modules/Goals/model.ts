export type Goal = {
  id: string;
  workspaceId: string;
  name: string;
  icon: string;
  color?: string;
  reason: string;
  target: number;
  saved: number;
  currencyCode: string;
  currencySymbol: string;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
};
export function goalProgress(goal: Pick<Goal, "target" | "saved">) {
  return {
    fraction: Math.min(1, Math.max(0, goal.saved / goal.target)),
    remaining: Math.max(0, goal.target - goal.saved),
    complete: goal.saved >= goal.target,
  };
}
export function validGoal(value: unknown): value is Goal {
  if (!value || typeof value !== "object") return false;
  const g = value as Goal;
  return (
    [
      g.id,
      g.workspaceId,
      g.name,
      g.icon,
      g.currencyCode,
      g.currencySymbol,
      g.createdAt,
      g.updatedAt,
    ].every((v) => typeof v === "string" && v.trim().length > 0) &&
    (g.color === undefined || /^#[0-9a-f]{6}$/i.test(g.color)) &&
    typeof g.reason === "string" &&
    Number.isFinite(g.target) &&
    g.target > 0 &&
    g.target < 1e15 &&
    Number.isFinite(g.saved) &&
    g.saved >= 0 &&
    g.saved < 1e15 &&
    (!g.deadline ||
      (/^\d{4}-\d{2}-\d{2}$/.test(g.deadline) &&
        Number.isFinite(new Date(`${g.deadline}T12:00:00`).getTime()) &&
        new Date(`${g.deadline}T12:00:00`).toISOString().slice(0, 10) ===
          g.deadline))
  );
}
