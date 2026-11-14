import type { Transaction } from "@/utils/Types";

export type InsightEntryGroup = {
  key: string; title: string; category: string; account: string; currencyCode: string;
  type: Transaction["type"]; amount: number; transactions: Transaction[];
};

/** Insights-only browsing groups; stored entries are never changed. */
export function groupInsightEntries(rows: readonly Transaction[], enabled: boolean, fallbackCurrency: string): InsightEntryGroup[] {
  const groups = new Map<string, InsightEntryGroup>();
  for (const row of rows) {
    if (row.deleted || (row as Transaction & { isDraft?: boolean }).isDraft || !Number.isFinite(row.amount)) continue;
    const title = (row.title || "").trim().replace(/\s+/g, " ");
    const currencyCode = row.currencyCode || fallbackCurrency;
    const key = enabled && title ? JSON.stringify([title.toLowerCase(), row.category, row.account, row.type, currencyCode]) : row.id;
    const group = groups.get(key) ?? { key, title, category: row.category, account: row.account, currencyCode,
      type: row.type, amount: 0, transactions: [] };
    group.transactions.push(row);
    group.amount += Math.abs(row.amount);
    groups.set(key, group);
  }
  return [...groups.values()];
}
