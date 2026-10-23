import type { Transaction } from "@/utils/Types";

/** Facts and preview share the same posted, elapsed-month, currency boundary. */
export function homeQuickFacts(
  rows: Transaction[],
  month: string,
  currency: string,
  today: string,
) {
  const posted = rows.filter(
    (row) =>
      !row.deleted &&
      !("isDraft" in row) &&
      row.date?.startsWith(month) &&
      row.date <= today &&
      (row.currencyCode || currency) === currency &&
      Number.isFinite(row.amount),
  );
  const expenses = posted.filter((row) => row.type === "expense");
  const days =
    month === today.slice(0, 7)
      ? Number(today.slice(8, 10))
      : new Date(
          Number(month.slice(0, 4)),
          Number(month.slice(5, 7)),
          0,
        ).getDate();
  const spent = expenses.reduce((sum, row) => sum + Math.abs(row.amount), 0);
  const largest = expenses.reduce<Transaction | null>(
    (best, row) =>
      !best || Math.abs(row.amount) > Math.abs(best.amount) ? row : best,
    null,
  );
  return {
    dailyAverage: spent / Math.max(1, days),
    days,
    entryCount: posted.length,
    largest,
    recent: [...posted]
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date) ||
          b.createdAt.localeCompare(a.createdAt) ||
          a.id.localeCompare(b.id),
      )
      .slice(0, 3),
  };
}
