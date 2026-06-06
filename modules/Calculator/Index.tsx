import { PageHeader } from "@/components/pageheader/PageHeader";
import { useSetTabBarEdgeButton } from "@/components/tabbar/TabBarContext";
import { useTabBarModePreference } from "@/components/tabbar/TabBarModePreference";
import { AccountManagementModal } from "@/modules/Common/Components/AccountManagement/Index";
import { CategoryManagementModal } from "@/modules/Common/Components/CategoryManagement/Index";
import {
  HeaderMenuButton,
  HeaderMenuSheet,
} from "@/modules/Common/Components/HeaderMenuModal/Index";
import { useAccountManagement } from "@/modules/Common/Hooks/UseAccountManagement";
import { useCategoryManagement } from "@/modules/Common/Hooks/UseCategoryManagement";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { TransactionModal } from "../Common/Components/TransactionModal/Index";
import { CalculatorButtons } from "./Components/CalculatorButtons";
import { CalculatorDisplay } from "./Components/CalculatorDisplay";
import { HistorySheet } from "./Components/HistorySheet";
import { useCalculator } from "./Hooks";
import { CalculatorStyles } from "./Styles";

export function Calculator() {
  const theme = useTheme();
  const setTabBarEdgeButton = useSetTabBarEdgeButton();
  const { tabBarMode } = useTabBarModePreference();
  const [isHeaderSheetOpen, setIsHeaderSheetOpen] = useState(false);
  const categoryManagement = useCategoryManagement("expense");
  const accountManagement = useAccountManagement();

  const {
    display,
    expression,
    operator,
    waitingForOperand,
    activeFunction,
    history,
    isHistoryOpen,
    setIsHistoryOpen,
    showAddTransactionPrompt,
    isTransactionModalOpen,
    transactionSeedAmount,
    tabBarHeight,
    handlePress,
    restoreFromHistory,
    handleConfirmAddTransaction,
    handleCloseTransactionModal,
  } = useCalculator();

  const setCalculatorEdgeButton = useCallback(() => {
    setTabBarEdgeButton({
      left: {
        onPress: handleConfirmAddTransaction,
        icon: ({ color, size }) => (
          <MaterialCommunityIcons name="plus" color={color} size={size} />
        ),
        accessibilityLabel: "Add calculator amount as transaction",
      },
      right: null,
    });
  }, [handleConfirmAddTransaction, setTabBarEdgeButton]);

  useEffect(() => {
    if (tabBarMode !== "floating") {
      setTabBarEdgeButton(null);
      return;
    }

    setCalculatorEdgeButton();
    return () => setTabBarEdgeButton(null);
  }, [setCalculatorEdgeButton, setTabBarEdgeButton, tabBarMode]);

  useFocusEffect(
    useCallback(() => {
      if (tabBarMode !== "floating") {
        setTabBarEdgeButton(null);
        return () => setTabBarEdgeButton(null);
      }

      setCalculatorEdgeButton();

      return () => setTabBarEdgeButton(null);
    }, [setCalculatorEdgeButton, setTabBarEdgeButton, tabBarMode]),
  );

  return (
    <SafeAreaView
      edges={["top"]}
      style={[
        CalculatorStyles.root,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <PageHeader
        variant="simple"
        title="Calculator"
        left={
          <HeaderMenuButton
            accessibilityLabel="Open calculator menu"
            onPress={() => setIsHeaderSheetOpen(true)}
          />
        }
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open history"
            hitSlop={8}
            onPress={() => setIsHistoryOpen(true)}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.68 : 1,
            })}
          >
            <MaterialCommunityIcons
              name="history"
              size={22}
              color={theme.colors.onSurface}
            />
          </Pressable>
        }
      />

      <HeaderMenuSheet
        visible={isHeaderSheetOpen}
        onDismiss={() => setIsHeaderSheetOpen(false)}
        onOpenCategories={() =>
          categoryManagement.handleOpenManagement("expense")
        }
        onOpenAccounts={accountManagement.handleOpenManagement}
      />

      <View
        style={[CalculatorStyles.content, { paddingBottom: tabBarHeight + 12 }]}
      >
        <CalculatorDisplay display={display} expression={expression} />

        <View
          style={[
            CalculatorStyles.divider,
            { backgroundColor: theme.colors.onSurface + "14" },
          ]}
        />

        <CalculatorButtons
          operator={operator}
          waitingForOperand={waitingForOperand}
          activeFunction={activeFunction}
          showAddTransactionPrompt={showAddTransactionPrompt}
          tabBarMode={tabBarMode}
          onPress={handlePress}
        />
      </View>

      <HistorySheet
        visible={isHistoryOpen}
        history={history}
        onDismiss={() => setIsHistoryOpen(false)}
        onRestoreEntry={restoreFromHistory}
      />

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={handleCloseTransactionModal}
        defaultType="expense"
        initialAmount={transactionSeedAmount}
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
