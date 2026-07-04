import { useStagger } from "@/components/animations/UseStagger";
import { EmptyState } from "@/components/EmptyStates";
import { SectionLabel } from "@/components/SectionLabel";
import {
  useSetTabBarEdgeButton,
  useTabBarHeight,
} from "@/components/tabbar/TabBarContext";
import { useAppSelector } from "@/hooks/Redux";
import { useAbstractSearch } from "@/hooks/use-abstract-search";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import { HeroCard } from "@/modules/Insights/Components/Cards/HeroCard";
import { formatAmount, formatShortDay } from "@/modules/Insights/Utils";
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
  Animated,
  FlatList,
  LayoutAnimation,
  Platform,
  UIManager,
  View,
} from "react-native";
import { useTheme } from "react-native-paper";
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
  animIndex: number;
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
  onTransactionSearchQueryChange,
  transactionSearchScope,
  onTransactionSearchScopeChange,
  searchVisible,
  onEdit,
  onAddPress,
  allEmpty,
  selectedDate: propsSelectedDate,
}: Props) {
  const theme = useTheme();
  const activeWorkspace = useAppSelector(selectActiveWorkspace);
  const setTabBarEdgeButton = useSetTabBarEdgeButton();
  const isFocused = useIsFocused();
  const tabBarHeight = useTabBarHeight();
  const { bottom } = useSafeAreaInsets();
  const usableSpace = tabBarHeight + bottom + 60;
  const currencyCode = activeWorkspace?.currencyCode ?? "INR";
  const currencySymbol = activeWorkspace?.currencySymbol ?? "";
  const todayKey = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

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

  const dayTransactions = useMemo(
    () => ({
      expense: filteredExpenseTransactions.filter(
        (t) => t.date === selectedDate,
      ),
      income: filteredIncomeTransactions.filter((t) => t.date === selectedDate),
    }),
    [filteredExpenseTransactions, filteredIncomeTransactions, selectedDate],
  );

  const dayExpenseTotal = useMemo(
    () =>
      dayTransactions.expense.reduce(
        (sum, transaction) => sum + Math.abs(transaction.amount),
        0,
      ),
    [dayTransactions.expense],
  );

  const dayIncomeTotal = useMemo(
    () =>
      dayTransactions.income.reduce(
        (sum, transaction) => sum + Math.abs(transaction.amount),
        0,
      ),
    [dayTransactions.income],
  );

  const isToday = selectedDate === todayKey;

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
  const totalVisibleTransactionCount =
    visibleExpenseTransactions.length + visibleIncomeTransactions.length;
  const averageSpendPerDay = useMemo(() => {
    if (visibleExpenseTransactions.length === 0) {
      return 0;
    }

    const activeExpenseDates = new Set(
      visibleExpenseTransactions
        .map((transaction) => transaction.date)
        .filter((date): date is string => Boolean(date)),
    );

    if (activeExpenseDates.size === 0) {
      return 0;
    }

    const totalVisibleExpense = visibleExpenseTransactions.reduce(
      (sum, transaction) => sum + Math.abs(transaction.amount),
      0,
    );

    return totalVisibleExpense / activeExpenseDates.size;
  }, [visibleExpenseTransactions]);
  const shouldAnimateRows =
    totalVisibleTransactionCount > 0 && totalVisibleTransactionCount <= 24;
  const scopeLabel =
    transactionSearchScope === "all"
      ? "ALL"
      : transactionSearchScope === "month"
        ? "MONTH"
        : "DAY";
  const scopeSearchHint =
    transactionSearchScope === "all"
      ? "your full transaction history"
      : transactionSearchScope === "month"
        ? "the selected month"
        : "the selected day";
  const sectionLabel = isSearchAwaitingInput
    ? `SEARCH · ${scopeLabel}`
    : trimmedSearchQuery
      ? `SEARCH RESULTS · ${scopeLabel}`
      : transactionSearchScope === "all"
        ? "ALL TRANSACTIONS"
        : transactionSearchScope === "month"
          ? "MONTH TRANSACTIONS"
          : "TODAY'S TRANSACTIONS";

  const flatListItems = useMemo<TransactionListItem[]>(() => {
    const groups = [
      visibleExpenseTransactions,
      visibleIncomeTransactions,
    ].filter((group) => group.length > 0);
    const rows: TransactionListItem[] = [];
    let animIndex = 0;

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
          animIndex,
        });
        animIndex += 1;
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

  const { getAnimStyle } = useStagger({
    count: shouldAnimateRows ? totalVisibleTransactionCount : 0,
    dataKey: shouldAnimateRows
      ? `${selectedDate}-${transactionSearchScope}-${flatListItems
          .filter(
            (item): item is TransactionListRowItem =>
              item.type === "transaction",
          )
          .map((item) => item.transaction.id)
          .join(",")}`
      : `${selectedDate}-${transactionSearchScope}-static`,
    stagger: 45,
    distance: 12,
    duration: 260,
    baseDelay: 80,
    autoPlay: shouldAnimateRows,
  });

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

      const wrapperStyle = shouldAnimateRows
        ? getAnimStyle(item.animIndex)
        : undefined;

      return (
        <Animated.View
          style={[
            wrapperStyle,
            {
              marginHorizontal: 20,
            },
          ]}
        >
          <TransactionRow
            transaction={item.transaction}
            onPressTransaction={onEdit}
            grouped
            groupPosition={item.groupPosition}
            showDivider={item.showDivider}
          />
        </Animated.View>
      );
    },
    [getAnimStyle, onEdit, shouldAnimateRows],
  );

  const listHeader = useMemo(
    () => (
      <>
        <HeroCard
          style={mobileLayoutStyles.summaryCardSpacing}
          summaryLabel={
            isToday
              ? "Today Summary"
              : `${formatShortDay(selectedDate)} Summary`
          }
          left={{
            label: "Expense",
            value: formatAmount(dayExpenseTotal, currencyCode, currencySymbol),
            caption: "spent",
          }}
          middle={{
            label: "Income",
            value: formatAmount(dayIncomeTotal, currencyCode, currencySymbol),
            caption: "earned",
          }}
          right={{
            label: "Avg Spend",
            value: formatAmount(
              averageSpendPerDay,
              currencyCode,
              currencySymbol,
            ),
            caption: "per day",
          }}
          accentColor={theme.colors.primary}
          outline={theme.colors.outline}
          textColor={theme.colors.onSurface}
          muted={theme.colors.onSurfaceVariant}
        />
        <SectionLabel label={sectionLabel} theme={theme} />
      </>
    ),
    [
      currencyCode,
      currencySymbol,
      averageSpendPerDay,
      dayExpenseTotal,
      dayIncomeTotal,
      isToday,
      sectionLabel,
      selectedDate,
      theme,
    ],
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
        ListHeaderComponent={listHeader}
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
