import { toast } from "@/components/toast/ToastProvider";
import { useAppDispatch, useAppSelector } from "@/hooks/Redux";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import {
  selectActiveExpenseCategories,
  selectBudgetSummary,
  selectCategoryBudgets,
  selectCategoryColors,
  selectCategoryIcons,
  selectExpenseTransactions,
  selectOverallBudget,
  updateCategoryBudgetAsync,
  updateOverallBudgetAsync,
} from "@/modules/Core/Slices/TransactionSlice";
import { getCategoryColor, getCategoryIconName } from "@/utils/Helpers";
import React from "react";

const parseAmount = (value: string) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

export function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

export function useBudgetManagement() {
  const dispatch = useAppDispatch();
  const { minimalIconsEnabled } = useAddonPrefs();
  const categories = useAppSelector(selectActiveExpenseCategories);
  const categoryIcons = useAppSelector(selectCategoryIcons);
  const categoryColors = useAppSelector(selectCategoryColors);
  const overallBudget = useAppSelector(selectOverallBudget);
  const categoryBudgets = useAppSelector(selectCategoryBudgets);
  const budgetSummary = useAppSelector(selectBudgetSummary);
  const expenseTransactions = useAppSelector(selectExpenseTransactions);

  const monthKey = new Date().toISOString().slice(0, 7);

  const categoryEntries = React.useMemo(() => {
    const today = new Date();
    const last30DaysStart = new Date(today);
    last30DaysStart.setDate(today.getDate() - 30);
    last30DaysStart.setHours(0, 0, 0, 0);

    const monthlySpent = expenseTransactions.reduce<Record<string, number>>(
      (acc, txn) => {
        if (!txn.date?.startsWith(monthKey)) return acc;
        acc[txn.category] = (acc[txn.category] ?? 0) + Math.max(0, txn.amount);
        return acc;
      },
      {},
    );
    const last30DaysSpent = expenseTransactions.reduce<Record<string, number>>(
      (acc, txn) => {
        if (!txn.date) return acc;
        const txnDate = new Date(`${txn.date}T00:00:00`);
        if (Number.isNaN(txnDate.getTime()) || txnDate < last30DaysStart) {
          return acc;
        }
        acc[txn.category] = (acc[txn.category] ?? 0) + Math.max(0, txn.amount);
        return acc;
      },
      {},
    );

    return categories.map((category) => {
      const budget = categoryBudgets[category] ?? 0;
      return {
        name: category,
        budget,
        spent: monthlySpent[category] ?? 0,
        last30DaysSpent: last30DaysSpent[category] ?? 0,
        icon: getCategoryIconName(category, "expense", categoryIcons),
        color: getCategoryColor(category, "expense", categoryColors),
      };
    });
  }, [categories, categoryBudgets, categoryColors, categoryIcons, expenseTransactions, monthKey]);

  const saveOverall = React.useCallback(
    async (value: string) => {
      const amount = parseAmount(value);
      try {
        await dispatch(updateOverallBudgetAsync(amount)).unwrap();
      } catch (error) {
        console.error("Couldn't save budget:", error);
        toast.error("Couldn't save budget");
      }
    },
    [dispatch],
  );

  const saveCategory = React.useCallback(
    async (categoryName: string, value: string) => {
      const amount = parseAmount(value);
      try {
        await dispatch(
          updateCategoryBudgetAsync({ categoryName, amount }),
        ).unwrap();
      } catch (error) {
        console.error("Couldn't save category budget:", error);
        toast.error("Couldn't save category budget");
      }
    },
    [dispatch],
  );

  const clearCategory = React.useCallback(
    async (categoryName: string) => {
      try {
        await dispatch(
          updateCategoryBudgetAsync({ categoryName, amount: 0 }),
        ).unwrap();
      } catch (error) {
        console.error("Couldn't clear category budget:", error);
        toast.error("Couldn't clear category budget");
      }
    },
    [dispatch],
  );

  return {
    categories,
    minimalIconsEnabled,
    categoryIcons,
    categoryColors,
    overallBudget,
    categoryBudgets,
    budgetSummary,
    categoryEntries,
    saveOverall,
    saveCategory,
    clearCategory,
  };
}
