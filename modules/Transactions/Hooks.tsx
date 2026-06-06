import { useSetTabBarEdgeButton } from "@/components/tabbar/TabBarContext";
import { useTabBarModePreference } from "@/components/tabbar/TabBarModePreference";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as NavigationBar from "expo-navigation-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "react-native-paper";
import { useAppDispatch, useAppSelector } from "../Common/Hooks/Redux";
import { useAccountManagement } from "../Common/Hooks/UseAccountManagement";
import { useCategoryManagement } from "../Common/Hooks/UseCategoryManagement";
import { useDataTransferControls } from "../Common/Hooks/UseDataTransferControls";
import { useTransactionFilters } from "../Common/Hooks/UseTransactionFilters";
import {
    closeModal,
    deleteTransactionAsync,
    openAddModal,
    openEditModal,
    selectExpenseTransactions,
    selectIncomeTransactions,
    selectIsModalOpen,
} from "../Common/Slices/TransactionSlice";
import {
    calculateTotal,
    matchesFilters,
    sortByDate,
} from "../Common/Utils/Helpers";
import { TransactionType } from "../Common/Utils/Types";
import { buildTransactionTokens } from "./Tokens";
import type { TransactionsPageState } from "./Types";

export function useTransactionsPage(): TransactionsPageState {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const tokens = useMemo(() => buildTransactionTokens(theme), [theme]);
  const setTabBarEdgeButton = useSetTabBarEdgeButton();
  const { tabBarMode } = useTabBarModePreference();

  useEffect(() => {
    NavigationBar.setBackgroundColorAsync(tokens.navigationBarBackground);
    NavigationBar.setButtonStyleAsync(tokens.navigationBarButtonStyle);
  }, [tokens]);

  const incomeTransactions = useAppSelector(selectIncomeTransactions);
  const expenseTransactions = useAppSelector(selectExpenseTransactions);
  const isModalOpen = useAppSelector(selectIsModalOpen);

  const [activeTab] = useState<TransactionType>("expense");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [monthMode, setMonthMode] = useState(false);

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

  const handleAdd = useCallback(() => {
    dispatch(openAddModal(activeTab));
  }, [activeTab, dispatch]);

  useFocusEffect(
    useCallback(() => {
      if (tabBarMode !== "floating") return;

      setTabBarEdgeButton({
        left: {
          onPress: handleAdd,
          icon: ({ color, size }) => (
            <MaterialCommunityIcons name="plus" color={color} size={size} />
          ),
          accessibilityLabel: "Add transaction",
        },
        right: null,
      });

      return () => setTabBarEdgeButton(null);
    }, [handleAdd, setTabBarEdgeButton, tabBarMode]),
  );

  return {
    theme,
    tokens,
    tabBarMode,
    activeTab,
    monthMode,
    setMonthMode,
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
