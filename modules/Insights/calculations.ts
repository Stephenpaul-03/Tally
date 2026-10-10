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
export const dateRangeLabel = (key: string, days: number) =>
  `${days === 1 ? "1" : `1–${days}`} ${monthLabel(key)}`;
export const amountChangeLabel = (
  current: number, previous: number, money: (value: number) => string,
) => {
  if (current === previous) return "The same recorded amount as last month";
  return `${money(Math.abs(current - previous))} ${current > previous ? "more" : "less"} than last month`;
};
export const total = (rows: Transaction[]) =>
  Number(rows.reduce((sum, row) => sum + Math.abs(row.amount), 0).toFixed(10));
export const changeLabel = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? "No change" : "No previous activity";
  const percent = ((current - previous) / Math.abs(previous)) * 100;
  return `${percent > 0 ? "+" : ""}${percent.toFixed(1)}% vs previous period`;
};
// A recorded cash-flow difference, not an account balance or a forecast.
export function incomePosition(income: number, expense: number) {
  return {
    remaining: Number((income - expense).toFixed(10)),
    usedPercent: income > 0 ? expense / income * 100 : null,
  };
}
export const percentLabel = (value: number) =>
  `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;

export type Group = {
  name: string; amount: number; previous: number; count: number; previousCount: number;
  share: number; transactions: Transaction[];
};
export function groupRows(current: Transaction[], previous: Transaction[], field: "category" | "account"): Group[] {
  const names = new Set([...current, ...previous].map(row => row[field]));
  const sum = total(current);
  return [...names].map(name => {
    const transactions = current.filter(row => row[field] === name);
    const amount = total(transactions);
    return { name, amount, previous: total(previous.filter(row => row[field] === name)),
      previousCount: previous.filter(row => row[field] === name).length,
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
  const incomeTotal = total(income);
  const expenseTotal = total(expense);
  const year = month.slice(0, 4);
  const yearMonths = Array.from({ length: 12 }, (_, index) => {
    const key = `${year}-${String(index + 1).padStart(2, "0")}`;
    const future = key > currentMonth;
    const rows = future ? [] : inMonth(key, key === currentMonth ? now.getDate() : daysInMonth(key));
    const received = rows.filter(row => row.type === "income");
    const spent = rows.filter(row => row.type === "expense");
    return { month: key, income: total(received), expense: total(spent),
      incomeCount: received.length, expenseCount: spent.length, future,
      isPartial: key === currentMonth && now.getDate() < daysInMonth(key) };
  });
  const yearIncome = Number(yearMonths.reduce((sum, row) => sum + row.income, 0).toFixed(10));
  const yearExpense = Number(yearMonths.reduce((sum, row) => sum + row.expense, 0).toFixed(10));
  return {
    current, previous, income: incomeTotal, expense: expenseTotal,
    ...incomePosition(incomeTotal, expenseTotal),
    year: { label: year, months: yearMonths, income: yearIncome, expense: yearExpense,
      ...incomePosition(yearIncome, yearExpense), isCurrent: year === currentMonth.slice(0, 4) },
    previousIncome: total(previousIncome), previousExpense: total(previousExpense),
    hasIncome: income.length > 0, hasSpending: expense.length > 0,
    hasPreviousIncome: previousIncome.length > 0, hasPreviousSpending: previousExpense.length > 0,
    periodLabel: dateRangeLabel(month, elapsed),
    periodCaption: month === currentMonth && elapsed < daysInMonth(month)
      ? elapsed === 1 ? "Day 1" : `Days 1–${elapsed}` : "Full month",
    comparisonDescription: month === currentMonth
      ? `Comparing ${dateRangeLabel(month, elapsed)} with ${dateRangeLabel(previousMonth, previousDays)}`
      : `Compared with ${monthLabel(previousMonth)}`,
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
        expense: total(rows.filter(row => row.type === "expense")),
        expenseCount: rows.filter(row => row.type === "expense").length,
        isPartial: key === currentMonth && elapsed < daysInMonth(key) };
    }),
    comparisonLabel: `${monthLabel(previousMonth)} · ${previousDays === daysInMonth(previousMonth) ? "full month" : `days 1–${previousDays}`}`,
  };
}

export type SpendingObservation = {
  group: Group;
  kind: "overBudget" | "increase" | "decrease";
  difference: number;
};

// Budget overruns take priority. Comparisons require recorded spending in both
// periods; missing entries alone cannot tell us that actual spending was zero.
export function getSpendingObservation(
  data: ReturnType<typeof calculateInsights>, budgets: Record<string, number> | null,
): SpendingObservation | null {
  if (!data.hasSpending) return null;
  const overruns = data.expenseCategories.flatMap(group => {
    const budget = budgets?.[group.name];
    return budget !== undefined && Number.isFinite(budget) && budget > 0 && group.amount > budget
      ? [{ group, kind: "overBudget" as const, difference: group.amount - budget }] : [];
  }).sort((a, b) => b.difference - a.difference || a.group.name.localeCompare(b.group.name));
  if (overruns.length) return overruns[0];
  if (!data.hasPreviousSpending) return null;
  const changes = data.expenseCategories.filter(group => group.amount !== group.previous)
    .sort((a, b) => Math.abs(b.amount - b.previous) - Math.abs(a.amount - a.previous)
      || a.name.localeCompare(b.name));
  const group = changes[0];
  return group ? { group, kind: group.amount > group.previous ? "increase" : "decrease",
    difference: Math.abs(group.amount - group.previous) } : null;
}
