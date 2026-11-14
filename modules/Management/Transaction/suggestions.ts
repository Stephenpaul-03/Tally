import type { Transaction, TransactionType } from "@/utils/Types";

export const normalizeTransactionTitle = (title: string) => title.trim().replace(/\s+/g, " ").toLocaleLowerCase();

/** Suggest a historically used pair; callers decide whether to apply it. */
export function suggestTransactionDetails(rows: readonly Transaction[], options: {
  title: string; type: TransactionType; currency: string; fallbackCurrency: string;
  categories: readonly string[]; accounts: readonly string[];
}) {
  const title = normalizeTransactionTitle(options.title);
  if (!title) return null;
  const pairs = new Map<string, { category: string; account: string; count: number; latest: string }>();
  for (const row of rows) {
    if (row.deleted || (row as Transaction & { isDraft?: boolean }).isDraft || row.type !== options.type
      || (row.currencyCode || options.fallbackCurrency) !== options.currency
      || normalizeTransactionTitle(row.title || "") !== title
      || !options.categories.includes(row.category) || !options.accounts.includes(row.account)) continue;
    const key = JSON.stringify([row.category, row.account]);
    const pair = pairs.get(key) ?? { category: row.category, account: row.account, count: 0, latest: "" };
    pair.count += 1;
    const recency = `${row.date} ${row.createdAt || ""}`;
    if (recency > pair.latest) pair.latest = recency;
    pairs.set(key, pair);
  }
  return [...pairs.values()].sort((a, b) => b.count - a.count || b.latest.localeCompare(a.latest)
    || a.category.localeCompare(b.category) || a.account.localeCompare(b.account))[0] ?? null;
}
