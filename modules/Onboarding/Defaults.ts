import {
  getAccountColor,
  getAccountIconName,
  getCategoryColor,
  getCategoryIconName,
} from "@/modules/Common/Utils/Helpers";
import type { TransactionType } from "@/modules/Common/Utils/Types";
import type { QuickStartSelection, StarterPill } from "./Types";

export const MIN_STARTER_SELECTION_COUNT = 3;

const INCOME_NAMES = [
  "Salary",
  "Freelance",
  "Business",
  "Investments",
  "Bonus",
  "Interest",
  "Rental Income",
  "Side Hustle",
  "Gifts",
  "Refunds",
  "Other Income",
] as const;

const EXPENSE_NAMES = [
  "Food & Dining",
  "Groceries",
  "Transportation",
  "Rent",
  "Bills & Utilities",
  "Shopping",
  "Entertainment",
  "Healthcare",
  "Education",
  "Travel",
  "Subscriptions",
  "Fitness",
  "Pets",
  "Other Expense",
] as const;

const ACCOUNT_NAMES = [
  "Cash",
  "Bank",
  "Card",
  "UPI",
  "Savings",
  "Wallet",
  "Credit Card",
  "Investments",
  "Other Account",
] as const;

function categoryPill(name: string, type: TransactionType): StarterPill {
  return {
    name,
    icon: getCategoryIconName(name, type),
    color: getCategoryColor(name, type),
    protected:
      (type === "income" && name === "Other Income") ||
      (type === "expense" && name === "Other Expense"),
  };
}

function accountPill(name: string): StarterPill {
  return {
    name,
    icon: getAccountIconName(name),
    color: getAccountColor(name),
    protected: name === "Other Account",
  };
}

export const STARTER_INCOME_CATEGORIES = INCOME_NAMES.map((name) =>
  categoryPill(name, "income"),
);

export const STARTER_EXPENSE_CATEGORIES = EXPENSE_NAMES.map((name) =>
  categoryPill(name, "expense"),
);

export const STARTER_ACCOUNTS = ACCOUNT_NAMES.map(accountPill);

function initialSelection(pills: StarterPill[]) {
  const protectedPills = pills.filter((pill) => pill.protected);
  const suggested = pills
    .filter((pill) => !pill.protected)
    .slice(0, MIN_STARTER_SELECTION_COUNT);

  return [...suggested, ...protectedPills];
}

export const DEFAULT_QUICK_START_SELECTION: QuickStartSelection = {
  income: initialSelection(STARTER_INCOME_CATEGORIES),
  expense: initialSelection(STARTER_EXPENSE_CATEGORIES),
  accounts: initialSelection(STARTER_ACCOUNTS),
};

export function hasValidQuickStartSelection(selection: QuickStartSelection) {
  return (
    selection.income.length >= MIN_STARTER_SELECTION_COUNT &&
    selection.expense.length >= MIN_STARTER_SELECTION_COUNT &&
    selection.accounts.length >= MIN_STARTER_SELECTION_COUNT
  );
}
