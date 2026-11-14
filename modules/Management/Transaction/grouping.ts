import type { Transaction } from "@/utils/Types";

export type TransactionGrouping = "date" | "category" | "title" | "account" | "type" | "matching";
export const TRANSACTION_GROUPINGS: { value: TransactionGrouping; label: string }[] = [
  { value: "date", label: "Date" }, { value: "category", label: "Category" },
  { value: "title", label: "Title" }, { value: "account", label: "Account" },
  { value: "type", label: "Type" }, { value: "matching", label: "Matching details" },
];

/** Display groups never merge records or combine amounts across currencies. */
export function groupTransactions(rows: readonly Transaction[], grouping: TransactionGrouping, fallbackCurrency: string) {
  const groups = new Map<string, { key: string; title: string; currencyCode: string; transactions: Transaction[] }>();
  for (const row of rows) {
    if (row.deleted || (row as Transaction & { isDraft?: boolean }).isDraft || !row.date || !Number.isFinite(row.amount)) continue;
    const currencyCode = row.currencyCode || fallbackCurrency;
    const values = grouping === "matching" ? [row.title, row.category, row.account]
      : [grouping === "type" ? row.type : row[grouping]];
    // Date keeps the familiar mixed-activity day section. Every other grouping
    // includes currency and type so its total is meaningful without netting.
    const key = grouping === "date" ? row.date : JSON.stringify([grouping, ...values, row.type, currencyCode]);
    const title = grouping === "date" ? row.date : `${values.filter(Boolean).join(" · ") || "Unspecified"} · ${row.type === "income" ? "Income" : "Expenses"} · ${currencyCode}`;
    const group = groups.get(key) ?? { key, title, currencyCode, transactions: [] };
    group.transactions.push(row);
    groups.set(key, group);
  }
  return [...groups.values()];
}
