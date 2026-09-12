export type BreakdownItem = { category: string; amount: number; color: string; percentage?: number };
export type CategoryComparisonRow = { category: string; currentAmount: number; previousAmount: number };
export type MonthSummary = {
  incomeTotal: number; expenseTotal: number; balanceInHand: number;
  fullExpenseBreakdown: BreakdownItem[]; fullIncomeBreakdown: BreakdownItem[];
};
