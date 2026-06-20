import { useAppDispatch, useAppSelector } from "@/hooks/Redux";
import { useAccountManagement } from "@/hooks/use-account-manangement";
import { useCategoryManagement } from "@/hooks/use-category-manamgement";
import { useDataTransferControls } from "@/hooks/use-datatransfer-controls";
import { useTransactionFilters } from "@/hooks/use-transaction-filters";
import {
  closeModal,
  deleteTransactionAsync,
  openAddModal,
  openEditModal,
  selectExpenseTransactions,
  selectIncomeTransactions,
  selectIsModalOpen,
} from "@/modules/Data/Slices/TransactionSlice";
import { calculateTotal, matchesFilters, sortByDate } from "@/utils/Helpers";
import { TransactionType } from "@/utils/Types";
import * as NavigationBar from "expo-navigation-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "react-native-paper";
import { buildTransactionTokens } from "./Tokens";
import type { TransactionsPageState } from "./Types";

export function useTransactionsPage(): TransactionsPageState {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const tokens = useMemo(() => buildTransactionTokens(theme), [theme]);

  useEffect(() => {
    NavigationBar.setBackgroundColorAsync(theme.colors.elevation.level2);
    NavigationBar.setButtonStyleAsync(tokens.navigationBarButtonStyle);
  }, [tokens, theme]);

  const incomeTransactions = useAppSelector(selectIncomeTransactions);
  const expenseTransactions = useAppSelector(selectExpenseTransactions);
  const isModalOpen = useAppSelector(selectIsModalOpen);

  const [activeTab] = useState<TransactionType>("expense");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

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
    filteredExpenseTransactions.length === 0 &&
    filteredIncomeTransactions.length === 0;

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
      dispatch(openEditModal(id));
    },
    [dispatch],
  );

  const handleCloseModal = useCallback(() => {
    dispatch(closeModal());
  }, [dispatch]);

  const handleAddPress = useCallback(
    (type: TransactionType) => {
      dispatch(openAddModal(type));
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
    allEmpty,
    filteredExpenseTransactions,
    filteredIncomeTransactions,
    isModalOpen,
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
