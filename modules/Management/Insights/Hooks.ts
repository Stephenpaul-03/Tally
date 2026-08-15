import { useAppSelector } from "@/hooks/Redux";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { useWorkspaceDefaults } from "@/hooks/use-workspace-defaults";
import {
  selectAccountColors,
  selectAccountIcons,
  selectActiveAccounts,
  selectActiveExpenseCategories,
  selectCategoryBudgets,
  selectCategoryColors,
  selectCategoryIcons,
  selectExpenseTransactions,
  selectIncomeTransactions,
  selectOverallBudget,
} from "@/modules/Core/Slices/TransactionSlice";
import { selectActiveWorkspaceId } from "@/modules/Core/Slices/WorkspaceSlice";
import {
  getAccountColor,
  getAccountIconName,
  getCategoryColor,
  getCategoryIconName,
} from "@/utils/Helpers";
import React from "react";

export type CategoryInsightCompareMode = "lastMonth" | "last3Months";

export type CategoryInsightRow = {
  name: string;
  icon: string;
  color: string;
  income: number;
  spent: number;
  incomeShare: number;
  spendingShare: number;
  budget: number;
  budgetUsed: number;
  budgetLeft: number;
  comparisonSpent: number;
  comparisonIncome: number;
  comparisonIncomeShare: number;
  delta: number;
  deltaPercent: number | null;
};

export type CategoryTrendRow = {
  name: string;
  icon: string;
  color: string;
  values: number[];
  latest: number;
  previous: number;
  delta: number;
  deltaPercent: number | null;
  total: number;
};

export type HeroBalanceSummary = {
  currentMonthKey: string;
  income: number;
  spent: number;
  net: number;
  budget: number;
  budgetLeft: number;
  budgetUsed: number;
  budgetSafeBelowPercent: number;
  budgetNearlyEmptyFromPercent: number;
};

function monthKeyFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function dateFromMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(date.getTime())) return new Date();
  return date;
}

export function getShiftedMonthKey(offset: number, baseMonthKey?: string) {
  const date = baseMonthKey ? dateFromMonthKey(baseMonthKey) : new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + offset);
  return monthKeyFromDate(date);
}

function getComparisonMonthKeys(
  compareMode: CategoryInsightCompareMode,
  currentMonthKey: string,
) {
  return compareMode === "lastMonth"
    ? [getShiftedMonthKey(-1, currentMonthKey)]
    : [
        getShiftedMonthKey(-1, currentMonthKey),
        getShiftedMonthKey(-2, currentMonthKey),
        getShiftedMonthKey(-3, currentMonthKey),
      ];
}

function getRecentMonthKeys(count: number, endMonthKey = getCurrentMonthKey()) {
  return Array.from({ length: count }, (_, index) =>
    getShiftedMonthKey(index - count + 1, endMonthKey),
  );
}

export function formatShortMonth(monthKey: string) {
  const date = dateFromMonthKey(monthKey);
  if (Number.isNaN(date.getTime())) return monthKey;
  return new Intl.DateTimeFormat("en-IN", { month: "short" }).format(date);
}

export function formatInsightMonth(monthKey: string) {
  const date = dateFromMonthKey(monthKey);
  if (Number.isNaN(date.getTime())) return monthKey;
  return new Intl.DateTimeFormat("en-IN", { month: "long" }).format(date);
}

function sumByCategory(
  transactions: { date?: string; amount: number; category: string }[],
  monthKeys: string[],
) {
  const monthSet = new Set(monthKeys);
  return transactions.reduce<Record<string, number>>((acc, transaction) => {
    const monthKey = transaction.date?.slice(0, 7);
    if (!monthKey || !monthSet.has(monthKey)) return acc;
    acc[transaction.category] =
      (acc[transaction.category] ?? 0) + Math.max(0, transaction.amount);
    return acc;
  }, {});
}

function sumByAccount(
  transactions: { date?: string; amount: number; account: string }[],
  monthKeys: string[],
) {
  const monthSet = new Set(monthKeys);
  return transactions.reduce<Record<string, number>>((acc, transaction) => {
    const monthKey = transaction.date?.slice(0, 7);
    if (!monthKey || !monthSet.has(monthKey)) return acc;
    acc[transaction.account] =
      (acc[transaction.account] ?? 0) + Math.max(0, transaction.amount);
    return acc;
  }, {});
}

function sumTransactionsInMonths(
  transactions: { date?: string; amount: number }[],
  monthKeys: string[],
) {
  const monthSet = new Set(monthKeys);
  return transactions.reduce((sum, transaction) => {
    const monthKey = transaction.date?.slice(0, 7);
    if (!monthKey || !monthSet.has(monthKey)) return sum;
    return sum + Math.max(0, transaction.amount);
  }, 0);
}

export function getCurrentMonthKey() {
  return monthKeyFromDate(new Date());
}

export function formatInsightMoney(value: number, currencyCode = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

export function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value)}%`;
}

export function useCategorySpendInsights(
  compareMode: CategoryInsightCompareMode,
  selectedMonthKey = getCurrentMonthKey(),
) {
  const { minimalIconsEnabled } = useAddonPrefs();
  const categories = useAppSelector(selectActiveExpenseCategories);
  const categoryBudgets = useAppSelector(selectCategoryBudgets);
  const categoryIcons = useAppSelector(selectCategoryIcons);
  const categoryColors = useAppSelector(selectCategoryColors);
  const expenseTransactions = useAppSelector(selectExpenseTransactions);
  const incomeTransactions = useAppSelector(selectIncomeTransactions);

  const currentMonthKey = selectedMonthKey;
  const comparisonMonthKeys = React.useMemo(
    () => getComparisonMonthKeys(compareMode, currentMonthKey),
    [compareMode, currentMonthKey],
  );

  const rows = React.useMemo<CategoryInsightRow[]>(() => {
    const currentSpentByCategory = sumByCategory(expenseTransactions, [
      currentMonthKey,
    ]);
    const comparisonSpentByCategory = sumByCategory(
      expenseTransactions,
      comparisonMonthKeys,
    );
    const currentIncome = sumTransactionsInMonths(incomeTransactions, [
      currentMonthKey,
    ]);
    const comparisonIncome =
      sumTransactionsInMonths(incomeTransactions, comparisonMonthKeys) /
      comparisonMonthKeys.length;
    const totalCurrentSpent = sumTransactionsInMonths(expenseTransactions, [currentMonthKey]);

    return categories
      .map((category) => {
        const spent = currentSpentByCategory[category] ?? 0;
        const budget = Math.max(0, categoryBudgets[category] ?? 0);
        const comparisonSpent =
          (comparisonSpentByCategory[category] ?? 0) /
          comparisonMonthKeys.length;
        const incomeShare = currentIncome > 0 ? (spent / currentIncome) * 100 : 0;
        const spendingShare = totalCurrentSpent > 0 ? (spent / totalCurrentSpent) * 100 : 0;
        const budgetUsed = budget > 0 ? (spent / budget) * 100 : 0;
        const comparisonIncomeShare =
          comparisonIncome > 0 ? (comparisonSpent / comparisonIncome) * 100 : 0;
        const delta = spent - comparisonSpent;
        const deltaPercent =
          comparisonSpent > 0 ? (delta / comparisonSpent) * 100 : null;

        return {
          name: category,
          icon: getCategoryIconName(category, "expense", categoryIcons),
          color: getCategoryColor(category, "expense", categoryColors),
          income: currentIncome,
          spent,
          incomeShare,
          spendingShare,
          budget,
          budgetUsed,
          budgetLeft: budget > 0 ? budget - spent : 0,
          comparisonSpent,
          comparisonIncome,
          comparisonIncomeShare,
          delta,
          deltaPercent,
        };
      })
      .filter(
        (row) => row.spent > 0 || row.budget > 0 || row.comparisonSpent > 0,
      )
      .sort((left, right) => {
        if (right.incomeShare !== left.incomeShare) {
          return right.incomeShare - left.incomeShare;
        }
        return right.spent - left.spent;
      });
  }, [
    categories,
    categoryBudgets,
    categoryColors,
    categoryIcons,
    comparisonMonthKeys,
    currentMonthKey,
    expenseTransactions,
    incomeTransactions,
  ]);

  return {
    rows,
    currentMonthKey,
    comparisonMonthKeys,
    minimalIconsEnabled,
    overallBudget: rows.reduce((sum, row) => sum + row.budget, 0),
    totalIncome: rows[0]?.income ?? 0,
  };
}

export function useIncomeAccountSpendInsights(
  compareMode: CategoryInsightCompareMode,
  selectedMonthKey = getCurrentMonthKey(),
) {
  const { minimalIconsEnabled } = useAddonPrefs();
  const accounts = useAppSelector(selectActiveAccounts);
  const accountIcons = useAppSelector(selectAccountIcons);
  const accountColors = useAppSelector(selectAccountColors);
  const overallBudget = useAppSelector(selectOverallBudget);
  const expenseTransactions = useAppSelector(selectExpenseTransactions);
  const incomeTransactions = useAppSelector(selectIncomeTransactions);

  const currentMonthKey = selectedMonthKey;
  const comparisonMonthKeys = React.useMemo(
    () => getComparisonMonthKeys(compareMode, currentMonthKey),
    [compareMode, currentMonthKey],
  );

  const rows = React.useMemo<CategoryInsightRow[]>(() => {
    const currentSpentByAccount = sumByAccount(expenseTransactions, [
      currentMonthKey,
    ]);
    const currentIncomeByAccount = sumByAccount(incomeTransactions, [
      currentMonthKey,
    ]);
    const comparisonSpentByAccount = sumByAccount(
      expenseTransactions,
      comparisonMonthKeys,
    );
    const comparisonIncomeByAccount = sumByAccount(
      incomeTransactions,
      comparisonMonthKeys,
    );

    return accounts
      .map((account) => {
        const income = currentIncomeByAccount[account] ?? 0;
        const spent = currentSpentByAccount[account] ?? 0;
        const budget = Math.max(0, overallBudget);
        const comparisonSpent =
          (comparisonSpentByAccount[account] ?? 0) / comparisonMonthKeys.length;
        const comparisonIncome =
          (comparisonIncomeByAccount[account] ?? 0) /
          comparisonMonthKeys.length;
        const incomeShare = income > 0 ? (spent / income) * 100 : 0;
        const spendingShare = 0;
        const budgetUsed = budget > 0 ? (spent / budget) * 100 : 0;
        const comparisonIncomeShare =
          comparisonIncome > 0 ? (comparisonSpent / comparisonIncome) * 100 : 0;
        const delta = spent - comparisonSpent;
        const deltaPercent =
          comparisonSpent > 0 ? (delta / comparisonSpent) * 100 : null;

        return {
          name: account,
          icon: getAccountIconName(account, accountIcons),
          color: getAccountColor(account, accountColors),
          income,
          spent,
          incomeShare,
          spendingShare,
          budget,
          budgetUsed,
          budgetLeft: budget > 0 ? budget - spent : 0,
          comparisonSpent,
          comparisonIncome,
          comparisonIncomeShare,
          delta,
          deltaPercent,
        };
      })
      .filter(
        (row) => row.income > 0 || row.spent > 0 || row.comparisonSpent > 0,
      )
      .sort((left, right) => {
        if (right.incomeShare !== left.incomeShare) {
          return right.incomeShare - left.incomeShare;
        }
        return right.spent - left.spent;
      });
  }, [
    accountColors,
    accountIcons,
    accounts,
    comparisonMonthKeys,
    currentMonthKey,
    expenseTransactions,
    incomeTransactions,
    overallBudget,
  ]);

  return {
    rows,
    currentMonthKey,
    comparisonMonthKeys,
    minimalIconsEnabled,
    overallBudget,
    totalIncome: rows.reduce((sum, row) => sum + row.income, 0),
  };
}

export function useHeroBalanceSummary(selectedMonthKey = getCurrentMonthKey()): HeroBalanceSummary {
  const { getWorkspaceDefaults } = useWorkspaceDefaults();
  const activeWorkspaceId = useAppSelector(selectActiveWorkspaceId);
  const overallBudget = useAppSelector(selectOverallBudget);
  const expenseTransactions = useAppSelector(selectExpenseTransactions);
  const incomeTransactions = useAppSelector(selectIncomeTransactions);
  const currentMonthKey = selectedMonthKey;
  const workspaceDefaults = getWorkspaceDefaults(
    activeWorkspaceId ?? "personal",
  );
  const budgetSafeBelowPercent = Math.max(
    0,
    Math.min(100, Math.round(workspaceDefaults.budgetSafeBelowPercent)),
  );
  const budgetNearlyEmptyFromPercent = Math.max(
    0,
    Math.min(100, Math.round(workspaceDefaults.budgetNearlyEmptyFromPercent)),
  );

  return React.useMemo(() => {
    const income = sumTransactionsInMonths(incomeTransactions, [
      currentMonthKey,
    ]);
    const spent = sumTransactionsInMonths(expenseTransactions, [
      currentMonthKey,
    ]);
    const net = income - spent;
    const budget = Math.max(0, overallBudget);
    const budgetLeft = budget > 0 ? budget - spent : 0;
    const budgetUsed = budget > 0 ? (spent / budget) * 100 : 0;

    return {
      currentMonthKey,
      income,
      spent,
      net,
      budget,
      budgetLeft,
      budgetUsed,
      budgetSafeBelowPercent,
      budgetNearlyEmptyFromPercent,
    };
  }, [
    budgetNearlyEmptyFromPercent,
    budgetSafeBelowPercent,
    currentMonthKey,
    expenseTransactions,
    incomeTransactions,
    overallBudget,
  ]);
}

export function useCategoryTrendInsights(selectedMonthKey = getCurrentMonthKey()) {
  const { minimalIconsEnabled } = useAddonPrefs();
  const categories = useAppSelector(selectActiveExpenseCategories);
  const categoryIcons = useAppSelector(selectCategoryIcons);
  const categoryColors = useAppSelector(selectCategoryColors);
  const expenseTransactions = useAppSelector(selectExpenseTransactions);
  const monthKeys = React.useMemo(
    () => getRecentMonthKeys(6, selectedMonthKey),
    [selectedMonthKey],
  );

  const rows = React.useMemo<CategoryTrendRow[]>(() => {
    const byCategoryMonth = expenseTransactions.reduce<
      Record<string, Record<string, number>>
    >((acc, transaction) => {
      const monthKey = transaction.date?.slice(0, 7);
      if (!monthKey || !monthKeys.includes(monthKey)) return acc;
      acc[transaction.category] ??= {};
      acc[transaction.category][monthKey] =
        (acc[transaction.category][monthKey] ?? 0) +
        Math.max(0, transaction.amount);
      return acc;
    }, {});

    return categories
      .map((category) => {
        const values = monthKeys.map(
          (monthKey) => byCategoryMonth[category]?.[monthKey] ?? 0,
        );
        const latest = values[values.length - 1] ?? 0;
        const previous = values[values.length - 2] ?? 0;
        const delta = latest - previous;
        const deltaPercent = previous > 0 ? (delta / previous) * 100 : null;

        return {
          name: category,
          icon: getCategoryIconName(category, "expense", categoryIcons),
          color: getCategoryColor(category, "expense", categoryColors),
          values,
          latest,
          previous,
          delta,
          deltaPercent,
          total: values.reduce((sum, value) => sum + value, 0),
        };
      })
      .filter((row) => row.total > 0)
      .sort((left, right) => {
        if (right.latest !== left.latest) return right.latest - left.latest;
        return right.total - left.total;
      });
  }, [
    categories,
    categoryColors,
    categoryIcons,
    expenseTransactions,
    monthKeys,
  ]);

  return {
    rows,
    monthKeys,
    monthLabels: monthKeys.map(formatShortMonth),
    minimalIconsEnabled,
  };
}
