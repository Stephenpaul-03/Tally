import { useAppSelector } from "@/hooks/Redux";
import {
    selectCategoryColors,
    selectCategoryIcons,
    selectExpenseTransactions,
    selectIncomeTransactions,
} from "@/modules/Data/Slices/TransactionSlice";
import { getCategoryColor, getCategoryIconName } from "@/utils/Helpers";
import type { Transaction } from "@/utils/Types";
import { useNavigation } from "@react-navigation/native";
import { useMemo, useState } from "react";
import { Platform } from "react-native";
import type { AnalyticsData, BreakdownItem, PaymentItem } from "./Types";
import {
    formatChange,
    formatMonthKey,
    formatMonthLabel,
    formatPercentChange,
    formatShortMonthLabel,
    formatTrendSummary,
    getMonthSummary,
    getPaymentMethodMeta,
    shiftMonth,
} from "./Utils";

type CategorySheetState = {
  mode: "expense" | "income";
  label: string;
  icon?: string;
  color?: string;
  total: number;
  transactions: Transaction[];
};

type AccountSheetState = {
  mode: "expense" | "income";
  label: string;
  icon?: string;
  color?: string;
  total: number;
  transactions: Transaction[];
};

export function useInsights() {
  const navigation = useNavigation<any>();

  const expenseTransactions = useAppSelector(selectExpenseTransactions);
  const incomeTransactions = useAppSelector(selectIncomeTransactions);
  const categoryIcons = useAppSelector(selectCategoryIcons);
  const categoryColors = useAppSelector(selectCategoryColors);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetMode, setSheetMode] = useState<"expense" | "income">("expense");
  const [categorySheet, setCategorySheet] = useState<CategorySheetState | null>(
    null,
  );
  const [accountSheet, setAccountSheet] = useState<AccountSheetState | null>(
    null,
  );

  const canOpenDrawer =
    Platform.OS === "web" && typeof navigation?.openDrawer === "function";

  const [selectedDate, setSelectedDate] = useState(
    () => `${formatMonthKey(new Date())}-01`,
  );
  const selectedMonth = selectedDate.slice(0, 7);
  const previousMonthKey = shiftMonth(selectedMonth, -1);

  const expenseMonthTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const tx of expenseTransactions) {
      const monthKey = tx.date.slice(0, 7);
      totals.set(monthKey, (totals.get(monthKey) ?? 0) + Math.abs(tx.amount));
    }
    return totals;
  }, [expenseTransactions]);

  const incomeMonthTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const tx of incomeTransactions) {
      const monthKey = tx.date.slice(0, 7);
      totals.set(monthKey, (totals.get(monthKey) ?? 0) + Math.abs(tx.amount));
    }
    return totals;
  }, [incomeTransactions]);

  const incomeCategoryTotalsByMonth = useMemo(() => {
    const totalsByMonth = new Map<string, Map<string, number>>();

    for (const tx of incomeTransactions) {
      const monthKey = tx.date.slice(0, 7);
      const monthTotals =
        totalsByMonth.get(monthKey) ?? new Map<string, number>();
      monthTotals.set(
        tx.category,
        (monthTotals.get(tx.category) ?? 0) + Math.abs(tx.amount),
      );
      totalsByMonth.set(monthKey, monthTotals);
    }

    return totalsByMonth;
  }, [incomeTransactions]);

  const expenseCategoryTotalsByMonth = useMemo(() => {
    const totalsByMonth = new Map<string, Map<string, number>>();

    for (const tx of expenseTransactions) {
      const monthKey = tx.date.slice(0, 7);
      const monthTotals =
        totalsByMonth.get(monthKey) ?? new Map<string, number>();
      monthTotals.set(
        tx.category,
        (monthTotals.get(tx.category) ?? 0) + Math.abs(tx.amount),
      );
      totalsByMonth.set(monthKey, monthTotals);
    }

    return totalsByMonth;
  }, [expenseTransactions]);

  const selectedMonthExpenseTransactions = useMemo(
    () => expenseTransactions.filter((tx) => tx.date.startsWith(selectedMonth)),
    [expenseTransactions, selectedMonth],
  );

  const selectedMonthIncomeTransactions = useMemo(
    () => incomeTransactions.filter((tx) => tx.date.startsWith(selectedMonth)),
    [incomeTransactions, selectedMonth],
  );

  const analytics = useMemo<AnalyticsData>(() => {
    const monthKeys = Array.from({ length: 6 }, (_, index) =>
      shiftMonth(selectedMonth, index - 5),
    );

    const points = monthKeys.map((monthKey) => ({
      monthKey,
      label: formatShortMonthLabel(monthKey),
      expenseTotal: expenseMonthTotals.get(monthKey) ?? 0,
      incomeTotal: incomeMonthTotals.get(monthKey) ?? 0,
    }));

    const latestPoint = points[points.length - 1] ?? {
      monthKey: selectedMonth,
      label: formatShortMonthLabel(selectedMonth),
      expenseTotal: 0,
      incomeTotal: 0,
    };
    const previousPoint = points[points.length - 2] ?? latestPoint;

    const buildCategoryComparison = (
      totalsByMonth: Map<string, Map<string, number>>,
      categoryMode: "expense" | "income",
    ) => {
      const currentCategoryTotals =
        totalsByMonth.get(selectedMonth) ?? new Map<string, number>();
      const previousCategoryTotals =
        totalsByMonth.get(previousMonthKey) ?? new Map<string, number>();

      const allCategories = Array.from(
        new Set([
          ...currentCategoryTotals.keys(),
          ...previousCategoryTotals.keys(),
        ]),
      );
      const currentMonthTotal = Array.from(
        currentCategoryTotals.values(),
      ).reduce((sum, amount) => sum + amount, 0);
      const previousMonthTotal = Array.from(
        previousCategoryTotals.values(),
      ).reduce((sum, amount) => sum + amount, 0);

      const rows = allCategories
        .map((category) => {
          const currentAmount = currentCategoryTotals.get(category) ?? 0;
          const previousAmount = previousCategoryTotals.get(category) ?? 0;
          return {
            category,
            currentAmount,
            previousAmount,
            percentChange: formatPercentChange(currentAmount, previousAmount),
            currentShare:
              currentMonthTotal > 0
                ? (currentAmount / currentMonthTotal) * 100
                : 0,
            previousShare:
              previousMonthTotal > 0
                ? (previousAmount / previousMonthTotal) * 100
                : 0,
            color: getCategoryColor(category, categoryMode, categoryColors),
            icon: getCategoryIconName(category, categoryMode, categoryIcons),
          };
        })
        .sort((a, b) => {
          const left = Math.max(a.currentAmount, a.previousAmount);
          const right = Math.max(b.currentAmount, b.previousAmount);
          return right - left;
        });

      return {
        rows,
        currentMonthTotal,
        previousMonthTotal,
        hasPreviousMonthData: previousCategoryTotals.size > 0,
      };
    };

    const expenseComparison = buildCategoryComparison(
      expenseCategoryTotalsByMonth,
      "expense",
    );
    const incomeComparison = buildCategoryComparison(
      incomeCategoryTotalsByMonth,
      "income",
    );

    const expenseMonthsWithData = points.filter(
      (point) => point.expenseTotal > 0,
    ).length;
    const monthsWithAnyData = points.filter(
      (point) => point.expenseTotal > 0 || point.incomeTotal > 0,
    ).length;

    return {
      spendingTrend: {
        points,
        hasEnoughData: expenseMonthsWithData >= 2,
        summary: formatTrendSummary(
          latestPoint.expenseTotal,
          previousPoint.expenseTotal,
          latestPoint.monthKey,
        ),
        currentValue: latestPoint.expenseTotal,
        previousValue: previousPoint.expenseTotal,
      },
      incomeVsExpenses: {
        points,
        hasEnoughData: monthsWithAnyData >= 2,
      },
      categoryComparison: {
        rows: expenseComparison.rows,
        incomeRows: incomeComparison.rows,
        hasPreviousMonthData: expenseComparison.hasPreviousMonthData,
        currentMonthTotal: expenseComparison.currentMonthTotal,
        previousMonthTotal: expenseComparison.previousMonthTotal,
      },
    };
  }, [
    expenseCategoryTotalsByMonth,
    incomeCategoryTotalsByMonth,
    expenseMonthTotals,
    incomeMonthTotals,
    categoryColors,
    categoryIcons,
    previousMonthKey,
    selectedMonth,
  ]);

  const summary = useMemo(
    () =>
      getMonthSummary(
        selectedMonth,
        expenseTransactions,
        incomeTransactions,
        categoryIcons,
        categoryColors,
      ),
    [
      selectedMonth,
      expenseTransactions,
      incomeTransactions,
      categoryIcons,
      categoryColors,
    ],
  );

  const comparison = useMemo(
    () =>
      formatChange(
        summary.expenseTotal,
        summary.previousMonthExpenseTotal,
        summary.monthKey,
      ),
    [summary.expenseTotal, summary.previousMonthExpenseTotal, summary.monthKey],
  );

  const heatmapMax = Math.max(
    ...summary.heatmap.weeks.flat().map((item) => item.amount),
    0,
  );

  const activeFullBreakdown =
    sheetMode === "expense"
      ? summary.fullExpenseBreakdown
      : summary.fullIncomeBreakdown;

  const monthTransactions = useMemo(
    () => ({
      expense: selectedMonthExpenseTransactions,
      income: selectedMonthIncomeTransactions,
    }),
    [selectedMonthExpenseTransactions, selectedMonthIncomeTransactions],
  );

  const openSheet = (mode: "expense" | "income") => {
    setSheetMode(mode);
    setSheetVisible(true);
  };

  const openCategorySheetFromBreakdownSheet = (item: BreakdownItem) => {
    setSheetVisible(false);
    openCategorySheet(sheetMode, item);
  };

  const openCategorySheet = (
    mode: "expense" | "income",
    item: BreakdownItem,
  ) => {
    const allBreakdown =
      mode === "expense"
        ? summary.fullExpenseBreakdown
        : summary.fullIncomeBreakdown;
    const sourceTransactions =
      mode === "expense" ? monthTransactions.expense : monthTransactions.income;
    const includedCategories =
      item.category === "Others"
        ? allBreakdown.slice(5).map((entry) => entry.category)
        : [item.category];

    const transactions = sourceTransactions
      .filter((tx) => includedCategories.includes(tx.category))
      .sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.updatedAt.localeCompare(a.updatedAt);
      });

    setCategorySheet({
      mode,
      label: item.category,
      icon: item.icon,
      color: item.color,
      total: item.amount,
      transactions,
    });
  };

  const openPaymentMethodSheet = (
    item: PaymentItem,
    visual?: {
      accent: string;
      icon: string;
      label: string;
    },
  ) => {
    const transactions = monthTransactions.expense
      .filter((tx) => getPaymentMethodMeta(tx.account).label === item.method)
      .sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.updatedAt.localeCompare(a.updatedAt);
      });

    setAccountSheet({
      mode: "expense",
      label: visual?.label ?? item.method,
      icon: visual?.icon,
      color: visual?.accent,
      total: item.amount,
      transactions,
    });
  };

  return {
    navigation,
    canOpenDrawer,
    selectedDate,
    setSelectedDate,
    summary,
    comparison,
    analytics,
    heatmapMax,
    sheetVisible,
    setSheetVisible,
    sheetMode,
    activeFullBreakdown,
    openSheet,
    setSheetMode,
    categorySheet,
    setCategorySheet,
    accountSheet,
    setAccountSheet,
    openCategorySheet,
    openPaymentMethodSheet,
    openCategorySheetFromBreakdownSheet,
    categorySheetMonthLabel: formatMonthLabel(selectedMonth),
    accountSheetMonthLabel: formatMonthLabel(selectedMonth),
  };
}
