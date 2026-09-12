import { AlertModal } from "@/components/alert/AlertModal";
import { InsightsScreen } from "@/modules/Insights/InsightsScreen";
import { useAppShell } from "@/components/AppShellContext";
import { EmptyState } from "@/components/EmptyStates";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { InlineCalendar } from "@/components/pageheader/Inlinecalendar";
import {
  SlidingPillToggle,
  SortOptionSheet,
} from "@/components/SortOptionSheet";
import {
  useSetTabBarEdgeButton,
  useSetTabBarHidden,
  useTabBarHeight,
} from "@/components/tabbar/TabBarContext";
import { useTabBarModePreference } from "@/components/tabbar/TabBarModePreference";
import { useAppSelector } from "@/hooks/Redux";
import { useWorkspaceDefaults } from "@/hooks/use-workspace-defaults";
import {
  selectAccountColors,
  selectAccountIcons,
  selectCategoryColors,
  selectCategoryIcons,
  selectTransactionDrafts,
} from "@/modules/Core/Slices/TransactionSlice";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import { AccountManagementModal } from "@/modules/Management/Account/Index";
import { CategoryManagementModal } from "@/modules/Management/Category/Index";
import { SettingsHeader } from "@/modules/Settings/Components/SettingsHeader";
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
import { useIsFocused } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Text, useTheme } from "react-native-paper";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { TransactionModal } from "./Components/TransactionModal/Index";
import { TransactionRow } from "./Components/TransactionRow";
import TimelineSectionHeader from "./Components/TransactionSectionHeader";
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
const TRANSACTION_LIST_FOOTER_MIN_HEIGHT = 300;
const TRANSACTION_LIST_HORIZONTAL_TRIM = 6;
const TRANSACTION_LIST_TIMELINE_LEFT = 24.5;

export type TransactionSortField =
  | "date"
  | "amount"
  | "title"
  | "category"
  | "account"
  | "type";
export type TransactionSortDirection = "asc" | "desc";

export type TransactionSortConfig = {
  field: TransactionSortField;
  direction: TransactionSortDirection;
};

type FilterOptionMeta = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
};

type TransactionViewFilters = {
  type: "all" | TransactionType;
  categories: string[];
  accounts: string[];
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
};

const WHITE_ICON = "#FFFFFF";
const OPTION_COLORS = {
  all: "#2563EB",
  expense: "#DC2626",
  income: "#16A34A",
  date: "#0EA5E9",
  amount: "#059669",
  title: "#7C3AED",
  category: "#F97316",
  account: "#D97706",
  type: "#0891B2",
};

const DEFAULT_VIEW_FILTERS: TransactionViewFilters = {
  type: "all",
  categories: [],
  accounts: [],
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

function darkenHex(hex: string, amount = 0.18) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;

  const value = parseInt(clean, 16);
  const r = Math.max(0, Math.round(((value >> 16) & 255) * (1 - amount)));
  const g = Math.max(0, Math.round(((value >> 8) & 255) * (1 - amount)));
  const b = Math.max(0, Math.round((value & 255) * (1 - amount)));

  return `#${[r, g, b]
    .map((part) => part.toString(16).padStart(2, "0"))
    .join("")}`;
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatIsoDateShort(dateKey: string) {
  const [year, month, day] = dateKey.split("-");
  if (!year || !month || !day) return dateKey;
  return `${day}-${month}`;
}

function formatIsoDateFull(dateKey: string) {
  const [year, month, day] = dateKey.split("-");
  if (!year || !month || !day) return dateKey;
  return `${day}-${month}-${year}`;
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
  if (
    filters.categories.length > 0 &&
    !filters.categories.includes(transaction.category)
  ) {
    return false;
  }
  if (
    filters.accounts.length > 0 &&
    !filters.accounts.includes(transaction.account)
  ) {
    return false;
  }
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
    filters.categories.length > 0,
    filters.accounts.length > 0,
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
  const resolvedIconColor = iconColor ?? theme.colors.primary;
  const selectedBorderColor = darkenHex(resolvedIconColor);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        local.filterChip,
        {
          backgroundColor: theme.colors.surface,
          borderColor: selected ? selectedBorderColor : "transparent",
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      {icon ? (
        <View
          style={[local.filterChipIcon, { backgroundColor: resolvedIconColor }]}
        >
          <MaterialCommunityIcons name={icon} size={14} color={WHITE_ICON} />
        </View>
      ) : null}
      <Text style={[local.filterChipText, { color: theme.colors.onSurface }]}>
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
  borderColor,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "numeric";
  borderColor?: string;
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
            borderColor: borderColor ?? theme.colors.outlineVariant,
          },
        ]}
      />
    </View>
  );
}

function FilterSelectCard({
  label,
  value,
  placeholder,
  icon,
  iconColor,
  onPress,
}: {
  label: string;
  value?: string | null;
  placeholder: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  iconColor?: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  const resolvedIconColor = iconColor ?? theme.colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Select ${label.toLowerCase()}`}
      onPress={onPress}
      style={({ pressed }) => [
        local.filterSelectCard,
        {
          backgroundColor: theme.colors.elevation.level1,
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      <View
        style={[local.filterSelectIcon, { backgroundColor: resolvedIconColor }]}
      >
        <MaterialCommunityIcons name={icon} size={18} color={WHITE_ICON} />
      </View>
      <View style={local.filterSelectCopy}>
        <Text
          numberOfLines={1}
          style={[
            local.filterSelectLabel,
            {
              color: theme.colors.onSurfaceVariant,
            },
          ]}
        >
          {label}
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.78}
          style={[
            local.filterSelectValue,
            {
              color: theme.colors.onSurface,
            },
          ]}
        >
          {value || placeholder}
        </Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={18}
        color={theme.colors.onSurfaceVariant}
      />
    </Pressable>
  );
}

function TransactionBottomSheet({
  visible,
  title,
  onDismiss,
  onReset,
  children,
  footer,
  compact = false,
  fitContent = false,
}: {
  visible: boolean;
  title: string;
  onDismiss: () => void;
  onReset: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  compact?: boolean;
  fitContent?: boolean;
}) {
  const theme = useTheme();
  const { bottom } = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const panelHeight = Math.round(windowHeight * (compact ? 0.54 : 0.78));
  const panelSizeStyle = fitContent
    ? { maxHeight: panelHeight }
    : { height: panelHeight };

  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onDismiss}
      presentation="sheet"
      includeBottomInset={false}
      keyboardAware={!compact}
      contentContainerStyle={local.sheetModalContent}
    >
      <View
        style={[
          local.nativeSheetPanel,
          compact ? local.nativeSheetPanelCompact : null,
          {
            backgroundColor: theme.colors.background,
            paddingBottom: Math.max(16, bottom + 12),
            ...panelSizeStyle,
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Close ${title}`}
            onPress={onDismiss}
            style={({ pressed }) => [
              local.filterCloseButton,
              {
                backgroundColor: theme.colors.surface,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="close"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
          </Pressable>
          <View style={local.sheetTitleWrap}>
            <Text
              numberOfLines={1}
              style={[local.filterTitle, { color: theme.colors.onSurface }]}
            >
              {title}
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

function SheetHeaderAction({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        local.filterResetButton,
        {
          borderColor: theme.colors.outlineVariant,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text style={[local.filterResetText, { color: theme.colors.primary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function FilterOptionPickerSheet({
  visible,
  title,
  options,
  selectedValues,
  meta,
  clearLabel,
  clearIcon,
  clearIconColor,
  onToggle,
  onClear,
  onDismiss,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selectedValues: string[];
  meta: Record<string, FilterOptionMeta>;
  clearLabel: string;
  clearIcon: FilterOptionMeta["icon"];
  clearIconColor: string;
  onToggle: (value: string) => void;
  onClear: () => void;
  onDismiss: () => void;
}) {
  const theme = useTheme();
  const { bottom } = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const panelMaxHeight = Math.round(windowHeight * 0.62);

  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onDismiss}
      presentation="sheet"
      zIndex={1100}
      includeBottomInset={false}
      contentContainerStyle={local.sheetModalContent}
    >
      <View
        style={[
          local.optionPickerPanel,
          {
            backgroundColor: theme.colors.background,
            maxHeight: panelMaxHeight,
            paddingBottom: Math.max(18, bottom + 12),
          },
        ]}
      >
        <View
          style={[
            local.filterSheetHandle,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />
        <SettingsHeader
          title={title}
          onBack={onDismiss}
          modal
          rightAccessory={<SheetHeaderAction label="Clear" onPress={onClear} />}
        />

        <KeyboardAwareScrollView
          style={local.optionPickerScrollFrame}
          contentContainerStyle={local.optionPickerList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <FilterChip
            label={clearLabel}
            icon={clearIcon}
            iconColor={clearIconColor}
            selected={selectedValues.length === 0}
            onPress={onClear}
          />
          {options.length ? (
            options.map((option) => (
              <FilterChip
                key={option}
                label={option}
                icon={meta[option]?.icon}
                iconColor={meta[option]?.color}
                selected={selectedValues.includes(option)}
                onPress={() => onToggle(option)}
              />
            ))
          ) : (
            <View
              style={[
                local.optionPickerEmpty,
                {
                  backgroundColor: theme.colors.elevation.level1,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="tray-remove"
                size={22}
                color={theme.colors.onSurfaceVariant}
              />
              <Text
                style={[
                  local.optionPickerEmptyText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                No matches
              </Text>
            </View>
          )}
        </KeyboardAwareScrollView>
        <Text
          style={[
            local.optionPickerHint,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          You can select more than one.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Done selecting ${title.toLowerCase()}`}
          onPress={onDismiss}
          style={({ pressed }) => [
            local.optionPickerDoneButton,
            {
              backgroundColor: theme.colors.primary,
              opacity: pressed ? 0.82 : 1,
            },
          ]}
        >
          <Text
            style={[local.applyFiltersText, { color: theme.colors.onPrimary }]}
          >
            Done
          </Text>
        </Pressable>
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
  const [categoryPickerVisible, setCategoryPickerVisible] =
    React.useState(false);
  const [accountPickerVisible, setAccountPickerVisible] = React.useState(false);
  const [datePickerVisible, setDatePickerVisible] = React.useState(false);
  const [amountPickerVisible, setAmountPickerVisible] = React.useState(false);
  const patch = (next: Partial<TransactionViewFilters>) =>
    onChange({ ...draftFilters, ...next });
  const toggleArrayValue = (
    field: "categories" | "accounts",
    value: string,
  ) => {
    const current = draftFilters[field];
    const nextValues = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];

    if (field === "categories") {
      patch({ categories: nextValues });
    } else {
      patch({ accounts: nextValues });
    }
  };
  const dateRangeLabel =
    draftFilters.startDate || draftFilters.endDate
      ? `${draftFilters.startDate ? formatIsoDateShort(draftFilters.startDate) : "Any"} to ${
          draftFilters.endDate
            ? formatIsoDateShort(draftFilters.endDate)
            : "Any"
        }`
      : "No Date Range";
  const amountRangeLabel =
    draftFilters.minAmount || draftFilters.maxAmount
      ? `${draftFilters.minAmount || "0"} - ${draftFilters.maxAmount || "Any"}`
      : "No amount range";
  const categoryValueLabel =
    draftFilters.categories.length === 0
      ? null
      : draftFilters.categories.length === 1
        ? draftFilters.categories[0]
        : `${draftFilters.categories.length} categories`;
  const accountValueLabel =
    draftFilters.accounts.length === 0
      ? null
      : draftFilters.accounts.length === 1
        ? draftFilters.accounts[0]
        : `${draftFilters.accounts.length} accounts`;
  const firstCategory = draftFilters.categories[0] ?? "";
  const firstAccount = draftFilters.accounts[0] ?? "";
  const categoryIcon = categoryMeta[firstCategory]?.icon ?? "tag-outline";
  const categoryIconColor =
    categoryMeta[firstCategory]?.color ?? OPTION_COLORS.category;
  const accountIcon = accountMeta[firstAccount]?.icon ?? "wallet-outline";
  const accountIconColor =
    accountMeta[firstAccount]?.color ?? OPTION_COLORS.account;

  return (
    <>
      <TransactionBottomSheet
        visible={visible}
        title="Filter"
        onDismiss={onDismiss}
        onReset={onReset}
        fitContent
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
              style={[
                local.applyFiltersText,
                { color: theme.colors.onPrimary },
              ]}
            >
              Apply filters
            </Text>
          </Pressable>
        }
      >
        <KeyboardAwareScrollView
          style={local.filterScrollFrame}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={local.filterScroll}
          keyboardShouldPersistTaps="handled"
        >
          <SlidingPillToggle
            value={draftFilters.type}
            onChange={(type) => patch({ type })}
            options={[
              {
                key: "all",
                label: "All",
                icon: "swap-vertical",
                color: OPTION_COLORS.all,
              },
              {
                key: "expense",
                label: "Expense",
                icon: "trending-down",
                color: OPTION_COLORS.expense,
              },
              {
                key: "income",
                label: "Income",
                icon: "trending-up",
                color: OPTION_COLORS.income,
              },
            ]}
          />

          <View style={local.filterChoiceGrid}>
            <FilterSelectCard
              label="Category"
              value={categoryValueLabel}
              placeholder="All Categories"
              icon={categoryIcon}
              iconColor={categoryIconColor}
              onPress={() => setCategoryPickerVisible(true)}
            />
            <FilterSelectCard
              label="Account"
              value={accountValueLabel}
              placeholder="All Accounts"
              icon={accountIcon}
              iconColor={accountIconColor}
              onPress={() => setAccountPickerVisible(true)}
            />
          </View>

          <View style={local.filterChoiceGrid}>
            <FilterSelectCard
              label="Date"
              value={
                draftFilters.startDate || draftFilters.endDate
                  ? dateRangeLabel
                  : null
              }
              placeholder="No Date Range"
              icon="calendar-range"
              iconColor={OPTION_COLORS.date}
              onPress={() => setDatePickerVisible(true)}
            />
            <FilterSelectCard
              label="Amount"
              value={
                draftFilters.minAmount || draftFilters.maxAmount
                  ? amountRangeLabel
                  : null
              }
              placeholder="No amount range"
              icon="cash-multiple"
              iconColor={OPTION_COLORS.amount}
              onPress={() => setAmountPickerVisible(true)}
            />
          </View>
        </KeyboardAwareScrollView>
      </TransactionBottomSheet>

      <FilterOptionPickerSheet
        visible={categoryPickerVisible}
        title="All categories"
        options={categoryOptions}
        selectedValues={draftFilters.categories}
        meta={categoryMeta}
        clearLabel="All Categories"
        clearIcon="tag-outline"
        clearIconColor={OPTION_COLORS.category}
        onToggle={(category) => toggleArrayValue("categories", category)}
        onClear={() => patch({ categories: [] })}
        onDismiss={() => setCategoryPickerVisible(false)}
      />
      <FilterOptionPickerSheet
        visible={accountPickerVisible}
        title="All accounts"
        options={accountOptions}
        selectedValues={draftFilters.accounts}
        meta={accountMeta}
        clearLabel="All Accounts"
        clearIcon="wallet-outline"
        clearIconColor={OPTION_COLORS.account}
        onToggle={(account) => toggleArrayValue("accounts", account)}
        onClear={() => patch({ accounts: [] })}
        onDismiss={() => setAccountPickerVisible(false)}
      />
      <DateFilterSheet
        visible={datePickerVisible}
        startDate={draftFilters.startDate}
        endDate={draftFilters.endDate}
        activeField={activeDateField}
        onActiveFieldChange={setActiveDateField}
        onChange={(next) => patch(next)}
        onClear={() => patch({ startDate: "", endDate: "" })}
        onDismiss={() => setDatePickerVisible(false)}
      />
      <AmountFilterSheet
        visible={amountPickerVisible}
        minAmount={draftFilters.minAmount}
        maxAmount={draftFilters.maxAmount}
        onChange={(next) => patch(next)}
        onClear={() => patch({ minAmount: "", maxAmount: "" })}
        onDismiss={() => setAmountPickerVisible(false)}
      />
    </>
  );
}

function DateFilterSheet({
  visible,
  startDate,
  endDate,
  activeField,
  onActiveFieldChange,
  onChange,
  onClear,
  onDismiss,
}: {
  visible: boolean;
  startDate: string;
  endDate: string;
  activeField: "startDate" | "endDate";
  onActiveFieldChange: (field: "startDate" | "endDate") => void;
  onChange: (next: Partial<TransactionViewFilters>) => void;
  onClear: () => void;
  onDismiss: () => void;
}) {
  const theme = useTheme();
  const { bottom } = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const panelMaxHeight = Math.round(windowHeight * 0.66);
  const activeDateValue =
    activeField === "startDate"
      ? startDate || getTodayKey()
      : endDate || getTodayKey();

  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onDismiss}
      presentation="sheet"
      zIndex={1100}
      includeBottomInset={false}
      contentContainerStyle={local.sheetModalContent}
    >
      <View
        style={[
          local.optionPickerPanel,
          {
            backgroundColor: theme.colors.background,
            maxHeight: panelMaxHeight,
            paddingBottom: Math.max(18, bottom + 12),
          },
        ]}
      >
        <View
          style={[
            local.filterSheetHandle,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />
        <SettingsHeader
          title="Date window"
          onBack={onDismiss}
          modal
          rightAccessory={<SheetHeaderAction label="Clear" onPress={onClear} />}
        />

        <KeyboardAwareScrollView
          style={local.dateFilterScrollFrame}
          contentContainerStyle={local.dateFilterContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={local.dateRangeTabs}>
            {(["startDate", "endDate"] as const).map((field) => {
              const selected = activeField === field;
              const value = field === "startDate" ? startDate : endDate;
              const tabColor =
                field === "startDate" ? OPTION_COLORS.date : OPTION_COLORS.type;
              return (
                <Pressable
                  key={field}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => onActiveFieldChange(field)}
                  style={[
                    local.dateRangeTab,
                    {
                      backgroundColor: theme.colors.elevation.level1,
                      borderColor: selected ? tabColor : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={[
                      local.filterInputLabel,
                      {
                        color: theme.colors.onSurfaceVariant,
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
                    {value ? formatIsoDateFull(value) : "Any date"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <InlineCalendar
            visible
            selectedDate={activeDateValue}
            backgroundColor={theme.colors.background}
            onDateSelect={(date) =>
              onChange(
                activeField === "startDate"
                  ? { startDate: date }
                  : { endDate: date },
              )
            }
          />
        </KeyboardAwareScrollView>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Done selecting date filter"
          onPress={onDismiss}
          style={({ pressed }) => [
            local.optionPickerDoneButton,
            {
              backgroundColor: theme.colors.primary,
              opacity: pressed ? 0.82 : 1,
            },
          ]}
        >
          <Text
            style={[local.applyFiltersText, { color: theme.colors.onPrimary }]}
          >
            Done
          </Text>
        </Pressable>
      </View>
    </AnimatedPaperModal>
  );
}

function AmountFilterSheet({
  visible,
  minAmount,
  maxAmount,
  onChange,
  onClear,
  onDismiss,
}: {
  visible: boolean;
  minAmount: string;
  maxAmount: string;
  onChange: (next: Partial<TransactionViewFilters>) => void;
  onClear: () => void;
  onDismiss: () => void;
}) {
  const theme = useTheme();
  const { bottom } = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const panelMaxHeight = Math.round(windowHeight * 0.48);

  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onDismiss}
      presentation="sheet"
      zIndex={1100}
      includeBottomInset={false}
      keyboardAware
      contentContainerStyle={local.sheetModalContent}
    >
      <View
        style={[
          local.optionPickerPanel,
          {
            backgroundColor: theme.colors.background,
            maxHeight: panelMaxHeight,
            paddingBottom: Math.max(18, bottom + 12),
          },
        ]}
      >
        <View
          style={[
            local.filterSheetHandle,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />
        <SettingsHeader
          title="Amount range"
          onBack={onDismiss}
          modal
          rightAccessory={<SheetHeaderAction label="Clear" onPress={onClear} />}
        />

        <View style={local.amountEditorContent}>
          <View style={local.filterInputRow}>
            <FilterInput
              label="Min"
              value={minAmount}
              onChangeText={(value) => onChange({ minAmount: value })}
              placeholder="0"
              keyboardType="numeric"
              borderColor={OPTION_COLORS.amount}
            />
            <FilterInput
              label="Max"
              value={maxAmount}
              onChangeText={(value) => onChange({ maxAmount: value })}
              placeholder="Any"
              keyboardType="numeric"
              borderColor={OPTION_COLORS.amount}
            />
          </View>
        </View>

        <Text
          style={[
            local.optionPickerHint,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          Leave one side empty for no limit.
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Done entering amount filter"
          onPress={onDismiss}
          style={({ pressed }) => [
            local.optionPickerDoneButton,
            {
              backgroundColor: theme.colors.primary,
              opacity: pressed ? 0.82 : 1,
            },
          ]}
        >
          <Text
            style={[local.applyFiltersText, { color: theme.colors.onPrimary }]}
          >
            Done
          </Text>
        </Pressable>
      </View>
    </AnimatedPaperModal>
  );
}

export function TransactionSortModal({
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
  return (
    <SortOptionSheet
      visible={visible}
      title="Sort"
      subtitle="Choose how transactions are ordered."
      options={SORT_FIELD_OPTIONS.map((option) => ({
        id: option.field,
        label: option.label,
        description: option.description,
        icon: option.icon,
      }))}
      value={sortConfig.field}
      direction={sortConfig.direction}
      resetDirection="desc"
      onChange={(value) =>
        onChange({
          field: value as TransactionSortField,
          direction: sortConfig.direction,
        })
      }
      onApply={(value, direction) =>
        onChange({
          field: value as TransactionSortField,
          direction,
        })
      }
      onReset={onReset}
      onDismiss={onDismiss}
      applyLabel="Apply sort"
    />
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
    <TimelineSectionHeader
      title={item.title}
      total={item.total}
      totalLabel={item.totalLabel}
      metric={item.metric}
      currencyCode={currencyCode}
      currencySymbol={currencySymbol}
      collapsed={collapsed}
      onToggleCollapsed={() => onToggleCollapsed(item.key)}
    >
      {!collapsed
        ? item.transactions.map((transaction, index) => {
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
          })
        : null}
    </TimelineSectionHeader>
  );
});

function TransactionListFooter({
  height,
  borderColor,
  showBorder,
}: {
  height: number;
  borderColor: string;
  showBorder: boolean;
}) {
  if (height <= 0) return null;

  return (
    <View
      pointerEvents="none"
      style={[local.transactionListFooter, { height }]}
    >
      {showBorder ? (
        <View
          style={[
            local.transactionListFooterBorder,
            { backgroundColor: borderColor },
          ]}
        />
      ) : null}
    </View>
  );
}

export default function Transactions({
  initialSelectedDate,
}: TransactionsProps) {
  const theme = useTheme<ExtendedMD3Theme>();
  const { activeTab: shellActiveTab } = useAppShell();
  const activeWorkspace = useAppSelector(selectActiveWorkspace);
  const { getWorkspaceDefaults } = useWorkspaceDefaults();
  const workspaceDefaults = getWorkspaceDefaults(
    activeWorkspace?.id ?? "personal",
  );
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
  const [appliedSort, setAppliedSort] = React.useState<TransactionSortConfig>(
    () => ({
      field: workspaceDefaults.transactionSortField,
      direction: workspaceDefaults.transactionSortDirection,
    }),
  );
  React.useEffect(() => {
    setAppliedSort({
      field: workspaceDefaults.transactionSortField,
      direction: workspaceDefaults.transactionSortDirection,
    });
  }, [
    workspaceDefaults.transactionSortDirection,
    workspaceDefaults.transactionSortField,
  ]);
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
        const metric: MonthSection["metric"] = incomeOnly ? "earned" : "spent";

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
          metric,
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
  const transactionListFooterHeight = Math.max(
    TRANSACTION_LIST_FOOTER_MIN_HEIGHT,
    transactionListBottomPadding,
    bottom * 2,
  );

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

  const transactionListFooter = useMemo(
    () => (
      <TransactionListFooter
        height={transactionListFooterHeight}
        borderColor={theme.colors.outlineVariant}
        showBorder={monthSections.length > 0}
      />
    ),
    [
      monthSections.length,
      theme.colors.outlineVariant,
      transactionListFooterHeight,
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
          ListFooterComponent={transactionListFooter}
          contentContainerStyle={local.transactionListContent}
          initialNumToRender={5}
          maxToRenderPerBatch={4}
          removeClippedSubviews
          updateCellsBatchingPeriod={80}
          windowSize={5}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEnabled={shellActiveTab === "calendar"}
        />
      </View>
    ),
    [
      monthSections,
      renderMonthSection,
      shellActiveTab,
      theme.colors.onSurface,
      transactionEmptyState,
      transactionListFooter,
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
          topContent={<InsightsScreen />}
          suspendLayout={filtersVisible || sortVisible}
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
  transactionListFooter: {
    marginHorizontal: 20,
    minHeight: 0,
  },
  transactionListFooterBorder: {
    height: StyleSheet.hairlineWidth,
    marginLeft: TRANSACTION_LIST_TIMELINE_LEFT,
    marginRight: -20,
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
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
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
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 8,
    minWidth: 0,
  },
  filterCloseButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  filterTitle: {
    ...typography.editorial.sectionLabel,
    fontSize: 22,
    lineHeight: 28,
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
    maxHeight: 440,
  },
  filterScroll: {
    gap: 12,
    paddingBottom: 2,
  },
  filterChoiceGrid: {
    flexDirection: "row",
    gap: 10,
  },
  filterSelectCard: {
    alignItems: "center",
    borderRadius: 16,
    flex: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 76,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  filterSelectIcon: {
    alignItems: "center",
    borderRadius: 12,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  filterSelectCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  filterSelectLabel: {
    ...typography.editorial.sectionLabel,
    fontSize: 10,
    lineHeight: 13,
  },
  filterSelectValue: {
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 15,
  },
  filterChip: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    maxWidth: "100%",
    paddingHorizontal: 10,
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
    flexShrink: 1,
    textTransform: "capitalize",
  },
  optionPickerPanel: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    gap: 8,
    paddingTop: 10,
    width: "100%",
  },
  optionPickerScrollFrame: {
    maxHeight: 280,
  },
  optionPickerList: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 8,
    paddingHorizontal: 20,
  },
  optionPickerEmpty: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 0.5,
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 22,
    width: "100%",
  },
  optionPickerEmptyText: {
    fontSize: 12,
    fontWeight: "700",
  },
  optionPickerHint: {
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 15,
    textAlign: "center",
  },
  optionPickerDoneButton: {
    alignItems: "center",
    borderRadius: 14,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 20,
    marginHorizontal: 20,
  },
  amountEditorContent: {
    gap: 12,
    paddingBottom: 2,
    paddingHorizontal: 20,
  },
  filterInputRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateRangeTabs: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
  },
  dateFilterScrollFrame: {
    maxHeight: 420,
  },
  dateFilterContent: {
    gap: 12,
  },
  dateRangeTab: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateRangeValue: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  filterInputWrap: {
    flex: 1,
    gap: 6,
  },
  filterInputLabel: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    textTransform: "uppercase",
  },
  filterInput: {
    borderRadius: 14,
    borderWidth: 1,
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
