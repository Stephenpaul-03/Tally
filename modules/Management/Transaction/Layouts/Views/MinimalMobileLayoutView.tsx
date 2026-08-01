import { EmptyState } from "@/components/EmptyStates";
import { useSharedTabHeader } from "@/components/pageheader/SharedTabHeader";
import { UniversalSearchBar } from "@/components/UniversalSearchBar";
import {
  useSetTabBarEdgeButton,
  useTabBarHeight,
} from "@/components/tabbar/TabBarContext";
import { useAppSelector } from "@/hooks/Redux";
import { useAbstractSearch } from "@/hooks/use-abstract-search";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import { formatAmount, formatShortDay } from "@/modules/Insights/Utils";
import { type TransactionSearchScope } from "@/modules/Management/Transaction/Components/SearchScopeSheet";
import {
  TransactionRow,
  type TransactionGroupPosition,
} from "@/modules/Management/Transaction/Components/TransactionRow";
import { TransactionSectionHeader } from "@/modules/Management/Transaction/Components/TransactionSectionHeader";
import { palette } from "@/theme/color_palette";
import { typography } from "@/theme/typography";
import type { Transaction, TransactionType } from "@/utils/Types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  FlatList,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  UIManager,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { Text, useTheme } from "react-native-paper";
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

type TransactionListSectionCardItem = {
  type: "section-card";
  key: string;
  title: string;
  total: number;
  transactions: Transaction[];
};

type TransactionListItem =
  | TransactionListRowItem
  | TransactionListSpacerItem
  | TransactionListSectionCardItem;

interface Props {
  colors: ColorsShape;
  rangeLabel: string;
  incomeTotal: number;
  expenseTotal: number;
  netBalance: number;
  overallBudget: number;
  activeTab: TransactionType;
  allEmpty: boolean;
  incomeTransactions: Transaction[];
  expenseTransactions: Transaction[];
  filteredExpenseTransactions: Transaction[];
  filteredIncomeTransactions: Transaction[];
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
  onOpenScopeSheet?: () => void;
}

type SummaryMetric = {
  label: string;
  value: string;
  caption: string;
};

const STICKY_VERTICAL_CHROME = 16;
const FALLBACK_GREETING_CARD_HEIGHT = 72;
const FALLBACK_COLLAPSED_HEADER_HEIGHT = 220;
const FALLBACK_COLLAPSED_HEADER_HEIGHT_WITH_SEARCH = 286;

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function getGreeting() {
  const tod = getTimeOfDay();
  if (tod === "morning") return "Good Morning";
  if (tod === "afternoon") return "Good Afternoon";
  if (tod === "evening") return "Good Evening";
  return "Good Night";
}

function getDateLabel() {
  const now = new Date();
  const day = now.getDate();
  const month = now.toLocaleString("en-IN", { month: "long" });
  const v = day % 100;
  const s = ["th", "st", "nd", "rd"];
  const suffix = s[(v - 20) % 10] ?? s[v] ?? s[0];
  return `${day}${suffix} ${month}`;
}

function getTimeIcon(): React.ComponentProps<
  typeof MaterialCommunityIcons
>["name"] {
  const tod = getTimeOfDay();
  if (tod === "morning") return "weather-sunset-up";
  if (tod === "afternoon") return "weather-sunny";
  if (tod === "evening") return "weather-sunset-down";
  return "weather-night";
}

function SummaryColumn({
  metric,
  muted,
}: {
  metric: SummaryMetric;
  muted: string;
}) {
  const theme = useTheme();
  const isNegativeValue = metric.value.includes("-");

  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={[local.metricLabel, { color: muted }]}>
        {metric.label}
      </Text>
      <Text
        style={[
          local.metricValue,
          { color: isNegativeValue ? theme.colors.error : theme.colors.onSurface },
        ]}
      >
        {metric.value}
      </Text>
      <Text style={[local.metricCaption, { color: muted }]}>
        {metric.caption}
      </Text>
    </View>
  );
}

function formatDateTitle(dateKey: string, todayKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  const day = date.getDate();
  const month = new Intl.DateTimeFormat("en-IN", { month: "short" }).format(
    date,
  );
  if (dateKey === todayKey) {
    return `Today • ${day} ${month}`;
  }
  return `${day} ${month}`;
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
  onEdit,
  onAddPress,
  selectedDate: propsSelectedDate,
  onDateSelect,
}: Props) {
  const theme = useTheme();
  const [collapsedHeaderHeight, setCollapsedHeaderHeight] = useState(0);
  const [greetingCardHeight, setGreetingCardHeight] = useState(0);
  const [searchStripOpen, setSearchStripOpen] = useState(false);
  const activeWorkspace = useAppSelector(selectActiveWorkspace);
  const setTabBarEdgeButton = useSetTabBarEdgeButton();
  const isFocused = useIsFocused();
  const tabBarHeight = useTabBarHeight();
  const { bottom } = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const searchStripProgress = useRef(new Animated.Value(0)).current;
  const usableSpace = tabBarHeight + bottom + 60;
  const currencyCode = activeWorkspace?.currencyCode ?? "INR";
  const currencySymbol = activeWorkspace?.currencySymbol ?? "";
  const ownerName = activeWorkspace?.ownerName?.trim() || null;
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
  const greetingOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 12, 56],
        outputRange: [1, 0.45, 0],
        extrapolate: "clamp",
      }),
    [scrollY],
  );
  const greetingTranslateY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 56],
        outputRange: [0, -12],
        extrapolate: "clamp",
      }),
    [scrollY],
  );
  const resolvedGreetingCardHeight =
    greetingCardHeight || FALLBACK_GREETING_CARD_HEIGHT;
  const resolvedCollapsedHeaderHeight =
    collapsedHeaderHeight ||
    (searchStripOpen
      ? FALLBACK_COLLAPSED_HEADER_HEIGHT_WITH_SEARCH
      : FALLBACK_COLLAPSED_HEADER_HEIGHT);
  const collapseDistance = useMemo(
    () => resolvedGreetingCardHeight + 14,
    [resolvedGreetingCardHeight],
  );
  const expandedHeaderHeight = useMemo(
    () => resolvedCollapsedHeaderHeight + collapseDistance,
    [resolvedCollapsedHeaderHeight, collapseDistance],
  );
  const stickyContentMarginTop = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, Math.max(collapseDistance, 1)],
        outputRange: [collapseDistance, 0],
        extrapolate: "clamp",
      }),
    [collapseDistance, scrollY],
  );
  const listTopSpacerHeight = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, Math.max(collapseDistance, 1)],
        outputRange: [
          expandedHeaderHeight + STICKY_VERTICAL_CHROME,
          resolvedCollapsedHeaderHeight + STICKY_VERTICAL_CHROME,
        ],
        extrapolate: "clamp",
      }),
    [
      collapseDistance,
      expandedHeaderHeight,
      resolvedCollapsedHeaderHeight,
      scrollY,
    ],
  );
  const searchStripHeight = useMemo(
    () =>
      searchStripProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 52],
        extrapolate: "clamp",
      }),
    [searchStripProgress],
  );
  const searchStripOpacity = useMemo(
    () =>
      searchStripProgress.interpolate({
        inputRange: [0, 0.35, 1],
        outputRange: [0, 0.55, 1],
        extrapolate: "clamp",
      }),
    [searchStripProgress],
  );
  const searchStripTranslateY = useMemo(
    () =>
      searchStripProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [-8, 0],
        extrapolate: "clamp",
      }),
    [searchStripProgress],
  );

  useEffect(() => {
    if (trimmedSearchQuery.length > 0) {
      setSearchStripOpen(true);
    }
  }, [trimmedSearchQuery.length]);

  useEffect(() => {
    Animated.timing(searchStripProgress, {
      toValue: searchStripOpen ? 1 : 0,
      duration: searchStripOpen ? 220 : 180,
      useNativeDriver: false,
    }).start();
  }, [searchStripOpen, searchStripProgress]);

  const headerSearchButton = useMemo(
    () => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          searchStripOpen ? "Hide transaction search" : "Show transaction search"
        }
        onPress={() => setSearchStripOpen((prev) => !prev)}
        style={({ pressed }) => [
          local.headerIconButton,
          {
            backgroundColor: pressed
              ? theme.colors.surfaceVariant
              : theme.colors.surface,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={searchStripOpen ? "close" : "magnify"}
          size={18}
          color={theme.colors.onSurface}
        />
      </Pressable>
    ),
    [
      searchStripOpen,
      theme.colors.onSurface,
      theme.colors.surface,
      theme.colors.surfaceVariant,
    ],
  );

  useSharedTabHeader(
    transactionSearchScope === "month"
      ? {
          variant: "basic",
          title: "Tally",
          backgroundColor: theme.colors.background,
          rightSlot: headerSearchButton,
        }
      : {
          variant: "date",
          title: "Tally",
          selectedDate,
          onDateSelect: onDateSelect ?? (() => {}),
          initialPickerMode: "day-strip",
          backgroundColor: theme.colors.background,
          rightSlot: headerSearchButton,
        },
  );

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
  }, [searchStripOpen]);

  const handleListScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentY = event.nativeEvent.contentOffset.y;
      scrollY.setValue(currentY);
    },
    [scrollY],
  );

  const scopedTransactions = useMemo(() => {
    const matchScope = (transaction: Transaction) => {
      if (transactionSearchScope === "all") return true;
      const date = transaction.date ?? "";
      if (transactionSearchScope === "month")
        return date.startsWith(selectedMonthKey);
      return date === selectedDate;
    };

    const baseExpense =
      transactionSearchScope === "all"
        ? expenseTransactions
        : filteredExpenseTransactions;
    const baseIncome =
      transactionSearchScope === "all"
        ? incomeTransactions
        : filteredIncomeTransactions;

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
      getSearchValues: (transaction: Transaction) => [
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
    searchStripOpen && trimmedSearchQuery.length === 0;
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
  const averageSpendPerDay = useMemo(() => {
    if (visibleExpenseTransactions.length === 0) return 0;
    const activeExpenseDates = new Set(
      visibleExpenseTransactions
        .map((transaction) => transaction.date)
        .filter((date): date is string => Boolean(date)),
    );
    if (activeExpenseDates.size === 0) return 0;
    const totalVisibleExpense = visibleExpenseTransactions.reduce(
      (sum, transaction) => sum + Math.abs(transaction.amount),
      0,
    );
    return totalVisibleExpense / activeExpenseDates.size;
  }, [visibleExpenseTransactions]);
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

  const monthSections = useMemo(() => {
    const grouped = new Map<string, Transaction[]>();
    const source =
      trimmedSearchQuery.length > 0
        ? [...visibleExpenseTransactions, ...visibleIncomeTransactions]
        : [...scopedTransactions.expense, ...scopedTransactions.income];

    source.forEach((transaction) => {
      if (!transaction.date) return;
      const group = grouped.get(transaction.date) ?? [];
      group.push(transaction);
      grouped.set(transaction.date, group);
    });

    return [...grouped.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateKey, transactions]) => ({
        key: dateKey,
        title: formatDateTitle(dateKey, todayKey),
        total: transactions.reduce(
          (sum, transaction) => sum + transaction.amount,
          0,
        ),
        transactions,
      }));
  }, [
    scopedTransactions.expense,
    scopedTransactions.income,
    todayKey,
    trimmedSearchQuery.length,
    visibleExpenseTransactions,
    visibleIncomeTransactions,
  ]);

  const flatListItems = useMemo<TransactionListItem[]>(() => {
    if (transactionSearchScope === "day") {
      const rows: TransactionListItem[] = [];
      [...visibleExpenseTransactions, ...visibleIncomeTransactions].forEach(
        (transaction, index, arr) => {
          const isLast = index === arr.length - 1;
          rows.push({
            type: "transaction",
            key: transaction.id,
            transaction,
            groupPosition:
              arr.length === 1
                ? "single"
                : index === 0
                  ? "first"
                  : isLast
                    ? "last"
                    : "middle",
            showDivider: !isLast,
          });
        },
      );
      return rows;
    }

    const rows: TransactionListItem[] = [];
    monthSections.forEach((section, sectionIndex) => {
      rows.push({
        type: "section-card",
        key: `section-card-${section.key}`,
        title: section.title,
        total: section.total,
        transactions: section.transactions,
      });
      if (sectionIndex < monthSections.length - 1) {
        rows.push({ type: "spacer", key: `spacer-${section.key}` });
      }
    });
    return rows;
  }, [
    monthSections,
    transactionSearchScope,
    visibleExpenseTransactions,
    visibleIncomeTransactions,
  ]);

  const handleAddTransaction = useCallback(() => {
    onAddPress(activeTab, selectedDate);
  }, [activeTab, onAddPress, selectedDate]);

  useEffect(() => {
    if (!isFocused) return;
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

      if (item.type === "section-card") {
        return (
          <TransactionSectionHeader
            title={item.title}
            total={item.total}
            currencyCode={currencyCode}
            currencySymbol={currencySymbol}
          >
            {item.transactions.map((transaction, index) => {
              const isLast = index === item.transactions.length - 1;
              return (
                <View key={transaction.id}>
                  <TransactionRow
                    transaction={transaction}
                    onPressTransaction={onEdit}
                    grouped
                    groupPosition={
                      item.transactions.length === 1
                        ? "single"
                        : index === 0
                          ? "first"
                          : isLast
                            ? "last"
                            : "middle"
                    }
                    showDivider={!isLast}
                  />
                </View>
              );
            })}
          </TransactionSectionHeader>
        );
      }

      return null;
    },
    [currencyCode, currencySymbol, onEdit],
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
      <Animated.View
        style={[
          local.stickyHeaderWrap,
          {
            backgroundColor: theme.colors.background,
            height: listTopSpacerHeight,
          },
        ]}
      >
        <Animated.View
          onLayout={(e) => setGreetingCardHeight(e.nativeEvent.layout.height)}
          style={[
            local.greetingCard,
            {
              position: "absolute",
              top: 0,
              left: 20,
              right: 20,
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline,
              opacity: greetingOpacity,
              transform: [{ translateY: greetingTranslateY }],
            },
          ]}
        >
          <View style={local.greetingTopRow}>
            <View style={local.greetingTextRow}>
              <MaterialCommunityIcons
                name={getTimeIcon()}
                size={16}
                color={theme.colors.primary}
              />
              <Text style={[local.greetingText, { color: theme.colors.onSurface }]}>
                {getGreeting()}
                {ownerName ? (
                  <Text
                    style={[
                      local.greetingText,
                      { color: theme.colors.primary },
                    ]}
                  >
                    {`, ${ownerName}`}
                  </Text>
                ) : null}
              </Text>
            </View>

            <View style={local.greetingDateRow}>
              <MaterialCommunityIcons
                name="calendar-outline"
                size={13}
                color={theme.colors.onSurfaceVariant}
              />
              <Text
                style={[
                  local.greetingDateLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {getDateLabel()}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          onLayout={(e) => setCollapsedHeaderHeight(e.nativeEvent.layout.height)}
          style={[
            local.collapsibleStickyContent,
            {
              marginTop: stickyContentMarginTop,
            },
          ]}
        >
          <View
            style={[
              local.summaryCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outline,
              },
            ]}
          >
            <View
              style={[
                local.summaryBadge,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outline,
                },
              ]}
            >
              <Text
                style={[local.summaryBadgeText, { color: theme.colors.primary }]}
              >
                {transactionSearchScope === "day"
                  ? selectedDate === todayKey
                    ? "Today Summary"
                    : `${formatShortDay(selectedDate)} Summary`
                  : "Month Summary"}
              </Text>
            </View>

            <View style={local.summaryMetricsRow}>
              <SummaryColumn
                metric={{
                  label: "Expense",
                  value: formatAmount(
                    Math.abs(
                      visibleExpenseTransactions.reduce(
                        (sum, t) => sum + Math.abs(t.amount),
                        0,
                      ),
                    ),
                    currencyCode,
                    currencySymbol,
                  ),
                  caption: "spent",
                }}
                muted={theme.colors.onSurfaceVariant}
              />
              <View
                style={[
                  local.summaryDivider,
                  { backgroundColor: theme.colors.outline },
                ]}
              />
              <SummaryColumn
                metric={{
                  label: "Income",
                  value: formatAmount(
                    Math.abs(
                      visibleIncomeTransactions.reduce(
                        (sum, t) => sum + Math.abs(t.amount),
                        0,
                      ),
                    ),
                    currencyCode,
                    currencySymbol,
                  ),
                  caption: "earned",
                }}
                muted={theme.colors.onSurfaceVariant}
              />
              <View
                style={[
                  local.summaryDivider,
                  { backgroundColor: theme.colors.outline },
                ]}
              />
              <SummaryColumn
                metric={{
                  label: "Avg Spend",
                  value: formatAmount(
                    averageSpendPerDay,
                    currencyCode,
                    currencySymbol,
                  ),
                  caption: "per day",
                }}
                muted={theme.colors.onSurfaceVariant}
              />
            </View>
          </View>

          <Animated.View
            pointerEvents={searchStripOpen ? "auto" : "none"}
            style={[
              local.searchStripWrap,
              {
                height: searchStripHeight,
                opacity: searchStripOpacity,
                transform: [{ translateY: searchStripTranslateY }],
              },
            ]}
          >
            <View style={local.searchStripInner}>
              <UniversalSearchBar
                bg={theme.colors.surfaceVariant}
                value={transactionSearchQuery}
                onChangeText={onTransactionSearchQueryChange}
                placeholder="Search transactions..."
                autoFocus={searchStripOpen}
                containerStyle={local.searchStripBar}
              />
            </View>
          </Animated.View>

          <View style={local.sectionLabelWrap}>
            <View
              style={[
                local.sectionLabelLine,
                { backgroundColor: theme.colors.outlineVariant },
              ]}
            />
            <Text
              style={[
                local.centerSectionLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {sectionLabel}
            </Text>
            <View
              style={[
                local.sectionLabelLine,
                { backgroundColor: theme.colors.outlineVariant },
              ]}
            />
          </View>
        </Animated.View>
      </Animated.View>

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
        ListHeaderComponent={
          <Animated.View style={{ height: listTopSpacerHeight }} />
        }
        onScroll={handleListScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingBottom: usableSpace,
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const local = StyleSheet.create({
  stickyHeaderWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 10,
    gap: 14,
  },
  headerIconButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  greetingCard: {
    borderRadius: 20,
    borderWidth: 0.5,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  greetingTopRow: {
    gap: 10,
  },
  greetingTextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  greetingText: {
    ...typography.editorial.sectionLabel,
    fontSize: 14,
    lineHeight: 20,
    flexShrink: 1,
  },
  greetingDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  greetingDateLabel: {
    ...typography.editorial.sectionLabel,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  collapsibleStickyContent: {
    gap: 14,
  },
  summaryCard: {
    borderRadius: 20,
    borderWidth: 0.5,
    paddingHorizontal: 10,
    paddingVertical: 20,
    position: "relative",
  },
  summaryBadge: {
    position: "absolute",
    top: -9,
    alignSelf: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 0.5,
    borderRadius: 20,
  },
  summaryBadgeText: {
    fontSize: 9,
    lineHeight: 14,
    fontWeight: "500",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  summaryMetricsRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  summaryDivider: {
    width: 0.5,
    marginHorizontal: 8,
  },
  metricLabel: {
    borderColor: palette.transparent,
    borderWidth: 0.5,
    fontSize: 10,
    lineHeight: 18,
    fontWeight: "400",
    letterSpacing: 0.5,
    textAlign: "center",
    textTransform: "uppercase",
  },
  metricValue: {
    ...typography.editorial.sectionLabel,
    fontSize: 20,
    lineHeight: 32,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  metricCaption: {
    fontSize: 10,
    lineHeight: 20,
    textAlign: "center",
  },
  searchStripWrap: {
    marginTop: -2,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  searchStripInner: {
    paddingTop: 2,
  },
  searchStripBar: {
    marginHorizontal: 0,
  },
  sectionLabelWrap: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  sectionLabelLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  centerSectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    opacity: 0.6,
  },
});
