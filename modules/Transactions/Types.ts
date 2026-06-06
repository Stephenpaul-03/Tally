import type { useAccountManagement } from "@/modules/Common/Hooks/UseAccountManagement";
import type { useCategoryManagement } from "@/modules/Common/Hooks/UseCategoryManagement";
import type { ExportScope } from "@/modules/Common/Hooks/UseImportExport";
import type {
    Transaction,
    TransactionType,
} from "@/modules/Common/Utils/Types";
import type { MD3Theme } from "react-native-paper";
import type { TransactionTokens } from "./Tokens";

import type { useDataTransferControls } from "@/modules/Common/Hooks/UseDataTransferControls";

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
  tabBarMode: "basic" | "floating";
  activeTab: TransactionType;
  monthMode: boolean;
  setMonthMode: (next: boolean) => void;
  incomeTotal: number;
  expenseTotal: number;
  netBalance: number;
  allEmpty: boolean;
  filteredExpenseTransactions: Transaction[];
  filteredIncomeTransactions: Transaction[];
  isModalOpen: boolean;
  handleCloseModal: () => void;
  pendingDeleteId: string | null;
  handleDelete: (id: string) => void;
  handleCancelDelete: () => void;
  handleConfirmDelete: () => void;
  handleEdit: (id: string) => void;
  handleAddPress: (type: TransactionType) => void;
  categoryManagement: TransactionsCategoryManagement;
  accountManagement: TransactionsAccountManagement;
  dataTransfer: TransactionsDataTransferControls;
};
