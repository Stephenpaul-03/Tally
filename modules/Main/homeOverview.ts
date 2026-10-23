import type { Transaction } from "@/utils/Types";

/** Home totals posted monthly records independently of ledger controls. */
export function homeOverview(
  rows: Transaction[],
  month: string,
  currency: string,
) {
  const monthly = rows.filter(
    (row) => !row.deleted && row.date?.startsWith(month),
  );
  let income = 0,
    spent = 0;
  for (const row of monthly) {
    if ((row.currencyCode || currency) !== currency) continue;
    if (row.type === "income") income += Math.abs(row.amount);
    else spent += Math.abs(row.amount);
  }
  return {
    income,
    spent,
    left: income - spent,
    entryCount: monthly.length,
    currencies: [
      ...new Set(monthly.map((row) => row.currencyCode || currency)),
    ],
  };
}
