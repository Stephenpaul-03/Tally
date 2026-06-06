import { Account, Transaction, TransactionFormData } from "../Utils/Types";

export interface Category {
  id: number;
  name: string;
  type: "income" | "expense";
  icon?: string;
  color?: string;
}

export interface FinanceRepository {
  // Transaction methods
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

  // Category methods
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

  // Migration
  migrateFromRedux(data: any): Promise<void>;
}
