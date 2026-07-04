import { useAppSelector } from "@/hooks/Redux";
import {
  selectCategoryColors,
  selectCategoryBudgets,
  selectCategoryIcons,
  selectExpenseTransactions,
  selectIncomeTransactions,
  selectOverallBudget,
} from "@/modules/Core/Slices/TransactionSlice";
import { getCategoryColor, getCategoryIconName, getTodayDate } from "@/utils/Helpers";
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
  formatWeekRangeLabel,
  formatWeekTitle,
  formatTrendSummary,
  getMonthSummary,
  monthStart,
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

function startOfIsoWeek(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  const day = normalized.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  normalized.setDate(normalized.getDate() + diff);
  return normalized;
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function useInsights() {
  const navigation = useNavigation<any>();

  const expenseTransactions = useAppSelector(selectExpenseTransactions);
  const incomeTransactions = useAppSelector(selectIncomeTransactions);
  const categoryIcons = useAppSelector(selectCategoryIcons);
  const categoryColors = useAppSelector(selectCategoryColors);
  const categoryBudgets = useAppSelector(selectCategoryBudgets);
  const overallBudget = useAppSelector(selectOverallBudget);

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
  const todayKey = getTodayDate();
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

  const todayExpenseTransactions = useMemo(
    () => expenseTransactions.filter((tx) => tx.date === todayKey),
    [expenseTransactions, todayKey],
  );

  const todayIncomeTransactions = useMemo(
    () => incomeTransactions.filter((tx) => tx.date === todayKey),
    [incomeTransactions, todayKey],
  );

  const analytics = useMemo<AnalyticsData>(() => {
    const today = new Date();
    const currentMonthKey = formatMonthKey(today);
    const selectedMonthDate = monthStart(selectedMonth);
    const selectedMonthIsCurrent = selectedMonth === currentMonthKey;
    const selectedMonthIsFuture = selectedMonth > currentMonthKey;
    const daysInSelectedMonth = new Date(
      selectedMonthDate.getFullYear(),
      selectedMonthDate.getMonth() + 1,
      0,
    ).getDate();
    const daysElapsed = selectedMonthIsFuture
      ? 0
      : selectedMonthIsCurrent
        ? today.getDate()
        : daysInSelectedMonth;
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
            deltaAmount: currentAmount - previousAmount,
            lastMonthAmount: previousAmount,
            changePercent: formatPercentChange(currentAmount, previousAmount),
            differenceAmount: currentAmount - previousAmount,
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
    const currentExpenseTotals =
      expenseCategoryTotalsByMonth.get(selectedMonth) ?? new Map<string, number>();
    const historyMonthKeys = Array.from(expenseCategoryTotalsByMonth.keys())
      .filter((monthKey) => monthKey !== selectedMonth)
      .sort();

    const weeklyBuckets = new Map<
      string,
      {
        key: string;
        label: string;
        title: string;
        rangeLabel: string;
        amount: number;
        isCurrentWeek: boolean;
      }
    >();
    // Historical months use the last day of that month as the reference point
    // so weekly/pacing cards still render a stable comparison outside the live month.
    const currentWeekKey = dateKey(
      startOfIsoWeek(
        new Date(
          selectedMonthDate.getFullYear(),
          selectedMonthDate.getMonth(),
          Math.max(1, daysElapsed || 1),
        ),
      ),
    );
    for (let day = 1; day <= daysInSelectedMonth; day += 1) {
      const dayDate = new Date(
        selectedMonthDate.getFullYear(),
        selectedMonthDate.getMonth(),
        day,
      );
      const weekStart = startOfIsoWeek(dayDate);
      const key = dateKey(weekStart);
      if (weeklyBuckets.has(key)) continue;

      const visibleStart = Math.max(1, dayDate.getDate() - ((dayDate.getDay() + 6) % 7));
      const visibleEnd = Math.min(visibleStart + 6, daysInSelectedMonth);
      const weekNumber = weeklyBuckets.size + 1;
      weeklyBuckets.set(key, {
        key,
        label: `Week ${weekNumber}`,
        title: formatWeekTitle(
          weekNumber,
          visibleStart,
          visibleEnd,
          selectedMonth,
        ),
        rangeLabel: formatWeekRangeLabel(
          visibleStart,
          visibleEnd,
          selectedMonth,
        ),
        amount: 0,
        isCurrentWeek: key === currentWeekKey,
      });
    }

    for (const tx of selectedMonthExpenseTransactions) {
      const bucketKey = dateKey(startOfIsoWeek(new Date(`${tx.date}T00:00:00`)));
      const bucket = weeklyBuckets.get(bucketKey);
      if (bucket) {
        bucket.amount += Math.abs(tx.amount);
      }
    }

    const weeklySeries = Array.from(weeklyBuckets.values());
    const currentWeekAmount =
      weeklySeries.find((week) => week.isCurrentWeek)?.amount ?? 0;
    const selectedMonthExpenseTotal = selectedMonthExpenseTransactions.reduce(
      (sum, tx) => sum + Math.abs(tx.amount),
      0,
    );
    const averageWeekAmount =
      weeklySeries.length > 0
        ? selectedMonthExpenseTotal / weeklySeries.length
        : 0;

    const projectedAmount =
      daysElapsed > 0
        ? (selectedMonthExpenseTotal / daysElapsed) * daysInSelectedMonth
        : 0;
    const lastMonthAmount = expenseMonthTotals.get(previousMonthKey) ?? 0;
    const projectionDelta = projectedAmount - lastMonthAmount;
    const projectionDirection =
      Math.abs(projectionDelta) < 1
        ? ("flat" as const)
        : projectionDelta > 0
          ? ("over" as const)
          : ("under" as const);

    const allHistoricalCategories = new Set<string>();
    historyMonthKeys.forEach((monthKey) => {
      for (const category of expenseCategoryTotalsByMonth.get(monthKey)?.keys() ??
        []) {
        allHistoricalCategories.add(category);
      }
    });
    for (const category of currentExpenseTotals.keys()) {
      allHistoricalCategories.add(category);
    }

    const unusualRows = Array.from(allHistoricalCategories)
      .map((category) => {
        if (historyMonthKeys.length === 0) return null;
        const currentAmount = currentExpenseTotals.get(category) ?? 0;
        const usualAmount =
          historyMonthKeys.reduce(
            (sum, monthKey) =>
              sum +
              (expenseCategoryTotalsByMonth.get(monthKey)?.get(category) ?? 0),
            0,
          ) / historyMonthKeys.length;

        if (usualAmount <= 0) return null;
        if (currentAmount >= usualAmount * 2) {
          return {
            category,
            currentAmount,
            usualAmount,
            direction: "up" as const,
            color: getCategoryColor(category, "expense", categoryColors),
          };
        }
        if (currentAmount <= usualAmount * 0.5) {
          return {
            category,
            currentAmount,
            usualAmount,
            direction: "down" as const,
            color: getCategoryColor(category, "expense", categoryColors),
          };
        }
        return null;
      })
      .filter((row): row is NonNullable<typeof row> => row != null)
      .sort((left, right) => {
        const leftRatio = Math.abs(left.currentAmount - left.usualAmount) / left.usualAmount;
        const rightRatio =
          Math.abs(right.currentAmount - right.usualAmount) / right.usualAmount;
        return rightRatio - leftRatio;
      });

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
        currentMonthLabel: formatMonthLabel(selectedMonth),
        lastMonthLabel: formatMonthLabel(previousMonthKey),
      },
      categoryTrends: (() => {
        const monthsWithData = monthKeys.filter(
          (monthKey) =>
            (expenseCategoryTotalsByMonth.get(monthKey)?.size ?? 0) > 0,
        );

        if (monthsWithData.length < 2) {
          return {
            rows: [],
            hasEnoughHistory: false,
            monthKeys,
            comparisonStartLabel: formatShortMonthLabel(monthKeys[0]),
            comparisonEndLabel:
              formatShortMonthLabel(monthKeys[monthKeys.length - 1]),
          };
        }

        const comparisonStartMonthKey = monthsWithData[0];
        const comparisonStartIndex = Math.max(
          monthKeys.indexOf(comparisonStartMonthKey),
          0,
        );
        const comparisonMonthKeys = monthKeys.slice(comparisonStartIndex);
        const categories = new Set<string>();
        comparisonMonthKeys.forEach((monthKey) => {
          for (const category of expenseCategoryTotalsByMonth.get(monthKey)?.keys() ??
            []) {
            categories.add(category);
          }
        });

        const rows = Array.from(categories)
          .map((category) => {
            const trendPoints = comparisonMonthKeys.map((monthKey) => ({
              monthKey,
              label: formatShortMonthLabel(monthKey),
              amount:
                expenseCategoryTotalsByMonth.get(monthKey)?.get(category) ?? 0,
            }));
            const activePoints = trendPoints.filter((point) => point.amount > 0);

            if (activePoints.length < 2) {
              return null;
            }

            const lastPoint = trendPoints[trendPoints.length - 1];
            const totalAmount = trendPoints.reduce(
              (sum, point) => sum + point.amount,
              0,
            );
            const averageAmount =
              trendPoints.length > 0 ? totalAmount / trendPoints.length : 0;
            const currentAmount = lastPoint?.amount ?? 0;
            const differenceAmount = currentAmount - averageAmount;
            const changePercent =
              averageAmount > 0
                ? Number(((differenceAmount / averageAmount) * 100).toFixed(1))
                : currentAmount > 0
                  ? null
                  : 0;

            return {
              category,
              currentAmount,
              averageAmount,
              differenceAmount,
              changePercent,
              budgetAmount: categoryBudgets[category],
              color: getCategoryColor(category, "expense", categoryColors),
              icon: getCategoryIconName(category, "expense", categoryIcons),
              points: trendPoints,
            };
          })
          .filter((row): row is NonNullable<typeof row> => row != null)
          .sort((left, right) => {
            if (right.currentAmount !== left.currentAmount) {
              return right.currentAmount - left.currentAmount;
            }
            return right.averageAmount - left.averageAmount;
          });

        return {
          rows,
          hasEnoughHistory: rows.length > 0,
          monthKeys: comparisonMonthKeys,
          comparisonStartLabel: formatShortMonthLabel(comparisonMonthKeys[0]),
          comparisonEndLabel: formatShortMonthLabel(
            comparisonMonthKeys[comparisonMonthKeys.length - 1],
          ),
        };
      })(),
      weeklySpending: {
        weeks: weeklySeries,
        currentWeekAmount,
        averageWeekAmount,
        hasData: weeklySeries.some((week) => week.amount > 0),
      },
      spendingPace: {
        projectedAmount,
        lastMonthAmount,
        deltaAmount: Math.abs(projectionDelta),
        direction: projectionDirection,
        progressPercent:
          daysInSelectedMonth > 0 ? (daysElapsed / daysInSelectedMonth) * 100 : 0,
        totalSpentSoFar: selectedMonthExpenseTotal,
        hasProjection: daysElapsed > 0,
      },
      unusualSpending: {
        rows: unusualRows,
        hasHistory: historyMonthKeys.length > 0,
      },
    };
  }, [
    categoryColors,
    categoryBudgets,
    expenseCategoryTotalsByMonth,
    incomeCategoryTotalsByMonth,
    expenseMonthTotals,
    incomeMonthTotals,
    categoryIcons,
    previousMonthKey,
    selectedMonthExpenseTransactions,
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

  const todaySummary = useMemo(
    () => ({
      expenseTotal: todayExpenseTransactions.reduce(
        (sum, tx) => sum + Math.abs(tx.amount),
        0,
      ),
      incomeTotal: todayIncomeTransactions.reduce(
        (sum, tx) => sum + Math.abs(tx.amount),
        0,
      ),
      transactionCount:
        todayExpenseTransactions.length + todayIncomeTransactions.length,
      label: todayKey,
    }),
    [todayExpenseTransactions, todayIncomeTransactions, todayKey],
  );

  const heroSummary = useMemo(() => {
    const today = new Date();
    const currentMonthKey = formatMonthKey(today);
    const selectedMonthStart = new Date(`${selectedMonth}-01T00:00:00`);
    const daysInSelectedMonth = new Date(
      selectedMonthStart.getFullYear(),
      selectedMonthStart.getMonth() + 1,
      0,
    ).getDate();
    const daysUntilMonthEnd =
      selectedMonth === currentMonthKey
        ? Math.max(0, daysInSelectedMonth - today.getDate())
        : selectedMonth > currentMonthKey
          ? daysInSelectedMonth
          : 0;

    return {
      expenseTransactionCount: selectedMonthExpenseTransactions.length,
      incomeTransactionCount: selectedMonthIncomeTransactions.length,
      daysUntilMonthEnd,
    };
  }, [
    selectedMonth,
    selectedMonthExpenseTransactions.length,
    selectedMonthIncomeTransactions.length,
  ]);

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
    selectedMonth,
    setSelectedDate,
    expenseTransactions,
    summary,
    overallBudget,
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
    todaySummary,
    heroSummary,
  };
}
