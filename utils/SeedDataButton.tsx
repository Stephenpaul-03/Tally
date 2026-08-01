import { ActionRow } from "@/components/ActionRow";
import { toast } from "@/components/toast/ToastProvider";
import {
  addTransactionAsync,
  selectActiveAccounts,
  selectActiveExpenseCategories,
  selectActiveIncomeCategories,
  updateCategoryBudgetAsync,
  updateOverallBudgetAsync,
} from "@/modules/Core/Slices/TransactionSlice";
import { AppDispatch, RootState } from "@/modules/Core/Store";
import type { TransactionFormData, TransactionType } from "@/utils/Types";
import React, { useState } from "react";
import type { MD3Theme } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { SeedConfigModal, type SeedScenario } from "./SeedConfigModal";

const EXPENSE_TEMPLATES = [
  { category: "Food & Dining", title: "Groceries", weight: 0.24 },
  { category: "Bills & Utilities", title: "Utilities", weight: 0.22 },
  { category: "Transportation", title: "Commute", weight: 0.12 },
  { category: "Shopping", title: "Shopping", weight: 0.18 },
  { category: "Entertainment", title: "Entertainment", weight: 0.08 },
  { category: "Healthcare", title: "Pharmacy", weight: 0.06 },
  { category: "Travel", title: "Travel", weight: 0.1 },
];

function currentMonthDate(day: number) {
  const now = new Date();
  const safeDay = Math.min(
    day,
    new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
  );
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
}

function pickCategory(
  preferred: string,
  categories: string[],
  fallbackIndex = 0,
) {
  return categories.includes(preferred)
    ? preferred
    : categories[fallbackIndex % Math.max(categories.length, 1)] || preferred;
}

function makeTransaction(
  type: TransactionType,
  amount: number,
  title: string,
  category: string,
  account: string,
  day: number,
): TransactionFormData {
  return {
    title,
    date: currentMonthDate(day),
    amount,
    type,
    category,
    account,
  };
}

function buildExpenseTransactions(
  targetTotal: number,
  expenseCategories: string[],
  account: string,
) {
  return EXPENSE_TEMPLATES.map((template, index) => {
    const category = pickCategory(template.category, expenseCategories, index);
    const amount = Math.round(targetTotal * template.weight);
    return makeTransaction(
      "expense",
      amount,
      template.title,
      category,
      account,
      3 + index * 3,
    );
  });
}

function incomeAmountForScenario(id: SeedScenario["id"]) {
  return id === "split-income" ||
    id === "expenses-under-income" ||
    id === "expenses-over-income";
}

function splitAmount(total: number, count: number) {
  if (count <= 0) return [];

  const cents = Math.round(total * 100);
  const base = Math.floor(cents / count);
  const remainder = cents - base * count;

  return Array.from({ length: count }, (_, index) =>
    (base + (index < remainder ? 1 : 0)) / 100,
  );
}

export function SeedDataButton({ theme }: { theme: MD3Theme }) {
  const dispatch = useDispatch<AppDispatch>();
  const [modalOpen, setModalOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const incomeCategories = useSelector((s: RootState) =>
    selectActiveIncomeCategories(s),
  );
  const expenseCategories = useSelector((s: RootState) =>
    selectActiveExpenseCategories(s),
  );
  const accounts = useSelector((s: RootState) => selectActiveAccounts(s));

  const seedBudgets = async (amount: number) => {
    await dispatch(updateOverallBudgetAsync(amount)).unwrap();
    const activeExpenseCategories = expenseCategories;
    if (!activeExpenseCategories.length) {
      throw new Error("Add at least one expense category before seeding budgets.");
    }

    const budgetAmounts = splitAmount(amount, activeExpenseCategories.length);
    for (const [index, category] of activeExpenseCategories.entries()) {
      await dispatch(
        updateCategoryBudgetAsync({
          categoryName: category,
          amount: budgetAmounts[index],
        }),
      ).unwrap();
    }
  };

  const seedExpenses = async (targetTotal: number) => {
    if (!expenseCategories.length) {
      throw new Error("Add at least one expense category before seeding expenses.");
    }

    const account = accounts[0] || "Card";
    const transactions = buildExpenseTransactions(
      targetTotal,
      expenseCategories,
      account,
    );

    for (const transaction of transactions) {
      await dispatch(addTransactionAsync(transaction)).unwrap();
    }
  };

  const seedIncome = async (amount: number) => {
    if (!incomeCategories.length) {
      throw new Error("Add at least one income category before seeding income.");
    }

    const activeAccounts = accounts.length ? accounts : ["Card"];
    const category = pickCategory("Salary", incomeCategories, 0);
    const amounts = splitAmount(amount, activeAccounts.length);

    for (const [index, account] of activeAccounts.entries()) {
      await dispatch(
        addTransactionAsync(
          makeTransaction(
            "income",
            amounts[index],
            `Seed income ${account}`,
            category,
            account,
            1 + index,
          ),
        ),
      ).unwrap();
    }
  };

  const handleConfirm = async (scenario: SeedScenario, amount: number) => {
    setModalOpen(false);
    setSeeding(true);

    try {
      if (scenario.id === "split-budgets") {
        await seedBudgets(amount);
      } else if (scenario.id === "expenses-under-budget") {
        await seedBudgets(amount);
        await seedExpenses(amount * 0.7);
      } else if (scenario.id === "expenses-over-budget") {
        await seedBudgets(amount);
        await seedExpenses(amount * 1.3);
      } else if (incomeAmountForScenario(scenario.id)) {
        await seedIncome(amount);

        if (scenario.id === "expenses-under-income") {
          await seedExpenses(amount * 0.7);
        } else if (scenario.id === "expenses-over-income") {
          await seedExpenses(amount * 1.3);
        }
      }

      toast.success(`${scenario.title} seeded`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Couldn't seed test data",
      );
    } finally {
      setSeeding(false);
    }
  };

  return (
    <>
      <ActionRow
        icon="database-plus-outline"
        label={seeding ? "Seeding..." : "Seed Test Data"}
        description="Generate simple budget, expense, or income presets"
        onPress={() => setModalOpen(true)}
        theme={theme}
      />
      <SeedConfigModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
}
