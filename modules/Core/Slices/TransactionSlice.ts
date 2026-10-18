import { sortCategories } from "@/utils/category-order";
/**
 * Transaction Redux Slice
 * State management for financial transactions
 */

import {
    createAsyncThunk,
    createSelector,
    createSlice,
    PayloadAction,
} from "@reduxjs/toolkit";
import {
    createTransaction,
    getCategoryIconKey,
    getLastTransaction,
} from "../../../utils/Helpers";
import {
    normalizeAccount,
    normalizeDate,
    normalizeType,
} from "../../../utils/Normalizers";
import {
    DEFAULT_ACCOUNTS,
    DEFAULT_EXPENSE_CATEGORIES,
    DEFAULT_INCOME_CATEGORIES,
    Transaction,
    TransactionDraft,
    TransactionFilters,
    TransactionFormData,
    TransactionState,
    TransactionType,
} from "../../../utils/Types";
import { financeRepository, switchWorkspace } from "../Repository/Index";
import type { RootState } from "../Store";
import { SQLiteFinanceRepository } from "../Repository/SQLiteRepo";

// Storage key for persistence
export const transactionStorageKey = "transactions";

// Initial state
const initialFilters: TransactionFilters = {
  category: "all",
  account: "all",
  search: "",
  date: undefined,
  tags: undefined,
};

// Initialize with empty transactions - no mock data
const initialState: TransactionState = {
  transactions: [],
  transactionDrafts: [],
  activeTransactionDraftId: null,
  incomeCategories: [...DEFAULT_INCOME_CATEGORIES],
  expenseCategories: [...DEFAULT_EXPENSE_CATEGORIES],
  deletedIncomeCategories: [],
  deletedExpenseCategories: [],
  categoryIcons: {},
  categoryColors: {},
  accounts: [...DEFAULT_ACCOUNTS],
  deletedAccounts: [],
  accountIcons: {},
  accountColors: {},
  overallBudget: 0,
  categoryBudgets: {},
  filters: initialFilters,
  modalMode: "add",
  editingTransactionId: null,
  isModalOpen: false,
  modalInitialDate: null,
  modalDefaultType: "expense",
  isCategoryModalOpen: false,
  categoryModalType: null,
  isLoading: false,
  error: null,
};

type OpenAddModalPayload = {
  type: TransactionType;
  date?: string | null;
};

type UpsertTransactionDraftPayload = {
  id?: string | null;
  data: TransactionFormData;
  amountInput: string;
};

function createDraftId() {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

type AddCategoryPayload =
  | string
  | { name: string; icon?: string; color?: string };
type AddAccountPayload =
  | string
  | { name: string; icon?: string; color?: string };

function normalizeCategoryPayload(payload: AddCategoryPayload) {
  if (typeof payload === "string") {
    return { name: payload.trim(), icon: undefined, color: undefined };
  }

  return {
    name: payload.name.trim(),
    icon: payload.icon?.trim() || undefined,
    color: payload.color?.trim() || undefined,
  };
}

function normalizeAccountPayload(payload: AddAccountPayload) {
  if (typeof payload === "string") {
    return { name: payload.trim(), icon: undefined, color: undefined };
  }

  return {
    name: payload.name.trim(),
    icon: payload.icon?.trim() || undefined,
    color: payload.color?.trim() || undefined,
  };
}

const transactionSlice = createSlice({
  name: "transactions",
  initialState,
  reducers: {
    // Modal actions
    openAddModal: (state, action: PayloadAction<OpenAddModalPayload>) => {
      state.modalMode = "add";
      state.editingTransactionId = null;
      state.isModalOpen = true;
      state.modalInitialDate = action.payload.date ?? null;
      state.modalDefaultType = action.payload.type;
      state.activeTransactionDraftId = createDraftId();
    },
    openDraftModal: (state, action: PayloadAction<string>) => {
      const draft = (state.transactionDrafts || []).find(
        (item) => item.id === action.payload,
      );
      if (!draft) return;
      state.modalMode = "add";
      state.editingTransactionId = null;
      state.isModalOpen = true;
      state.modalInitialDate = draft.date;
      state.modalDefaultType = draft.type;
      state.activeTransactionDraftId = draft.id;
    },
    openEditModal: (state, action: PayloadAction<string>) => {
      state.modalMode = "edit";
      state.editingTransactionId = action.payload;
      state.isModalOpen = true;
      state.modalInitialDate = null;
      state.activeTransactionDraftId = null;
    },
    openViewModal: (state, action: PayloadAction<string>) => {
      state.modalMode = "view";
      state.editingTransactionId = action.payload;
      state.isModalOpen = true;
      state.modalInitialDate = null;
      state.activeTransactionDraftId = null;
    },
    closeModal: (state) => {
      state.isModalOpen = false;
      state.editingTransactionId = null;
      state.modalInitialDate = null;
      state.activeTransactionDraftId = null;
    },

    upsertTransactionDraft: (
      state,
      action: PayloadAction<UpsertTransactionDraftPayload>,
    ) => {
      const now = new Date().toISOString();
      const id =
        action.payload.id ?? state.activeTransactionDraftId ?? createDraftId();
      const draft: TransactionDraft = {
        ...action.payload.data,
        id,
        amount: Math.abs(action.payload.data.amount || 0),
        amountInput: action.payload.amountInput,
        title: action.payload.data.title,
        notes: action.payload.data.notes,
        isDraft: true,
        createdAt: now,
        updatedAt: now,
      };
      state.transactionDrafts ??= [];
      const index = state.transactionDrafts.findIndex((item) => item.id === id);
      if (index === -1) {
        state.transactionDrafts.unshift(draft);
      } else {
        state.transactionDrafts[index] = {
          ...state.transactionDrafts[index],
          ...draft,
          createdAt: state.transactionDrafts[index].createdAt,
          updatedAt: now,
        };
      }
      state.activeTransactionDraftId = id;
    },

    removeTransactionDraft: (state, action: PayloadAction<string | null>) => {
      const id = action.payload ?? state.activeTransactionDraftId;
      if (!id) return;
      state.transactionDrafts ??= [];
      state.transactionDrafts = state.transactionDrafts.filter(
        (item) => item.id !== id,
      );
      if (state.activeTransactionDraftId === id) {
        state.activeTransactionDraftId = null;
      }
    },

    // Category modal actions
    openCategoryModal: (state, action: PayloadAction<TransactionType>) => {
      state.categoryModalType = action.payload;
      state.isCategoryModalOpen = true;
    },
    closeCategoryModal: (state) => {
      state.isCategoryModalOpen = false;
      state.categoryModalType = null;
    },

    // CRUD operations
    addTransaction: (state, action: PayloadAction<TransactionFormData>) => {
      // Optimistic update - actual DB write happens via async thunk
      const amount = Math.abs(action.payload.amount);
      const newTransaction = createTransaction({
        ...action.payload,
        title: action.payload.title?.trim() || action.payload.category,
        amount,
        createdBy: "Current User",
        deleted: false,
      });
      state.transactions.push(newTransaction);
    },

    updateTransaction: (
      state,
      action: PayloadAction<{ id: string; data: Partial<TransactionFormData> }>,
    ) => {
      const { id, data } = action.payload;
      const index = state.transactions.findIndex((t) => t.id === id);
      if (index !== -1) {
        const existingTransaction = state.transactions[index];
        const nextData: Partial<TransactionFormData> = {
          ...data,
          amount:
            typeof data.amount === "number"
              ? Math.abs(data.amount)
              : data.amount,
        };
        state.transactions[index] = {
          ...existingTransaction,
          ...nextData,
          updatedAt: new Date().toISOString(),
        };
      }
    },

    // Soft delete
    softDeleteTransaction: (state, action: PayloadAction<string>) => {
      const transaction = state.transactions.find(
        (t) => t.id === action.payload,
      );
      if (transaction) {
        transaction.deleted = true;
        transaction.updatedAt = new Date().toISOString();
      }
    },

    // Restore soft-deleted transaction
    restoreTransaction: (state, action: PayloadAction<string>) => {
      const transaction = state.transactions.find(
        (t) => t.id === action.payload,
      );
      if (transaction) {
        transaction.deleted = false;
        transaction.updatedAt = new Date().toISOString();
      }
    },

    // Permanent delete (use with caution)
    permanentDeleteTransaction: (state, action: PayloadAction<string>) => {
      state.transactions = state.transactions.filter(
        (t) => t.id !== action.payload,
      );
    },

    // Filter actions
    setFilters: (state, action: PayloadAction<Partial<TransactionFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialFilters;
    },

    // Category management
    addIncomeCategory: (state, action: PayloadAction<AddCategoryPayload>) => {
      const { name, icon, color } = normalizeCategoryPayload(action.payload);
      if (!name) return;

      if (!state.incomeCategories.includes(name)) {
        state.incomeCategories.push(name);
      }

      if (!state.deletedIncomeCategories.includes(name)) {
        state.deletedIncomeCategories = state.deletedIncomeCategories.filter(
          (n) => n !== name,
        );
      }

      if (icon) {
        state.categoryIcons[getCategoryIconKey("income", name)] = icon;
      }
      if (color) {
        state.categoryColors[getCategoryIconKey("income", name)] = color;
      }
    },

    updateIncomeCategory: (
      state,
      action: PayloadAction<{
        oldName: string;
        newName: string;
        icon?: string;
        color?: string;
      }>,
    ) => {
      const { oldName, newName, icon, color } = action.payload;

      const index = state.incomeCategories.indexOf(oldName);
      if (index !== -1) {
        state.incomeCategories[index] = newName;
      }

      // Re-assign existing transactions to the new category name.
      if (oldName !== newName) {
        state.transactions.forEach((t) => {
          if (t.type !== "income") return;
          if (t.category !== oldName) return;
          t.category = newName;
          t.updatedAt = new Date().toISOString();
        });
      }

      if (icon !== undefined) {
        const key = getCategoryIconKey("income", newName);
        state.categoryIcons[key] = icon;

        const oldKey = getCategoryIconKey("income", oldName);
        if (oldKey !== key) {
          delete state.categoryIcons[oldKey];
        }
      }
      if (color !== undefined) {
        const key = getCategoryIconKey("income", newName);
        state.categoryColors[key] = color;

        const oldKey = getCategoryIconKey("income", oldName);
        if (oldKey !== key) {
          delete state.categoryColors[oldKey];
        }
      }

      // Ensure renamed category is active.
      state.deletedIncomeCategories = state.deletedIncomeCategories.filter(
        (n) => n !== oldName && n !== newName,
      );
    },

    softRemoveIncomeCategory: (state, action: PayloadAction<string>) => {
      const name = action.payload;
      if (
        !state.deletedIncomeCategories.includes(name) &&
        state.incomeCategories.includes(name)
      ) {
        state.deletedIncomeCategories.push(name);
      }
    },

    addExpenseCategory: (state, action: PayloadAction<AddCategoryPayload>) => {
      const { name, icon, color } = normalizeCategoryPayload(action.payload);
      if (!name) return;

      if (!state.expenseCategories.includes(name)) {
        state.expenseCategories.push(name);
      }

      if (!state.deletedExpenseCategories.includes(name)) {
        state.deletedExpenseCategories = state.deletedExpenseCategories.filter(
          (n) => n !== name,
        );
      }

      if (icon) {
        state.categoryIcons[getCategoryIconKey("expense", name)] = icon;
      }
      if (color) {
        state.categoryColors[getCategoryIconKey("expense", name)] = color;
      }
    },

    updateExpenseCategory: (
      state,
      action: PayloadAction<{
        oldName: string;
        newName: string;
        icon?: string;
        color?: string;
      }>,
    ) => {
      const { oldName, newName, icon, color } = action.payload;

      const index = state.expenseCategories.indexOf(oldName);
      if (index !== -1) {
        state.expenseCategories[index] = newName;
      }

      // Re-assign existing transactions to the new category name.
      if (oldName !== newName) {
        state.transactions.forEach((t) => {
          if (t.type !== "expense") return;
          if (t.category !== oldName) return;
          t.category = newName;
          t.updatedAt = new Date().toISOString();
        });
        if (state.categoryBudgets[oldName] !== undefined) {
          state.categoryBudgets[newName] = state.categoryBudgets[oldName];
          delete state.categoryBudgets[oldName];
        }
      }

      if (icon !== undefined) {
        const key = getCategoryIconKey("expense", newName);
        state.categoryIcons[key] = icon;

        const oldKey = getCategoryIconKey("expense", oldName);
        if (oldKey !== key) {
          delete state.categoryIcons[oldKey];
        }
      }
      if (color !== undefined) {
        const key = getCategoryIconKey("expense", newName);
        state.categoryColors[key] = color;

        const oldKey = getCategoryIconKey("expense", oldName);
        if (oldKey !== key) {
          delete state.categoryColors[oldKey];
        }
      }

      // Ensure renamed category is active.
      state.deletedExpenseCategories = state.deletedExpenseCategories.filter(
        (n) => n !== oldName && n !== newName,
      );
    },

    softRemoveExpenseCategory: (state, action: PayloadAction<string>) => {
      const name = action.payload;
      if (
        !state.deletedExpenseCategories.includes(name) &&
        state.expenseCategories.includes(name)
      ) {
        state.deletedExpenseCategories.push(name);
      }
      delete state.categoryBudgets[name];
    },

    removeCategoryAndReassign: (
      state,
      action: PayloadAction<{
        type: TransactionType;
        name: string;
        fallback: string;
      }>,
    ) => {
      const { type, name, fallback } = action.payload;
      if (!name || !fallback || name === fallback) return;

      const categories =
        type === "income" ? state.incomeCategories : state.expenseCategories;
      const deleted =
        type === "income"
          ? state.deletedIncomeCategories
          : state.deletedExpenseCategories;

      if (!categories.includes(fallback)) {
        categories.push(fallback);
      }

      // Ensure fallback is active (not soft-deleted).
      if (deleted.includes(fallback)) {
        const next = deleted.filter((n) => n !== fallback);
        if (type === "income") state.deletedIncomeCategories = next;
        else state.deletedExpenseCategories = next;
      }

      // Reassign existing transactions (including soft-deleted ones, so restores stay consistent).
      state.transactions.forEach((t) => {
        if (t.type !== type) return;
        if (t.category !== name) return;
        t.category = fallback;
        t.updatedAt = new Date().toISOString();
      });

      // Soft-remove the category.
      if (type === "income") {
        if (
          !state.deletedIncomeCategories.includes(name) &&
          state.incomeCategories.includes(name)
        ) {
          state.deletedIncomeCategories.push(name);
        }
      } else {
        if (
          !state.deletedExpenseCategories.includes(name) &&
          state.expenseCategories.includes(name)
        ) {
          state.deletedExpenseCategories.push(name);
        }
        delete state.categoryBudgets[name];
      }

      // Clean up icon override for this category.
      const key = getCategoryIconKey(type, name);
      delete state.categoryIcons[key];
      delete state.categoryColors[key];
    },

    addAccount: (state, action: PayloadAction<AddAccountPayload>) => {
      const { name, icon, color } = normalizeAccountPayload(action.payload);
      if (!name) return;

      if (!state.accounts.includes(name)) {
        state.accounts.push(name);
      }

      state.deletedAccounts = state.deletedAccounts.filter((n) => n !== name);

      const key = name.trim().toLowerCase();
      if (icon) state.accountIcons[key] = icon;
      if (color) state.accountColors[key] = color;
    },

    updateAccount: (
      state,
      action: PayloadAction<{
        oldName: string;
        newName: string;
        icon?: string;
        color?: string;
      }>,
    ) => {
      const { oldName, newName, icon, color } = action.payload;

      const index = state.accounts.indexOf(oldName);
      if (index !== -1) {
        state.accounts[index] = newName;
      }

      if (oldName !== newName) {
        state.transactions.forEach((t) => {
          if (t.account !== oldName) return;
          t.account = newName;
          t.updatedAt = new Date().toISOString();
        });
      }

      const newKey = newName.trim().toLowerCase();
      const oldKey = oldName.trim().toLowerCase();
      if (icon !== undefined) {
        state.accountIcons[newKey] = icon;
        if (oldKey !== newKey) delete state.accountIcons[oldKey];
      }
      if (color !== undefined) {
        state.accountColors[newKey] = color;
        if (oldKey !== newKey) delete state.accountColors[oldKey];
      }

      state.deletedAccounts = state.deletedAccounts.filter(
        (n) => n !== oldName && n !== newName,
      );
    },

    softRemoveAccount: (state, action: PayloadAction<string>) => {
      const name = action.payload;
      if (
        !state.deletedAccounts.includes(name) &&
        state.accounts.includes(name)
      ) {
        state.deletedAccounts.push(name);
      }
    },

    removeAccountAndReassign: (
      state,
      action: PayloadAction<{
        name: string;
        fallback: string;
      }>,
    ) => {
      const { name, fallback } = action.payload;
      if (!name || !fallback || name === fallback) return;

      if (!state.accounts.includes(fallback)) {
        state.accounts.push(fallback);
      }

      if (state.deletedAccounts.includes(fallback)) {
        state.deletedAccounts = state.deletedAccounts.filter(
          (item) => item !== fallback,
        );
      }

      state.transactions.forEach((t) => {
        if (t.account !== name) return;
        t.account = fallback;
        t.updatedAt = new Date().toISOString();
      });

      if (
        !state.deletedAccounts.includes(name) &&
        state.accounts.includes(name)
      ) {
        state.deletedAccounts.push(name);
      }

      const key = name.trim().toLowerCase();
      delete state.accountIcons[key];
      delete state.accountColors[key];
    },

    reorderAccounts: (state, action: PayloadAction<string[]>) => {
      state.accounts = action.payload;
    },

    // Quick tools actions
    duplicateLastTransaction: (
      state,
      action: PayloadAction<TransactionType>,
    ) => {
      const lastTransaction = getLastTransaction(
        state.transactions,
        action.payload,
      );
      if (lastTransaction) {
        const newTransaction = createTransaction({
          title: lastTransaction.title || lastTransaction.category,
          date: new Date().toISOString().split("T")[0],
          amount: Math.abs(lastTransaction.amount),
          type: lastTransaction.type,
          category: lastTransaction.category,
          account: lastTransaction.account,
          notes: `Duplicate of ${lastTransaction.date}`,
          tags: lastTransaction.tags,
          createdBy: "Current User",
          deleted: false,
        });
        state.transactions.push(newTransaction);
      }
    },

    repeatLastTransaction: (state, action: PayloadAction<TransactionType>) => {
      const lastTransaction = getLastTransaction(
        state.transactions,
        action.payload,
      );
      if (lastTransaction) {
        const newTransaction = createTransaction({
          title: lastTransaction.title || lastTransaction.category,
          date: new Date().toISOString().split("T")[0],
          amount: Math.abs(lastTransaction.amount),
          type: lastTransaction.type,
          category: lastTransaction.category,
          account: lastTransaction.account,
          notes: `Repeat of ${lastTransaction.date}`,
          tags: lastTransaction.tags,
          createdBy: "Current User",
          deleted: false,
        });
        state.transactions.push(newTransaction);
      }
    },

    // Bulk operations
    loadTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.transactions = action.payload;
    },

    clearAllTransactions: (state) => {
      state.transactions = [];
    },

    // Import transactions from JSON/Excel format
    importTransactions: (
      state,
      action: PayloadAction<Partial<Transaction>[]>,
    ) => {
      const importedTransactions = action.payload
        .map((t) => {
          const date = normalizeDate(t.date);
          const amountRaw =
            typeof t.amount === "number" ? t.amount : Number(t.amount);
          const amount = Number.isFinite(amountRaw)
            ? Math.abs(amountRaw)
            : amountRaw;
          const type = normalizeType(t.type);
          const title = typeof t.title === "string" ? t.title.trim() : "";
          const category =
            typeof t.category === "string" ? t.category.trim() : "";
          const account = normalizeAccount(t.account);

          if (
            !date ||
            !Number.isFinite(amount) ||
            !type ||
            !category ||
            !account
          ) {
            return null;
          }

          return {
            ...t,
            date,
            amount,
            type,
            title: title || category,
            category,
            account,
          };
        })
        .filter(
          (
            t,
          ): t is Partial<Transaction> &
            Pick<
              Transaction,
              "date" | "amount" | "type" | "title" | "category" | "account"
            > => Boolean(t),
        );

      const now = new Date().toISOString();
      const newTransactions: Transaction[] = importedTransactions.map((t) => ({
        id:
          t.id ||
          `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: t.title!,
        date: t.date!,
        amount: t.amount!,
        type: t.type!,
        category: t.category!,
        account: t.account!,
        currencyCode: t.currencyCode,
        currencySymbol: t.currencySymbol,
        currencyName: t.currencyName,
        notes: t.notes,
        tags: t.tags,
        createdBy: t.createdBy || "Imported",
        createdAt: t.createdAt || now,
        updatedAt: now,
        deleted: t.deleted ?? false,
      }));

      state.transactions = [...state.transactions, ...newTransactions];
    },

    // Set transaction type for new transaction (used by quick tools)
    setNewTransactionType: (state, action: PayloadAction<TransactionType>) => {
      state.modalDefaultType = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.transactions = action.payload;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        const { type, categories } = action.payload;
        const names = categories.map((category) => category.name);
        const prefix = `${type}:`;

        Object.keys(state.categoryIcons).forEach((key) => {
          if (key.startsWith(prefix)) delete state.categoryIcons[key];
        });
        Object.keys(state.categoryColors).forEach((key) => {
          if (key.startsWith(prefix)) delete state.categoryColors[key];
        });

        categories.forEach((category) => {
          const key = getCategoryIconKey(type, category.name);
          if (category.icon) state.categoryIcons[key] = category.icon;
          if (category.color) state.categoryColors[key] = category.color;
        });

        if (type === "income") {
          state.incomeCategories = names;
          state.deletedIncomeCategories = [];
        } else {
          state.expenseCategories = names;
          state.deletedExpenseCategories = [];
        }
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        const names = action.payload.map((account) => account.name);

        Object.keys(state.accountIcons).forEach((key) => {
          delete state.accountIcons[key];
        });
        Object.keys(state.accountColors).forEach((key) => {
          delete state.accountColors[key];
        });

        action.payload.forEach((account) => {
          const key = account.name.trim().toLowerCase();
          if (account.icon) state.accountIcons[key] = account.icon;
          if (account.color) state.accountColors[key] = account.color;
        });

        state.accounts = names;
        state.deletedAccounts = [];
      })
      .addCase(fetchBudget.fulfilled, (state, action) => {
        state.overallBudget = action.payload.overallBudget;
        state.categoryBudgets = Object.fromEntries(
          action.payload.categoryBudgets.map((budget) => [
            budget.category,
            budget.amount,
          ]),
        );
      })
      .addCase(updateOverallBudgetAsync.fulfilled, (state, action) => {
        state.overallBudget = action.payload.overallBudget;
        state.categoryBudgets = Object.fromEntries(
          action.payload.categoryBudgets.map((budget) => [
            budget.category,
            budget.amount,
          ]),
        );
      })
      .addCase(updateCategoryBudgetAsync.fulfilled, (state, action) => {
        state.overallBudget = action.payload.overallBudget;
        state.categoryBudgets = Object.fromEntries(
          action.payload.categoryBudgets.map((budget) => [
            budget.category,
            budget.amount,
          ]),
        );
      })
      .addCase(addTransactionAsync.fulfilled, (state, action) => {
        state.transactions.push(action.payload);
      })
      .addCase(updateTransactionAsync.fulfilled, (state, action) => {
        const index = state.transactions.findIndex(
          (t) => t.id === action.payload.id,
        );
        if (index !== -1) {
          state.transactions[index] = action.payload;
        }
      })
      .addCase(deleteTransactionAsync.fulfilled, (state, action) => {
        const tx = state.transactions.find((t) => t.id === action.payload);
        if (tx) {
          tx.deleted = true;
          tx.updatedAt = new Date().toISOString();
        }
      })
      .addCase(restoreTransactionAsync.fulfilled, (state, action) => {
        const tx = state.transactions.find((t) => t.id === action.payload);
        if (tx) {
          tx.deleted = false;
          tx.updatedAt = new Date().toISOString();
        }
      })
      .addCase(addCategoryAsync.fulfilled, (state, action) => {
        const { type, name, icon, color } = action.payload;
        const categories =
          type === "income" ? state.incomeCategories : state.expenseCategories;
        if (!categories.includes(name)) {
          categories.push(name);
        }
        const key = getCategoryIconKey(type, name);
        if (icon) state.categoryIcons[key] = icon;
        if (color) state.categoryColors[key] = color;
      })
      .addCase(updateCategoryAsync.fulfilled, (state, action) => {
        const { oldName, newName, type, icon, color } = action.payload;
        const categories =
          type === "income" ? state.incomeCategories : state.expenseCategories;

        const index = categories.indexOf(oldName);
        if (index !== -1) {
          categories[index] = newName;
        }

        // Reassign transactions if name changed
        if (oldName !== newName) {
          state.transactions.forEach((t) => {
            if (t.type !== type || t.category !== oldName) return;
            t.category = newName;
            t.updatedAt = new Date().toISOString();
          });
          if (
            type === "expense" &&
            state.categoryBudgets[oldName] !== undefined
          ) {
            state.categoryBudgets[newName] = state.categoryBudgets[oldName];
            delete state.categoryBudgets[oldName];
          }
        }

        // Update icon
        if (icon !== undefined) {
          const newKey = getCategoryIconKey(type, newName);
          state.categoryIcons[newKey] = icon;
          const oldKey = getCategoryIconKey(type, oldName);
          if (oldKey !== newKey) delete state.categoryIcons[oldKey];
        }
        if (color !== undefined) {
          const newKey = getCategoryIconKey(type, newName);
          state.categoryColors[newKey] = color;
          const oldKey = getCategoryIconKey(type, oldName);
          if (oldKey !== newKey) delete state.categoryColors[oldKey];
        }

        // Keep deleted lists clean
        const deletedList =
          type === "income"
            ? state.deletedIncomeCategories
            : state.deletedExpenseCategories;
        const cleaned = deletedList.filter(
          (n) => n !== oldName && n !== newName,
        );
        if (type === "income") state.deletedIncomeCategories = cleaned;
        else state.deletedExpenseCategories = cleaned;
      })
      .addCase(addAccountAsync.fulfilled, (state, action) => {
        const { name, icon, color } = action.payload;
        if (!state.accounts.includes(name)) {
          state.accounts.push(name);
        }
        const key = name.trim().toLowerCase();
        if (icon) state.accountIcons[key] = icon;
        if (color) state.accountColors[key] = color;
      })
      .addCase(updateAccountAsync.fulfilled, (state, action) => {
        const { oldName, newName, icon, color } = action.payload;
        const index = state.accounts.indexOf(oldName);
        if (index !== -1) {
          state.accounts[index] = newName;
        }

        if (oldName !== newName) {
          state.transactions.forEach((t) => {
            if (t.account !== oldName) return;
            t.account = newName;
            t.updatedAt = new Date().toISOString();
          });
        }

        const newKey = newName.trim().toLowerCase();
        const oldKey = oldName.trim().toLowerCase();
        if (icon !== undefined) {
          state.accountIcons[newKey] = icon;
          if (oldKey !== newKey) delete state.accountIcons[oldKey];
        }
        if (color !== undefined) {
          state.accountColors[newKey] = color;
          if (oldKey !== newKey) delete state.accountColors[oldKey];
        }

        state.deletedAccounts = state.deletedAccounts.filter(
          (name) => name !== oldName && name !== newName,
        );
      })
      .addCase(deleteAccountAsync.fulfilled, (state, action) => {
        const { name } = action.payload;
        const activeIndex = state.accounts.indexOf(name);
        if (activeIndex !== -1) {
          state.accounts.splice(activeIndex, 1);
        }
        if (!state.deletedAccounts.includes(name)) {
          state.deletedAccounts.push(name);
        }
      })
      .addCase(updateAccountOrderAsync.fulfilled, (state, action) => {
        state.accounts = action.payload;
      })
      .addCase(clearAllTransactionsAsync.fulfilled, (state) => {
        state.transactions = [];
        state.transactionDrafts = [];
        state.activeTransactionDraftId = null;
      })
      .addCase(clearTransactionsForDateRangeAsync.fulfilled, (state, action) => {
        const { startDate, endDate } = action.meta.arg;
        state.transactions = state.transactions.filter(
          (transaction) =>
            transaction.date < startDate || transaction.date > endDate,
        );
        state.transactionDrafts = [];
        state.activeTransactionDraftId = null;
      })
      .addCase(resetWorkspaceDataAsync.fulfilled, (state) => {
        state.transactions = [];
        state.transactionDrafts = [];
        state.activeTransactionDraftId = null;
        state.incomeCategories = [...DEFAULT_INCOME_CATEGORIES];
        state.expenseCategories = [...DEFAULT_EXPENSE_CATEGORIES];
        state.deletedIncomeCategories = [];
        state.deletedExpenseCategories = [];
        state.categoryIcons = {};
        state.categoryColors = {};
        state.accounts = [...DEFAULT_ACCOUNTS];
        state.deletedAccounts = [];
        state.accountIcons = {};
        state.accountColors = {};
        state.overallBudget = 0;
        state.categoryBudgets = {};
      });
  },
});

// Export actions
export const {
  openAddModal,
  openDraftModal,
  openEditModal,
  openViewModal,
  closeModal,
  upsertTransactionDraft,
  removeTransactionDraft,
  openCategoryModal,
  closeCategoryModal,
  addTransaction,
  updateTransaction,
  softDeleteTransaction,
  restoreTransaction,
  permanentDeleteTransaction,
  setFilters,
  resetFilters,
  addIncomeCategory,
  addExpenseCategory,
  updateIncomeCategory,
  updateExpenseCategory,
  softRemoveIncomeCategory,
  softRemoveExpenseCategory,
  removeCategoryAndReassign,
  addAccount,
  updateAccount,
  softRemoveAccount,
  removeAccountAndReassign,
  reorderAccounts,
  duplicateLastTransaction,
  repeatLastTransaction,
  loadTransactions,
  clearAllTransactions,
  importTransactions,
  setNewTransactionType,
} = transactionSlice.actions;

export default transactionSlice.reducer;

// ============================================================================
// Selectors
// ============================================================================

export const selectTransactions = (state: RootState) =>
  state.transactions.transactions;

export const selectTransactionDrafts = (state: RootState) =>
  state.transactions.transactionDrafts || [];

export const selectActiveTransactionDraftId = (state: RootState) =>
  state.transactions.activeTransactionDraftId || null;

export const selectActiveTransactionDraft = createSelector(
  [selectTransactionDrafts, selectActiveTransactionDraftId],
  (drafts, activeDraftId) =>
    activeDraftId ? drafts.find((draft) => draft.id === activeDraftId) : null,
);

export const selectNonDeletedTransactions = createSelector(
  [selectTransactions],
  (transactions) => transactions.filter((t) => !t.deleted),
);

export const selectIncomeTransactions = (state: RootState) =>
  state.transactions.transactions.filter(
    (t) => t.type === "income" && !t.deleted,
  );

export const selectExpenseTransactions = (state: RootState) =>
  state.transactions.transactions.filter(
    (t) => t.type === "expense" && !t.deleted,
  );

export const selectFilters = (state: { transactions: TransactionState }) =>
  state.transactions.filters;

export const selectIsModalOpen = (state: { transactions: TransactionState }) =>
  state.transactions.isModalOpen;

export const selectModalMode = (state: { transactions: TransactionState }) =>
  state.transactions.modalMode;

export const selectModalInitialDate = (state: {
  transactions: TransactionState;
}) => state.transactions.modalInitialDate;

export const selectModalDefaultType = (state: {
  transactions: TransactionState;
}) => state.transactions.modalDefaultType;

export const selectEditingTransactionId = (state: {
  transactions: TransactionState;
}) => state.transactions.editingTransactionId;

export const selectTransactionById =
  (id: string) => (state: { transactions: TransactionState }) =>
    state.transactions.transactions.find((t) => t.id === id);

export const selectIncomeCategories = createSelector(
  [(state: { transactions: TransactionState }) => state.transactions.incomeCategories],
  names => sortCategories(names, name => name),
);
export const selectExpenseCategories = createSelector(
  [(state: { transactions: TransactionState }) => state.transactions.expenseCategories],
  names => sortCategories(names, name => name),
);
export const selectActiveIncomeCategories = createSelector(
  [selectIncomeCategories, (state: { transactions: TransactionState }) => state.transactions.deletedIncomeCategories],
  (names, deleted) => names.filter(name => !deleted.includes(name)),
);
export const selectActiveExpenseCategories = createSelector(
  [selectExpenseCategories, (state: { transactions: TransactionState }) => state.transactions.deletedExpenseCategories],
  (names, deleted) => names.filter(name => !deleted.includes(name)),
);

export const selectCategoryIcons = (state: {
  transactions: TransactionState;
}) => state.transactions.categoryIcons || {};

export const selectCategoryColors = (state: {
  transactions: TransactionState;
}) => state.transactions.categoryColors || {};

export const selectActiveAccounts = (state: {
  transactions: TransactionState;
}) =>
  state.transactions.accounts.filter(
    (name) => !state.transactions.deletedAccounts.includes(name),
  );

export const selectAccounts = (state: { transactions: TransactionState }) =>
  state.transactions.accounts;

export const selectAccountIcons = (state: { transactions: TransactionState }) =>
  state.transactions.accountIcons || {};

export const selectAccountColors = (state: {
  transactions: TransactionState;
}) => state.transactions.accountColors || {};

export const selectOverallBudget = (state: RootState) =>
  state.transactions.overallBudget || 0;

export const selectCategoryBudgets = (state: {
  transactions: TransactionState;
}) => state.transactions.categoryBudgets || {};

export const selectBudgetSummary = createSelector(
  [selectOverallBudget, selectCategoryBudgets],
  (overallBudget, categoryBudgets) => {
    const allocated = Object.values(categoryBudgets).reduce(
      (sum, amount) => sum + Math.max(0, amount),
      0,
    );
    return {
      overallBudget,
      categoryBudgets,
      allocated,
      remaining: overallBudget - allocated,
      isOverAllocated: allocated > overallBudget,
    };
  },
);

export const selectIsCategoryModalOpen = (state: {
  transactions: TransactionState;
}) => state.transactions.isCategoryModalOpen;

export const selectCategoryModalType = (state: {
  transactions: TransactionState;
}) => state.transactions.categoryModalType;

export const selectLastTransaction =
  (type?: TransactionType) => (state: { transactions: TransactionState }) =>
    getLastTransaction(state.transactions.transactions, type);

export const fetchTransactions = createAsyncThunk(
  "transactions/fetchTransactions",
  async () => {
    if (!financeRepository) return [] as Transaction[];
    const txs = await financeRepository.getTransactions();
    return txs;
  },
);

export const setInsightsSampleDataAsync = createAsyncThunk<number, boolean, { state: RootState }>(
  "transactions/setInsightsSampleData",
  async (enabled, { getState, dispatch }) => {
    const workspaceId = getState().workspace.activeWorkspaceId;
    const repository = new SQLiteFinanceRepository(workspaceId);
    const count = await repository.setInsightsSampleData(enabled);
    const transactions = await repository.getTransactions();
    if (getState().workspace.activeWorkspaceId === workspaceId) {
      dispatch(loadTransactions(transactions));
    }
    return count;
  },
  { condition: (_, { getState }) => !getState().transactions.isLoading },
);

export const fetchCategories = createAsyncThunk(
  "transactions/fetchCategories",
  async (type: TransactionType) => {
    if (!financeRepository) {
      const defaultCategories =
        type === "income"
          ? DEFAULT_INCOME_CATEGORIES
          : DEFAULT_EXPENSE_CATEGORIES;
      return {
        type,
        categories: defaultCategories.map((name) => ({
          name,
          type,
          icon: undefined,
          color: undefined,
        })),
      };
    }
    const categories = await financeRepository.getCategories(type);
    return { type, categories };
  },
);

export const fetchAccounts = createAsyncThunk(
  "transactions/fetchAccounts",
  async () => {
    if (!financeRepository) {
      return DEFAULT_ACCOUNTS.map((name) => ({
        id: name,
        name,
        icon: undefined,
        color: undefined,
        createdAt: new Date().toISOString(),
      }));
    }
    return await financeRepository.getAccounts();
  },
);

export const fetchBudget = createAsyncThunk("transactions/fetchBudget", async () => {
  if (!financeRepository) {
    return { overallBudget: 0, categoryBudgets: [] };
  }
  return await financeRepository.getBudget();
});

export const updateOverallBudgetAsync = createAsyncThunk(
  "transactions/updateOverallBudget",
  async (amount: number) => {
    if (!financeRepository) throw new Error("Repository not available");
    return await financeRepository.upsertOverallBudget(amount);
  },
);

export const updateCategoryBudgetAsync = createAsyncThunk(
  "transactions/updateCategoryBudget",
  async ({ categoryName, amount }: { categoryName: string; amount: number }) => {
    if (!financeRepository) throw new Error("Repository not available");
    return await financeRepository.upsertCategoryBudget(categoryName, amount);
  },
);

export const addTransactionAsync = createAsyncThunk(
  "transactions/addTransaction",
  async (txData: TransactionFormData) => {
    if (!financeRepository) throw new Error("Repository not available");
    return await financeRepository.addTransaction(txData);
  },
);

export const updateTransactionAsync = createAsyncThunk(
  "transactions/updateTransaction",
  async ({ id, data }: { id: string; data: Partial<TransactionFormData> }) => {
    if (!financeRepository) throw new Error("Repository not available");
    return await financeRepository.updateTransaction(id, data);
  },
);

export const deleteTransactionAsync = createAsyncThunk(
  "transactions/deleteTransaction",
  async (id: string) => {
    if (!financeRepository) throw new Error("Repository not available");
    await financeRepository.softDeleteTransaction(id);
    return id;
  },
);

export const restoreTransactionAsync = createAsyncThunk(
  "transactions/restoreTransaction",
  async (id: string) => {
    if (!financeRepository) throw new Error("Repository not available");
    await financeRepository.restoreTransaction(id);
    return id;
  },
);

export const clearAllTransactionsAsync = createAsyncThunk(
  "transactions/clearAllTransactions",
  async () => {
    if (!financeRepository) throw new Error("Repository not available");
    await financeRepository.clearAllTransactions();
  },
);

export const clearTransactionsForDateRangeAsync = createAsyncThunk(
  "transactions/clearTransactionsForDateRange",
  async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
    if (!financeRepository) throw new Error("Repository not available");
    await financeRepository.clearTransactionsForDateRange(startDate, endDate);
  },
);

export const resetWorkspaceDataAsync = createAsyncThunk(
  "transactions/resetWorkspaceData",
  async () => {
    if (!financeRepository) throw new Error("Repository not available");
    await financeRepository.resetWorkspaceData();
    switchWorkspace("personal");
  },
);

export const updateCategoryAsync = createAsyncThunk(
  "transactions/updateCategory",
  async ({
    oldName,
    newName,
    type,
    icon,
    color,
  }: {
    oldName: string;
    newName: string;
    type: TransactionType;
    icon?: string;
    color?: string;
  }) => {
    if (!financeRepository) throw new Error("Repository not available");
    const category = await financeRepository.getCategoryByName(oldName, type);
    if (!category) throw new Error(`Category '${oldName}' not found`);
    await financeRepository.updateCategory(category.id, newName, icon, color);
    return { oldName, newName, type, icon, color };
  },
);

export const deleteCategoriesAsync = createAsyncThunk<number, { names: string[]; type: TransactionType; destination?: string; workspaceId: string }, { state: RootState }>(
  "transactions/deleteCategories",
  async ({ names, type, destination, workspaceId }, { getState, dispatch }) => {
    if (getState().workspace.activeWorkspaceId !== workspaceId) throw new Error("Workspace changed. Open the category list again.");
    const repository = new SQLiteFinanceRepository(workspaceId);
    await repository.deleteCategories(type, names, destination);
    try {
      const [transactions, categories, budget] = await Promise.all([repository.getTransactions(), repository.getCategories(type), repository.getBudget()]);
      if (getState().workspace.activeWorkspaceId === workspaceId) {
        dispatch(loadTransactions(transactions));
        dispatch(fetchCategories.fulfilled({ type, categories }, "category-delete", type));
        dispatch(fetchBudget.fulfilled(budget, "category-delete", undefined));
      }
    } catch {
      throw new Error("Categories were deleted, but the list could not refresh. Restart the app.");
    }
    return names.length;
  },
);

export const deleteCategoryAsync = createAsyncThunk(
  "transactions/deleteCategory",
  async ({ name, type, fallback }: { name: string; type: TransactionType; fallback?: string }, { getState, dispatch }) => {
    const workspaceId = (getState() as RootState).workspace.activeWorkspaceId;
    await dispatch(deleteCategoriesAsync({ names: [name], type, destination: fallback, workspaceId }) as any).unwrap();
    return { name, type };
  },
);

export const addCategoryAsync = createAsyncThunk(
  "transactions/addCategory",
  async ({
    name,
    type,
    icon,
    color,
  }: {
    name: string;
    type: TransactionType;
    icon?: string;
    color?: string;
  }) => {
    if (!financeRepository) throw new Error("Repository not available");
    // Check if category already exists
    const existing = await financeRepository.getCategoryByName(name, type);
    if (existing) throw new Error(`Category '${name}' already exists`);
    return await financeRepository.addCategory(name, type, icon, color);
  },
);

export const updateAccountAsync = createAsyncThunk(
  "transactions/updateAccount",
  async ({
    oldName,
    newName,
    icon,
    color,
  }: {
    oldName: string;
    newName: string;
    icon?: string;
    color?: string;
  }) => {
    if (!financeRepository) throw new Error("Repository not available");
    const account = await financeRepository.getAccountByName(oldName);
    if (!account) throw new Error(`Account '${oldName}' not found`);
    await financeRepository.updateAccount(
      Number(account.id),
      newName,
      icon,
      color,
    );
    return { oldName, newName, icon, color };
  },
);

export const deleteAccountAsync = createAsyncThunk(
  "transactions/deleteAccount",
  async ({ name, fallback }: { name: string; fallback?: string }) => {
    if (!financeRepository) throw new Error("Repository not available");
    const account = await financeRepository.getAccountByName(name);
    if (!account) throw new Error(`Account '${name}' not found`);
    if (fallback && fallback !== name) {
      const destination = await financeRepository.getAccountByName(fallback);
      if (!destination) {
        throw new Error(`Account '${fallback}' not found`);
      }
      await financeRepository.reassignAccountTransactions(name, fallback);
    }
    await financeRepository.softDeleteAccount(Number(account.id));
    return { name };
  },
);

export const addAccountAsync = createAsyncThunk(
  "transactions/addAccount",
  async ({
    name,
    icon,
    color,
  }: {
    name: string;
    icon?: string;
    color?: string;
  }) => {
    if (!financeRepository) throw new Error("Repository not available");
    const existing = await financeRepository.getAccountByName(name);
    if (existing) throw new Error(`Account '${name}' already exists`);
    return await financeRepository.addAccount(name, icon, color);
  },
);

export const updateAccountOrderAsync = createAsyncThunk(
  "transactions/updateAccountOrder",
  async (names: string[]) => {
    if (!financeRepository) throw new Error("Repository not available");
    await financeRepository.updateAccountOrder(names);
    return names;
  },
);
