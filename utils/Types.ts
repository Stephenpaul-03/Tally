/**
 * Transaction Types
 * Spreadsheet-friendly data structure for financial transactions
 *
 * Designed to map 1:1 to spreadsheet columns for future Google Sheets / Excel migration
 */

// ============================================================================
// Core Types
// ============================================================================

export type TransactionType = "income" | "expense";
export type PaymentMethod = string;
export type ModalMode = "add" | "view" | "edit";
export type TransactionDatePreset =
  | "all"
  | "today"
  | "week"
  | "month"
  | "lastmonth"
  | "last3months"
  | "custom";

// ============================================================================
// Transaction Model (Spreadsheet-compatible)
// ============================================================================

export interface Transaction {
  // Core identification
  id: string;

  // Transaction details
  title: string; // User-friendly title/name
  date: string; // ISO 8601 date string (YYYY-MM-DD)
  amount: number; // Can be positive or negative
  type: TransactionType; // 'income' | 'expense'
  category: string; // User-defined categories
  account: PaymentMethod; // User-managed account name, e.g. 'Card'
  currencyCode?: string;
  currencySymbol?: string;
  currencyName?: string;

  // Optional fields
  notes?: string; // Additional notes
  tags?: string[]; // Array of tags for organization

  // Metadata
  createdBy: string; // Workspace member who created it
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp

  // Soft delete support
  deleted: boolean; // For soft delete - deleted items don't show in main list
}

export interface TransactionDraft extends TransactionFormData {
  id: string;
  amountInput: string;
  isDraft: true;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Form Data Types
// ============================================================================

export interface TransactionFormData {
  title: string;
  date: string;
  amount: number;
  type: TransactionType;
  category: string;
  account: PaymentMethod;
  currencyCode?: string;
  currencySymbol?: string;
  currencyName?: string;
  notes?: string;
  tags?: string[];
}

// ============================================================================
// Filter Types
// ============================================================================

export interface TransactionFilters {
  date?: {
    start?: string;
    end?: string;
  };
  datePreset?: TransactionDatePreset;
  category?: string | "all";
  account?: PaymentMethod | "all";
  tags?: string[];
  search?: string;
}

// ============================================================================
// Category Types
// ============================================================================

export interface Category {
  id: string;
  name: string;
  type: TransactionType; // Separate category sets for income and expense
  icon?: string;
  color?: string;
  createdAt: string;
}

export interface Account {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  createdAt: string;
}

export interface BudgetStateData {
  overallBudget: number;
  categoryBudgets: Record<string, number>;
}

// ============================================================================
// State Types
// ============================================================================

export interface TransactionState {
  // Transactions
  transactions: Transaction[];
  transactionDrafts: TransactionDraft[];
  activeTransactionDraftId: string | null;

  // Categories
  incomeCategories: string[];
  expenseCategories: string[];
  deletedIncomeCategories: string[];
  deletedExpenseCategories: string[];
  categoryIcons: Record<string, string>;
  categoryColors: Record<string, string>;
  accounts: string[];
  deletedAccounts: string[];
  accountIcons: Record<string, string>;
  accountColors: Record<string, string>;

  // Budget
  overallBudget: number;
  categoryBudgets: Record<string, number>;

  // Filters
  filters: TransactionFilters;

  // Modal state
  modalMode: ModalMode;
  editingTransactionId: string | null;
  isModalOpen: boolean;
  modalInitialDate: string | null;
  modalDefaultType: TransactionType;

  // Quick tools
  isCategoryModalOpen: boolean;
  categoryModalType: TransactionType | null;

  // Loading state
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// Default Categories
// ============================================================================

export const DEFAULT_INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Investments",
  "Gifts",
  "Refunds",
  "Other Income",
] as const;

export const DEFAULT_EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "Healthcare",
  "Education",
  "Travel",
  "Other Expense",
] as const;

export const DEFAULT_ACCOUNTS = ["Card", "Cash", "UPI"] as const;

// ============================================================================
// Spreadsheet Mapping Notes
// ============================================================================
//
// The Transaction structure is designed to map 1:1 to spreadsheet columns:
//
// | id | date | amount | type | category | account | notes | tags | createdBy | createdAt | updatedAt | deleted |
//
// All fields are flat (no nested objects) for easy CSV/Excel export.
// Date fields use ISO 8601 format for consistent parsing.
// tags is a comma-separated string when exported to spreadsheet.
//
