import { useAppDispatch, useAppSelector } from "@/hooks/Redux";
import { useAccountManagement } from "@/hooks/use-account-manangement";
import { useCategoryManagement } from "@/hooks/use-category-manamgement";
import { useDataTransferControls } from "@/hooks/use-datatransfer-controls";
import { useTransactionFilters } from "@/hooks/use-transaction-filters";
import {
    closeModal,
    deleteTransactionAsync,
    openAddModal,
    openDraftModal,
    openViewModal,
    selectExpenseTransactions,
    selectIncomeTransactions,
    selectIsModalOpen,
    selectModalDefaultType,
    selectModalInitialDate,
    selectOverallBudget,
    selectTransactionDrafts,
} from "@/modules/Core/Slices/TransactionSlice";
import { calculateTotal, matchesFilters, sortByDate } from "@/utils/Helpers";
import { TransactionType } from "@/utils/Types";
import { useCallback, useMemo, useState } from "react";
import { useTheme } from "react-native-paper";
import type { TransactionSearchScope } from "./Components/SearchScopeSheet";
import { buildTransactionTokens } from "./Tokens";
import type { TransactionsPageState } from "./Types";

export function useTransactionsPage(): TransactionsPageState {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const tokens = useMemo(() => buildTransactionTokens(theme), [theme]);

  const incomeTransactions = useAppSelector(selectIncomeTransactions);
  const expenseTransactions = useAppSelector(selectExpenseTransactions);
  const overallBudget = useAppSelector(selectOverallBudget);
  const isModalOpen = useAppSelector(selectIsModalOpen);
  const modalInitialDate = useAppSelector(selectModalInitialDate);
  const modalDefaultType = useAppSelector(selectModalDefaultType);
  const transactionDrafts = useAppSelector(selectTransactionDrafts);

  const [activeTab] = useState<TransactionType>("expense");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [transactionSearchQuery, setTransactionSearchQuery] = useState("");
  const [transactionSearchScope, setTransactionSearchScope] =
    useState<TransactionSearchScope>("day");

  const { filters, handleApplyFilters } = useTransactionFilters();
  const categoryManagement = useCategoryManagement(activeTab);
  const accountManagement = useAccountManagement();
  const dataTransfer = useDataTransferControls(handleApplyFilters);

  const filteredIncomeTransactions = useMemo(
    () =>
      sortByDate(incomeTransactions).filter((transaction) =>
        matchesFilters(transaction, filters),
      ),
    [incomeTransactions, filters],
  );

  const filteredExpenseTransactions = useMemo(
    () =>
      sortByDate(expenseTransactions).filter((transaction) =>
        matchesFilters(transaction, filters),
      ),
    [expenseTransactions, filters],
  );

  const incomeTotal = calculateTotal(filteredIncomeTransactions);
  const expenseTotal = calculateTotal(filteredExpenseTransactions);
  const netBalance = incomeTotal - expenseTotal;

  const allEmpty =
    expenseTransactions.length === 0 && incomeTransactions.length === 0;

  const handleDelete = useCallback((id: string) => {
    setPendingDeleteId(id);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setPendingDeleteId(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!pendingDeleteId) return;
    dispatch(deleteTransactionAsync(pendingDeleteId));
    setPendingDeleteId(null);
  }, [dispatch, pendingDeleteId]);

  const handleEdit = useCallback(
    (id: string) => {
      if (transactionDrafts.some((draft) => draft.id === id)) {
        dispatch(openDraftModal(id));
        return;
      }
      dispatch(openViewModal(id));
    },
    [dispatch, transactionDrafts],
  );

  const handleCloseModal = useCallback(() => {
    dispatch(closeModal());
  }, [dispatch]);

  const handleAddPress = useCallback(
    (type: TransactionType, date?: string) => {
      dispatch(openAddModal({ type, date: date ?? null }));
    },
    [dispatch],
  );

  return {
    theme,
    tokens,
    activeTab,
    incomeTotal,
    expenseTotal,
    netBalance,
    overallBudget,
    allEmpty,
    incomeTransactions,
    expenseTransactions,
    filteredExpenseTransactions,
    filteredIncomeTransactions,
    transactionSearchQuery,
    setTransactionSearchQuery,
    transactionSearchScope,
    setTransactionSearchScope,
    isModalOpen,
    modalDefaultType,
    modalInitialDate,
    handleCloseModal,
    pendingDeleteId,
    handleDelete,
    handleCancelDelete,
    handleConfirmDelete,
    handleEdit,
    handleAddPress,
    categoryManagement,
    accountManagement,
    dataTransfer,
  };
}
