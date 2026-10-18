import type { ImportRow } from "@/modules/Core/import/validation";
import {
    Account,
    Transaction,
    TransactionFormData,
} from "../../../utils/Types";

export interface Category {
  id: number;
  name: string;
  type: "income" | "expense";
  icon?: string;
  color?: string;
}

export interface CategoryBudget {
  categoryId: number;
  category: string;
  amount: number;
}

export interface BudgetSettings {
  overallBudget: number;
  categoryBudgets: CategoryBudget[];
}

export interface FinanceRepository {
  // Transaction methods
  importReviewedTransactions(rows: ImportRow[]): Promise<number>;
  getTransactions(filters?: any): Promise<Transaction[]>;
  addTransaction(tx: TransactionFormData): Promise<Transaction>;
  updateTransaction(
    id: string,
    data: Partial<TransactionFormData>,
  ): Promise<Transaction>;
  softDeleteTransaction(id: string): Promise<void>;
  restoreTransaction(id: string): Promise<void>;
  permanentDeleteTransaction(id: string): Promise<void>;
  clearAllTransactions(): Promise<void>;
  clearTransactionsForDateRange(startDate: string, endDate: string): Promise<void>;

  setInsightsSampleData(enabled: boolean): Promise<number>;

  // Category methods
  getCategoryUsage(type: "income" | "expense"): Promise<{ name: string; count: number }[]>;
  deleteCategories(type: "income" | "expense", names: string[], destination?: string): Promise<void>;
  getCategories(type: "income" | "expense"): Promise<Category[]>;
  getCategoryByName(
    name: string,
    type: "income" | "expense",
  ): Promise<Category | null>;
  addCategory(
    name: string,
    type: "income" | "expense",
    icon?: string,
    color?: string,
  ): Promise<Category>;
  updateCategory(
    id: number,
    newName: string,
    icon?: string,
    color?: string,
  ): Promise<Category>;
  reassignCategoryTransactions(
    fromCategoryId: number,
    toCategoryId: number,
    type: "income" | "expense",
  ): Promise<void>;
  softDeleteCategory(id: number): Promise<void>;

  // Account methods
  getAccounts(): Promise<Account[]>;
  getAccountByName(name: string): Promise<Account | null>;
  addAccount(name: string, icon?: string, color?: string): Promise<Account>;
  updateAccount(
    id: number,
    newName: string,
    icon?: string,
    color?: string,
  ): Promise<Account>;
  reassignAccountTransactions(fromName: string, toName: string): Promise<void>;
  softDeleteAccount(id: number): Promise<void>;
  updateAccountOrder(names: string[]): Promise<void>;

  // Budget methods
  getBudget(): Promise<BudgetSettings>;
  upsertOverallBudget(amount: number): Promise<BudgetSettings>;
  upsertCategoryBudget(
    categoryName: string,
    amount: number,
  ): Promise<BudgetSettings>;
  upsertCategoryBudgets(
    entries: { categoryName: string; amount: number }[],
  ): Promise<BudgetSettings>;

  // Migration
  migrateFromRedux(data: any): Promise<void>;
  resetWorkspaceData(): Promise<void>;
  replaceWorkspaceSetup(data: {
    incomeCategories: { name: string; icon?: string; color?: string }[];
    expenseCategories: { name: string; icon?: string; color?: string }[];
    accounts: { name: string; icon?: string; color?: string }[];
    overallBudget?: number;
    categoryBudgets?: { categoryName: string; amount: number }[];
  }): Promise<void>;
}
