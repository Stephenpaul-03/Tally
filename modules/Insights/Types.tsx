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
  deltaAmount: number;
  lastMonthAmount: number;
  changePercent: number | null;
  differenceAmount: number;
  currentShare: number;
  previousShare: number;
  color: string;
  icon: string;
};

export type CategoryTrendPoint = {
  monthKey: string;
  label: string;
  amount: number;
};

export type CategoryTrendRow = {
  category: string;
  currentAmount: number;
  averageAmount: number;
  differenceAmount: number;
  changePercent: number | null;
  budgetAmount?: number;
  color: string;
  icon: string;
  points: CategoryTrendPoint[];
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
    currentMonthLabel: string;
    lastMonthLabel: string;
  };
  categoryTrends: {
    rows: CategoryTrendRow[];
    hasEnoughHistory: boolean;
    monthKeys: string[];
    comparisonStartLabel: string;
    comparisonEndLabel: string;
  };
  weeklySpending: {
    weeks: {
      key: string;
      label: string;
      title: string;
      rangeLabel: string;
      amount: number;
      isCurrentWeek: boolean;
    }[];
    currentWeekAmount: number;
    averageWeekAmount: number;
    hasData: boolean;
  };
  spendingPace: {
    projectedAmount: number;
    lastMonthAmount: number;
    deltaAmount: number;
    direction: "over" | "under" | "flat";
    progressPercent: number;
    totalSpentSoFar: number;
    hasProjection: boolean;
  };
  unusualSpending: {
    rows: {
      category: string;
      currentAmount: number;
      usualAmount: number;
      direction: "up" | "down";
      color: string;
    }[];
    hasHistory: boolean;
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
