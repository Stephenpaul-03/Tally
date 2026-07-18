import { AlertModal } from "@/components/alert/AlertModal";
import { useAppShell } from "@/components/AppShellContext";
import { EmptyState } from "@/components/EmptyStates";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { InlineCalendar } from "@/components/pageheader/Inlinecalendar";
import {
  useSetTabBarEdgeButton,
  useSetTabBarHidden,
  useTabBarHeight,
} from "@/components/tabbar/TabBarContext";
import { useTabBarModePreference } from "@/components/tabbar/TabBarModePreference";
import { useAppSelector } from "@/hooks/Redux";
import {
  selectAccountColors,
  selectAccountIcons,
  selectCategoryColors,
  selectCategoryIcons,
  selectTransactionDrafts,
} from "@/modules/Core/Slices/TransactionSlice";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import { HeroCard } from "@/modules/Insights/Components/Cards/HeroCard";
import { formatAmount } from "@/modules/Insights/Utils";
import { AccountManagementModal } from "@/modules/Management/Account/Index";
import { CategoryManagementModal } from "@/modules/Management/Category/Index";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { typography } from "@/theme/typography";
import {
  getAccountColor,
  getAccountIconName,
  getCategoryColor,
  getCategoryIconName,
} from "@/utils/Helpers";
import type {
  Transaction,
  TransactionDraft,
  TransactionType,
} from "@/utils/Types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  useIsFocused,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { Text, useTheme } from "react-native-paper";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { TransactionModal } from "./Components/TransactionModal/Index";
import { TransactionRow } from "./Components/TransactionRow";
import { TransactionSectionHeader } from "./Components/TransactionSectionHeader";
import { useTransactionsPage } from "./Hooks";
import { GestureDualCardLayoutView } from "./Layouts/Views/GestureDualCardLayoutView";
import { styles } from "./Styles";

type TransactionsProps = {
  initialSelectedDate?: string;
};

type MonthSection = {
  key: string;
  title: string;
  total: number;
  totalLabel?: string;
  metric?: "spent" | "earned";
  transactions: (Transaction | TransactionDraft)[];
};

const TAB_BAR_TRANSACTION_LIST_CLEARANCE = 60;
const NO_TAB_BAR_TRANSACTION_LIST_CLEARANCE = 24;
const TRANSACTION_LIST_HORIZONTAL_TRIM = 6;
const TRANSACTION_TIMELINE_LAYER_WIDTH = 10;
const TRANSACTION_TIMELINE_STROKE_WIDTH = 1;
const TRANSACTION_TIMELINE_RAIL_LEFT =
  (TRANSACTION_TIMELINE_LAYER_WIDTH - TRANSACTION_TIMELINE_STROKE_WIDTH) / 2;

type TransactionSortField =
  | "date"
  | "amount"
  | "title"
  | "category"
  | "account"
  | "type";
type TransactionSortDirection = "asc" | "desc";

type TransactionSortConfig = {
  field: TransactionSortField;
  direction: TransactionSortDirection;
};

type FilterOptionMeta = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
};

type TransactionViewFilters = {
  type: "all" | TransactionType;
  category: string | null;
  account: string | null;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
};

const DEFAULT_VIEW_FILTERS: TransactionViewFilters = {
  type: "all",
  category: null,
  account: null,
  startDate: "",
  endDate: "",
  minAmount: "",
  maxAmount: "",
};

const DEFAULT_SORT_CONFIG: TransactionSortConfig = {
  field: "date",
  direction: "desc",
};

const SORT_FIELD_OPTIONS: {
  field: TransactionSortField;
  label: string;
  description: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
}[] = [
  {
    field: "date",
    label: "Day",
    description: "Group and order by transaction date",
    icon: "calendar-month-outline",
  },
  {
    field: "amount",
    label: "Amount",
    description: "Put larger or smaller transactions first",
    icon: "cash",
  },
  {
    field: "title",
    label: "Title",
    description: "Alphabetize by transaction title",
    icon: "sort-alphabetical-ascending",
  },
  {
    field: "category",
    label: "Category",
    description: "Cluster similar spending categories",
    icon: "tag-outline",
  },
  {
    field: "account",
    label: "Account",
    description: "Sort by payment source",
    icon: "credit-card-outline",
  },
  {
    field: "type",
    label: "Type",
    description: "Separate income and expenses",
    icon: "swap-vertical",
  },
];

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateTitle(dateKey: string, todayKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  const day = date.getDate();
  const month = new Intl.DateTimeFormat("en-IN", { month: "long" }).format(
    date,
  );
  if (dateKey === todayKey) {
    return `Today • ${day} ${month}`;
  }
  const today = new Date(`${todayKey}T00:00:00`);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = [
    yesterday.getFullYear(),
    String(yesterday.getMonth() + 1).padStart(2, "0"),
    String(yesterday.getDate()).padStart(2, "0"),
  ].join("-");
  if (dateKey === yesterdayKey) {
    return `Yesterday • ${day} ${month}`;
  }
  return `${day} ${month}`;
}

function matchesViewFilters(
  transaction: Transaction,
  filters: TransactionViewFilters,
) {
  if (filters.type !== "all" && transaction.type !== filters.type) return false;
  if (filters.category && transaction.category !== filters.category)
    return false;
  if (filters.account && transaction.account !== filters.account) return false;
  if (filters.startDate && transaction.date < filters.startDate) return false;
  if (filters.endDate && transaction.date > filters.endDate) return false;

  const amount = Math.abs(transaction.amount);
  const minAmount = Number(filters.minAmount);
  const maxAmount = Number(filters.maxAmount);
  if (filters.minAmount && Number.isFinite(minAmount) && amount < minAmount) {
    return false;
  }
  if (filters.maxAmount && Number.isFinite(maxAmount) && amount > maxAmount) {
    return false;
  }

  return true;
}

function matchesTransactionSearch(transaction: Transaction, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return [
    transaction.title,
    transaction.category,
    transaction.account,
    transaction.notes,
    transaction.date,
    String(transaction.amount),
    transaction.type,
    ...(transaction.tags ?? []),
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedQuery));
}

function countActiveFilters(filters: TransactionViewFilters) {
  return [
    filters.type !== "all",
    Boolean(filters.category),
    Boolean(filters.account),
    Boolean(filters.startDate),
    Boolean(filters.endDate),
    Boolean(filters.minAmount),
    Boolean(filters.maxAmount),
  ].filter(Boolean).length;
}

function getSortValue(transaction: Transaction, field: TransactionSortField) {
  if (field === "amount") return Math.abs(transaction.amount);
  if (field === "date") return transaction.date ?? "";
  if (field === "type") return transaction.type;
  return String(transaction[field] ?? "").toLowerCase();
}

function compareTransactionsBySort(
  left: Transaction,
  right: Transaction,
  sortConfig: TransactionSortConfig,
) {
  const leftValue = getSortValue(left, sortConfig.field);
  const rightValue = getSortValue(right, sortConfig.field);
  const direction = sortConfig.direction === "asc" ? 1 : -1;

  if (typeof leftValue === "number" && typeof rightValue === "number") {
    return (leftValue - rightValue) * direction;
  }

  const compared = String(leftValue).localeCompare(String(rightValue));
  if (compared !== 0) return compared * direction;

  return (left.date ?? "").localeCompare(right.date ?? "") * -1;
}

function getSortFieldIcon(field: TransactionSortField) {
  return (
    SORT_FIELD_OPTIONS.find((option) => option.field === field)?.icon ??
    "sort-variant"
  );
}

function FilterChip({
  label,
  selected,
  onPress,
  icon,
  iconColor,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: FilterOptionMeta["icon"];
  iconColor?: string;
}) {
  const theme = useTheme();
  const resolvedIconColor = iconColor ?? theme.colors.onSurfaceVariant;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        local.filterChip,
        {
          backgroundColor: selected
            ? theme.colors.primaryContainer
            : theme.colors.surface,
          borderColor: selected
            ? theme.colors.primary
            : theme.colors.outlineVariant,
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      {icon ? (
        <View
          style={[
            local.filterChipIcon,
            { backgroundColor: `${resolvedIconColor}24` },
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={14}
            color={resolvedIconColor}
          />
        </View>
      ) : null}
      <Text
        style={[
          local.filterChipText,
          { color: selected ? theme.colors.primary : theme.colors.onSurface },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FilterInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "numeric";
}) {
  const theme = useTheme();
  return (
    <View style={local.filterInputWrap}>
      <Text
        style={[
          local.filterInputLabel,
          { color: theme.colors.onSurfaceVariant },
        ]}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        placeholderTextColor={theme.colors.onSurfaceVariant}
        style={[
          local.filterInput,
          {
            color: theme.colors.onSurface,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      />
    </View>
  );
}

function TransactionBottomSheet({
  visible,
  title,
  subtitle,
  onDismiss,
  onReset,
  children,
  footer,
  compact = false,
}: {
  visible: boolean;
  title: string;
  subtitle: string;
  onDismiss: () => void;
  onReset: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  compact?: boolean;
}) {
  const theme = useTheme();
  const { bottom } = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const panelHeight = Math.round(windowHeight * (compact ? 0.56 : 0.84));

  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onDismiss}
      presentation="sheet"
      includeBottomInset={false}
      contentContainerStyle={local.sheetModalContent}
    >
      <View
        style={[
          local.nativeSheetPanel,
          compact ? local.nativeSheetPanelCompact : null,
          {
            backgroundColor: theme.colors.background,
            height: panelHeight,
            paddingBottom: Math.max(16, bottom + 12),
          },
        ]}
      >
        <View
          style={[
            local.filterSheetHandle,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />
        <View style={local.sheetHeader}>
          <View style={local.sheetTitleWrap}>
            <Text
              style={[local.filterTitle, { color: theme.colors.onSurface }]}
            >
              {title}
            </Text>
            <Text
              style={[
                local.filterSubtitle,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {subtitle}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Reset ${title}`}
            onPress={onReset}
            style={({ pressed }) => [
              local.filterResetButton,
              {
                borderColor: theme.colors.outlineVariant,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text
              style={[local.filterResetText, { color: theme.colors.primary }]}
            >
              Reset
            </Text>
          </Pressable>
        </View>
        {children}
        {footer}
      </View>
    </AnimatedPaperModal>
  );
}

function TransactionFiltersModal({
  visible,
  draftFilters,
  categoryOptions,
  accountOptions,
  categoryMeta,
  accountMeta,
  onChange,
  onReset,
  onApply,
  onDismiss,
}: {
  visible: boolean;
  draftFilters: TransactionViewFilters;
  categoryOptions: string[];
  accountOptions: string[];
  categoryMeta: Record<string, FilterOptionMeta>;
  accountMeta: Record<string, FilterOptionMeta>;
  onChange: (filters: TransactionViewFilters) => void;
  onReset: () => void;
  onApply: () => void;
  onDismiss: () => void;
}) {
  const theme = useTheme();
  const [activeDateField, setActiveDateField] = React.useState<
    "startDate" | "endDate"
  >("startDate");
  const [categoryExpanded, setCategoryExpanded] = React.useState(false);
  const [accountExpanded, setAccountExpanded] = React.useState(false);
  const [calendarVisible, setCalendarVisible] = React.useState(false);
  const patch = (next: Partial<TransactionViewFilters>) =>
    onChange({ ...draftFilters, ...next });
  const activeDateValue = draftFilters[activeDateField] || getTodayKey();
  const visibleCategoryOptions = categoryExpanded
    ? categoryOptions
    : categoryOptions.slice(0, 6);
  const visibleAccountOptions = accountExpanded
    ? accountOptions
    : accountOptions.slice(0, 6);

  return (
    <TransactionBottomSheet
      visible={visible}
      title="Filters"
      subtitle="Narrow transactions by type, category, account, date, or amount."
      onDismiss={onDismiss}
      onReset={onReset}
      footer={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Apply transaction filters"
          onPress={onApply}
          style={({ pressed }) => [
            local.applyFiltersButton,
            {
              backgroundColor: theme.colors.primary,
              opacity: pressed ? 0.82 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="check"
            size={18}
            color={theme.colors.onPrimary}
          />
          <Text
            style={[local.applyFiltersText, { color: theme.colors.onPrimary }]}
          >
            Apply filters
          </Text>
        </Pressable>
      }
    >
      <ScrollView
        style={local.filterScrollFrame}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={local.filterScroll}
      >
        <View
          style={[
            local.filterSection,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text
            style={[
              local.filterSectionTitle,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Type
          </Text>
          <View style={local.chipWrap}>
            {(["all", "expense", "income"] as const).map((type) => (
              <FilterChip
                key={type}
                label={type === "all" ? "All" : type}
                selected={draftFilters.type === type}
                onPress={() => patch({ type })}
              />
            ))}
          </View>
        </View>

        <View
          style={[
            local.filterSection,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text
            style={[
              local.filterSectionTitle,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Category
          </Text>
          <View style={local.chipWrap}>
            <FilterChip
              label="All categories"
              selected={!draftFilters.category}
              onPress={() => patch({ category: null })}
            />
            {visibleCategoryOptions.map((category) => (
              <FilterChip
                key={category}
                label={category}
                icon={categoryMeta[category]?.icon}
                iconColor={categoryMeta[category]?.color}
                selected={draftFilters.category === category}
                onPress={() => patch({ category })}
              />
            ))}
          </View>
          {categoryOptions.length > visibleCategoryOptions.length ||
          categoryExpanded ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setCategoryExpanded((value) => !value)}
              style={local.expandFilterButton}
            >
              <Text
                style={[
                  local.expandFilterText,
                  { color: theme.colors.primary },
                ]}
              >
                {categoryExpanded ? "Show fewer" : "Show all categories"}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View
          style={[
            local.filterSection,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text
            style={[
              local.filterSectionTitle,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Account
          </Text>
          <View style={local.chipWrap}>
            <FilterChip
              label="All accounts"
              selected={!draftFilters.account}
              onPress={() => patch({ account: null })}
            />
            {visibleAccountOptions.map((account) => (
              <FilterChip
                key={account}
                label={account}
                icon={accountMeta[account]?.icon}
                iconColor={accountMeta[account]?.color}
                selected={draftFilters.account === account}
                onPress={() => patch({ account })}
              />
            ))}
          </View>
          {accountOptions.length > visibleAccountOptions.length ||
          accountExpanded ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setAccountExpanded((value) => !value)}
              style={local.expandFilterButton}
            >
              <Text
                style={[
                  local.expandFilterText,
                  { color: theme.colors.primary },
                ]}
              >
                {accountExpanded ? "Show fewer" : "Show all accounts"}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View
          style={[
            local.filterSection,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text
            style={[
              local.filterSectionTitle,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Date range
          </Text>
          <View style={local.dateRangeTabs}>
            {(["startDate", "endDate"] as const).map((field) => {
              const selected = activeDateField === field;
              return (
                <Pressable
                  key={field}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    setActiveDateField(field);
                    setCalendarVisible(true);
                  }}
                  style={[
                    local.dateRangeTab,
                    {
                      backgroundColor: selected
                        ? theme.colors.primaryContainer
                        : theme.colors.background,
                      borderColor: selected
                        ? theme.colors.primary
                        : theme.colors.outlineVariant,
                    },
                  ]}
                >
                  <Text
                    style={[
                      local.filterInputLabel,
                      {
                        color: selected
                          ? theme.colors.primary
                          : theme.colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    {field === "startDate" ? "From" : "To"}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      local.dateRangeValue,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    {draftFilters[field] || "Any date"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {calendarVisible ? (
            <InlineCalendar
              visible
              selectedDate={activeDateValue}
              backgroundColor={theme.colors.surface}
              onDateSelect={(date) => patch({ [activeDateField]: date })}
            />
          ) : null}
        </View>

        <View
          style={[
            local.filterSection,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text
            style={[
              local.filterSectionTitle,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Amount range
          </Text>
          <View style={local.filterInputRow}>
            <FilterInput
              label="Min"
              value={draftFilters.minAmount}
              onChangeText={(minAmount) => patch({ minAmount })}
              placeholder="0"
              keyboardType="numeric"
            />
            <FilterInput
              label="Max"
              value={draftFilters.maxAmount}
              onChangeText={(maxAmount) => patch({ maxAmount })}
              placeholder="1000"
              keyboardType="numeric"
            />
          </View>
        </View>
      </ScrollView>
    </TransactionBottomSheet>
  );
}

function TransactionSortModal({
  visible,
  sortConfig,
  onChange,
  onReset,
  onDismiss,
}: {
  visible: boolean;
  sortConfig: TransactionSortConfig;
  onChange: (sortConfig: TransactionSortConfig) => void;
  onReset: () => void;
  onDismiss: () => void;
}) {
  const theme = useTheme();
  const [draftSort, setDraftSort] =
    React.useState<TransactionSortConfig>(sortConfig);

  React.useEffect(() => {
    if (visible) setDraftSort(sortConfig);
  }, [sortConfig, visible]);

  const patch = (next: Partial<TransactionSortConfig>) =>
    setDraftSort((current) => ({ ...current, ...next }));

  const handleReset = () => {
    setDraftSort(DEFAULT_SORT_CONFIG);
    onReset();
  };

  const handleApply = () => {
    onChange(draftSort);
    onDismiss();
  };

  return (
    <TransactionBottomSheet
      visible={visible}
      title="Sort"
      subtitle="Change the order of days and transactions instantly."
      onDismiss={onDismiss}
      onReset={handleReset}
      compact
      footer={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Apply transaction sort"
          onPress={handleApply}
          style={({ pressed }) => [
            local.applyFiltersButton,
            {
              backgroundColor: theme.colors.primary,
              opacity: pressed ? 0.82 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="check"
            size={18}
            color={theme.colors.onPrimary}
          />
          <Text
            style={[local.applyFiltersText, { color: theme.colors.onPrimary }]}
          >
            Apply sort
          </Text>
        </Pressable>
      }
    >
      <ScrollView
        style={local.filterScrollFrame}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={local.sortScroll}
      >
        <View
          style={[
            local.filterSection,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text
            style={[
              local.filterSectionTitle,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Direction
          </Text>
          <View style={local.directionCard}>
            {(["asc", "desc"] as const).map((direction) => {
              const selected = draftSort.direction === direction;
              return (
                <Pressable
                  key={direction}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => patch({ direction })}
                  style={[
                    local.directionOption,
                    {
                      backgroundColor: selected
                        ? theme.colors.primaryContainer
                        : "transparent",
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      direction === "asc" ? "sort-ascending" : "sort-descending"
                    }
                    size={20}
                    color={
                      selected
                        ? theme.colors.primary
                        : theme.colors.onSurfaceVariant
                    }
                  />
                  <Text
                    style={[
                      local.sortOptionLabel,
                      {
                        color: selected
                          ? theme.colors.primary
                          : theme.colors.onSurface,
                      },
                    ]}
                  >
                    {direction === "asc" ? "Ascending" : "Descending"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View
          style={[
            local.filterSection,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text
            style={[
              local.filterSectionTitle,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Sort by
          </Text>
          <View style={local.sortOptionGrid}>
            {SORT_FIELD_OPTIONS.map((option) => {
              const selected = draftSort.field === option.field;
              return (
                <Pressable
                  key={option.field}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => patch({ field: option.field })}
                  style={({ pressed }) => [
                    local.sortOption,
                    {
                      backgroundColor: selected
                        ? theme.colors.primaryContainer
                        : theme.colors.surface,
                      borderColor: selected
                        ? theme.colors.primary
                        : theme.colors.outlineVariant,
                      opacity: pressed ? 0.72 : 1,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={option.icon}
                    size={20}
                    color={
                      selected
                        ? theme.colors.primary
                        : theme.colors.onSurfaceVariant
                    }
                  />
                  <View style={local.sortOptionCopy}>
                    <Text
                      numberOfLines={1}
                      style={[
                        local.sortOptionLabel,
                        { color: theme.colors.onSurface },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </TransactionBottomSheet>
  );
}

const TimelineDaySection = React.memo(function TimelineDaySection({
  item,
  currencyCode,
  currencySymbol,
  onPressTransaction,
  collapsed,
  onToggleCollapsed,
}: {
  item: MonthSection;
  currencyCode: string;
  currencySymbol: string;
  onPressTransaction: (id: string) => void;
  collapsed: boolean;
  onToggleCollapsed: (key: string) => void;
}) {
  return (
    <TransactionSectionHeader
      title={item.title}
      total={item.total}
      totalLabel={item.totalLabel}
      metric={item.metric}
      currencyCode={currencyCode}
      currencySymbol={currencySymbol}
      collapsed={collapsed}
      onToggleCollapsed={() => onToggleCollapsed(item.key)}
    >
      {item.transactions.map((transaction, index) => {
        const isLast = index === item.transactions.length - 1;
        return (
          <View key={transaction.id}>
            <TransactionRow
              transaction={transaction}
              onPressTransaction={onPressTransaction}
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
});

function TransactionTimelineFooter({
  height,
  color,
}: {
  height: number;
  color: string;
}) {
  if (height <= 0) return null;

  return (
    <View
      pointerEvents="none"
      style={[local.transactionTimelineFooter, { height }]}
    >
      <View
        style={[
          local.transactionTimelineFooterRail,
          { backgroundColor: color },
        ]}
      />
      <View
        style={[
          local.transactionTimelineFooterTopBorder,
          { backgroundColor: color },
        ]}
      />
    </View>
  );
}

export default function Transactions({
  initialSelectedDate,
}: TransactionsProps) {
  const theme = useTheme<ExtendedMD3Theme>();
  const { activeTab: shellActiveTab, activeTabProgress } = useAppShell();
  const activeWorkspace = useAppSelector(selectActiveWorkspace);
  const categoryIcons = useAppSelector(selectCategoryIcons);
  const categoryColors = useAppSelector(selectCategoryColors);
  const accountIcons = useAppSelector(selectAccountIcons);
  const accountColors = useAppSelector(selectAccountColors);
  const transactionDrafts = useAppSelector(selectTransactionDrafts);
  const isFocused = useIsFocused();
  const setTabBarEdgeButton = useSetTabBarEdgeButton();
  const setTabBarHidden = useSetTabBarHidden();
  const tabBarHeight = useTabBarHeight();
  const { tabBarEnabled } = useTabBarModePreference();
  const { bottom } = useSafeAreaInsets();
  const [transactionSearchQuery, setTransactionSearchQuery] =
    React.useState("");
  const [filtersVisible, setFiltersVisible] = React.useState(false);
  const [sortVisible, setSortVisible] = React.useState(false);
  const [appliedFilters, setAppliedFilters] =
    React.useState<TransactionViewFilters>(DEFAULT_VIEW_FILTERS);
  const [draftFilters, setDraftFilters] =
    React.useState<TransactionViewFilters>(DEFAULT_VIEW_FILTERS);
  const [appliedSort, setAppliedSort] =
    React.useState<TransactionSortConfig>(DEFAULT_SORT_CONFIG);
  const [collapsedDaySections, setCollapsedDaySections] = React.useState<
    Record<string, boolean>
  >({});
  const {
    tokens,
    activeTab,
    isModalOpen,
    modalDefaultType,
    modalInitialDate,
    handleCloseModal,
    pendingDeleteId,
    handleCancelDelete,
    handleConfirmDelete,
    categoryManagement,
    accountManagement,
    overallBudget,
    filteredIncomeTransactions,
    filteredExpenseTransactions,
    handleEdit,
    handleAddPress,
  } = useTransactionsPage();
  const currencyCode = activeWorkspace?.currencyCode ?? "INR";
  const currencySymbol = activeWorkspace?.currencySymbol ?? "";
  const todayKey = useMemo(() => getTodayKey(), []);

  useEffect(() => {
    if (!isFocused) return;

    setTabBarHidden(filtersVisible);

    return () => setTabBarHidden(false);
  }, [filtersVisible, isFocused, setTabBarHidden]);

  const [selectedDateOverride, setSelectedDateOverride] = React.useState<
    string | null
  >(null);

  useEffect(() => {
    setSelectedDateOverride(null);
  }, [initialSelectedDate]);

  const selectedDate = selectedDateOverride ?? initialSelectedDate ?? todayKey;
  const selectedMonthKey = selectedDate.slice(0, 7);
  const backgroundColor = theme.colors.background;

  const rawMonthTransactions = useMemo(() => {
    const matchSelectedMonth = (transaction: Transaction) =>
      transaction.date?.startsWith(selectedMonthKey);

    return {
      expense: filteredExpenseTransactions.filter(matchSelectedMonth),
      income: filteredIncomeTransactions.filter(matchSelectedMonth),
    };
  }, [
    filteredExpenseTransactions,
    filteredIncomeTransactions,
    selectedMonthKey,
  ]);

  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [...rawMonthTransactions.expense, ...rawMonthTransactions.income]
            .map((transaction) => transaction.category)
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [rawMonthTransactions.expense, rawMonthTransactions.income],
  );

  const accountOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [...rawMonthTransactions.expense, ...rawMonthTransactions.income]
            .map((transaction) => transaction.account)
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [rawMonthTransactions.expense, rawMonthTransactions.income],
  );

  const categoryMeta = useMemo<Record<string, FilterOptionMeta>>(() => {
    const transactions = [
      ...rawMonthTransactions.expense,
      ...rawMonthTransactions.income,
    ];
    return categoryOptions.reduce<Record<string, FilterOptionMeta>>(
      (meta, category) => {
        const source =
          transactions.find(
            (transaction) =>
              transaction.category === category &&
              transaction.type === "expense",
          ) ??
          transactions.find((transaction) => transaction.category === category);
        const type = source?.type ?? "expense";
        meta[category] = {
          icon: getCategoryIconName(
            category,
            type,
            categoryIcons,
          ) as FilterOptionMeta["icon"],
          color: getCategoryColor(category, type, categoryColors),
        };
        return meta;
      },
      {},
    );
  }, [
    categoryColors,
    categoryIcons,
    categoryOptions,
    rawMonthTransactions.expense,
    rawMonthTransactions.income,
  ]);

  const accountMeta = useMemo<Record<string, FilterOptionMeta>>(
    () =>
      accountOptions.reduce<Record<string, FilterOptionMeta>>(
        (meta, account) => {
          meta[account] = {
            icon: getAccountIconName(
              account,
              accountIcons,
            ) as FilterOptionMeta["icon"],
            color: getAccountColor(account, accountColors),
          };
          return meta;
        },
        {},
      ),
    [accountColors, accountIcons, accountOptions],
  );

  const activeFilterCount = useMemo(
    () => countActiveFilters(appliedFilters),
    [appliedFilters],
  );

  const activeSortBadgeIcon = useMemo(
    () => getSortFieldIcon(appliedSort.field),
    [appliedSort.field],
  );

  const monthTransactions = useMemo(() => {
    const filterTransaction = (transaction: Transaction) =>
      matchesViewFilters(transaction, appliedFilters) &&
      matchesTransactionSearch(transaction, transactionSearchQuery);

    return {
      expense: rawMonthTransactions.expense.filter(filterTransaction),
      income: rawMonthTransactions.income.filter(filterTransaction),
    };
  }, [
    appliedFilters,
    rawMonthTransactions.expense,
    rawMonthTransactions.income,
    transactionSearchQuery,
  ]);

  const monthSections = useMemo<MonthSection[]>(() => {
    const grouped = new Map<string, Transaction[]>();
    [...monthTransactions.expense, ...monthTransactions.income].forEach(
      (transaction) => {
        if (!transaction.date) return;
        const group = grouped.get(transaction.date) ?? [];
        group.push(transaction);
        grouped.set(transaction.date, group);
      },
    );

    const sections: MonthSection[] = [...grouped.entries()]
      .map(([dateKey, transactions]) => {
        const sortedTransactions = [...transactions].sort((left, right) =>
          compareTransactionsBySort(left, right, appliedSort),
        );
        const incomeOnly =
          sortedTransactions.length > 0 &&
          sortedTransactions.every(
            (transaction) => transaction.type === "income",
          );

        return {
          key: dateKey,
          title: formatDateTitle(dateKey, todayKey),
          total: sortedTransactions.reduce(
            (sum, transaction) =>
              transaction.type === (incomeOnly ? "income" : "expense")
                ? sum + Math.abs(transaction.amount)
                : sum,
            0,
          ),
          metric: incomeOnly ? "earned" : "spent",
          transactions: sortedTransactions,
        };
      })
      .sort((left, right) => {
        if (appliedSort.field === "date") {
          return appliedSort.direction === "desc"
            ? right.key.localeCompare(left.key)
            : left.key.localeCompare(right.key);
        }

        const leftLead = left.transactions[0];
        const rightLead = right.transactions[0];
        if (!leftLead || !rightLead) return 0;
        return compareTransactionsBySort(leftLead, rightLead, appliedSort);
      });

    if (transactionDrafts.length) {
      return [
        {
          key: "draft",
          title: "Unsaved",
          total: 0,
          totalLabel: "Drafts",
          transactions: [...transactionDrafts].sort((left, right) =>
            right.updatedAt.localeCompare(left.updatedAt),
          ),
        },
        ...sections,
      ];
    }

    return sections;
  }, [
    appliedSort,
    monthTransactions.expense,
    monthTransactions.income,
    todayKey,
    transactionDrafts,
  ]);

  const monthExpenseTotal = useMemo(
    () =>
      monthTransactions.expense.reduce(
        (sum, transaction) => sum + Math.abs(transaction.amount),
        0,
      ),
    [monthTransactions.expense],
  );

  const monthIncomeTotal = useMemo(
    () =>
      monthTransactions.income.reduce(
        (sum, transaction) => sum + Math.abs(transaction.amount),
        0,
      ),
    [monthTransactions.income],
  );

  const handleHeroMonthChange = useCallback(
    (monthKey: string) => {
      const nextDate = todayKey.startsWith(monthKey)
        ? todayKey
        : `${monthKey}-01`;
      setSelectedDateOverride(nextDate);
    },
    [todayKey],
  );

  const handleToggleDaySection = useCallback((key: string) => {
    setCollapsedDaySections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const allTransactionHeadersCollapsed =
    monthSections.length > 0 &&
    monthSections.every((section) => collapsedDaySections[section.key]);

  const handleToggleAllDaySections = useCallback(() => {
    if (!monthSections.length) return;

    setCollapsedDaySections((prev) => {
      const allCollapsed = monthSections.every((section) => prev[section.key]);
      if (allCollapsed) return {};

      return monthSections.reduce<Record<string, boolean>>((next, section) => {
        next[section.key] = true;
        return next;
      }, {});
    });
  }, [monthSections]);

  const handleAddTransaction = useCallback(() => {
    handleAddPress(activeTab, selectedDate);
  }, [activeTab, handleAddPress, selectedDate]);

  const handleOpenFilters = useCallback(() => {
    setDraftFilters(appliedFilters);
    setFiltersVisible(true);
  }, [appliedFilters]);

  const handleResetFilters = useCallback(() => {
    setDraftFilters(DEFAULT_VIEW_FILTERS);
    setAppliedFilters(DEFAULT_VIEW_FILTERS);
  }, []);

  const handleApplyFilters = useCallback(() => {
    setAppliedFilters(draftFilters);
    setFiltersVisible(false);
  }, [draftFilters]);

  const handleOpenSort = useCallback(() => {
    setSortVisible(true);
  }, []);

  const handleResetSort = useCallback(() => {
    setAppliedSort(DEFAULT_SORT_CONFIG);
  }, []);

  useEffect(() => {
    if (!isFocused || shellActiveTab !== "calendar") {
      setTabBarEdgeButton(null);
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
  }, [handleAddTransaction, isFocused, setTabBarEdgeButton, shellActiveTab]);

  const transactionListBottomPadding = tabBarEnabled
    ? tabBarHeight + bottom + TAB_BAR_TRANSACTION_LIST_CLEARANCE
    : bottom + NO_TAB_BAR_TRANSACTION_LIST_CLEARANCE;

  const renderMonthSection = useCallback(
    ({ item }: { item: MonthSection }) => (
      <TimelineDaySection
        item={item}
        currencyCode={currencyCode}
        currencySymbol={currencySymbol}
        onPressTransaction={handleEdit}
        collapsed={Boolean(collapsedDaySections[item.key])}
        onToggleCollapsed={handleToggleDaySection}
      />
    ),
    [
      collapsedDaySections,
      currencyCode,
      currencySymbol,
      handleEdit,
      handleToggleDaySection,
    ],
  );

  const transactionEmptyState = useMemo(
    () => (
      <View style={local.emptyStateWrap}>
        <EmptyState
          icon="inbox-outline"
          title="No transactions yet"
          subtitle={
            "Looks empty in here.\nAdd your first transaction to get started."
          }
        />
      </View>
    ),
    [],
  );

  const transactionTimelineFooter = useMemo(
    () =>
      monthSections.length ? (
        <TransactionTimelineFooter
          height={transactionListBottomPadding}
          color={theme.colors.outlineVariant}
        />
      ) : null,
    [
      monthSections.length,
      theme.colors.outlineVariant,
      transactionListBottomPadding,
    ],
  );

  const transactionCard = useMemo(
    () => (
      <View style={local.transactionCardWrap}>
        <View style={local.transactionCardHeader}>
          <Text
            numberOfLines={1}
            style={[
              local.transactionCardTitle,
              { color: theme.colors.onSurface },
            ]}
          >
            Transactions
          </Text>
        </View>
        <FlatList
          style={local.transactionList}
          data={monthSections}
          renderItem={renderMonthSection}
          keyExtractor={(item) => item.key}
          ListEmptyComponent={transactionEmptyState}
          ListFooterComponent={transactionTimelineFooter}
          contentContainerStyle={local.transactionListContent}
          initialNumToRender={5}
          maxToRenderPerBatch={4}
          removeClippedSubviews
          updateCellsBatchingPeriod={80}
          windowSize={5}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      </View>
    ),
    [
      monthSections,
      renderMonthSection,
      theme.colors.onSurface,
      transactionEmptyState,
      transactionTimelineFooter,
    ],
  );
  const heroCard = useMemo(
    () => (
      <HeroCard
        heroLabel="Balance left"
        greetingCollapseProgress={Math.max(0, 1 - activeTabProgress)}
        primary={{
          label: "Balance",
          value: formatAmount(
            monthIncomeTotal - monthExpenseTotal,
            currencyCode,
            currencySymbol,
          ),
          icon: "wallet-outline",
          color: "#F4C891",
        }}
        middle={{
          label: "Income",
          value: formatAmount(monthIncomeTotal, currencyCode, currencySymbol),
          icon: "arrow-up",
          color: theme.semantic.income,
        }}
        right={{
          label: "Expenses",
          value: formatAmount(monthExpenseTotal, currencyCode, currencySymbol),
          icon: "arrow-down",
          color: theme.semantic.expense,
        }}
        budget={
          overallBudget > 0
            ? {
                label: "Monthly budget",
                value: formatAmount(
                  overallBudget,
                  currencyCode,
                  currencySymbol,
                ),
              }
            : undefined
        }
        accentColor={theme.colors.primary}
        outline={theme.colors.outlineVariant}
        textColor={theme.colors.onSurface}
        muted={theme.colors.onSurfaceVariant}
        monthTimeline={{
          selectedMonthKey,
          onMonthChange: handleHeroMonthChange,
        }}
      />
    ),
    [
      activeTabProgress,
      currencyCode,
      currencySymbol,
      handleHeroMonthChange,
      monthExpenseTotal,
      monthIncomeTotal,
      overallBudget,
      selectedMonthKey,
      theme.colors.onSurface,
      theme.colors.onSurfaceVariant,
      theme.colors.outlineVariant,
      theme.colors.primary,
      theme.semantic.expense,
      theme.semantic.income,
    ],
  );

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[
        styles.container,
        {
          backgroundColor,
        },
      ]}
    >
      <StatusBar
        style={theme.dark ? "light" : "dark"}
        backgroundColor={theme.colors.error}
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
        <GestureDualCardLayoutView
          controlButtons={{
            left: {
              label: "Sort",
              icon: "sort-variant",
              iconColor: theme.colors.primary,
              badgeIcon: activeSortBadgeIcon,
              accessibilityLabel: "Sort transactions",
              onPress: handleOpenSort,
            },
            leftMiddle: {
              label: "Filter",
              icon: "filter-outline",
              iconColor: theme.colors.primary,
              badgeCount: activeFilterCount,
              accessibilityLabel: "Filter transactions",
              onPress: handleOpenFilters,
            },
            middle: {
              label: "Add",
              icon: "plus",
              iconColor: theme.colors.primary,
              featured: true,
              accessibilityLabel: "Add transaction",
              onPress: handleAddTransaction,
            },
            rightMiddle: {
              label: "Search",
              icon: "magnify",
              iconColor: theme.colors.primary,
              accessibilityLabel: "Search transactions",
              search: {
                value: transactionSearchQuery,
                onChangeText: setTransactionSearchQuery,
                placeholder: "Search transactions...",
              },
            },
            right: {
              label: allTransactionHeadersCollapsed ? "Expand" : "Collapse",
              icon: allTransactionHeadersCollapsed
                ? "arrow-expand-vertical"
                : "arrow-collapse-vertical",
              iconColor: theme.colors.primary,
              accessibilityLabel: allTransactionHeadersCollapsed
                ? "Expand all transaction headers"
                : "Collapse all transaction headers",
              disabled: monthSections.length === 0,
              onPress: handleToggleAllDaySections,
            },
          }}
        >
          <View style={local.insightsSlot}>{heroCard}</View>
          {transactionCard}
        </GestureDualCardLayoutView>
      </View>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        defaultType={modalDefaultType}
        initialDate={modalInitialDate}
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

      <TransactionFiltersModal
        visible={filtersVisible}
        draftFilters={draftFilters}
        categoryOptions={categoryOptions}
        accountOptions={accountOptions}
        categoryMeta={categoryMeta}
        accountMeta={accountMeta}
        onChange={setDraftFilters}
        onReset={handleResetFilters}
        onApply={handleApplyFilters}
        onDismiss={() => setFiltersVisible(false)}
      />

      <TransactionSortModal
        visible={sortVisible}
        sortConfig={appliedSort}
        onChange={setAppliedSort}
        onReset={handleResetSort}
        onDismiss={() => setSortVisible(false)}
      />
    </SafeAreaView>
  );
}

const local = StyleSheet.create({
  insightsSlot: {
    flex: 1,
    minHeight: 0,
  },
  transactionCardWrap: {
    flex: 1,
    minHeight: 0,
  },
  transactionList: {
    marginHorizontal: -TRANSACTION_LIST_HORIZONTAL_TRIM,
  },
  transactionCardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20 - TRANSACTION_LIST_HORIZONTAL_TRIM,
    paddingBottom: 6,
  },
  transactionCardTitle: {
    ...typography.editorial.sectionLabel,
    flex: 1,
    fontSize: 20,
    lineHeight: 28,
    textAlign: "center",
  },
  transactionListContent: {
    flexGrow: 1,
    paddingBottom: 0,
    paddingTop: 2,
  },
  transactionTimelineFooter: {
    marginHorizontal: 20,
    position: "relative",
  },
  transactionTimelineFooterRail: {
    bottom: 0,
    left: TRANSACTION_TIMELINE_RAIL_LEFT,
    position: "absolute",
    top: 0,
    width: TRANSACTION_TIMELINE_STROKE_WIDTH,
  },
  transactionTimelineFooterTopBorder: {
    height: TRANSACTION_TIMELINE_STROKE_WIDTH,
    left: TRANSACTION_TIMELINE_RAIL_LEFT,
    position: "absolute",
    right: -20,
    top: 0,
  },
  emptyStateWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  sheetModalContent: {
    justifyContent: "flex-end",
  },
  nativeSheetPanel: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 12,
    width: "100%",
  },
  nativeSheetPanelCompact: {},
  filterSheetHandle: {
    alignSelf: "center",
    borderRadius: 999,
    height: 4,
    width: 42,
  },
  sheetHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  sheetTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  filterTitle: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 30,
  },
  filterSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 3,
  },
  filterResetButton: {
    borderRadius: 999,
    borderWidth: 0.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterResetText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  filterScrollFrame: {
    flex: 1,
  },
  filterScroll: {
    gap: 10,
    paddingBottom: 2,
  },
  filterSection: {
    borderRadius: 18,
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  filterSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 0.5,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipIcon: {
    alignItems: "center",
    borderRadius: 999,
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  expandFilterButton: {
    alignSelf: "flex-start",
    paddingVertical: 2,
  },
  expandFilterText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  sortOptionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  sortScroll: {
    gap: 10,
    paddingBottom: 2,
  },
  sortOption: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 0.5,
    gap: 8,
    justifyContent: "center",
    minHeight: 76,
    paddingHorizontal: 6,
    paddingVertical: 10,
    width: "31.2%",
  },
  sortOptionCopy: {
    gap: 2,
    minWidth: 0,
  },
  sortOptionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  directionCard: {
    borderRadius: 16,
    flexDirection: "row",
    gap: 8,
    padding: 4,
  },
  directionOption: {
    alignItems: "center",
    borderRadius: 13,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 48,
  },
  filterInputRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateRangeTabs: {
    flexDirection: "row",
    gap: 10,
  },
  dateRangeTab: {
    borderRadius: 14,
    borderWidth: 0.5,
    flex: 1,
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateRangeValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  filterInputWrap: {
    flex: 1,
    gap: 6,
  },
  filterInputLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  filterInput: {
    borderRadius: 14,
    borderWidth: 0.5,
    fontSize: 14,
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  applyFiltersButton: {
    alignItems: "center",
    borderRadius: 18,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 52,
  },
  applyFiltersText: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
