import type { useAccountManagement } from "@/hooks/use-account-manangement";
import type { useCategoryManagement } from "@/hooks/use-category-manamgement";
import type { Transaction, TransactionType } from "@/utils/Types";
import type { MD3Theme } from "react-native-paper";
import type { TransactionTokens } from "./Tokens";
import type { TransactionSearchScope } from "./Components/SearchScopeSheet";

import type { useDataTransferControls } from "@/hooks/use-datatransfer-controls";

export type TransactionsCategoryManagement = ReturnType<
  typeof useCategoryManagement
>;

export type TransactionsAccountManagement = ReturnType<
  typeof useAccountManagement
>;

export type TransactionsDataTransferControls = ReturnType<
  typeof useDataTransferControls
>;

export type TransactionsPageState = {
  theme: MD3Theme;
  tokens: TransactionTokens;
  activeTab: TransactionType;
  incomeTotal: number;
  expenseTotal: number;
  netBalance: number;
  overallBudget: number;
  allEmpty: boolean;
  incomeTransactions: Transaction[];
  expenseTransactions: Transaction[];
  filteredExpenseTransactions: Transaction[];
  filteredIncomeTransactions: Transaction[];
  transactionSearchQuery: string;
  setTransactionSearchQuery: (value: string) => void;
  transactionSearchScope: TransactionSearchScope;
  setTransactionSearchScope: (scope: TransactionSearchScope) => void;
  isModalOpen: boolean;
  modalDefaultType: TransactionType;
  modalInitialDate: string | null;
  handleCloseModal: () => void;
  pendingDeleteId: string | null;
  handleDelete: (id: string) => void;
  handleCancelDelete: () => void;
  handleConfirmDelete: () => void;
  handleEdit: (id: string) => void;
  handleAddPress: (type: TransactionType, date?: string) => void;
  categoryManagement: TransactionsCategoryManagement;
  accountManagement: TransactionsAccountManagement;
  dataTransfer: TransactionsDataTransferControls;
};
