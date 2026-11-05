import type { DatabaseTransaction } from "@/modules/Core/Repository/SQLiteRepo";
import type { MonthSummary } from "@/modules/Insights/Types";
import { reportDetailKey } from "@/modules/Insights/reportSelection";
import { shiftMonth } from "@/modules/Insights/calculations";
import { getCategoryColor } from "@/utils/Helpers";
import { databaseSummary } from "./model";

export function workspaceSummaryReport(rows: DatabaseTransaction[], currency: string, month: string | null) {
  const current = databaseSummary(rows, currency, month);
  const previous = month ? databaseSummary(rows, currency, shiftMonth(month, -1)) : databaseSummary([], currency, null);
  const categories = (type: "income" | "expense") => [...new Set([...current.entries, ...previous.entries].filter(row => row.type === type).map(row => row.category))].map(name => {
    const entries = current.entries.filter(row => row.type === type && row.category === name);
    const old = previous.entries.filter(row => row.type === type && row.category === name);
    const sample = entries[0] || old[0];
    return { name, entries, amount: entries.reduce((sum, row) => sum + Math.abs(row.amount), 0), previous: old.reduce((sum, row) => sum + Math.abs(row.amount), 0), color: sample.categoryColor || getCategoryColor(name, type), icon: sample.categoryIcon };
  });
  const expense = categories("expense"), income = categories("income");
  const accounts = [...new Set([...current.entries, ...previous.entries].map(row => row.account))].map(name => {
    const entries = current.entries.filter(row => row.account === name), old = previous.entries.filter(row => row.account === name);
    const total = (rows: DatabaseTransaction[], type: "income" | "expense") => rows.filter(row => row.type === type).reduce((sum, row) => sum + Math.abs(row.amount), 0);
    return { name, income: total(entries, "income"), expense: total(entries, "expense"), previousIncome: total(old, "income"), previousExpense: total(old, "expense"), entries };
  });
  const summary: MonthSummary = { incomeTotal: current.income, expenseTotal: current.spent, balanceInHand: current.balance,
    fullExpenseBreakdown: expense.filter(group => group.entries.length).map(group => ({ category: group.name, amount: group.amount, color: group.color })),
    fullIncomeBreakdown: income.filter(group => group.entries.length).map(group => ({ category: group.name, amount: group.amount, color: group.color })) };
  return { summary, accounts,
    expenseComparison: expense.map(group => ({ category: group.name, currentAmount: group.amount, previousAmount: group.previous })),
    incomeComparison: income.map(group => ({ category: group.name, currentAmount: group.amount, previousAmount: group.previous })),
    previousSections: { includeIncome: previous.income > 0, includeExpenses: previous.spent > 0, includeAccounts: previous.entries.length > 0 },
    groups: [
      ...expense.filter(group => group.entries.length).map(group => ({ key: reportDetailKey("expense", group.name), label: group.name, section: "includeExpenses" as const, count: group.entries.length, color: group.color, icon: group.icon })),
      ...income.filter(group => group.entries.length).map(group => ({ key: reportDetailKey("income", group.name), label: group.name, section: "includeIncome" as const, count: group.entries.length, color: group.color, icon: group.icon })),
      ...accounts.filter(group => group.entries.length).map(group => ({ key: reportDetailKey("account", group.name), label: group.name, section: "includeAccounts" as const, count: group.entries.length })),
    ],
    // Keep the source visible in expanded PDF transaction details.
    transactions: current.entries.map(row => ({ ...row, title: `${row.title} · ${row.workspaceName}` })),
  };
}
