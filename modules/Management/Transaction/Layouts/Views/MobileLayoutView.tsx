import { EmptyState } from "@/components/EmptyStates";
import {
  useSetTabBarEdgeButton,
  useTabBarHeight,
} from "@/components/tabbar/TabBarContext";
import { useAbstractSearch } from "@/hooks/use-abstract-search";
import { type TransactionSearchScope } from "@/modules/Management/Transaction/Components/SearchScopeSheet";
import {
  TransactionRow,
  type TransactionGroupPosition,
} from "@/modules/Management/Transaction/Components/TransactionRow";
import type { Transaction, TransactionType } from "@/utils/Types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo } from "react";
import {
  FlatList,
  LayoutAnimation,
  Platform,
  UIManager,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { mobileLayoutStyles } from "../Styles/MobileLayoutStyles";

interface Tone {
  bg: string;
  border: string;
  text: string;
  icon: string;
}

interface ColorsShape {
  background: { primary: string; card: string };
  border: { primary: string };
  text: { primary: string; secondary: string; muted: string };
}

type TransactionListRowItem = {
  type: "transaction";
  key: string;
  transaction: Transaction;
  groupPosition: TransactionGroupPosition;
  showDivider: boolean;
};

type TransactionListSpacerItem = {
  type: "spacer";
  key: string;
};

type TransactionListItem = TransactionListRowItem | TransactionListSpacerItem;

interface Props {
  colors: ColorsShape;
  rangeLabel: string;
  incomeTotal: number;
  expenseTotal: number;
  netBalance: number;
  overallBudget: number;
  activeTab: TransactionType;
  allEmpty: boolean;
  incomeTransactions: import("@/utils/Types").Transaction[];
  expenseTransactions: import("@/utils/Types").Transaction[];
  filteredExpenseTransactions: import("@/utils/Types").Transaction[];
  filteredIncomeTransactions: import("@/utils/Types").Transaction[];
  transactionSearchQuery: string;
  onTransactionSearchQueryChange: (value: string) => void;
  transactionSearchScope: TransactionSearchScope;
  onTransactionSearchScopeChange: (scope: TransactionSearchScope) => void;
  searchVisible: boolean;
  expenseTone: Tone;
  incomeTone: Tone;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAddPress: (type: TransactionType, date?: string) => void;
  selectedDate?: string;
  onDateSelect?: (date: string) => void;
}

export function MobileLayout({
  activeTab,
  incomeTransactions,
  expenseTransactions,
  filteredExpenseTransactions,
  filteredIncomeTransactions,
  transactionSearchQuery,
  transactionSearchScope,
  searchVisible,
  onEdit,
  onAddPress,
  selectedDate: propsSelectedDate,
}: Props) {
  const setTabBarEdgeButton = useSetTabBarEdgeButton();
  const isFocused = useIsFocused();
  const tabBarHeight = useTabBarHeight();
  const { bottom } = useSafeAreaInsets();
  const usableSpace = tabBarHeight + bottom + 60;

  const fallbackSelectedDate = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  const selectedDate = propsSelectedDate ?? fallbackSelectedDate;
  const selectedMonthKey = selectedDate.slice(0, 7);
  const trimmedSearchQuery = transactionSearchQuery.trim();

  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [searchVisible]);

  const scopedTransactions = useMemo(() => {
    const matchScope = (transaction: import("@/utils/Types").Transaction) => {
      if (transactionSearchScope === "all") return true;
      const date = transaction.date ?? ""; // ← guard null/undefined
      if (transactionSearchScope === "month") {
        return date.startsWith(selectedMonthKey);
      }
      return date === selectedDate;
    };

    const baseExpense =
      transactionSearchScope === "month"
        ? filteredExpenseTransactions
        : transactionSearchScope === "day"
          ? filteredExpenseTransactions
          : expenseTransactions;
    const baseIncome =
      transactionSearchScope === "month"
        ? filteredIncomeTransactions
        : transactionSearchScope === "day"
          ? filteredIncomeTransactions
          : incomeTransactions;

    return {
      expense: baseExpense.filter(matchScope),
      income: baseIncome.filter(matchScope),
    };
  }, [
    expenseTransactions,
    filteredExpenseTransactions,
    filteredIncomeTransactions,
    incomeTransactions,
    selectedDate,
    selectedMonthKey,
    transactionSearchScope,
  ]);

  const transactionSearchOptions = useMemo(
    () => ({
      getSearchValues: (transaction: import("@/utils/Types").Transaction) => [
        transaction.title,
        transaction.category,
        transaction.account,
        transaction.notes,
        transaction.date,
        transaction.amount,
        ...(transaction.tags ?? []),
      ],
    }),
    [],
  );

  const isSearchAwaitingInput =
    searchVisible && trimmedSearchQuery.length === 0;
  const searchSourceTransactions = isSearchAwaitingInput
    ? { expense: [], income: [] }
    : scopedTransactions;

  const visibleExpenseTransactions = useAbstractSearch(
    searchSourceTransactions.expense,
    transactionSearchQuery,
    transactionSearchOptions,
  );
  const visibleIncomeTransactions = useAbstractSearch(
    searchSourceTransactions.income,
    transactionSearchQuery,
    transactionSearchOptions,
  );

  const hasVisibleTransactions =
    visibleExpenseTransactions.length > 0 ||
    visibleIncomeTransactions.length > 0;
  const scopeSearchHint =
    transactionSearchScope === "all"
      ? "your full transaction history"
      : transactionSearchScope === "month"
        ? "the selected month"
        : "the selected day";

  const flatListItems = useMemo<TransactionListItem[]>(() => {
    const groups = [
      visibleExpenseTransactions,
      visibleIncomeTransactions,
    ].filter((group) => group.length > 0);
    const rows: TransactionListItem[] = [];

    groups.forEach((group, groupIndex) => {
      group.forEach((transaction, index) => {
        const isFirst = index === 0;
        const isLast = index === group.length - 1;
        const groupPosition: TransactionGroupPosition =
          group.length === 1
            ? "single"
            : isFirst
              ? "first"
              : isLast
                ? "last"
                : "middle";

        rows.push({
          type: "transaction",
          key: transaction.id,
          transaction,
          groupPosition,
          showDivider: !isLast,
        });
      });

      if (groupIndex < groups.length - 1) {
        rows.push({
          type: "spacer",
          key: `spacer-${groupIndex}`,
        });
      }
    });

    return rows;
  }, [visibleExpenseTransactions, visibleIncomeTransactions]);

  const handleAddTransaction = useCallback(() => {
    onAddPress(activeTab, selectedDate);
  }, [activeTab, onAddPress, selectedDate]);

  useEffect(() => {
    if (!isFocused) {
      return;
    }
    setTabBarEdgeButton({
      right: {
        label: "Add",
        accessibilityLabel: "Add transaction",
        onPress: handleAddTransaction,
        icon: ({ color, size }) => (
          <MaterialCommunityIcons name="plus" color={color} size={size} />
        ),
      },
    });
    return () => setTabBarEdgeButton(null);
  }, [handleAddTransaction, isFocused, setTabBarEdgeButton]);

  const renderTransactionItem = useCallback(
    ({ item }: { item: TransactionListItem }) => {
      if (item.type === "spacer") {
        return <View style={{ height: 14 }} />;
      }

      return (
        <View style={{ marginHorizontal: 20 }}>
          <TransactionRow
            transaction={item.transaction}
            onPressTransaction={onEdit}
            grouped
            groupPosition={item.groupPosition}
            showDivider={item.showDivider}
          />
        </View>
      );
    },
    [onEdit],
  );

  const listEmptyState = useMemo(() => {
    if (isSearchAwaitingInput) {
      return (
        <View style={mobileLayoutStyles.emptyStateWrap}>
          <EmptyState
            icon="magnify"
            title="Search is ready"
            subtitle={`Type something to search across ${scopeSearchHint}.`}
          />
        </View>
      );
    }

    if (trimmedSearchQuery && !hasVisibleTransactions) {
      return (
        <View style={mobileLayoutStyles.emptyStateWrap}>
          <EmptyState
            icon="magnify-close"
            title="No matching transactions"
            subtitle="Try a different keyword or widen the search scope."
          />
        </View>
      );
    }

    return (
      <View style={mobileLayoutStyles.emptyStateWrap}>
        <EmptyState
          icon="inbox-outline"
          title="No transactions yet"
          subtitle={
            "Looks empty in here.\nAdd your first transaction to get started."
          }
          hint="Add a New transaction"
          onHintPress={handleAddTransaction}
        />
      </View>
    );
  }, [
    handleAddTransaction,
    hasVisibleTransactions,
    isSearchAwaitingInput,
    scopeSearchHint,
    trimmedSearchQuery,
  ]);

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        style={{ flex: 1 }}
        data={flatListItems}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.key}
        ListEmptyComponent={listEmptyState}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={7}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={Platform.OS === "android"}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: 15, paddingBottom: usableSpace }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
