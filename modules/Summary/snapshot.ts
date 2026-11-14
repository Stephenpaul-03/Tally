import type { Transaction } from "@/utils/Types";

export function workspaceSnapshot(rows: readonly Transaction[], currency: string, fallbackCurrency: string, month: string | null = null) {
  const entries = rows.filter(row => !row.deleted && !(row as Transaction & { isDraft?: boolean }).isDraft
    && Number.isFinite(row.amount) && (row.currencyCode || fallbackCurrency) === currency
    && (!month || row.date.startsWith(month)));
  let income = 0, spent = 0;
  for (const row of entries) {
    if (row.type === "income") income += Math.abs(row.amount);
    else spent += Math.abs(row.amount);
  }
  return { income, spent, balance: income - spent, count: entries.length,
    activeDays: new Set(entries.map(row => row.date)).size,
    accounts: new Set(entries.map(row => row.account).filter(Boolean)).size,
    expenseShare: income + spent > 0 ? spent / (income + spent) : 0 };
}
