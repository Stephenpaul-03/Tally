import type { Transaction } from "@/utils/Types";

/** Match Home's elapsed-month/currency boundary for previews and account drilldowns. */
export function tabletHomeData(raw: readonly Transaction[], month: string, currency: string, today: string, accountNames: readonly string[]) {
  const posted = raw.filter(row => !row.deleted && !("isDraft" in row) && Number.isFinite(row.amount)
    && row.date.startsWith(month) && row.date <= today && (row.currencyCode || currency) === currency);
  const recent = [...posted].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id)).slice(0, 4);
  const accounts = accountNames.map(name => {
    const rows = posted.filter(row => row.account === name);
    const net = rows.reduce((sum, row) => sum + (row.type === "income" ? 1 : -1) * Math.abs(row.amount), 0);
    return { name, rows, net };
  });
  return { posted, recent, accounts };
}
