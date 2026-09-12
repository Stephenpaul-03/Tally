import type { Transaction } from "@/utils/Types";

export const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
export const shiftMonth = (key: string, offset: number) => {
  const [year, month] = key.split("-").map(Number);
  return monthKey(new Date(year, month - 1 + offset, 1));
};
export const daysInMonth = (key: string) => {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month, 0).getDate();
};
export const monthLabel = (key: string) => {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "long", year: "numeric",
  });
};
export const total = (rows: Transaction[]) =>
  Number(rows.reduce((sum, row) => sum + Math.abs(row.amount), 0).toFixed(10));
export const changeLabel = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? "No change" : "No previous activity";
  const percent = ((current - previous) / Math.abs(previous)) * 100;
  return `${percent > 0 ? "+" : ""}${percent.toFixed(1)}% vs previous period`;
};
export type Group = {
  name: string; amount: number; previous: number; count: number;
  share: number; transactions: Transaction[];
};
export function groupRows(current: Transaction[], previous: Transaction[], field: "category" | "account"): Group[] {
  const names = new Set([...current, ...previous].map(row => row[field]));
  const sum = total(current);
  return [...names].map(name => {
    const transactions = current.filter(row => row[field] === name);
    const amount = total(transactions);
    return { name, amount, previous: total(previous.filter(row => row[field] === name)),
      count: transactions.length, share: sum ? amount / sum : 0, transactions };
  }).sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name));
}
export function calculateInsights(
  transactions: Transaction[], month: string, currency: string,
  workspaceCurrency: string, matchedDays: boolean, now = new Date(),
) {
  const currentMonth = monthKey(now);
  const elapsed = month === currentMonth ? now.getDate() : daysInMonth(month);
  const previousMonth = shiftMonth(month, -1);
  const previousDays = matchedDays && month === currentMonth
    ? Math.min(elapsed, daysInMonth(previousMonth)) : daysInMonth(previousMonth);
  const valid = transactions.filter(row => !row.deleted && Number.isFinite(row.amount)
    && /^\d{4}-\d{2}-\d{2}$/.test(row.date)
    && (row.currencyCode || workspaceCurrency) === currency);
  const inMonth = (key: string, limit: number) =>
    valid.filter(row => row.date.slice(0, 7) === key && Number(row.date.slice(8)) <= limit);
  const current = inMonth(month, elapsed);
  const previous = inMonth(previousMonth, previousDays);
  const income = current.filter(row => row.type === "income");
  const expense = current.filter(row => row.type === "expense");
  const previousIncome = previous.filter(row => row.type === "income");
  const previousExpense = previous.filter(row => row.type === "expense");
  return {
    current, previous, income: total(income), expense: total(expense),
    previousIncome: total(previousIncome), previousExpense: total(previousExpense),
    incomeCategories: groupRows(income, previousIncome, "category"),
    expenseCategories: groupRows(expense, previousExpense, "category"),
    accounts: [...new Set([...current, ...previous].map(row => row.account))].map(name => {
      const rows = current.filter(row => row.account === name);
      const old = previous.filter(row => row.account === name);
      return { name, transactions: rows, income: total(rows.filter(row => row.type === "income")),
        expense: total(rows.filter(row => row.type === "expense")),
        previousIncome: total(old.filter(row => row.type === "income")),
        previousExpense: total(old.filter(row => row.type === "expense")) };
    }),
    days: Array.from({ length: daysInMonth(month) }, (_, index) => {
      const date = `${month}-${String(index + 1).padStart(2, "0")}`;
      const rows = current.filter(row => row.date === date);
      return { date, transactions: rows, future: month === currentMonth && index + 1 > elapsed,
        income: total(rows.filter(row => row.type === "income")),
        expense: total(rows.filter(row => row.type === "expense")) };
    }),
    trend: Array.from({ length: 6 }, (_, index) => {
      const key = shiftMonth(month, index - 5);
      const rows = inMonth(key, key === currentMonth ? elapsed : daysInMonth(key));
      return { month: key, income: total(rows.filter(row => row.type === "income")),
        expense: total(rows.filter(row => row.type === "expense")) };
    }),
    comparisonLabel: `${monthLabel(previousMonth)} · ${previousDays === daysInMonth(previousMonth) ? "full month" : `days 1–${previousDays}`}`,
  };
}
