export type BreakdownItem = {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
};

export type PaymentItem = {
  method: string;
  amount: number;
  percentage: number;
};

export type MonthlyPoint = {
  monthKey: string;
  label: string;
  expenseTotal: number;
  incomeTotal: number;
};

export type CategoryComparisonRow = {
  category: string;
  currentAmount: number;
  previousAmount: number;
  percentChange: number | null;
  currentShare: number;
  previousShare: number;
  color: string;
  icon: string;
};

export type AnalyticsData = {
  spendingTrend: {
    points: MonthlyPoint[];
    hasEnoughData: boolean;
    summary: string;
    currentValue: number;
    previousValue: number;
  };
  incomeVsExpenses: {
    points: MonthlyPoint[];
    hasEnoughData: boolean;
  };
  categoryComparison: {
    rows: CategoryComparisonRow[];
    incomeRows: CategoryComparisonRow[];
    hasPreviousMonthData: boolean;
    currentMonthTotal: number;
    previousMonthTotal: number;
  };
};

export type HeatmapCell = {
  date: string | null;
  day: number | null;
  amount: number;
};

export type MonthSummary = {
  monthKey: string;
  incomeTotal: number;
  expenseTotal: number;
  balanceInHand: number;
  previousMonthExpenseTotal: number;
  fullExpenseBreakdown: BreakdownItem[];
  groupedExpenseBreakdown: BreakdownItem[];
  fullIncomeBreakdown: BreakdownItem[];
  groupedIncomeBreakdown: BreakdownItem[];
  paymentMethodBreakdown: PaymentItem[];
  heatmap: {
    dayLabel: string;
    topSpendingDayLabel: string | null;
    longestNoSpendStreak: number;
    weeks: HeatmapCell[][];
  };
};
