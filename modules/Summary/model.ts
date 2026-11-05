import type { DatabaseTransaction } from "@/modules/Core/Repository/SQLiteRepo";
/** Never combine amounts with different currencies or count deleted entries. */
export function databaseSummary(rows: DatabaseTransaction[], currency: string, month: string | null) {
  const entries = rows.filter(row => !row.deleted && row.currencyCode === currency && (!month || row.date.startsWith(month)));
  const income = entries.filter(row => row.type === "income").reduce((sum, row) => sum + Math.abs(row.amount), 0);
  const spent = entries.filter(row => row.type === "expense").reduce((sum, row) => sum + Math.abs(row.amount), 0);
  const workspaces = [...new Set(entries.map(row => row.workspaceId))].map(id => {
    const own = entries.filter(row => row.workspaceId === id);
    return { id, name: own[0].workspaceName, income: own.filter(row => row.type === "income").reduce((sum, row) => sum + Math.abs(row.amount), 0), spent: own.filter(row => row.type === "expense").reduce((sum, row) => sum + Math.abs(row.amount), 0), count: own.length };
  });
  return { entries, income, spent, balance: income - spent, workspaces };
}
