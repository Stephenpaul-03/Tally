import { AlertModal } from "@/components/alert/AlertModal";
import { AccountManagementModal } from "@/modules/Management/Account/Index";
import { CategoryManagementModal } from "@/modules/Management/Category/Index";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TransactionModal } from "./Components/TransactionModal/Index";
import { useTransactionsPage } from "./Hooks";
import { MobileLayout } from "./Layouts/Views/MobileLayoutView";
import { styles } from "./Styles";

export default function Transactions() {
  const {
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
  } = useTransactionsPage();

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        style={theme.dark ? "light" : "dark"}
        backgroundColor={theme.colors.background}
      />
      <View
        style={[
          styles.body,
          {
            paddingBottom: 0,
            backgroundColor: tokens.colors.background.primary,
          },
        ]}
      >
        <MobileLayout
          colors={tokens.colors}
          rangeLabel=""
          incomeTotal={incomeTotal}
          expenseTotal={expenseTotal}
          netBalance={netBalance}
          activeTab={activeTab}
          allEmpty={allEmpty}
          filteredExpenseTransactions={filteredExpenseTransactions}
          filteredIncomeTransactions={filteredIncomeTransactions}
          expenseTone={tokens.expenseTone}
          incomeTone={tokens.incomeTone}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAddPress={handleAddPress}
        />
      </View>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        defaultType={activeTab}
      />

      <AlertModal
        isOpen={pendingDeleteId !== null}
        title="Delete Transaction"
        message="Are You Sure You Want To Delete This Transaction?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        destructive
        confirmMode="slide"
      />

      <CategoryManagementModal
        isOpen={categoryManagement.isManagementOpen}
        onClose={categoryManagement.handleCloseManagement}
        management={categoryManagement}
      />

      <AccountManagementModal
        isOpen={accountManagement.isManagementOpen}
        onClose={accountManagement.handleCloseManagement}
        management={accountManagement}
      />
    </SafeAreaView>
  );
}
