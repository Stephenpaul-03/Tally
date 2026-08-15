import { ActionRow } from "@/components/ActionRow";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { SheetCard } from "@/components/SheetCard";
import { SortOptionSheet } from "@/components/SortOptionSheet";
import { toast } from "@/components/toast/ToastProvider";
import { useAppDispatch, useAppSelector } from "@/hooks/Redux";
import { useAccountManagement } from "@/hooks/use-account-manangement";
import { useCategoryManagement } from "@/hooks/use-category-manamgement";
import type {
  AccountSortFieldDefault,
  BudgetSortFieldDefault,
  CategorySortFieldDefault,
  SortDirectionDefault,
  TransactionSortFieldDefault,
} from "@/hooks/use-workspace-defaults";
import { useWorkspaceDefaults } from "@/hooks/use-workspace-defaults";
import {
  selectAccountColors,
  selectAccountIcons,
  selectCategoryColors,
  selectCategoryIcons,
} from "@/modules/Core/Slices/TransactionSlice";
import {
  selectActiveWorkspace,
  updateWorkspaceAsync,
} from "@/modules/Core/Slices/WorkspaceSlice";
import { AccountManagementModal } from "@/modules/Management/Account/Index";
import { CategoryManagementModal } from "@/modules/Management/Category/Index";
import { TransactionSortModal } from "@/modules/Management/Transaction/Index";
import {
  getAccountColor,
  getAccountIconName,
  getCategoryColor,
  getCategoryIconName,
} from "@/utils/Helpers";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Text, TextInput, useTheme } from "react-native-paper";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { SectionLabel } from "../Components/SectionLabel";
import { SettingsSearchHeader } from "../Components/SettingsSearchHeader";
import type { SettingsStackParamList } from "../Navigation";
import { SettingsStyles } from "../Styles";

type PickerState = "account" | "income" | "expense" | null;
type SortPicker = "transactions" | "accounts" | "categories" | "budget" | null;
type BudgetThreshold = "safeBelow" | "nearlyEmptyFrom";

const TRANSACTION_SORT_OPTIONS: {
  id: TransactionSortFieldDefault;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "date",
    label: "Day",
    description: "Transaction date",
    icon: "calendar-month-outline",
  },
  {
    id: "amount",
    label: "Amount",
    description: "Transaction amount",
    icon: "cash",
  },
  {
    id: "title",
    label: "Title",
    description: "Transaction title",
    icon: "sort-alphabetical-ascending",
  },
  {
    id: "category",
    label: "Category",
    description: "Transaction category",
    icon: "tag-outline",
  },
  {
    id: "account",
    label: "Account",
    description: "Payment source",
    icon: "credit-card-outline",
  },
  {
    id: "type",
    label: "Type",
    description: "Income or expense",
    icon: "swap-vertical",
  },
];
const SIMPLE_SORT_OPTIONS: {
  id: AccountSortFieldDefault;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "name",
    label: "Name",
    description: "Sort names",
    icon: "sort-alphabetical-ascending",
  },
  {
    id: "usage",
    label: "Usage",
    description: "Sort by transaction count",
    icon: "chart-bar",
  },
];
const BUDGET_SORT_OPTIONS: {
  id: BudgetSortFieldDefault;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "budget",
    label: "Budget",
    description: "Sort by budget amount",
    icon: "cash-multiple",
  },
  {
    id: "spent",
    label: "Spent",
    description: "Sort by spending",
    icon: "chart-bar",
  },
  {
    id: "remaining",
    label: "Remaining",
    description: "Sort by remaining balance",
    icon: "progress-alert",
  },
  {
    id: "name",
    label: "Name",
    description: "Sort category names",
    icon: "sort-alphabetical-ascending",
  },
  {
    id: "usage",
    label: "Usage",
    description: "Sort by percent used",
    icon: "percent-outline",
  },
];

function sortLabel(kind: Exclude<SortPicker, null>, value: string) {
  const options =
    kind === "transactions"
      ? TRANSACTION_SORT_OPTIONS
      : kind === "budget"
        ? BUDGET_SORT_OPTIONS
        : SIMPLE_SORT_OPTIONS;
  return options.find((option) => option.id === value)?.label ?? value;
}

function sortColor(value: string) {
  const colors: Record<string, string> = {
    date: "#159ED9",
    amount: "#079669",
    title: "#7C3AED",
    category: "#FF7417",
    account: "#D98200",
    type: "#0D9AB8",
    name: "#4F46E5",
    usage: "#0F9F6E",
    budget: "#159ED9",
    spent: "#D9485F",
    remaining: "#2E9D59",
  };
  return colors[value] ?? "#64748B";
}

type WorkspaceCurrency = {
  code: string;
  name: string;
  symbol: string;
};

type CurrencyItem = {
  code: string;
  name: string;
  symbol?: string;
  symbol_native?: string;
  flag_emoji?: string;
};

const currencyData =
  require("../../../node_modules/@youssefprodev/rn-currency-picker/src/constants/CommonCurrency.json") as Record<
    string,
    CurrencyItem
  >;
const CURRENCIES = Object.values(currencyData) as CurrencyItem[];
const clampPercent = (value: number) =>
  Math.max(0, Math.min(100, Math.round(value)));

function getDisplayCurrencySymbol(item: CurrencyItem) {
  try {
    const parts = new Intl.NumberFormat("en-IN", {
      currency: item.code,
      currencyDisplay: "narrowSymbol",
      style: "currency",
    }).formatToParts(0);
    const symbol = parts.find((part) => part.type === "currency")?.value;
    if (symbol && symbol !== item.code) return symbol;
  } catch {
    // Fall through to bundled currency data.
  }

  if (item.symbol && item.symbol !== item.code) return item.symbol;
  if (item.symbol_native && item.symbol_native !== item.code) {
    return item.symbol_native;
  }

  return item.code;
}

export function DefaultsScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const dispatch = useAppDispatch();
  const activeWorkspace = useAppSelector(selectActiveWorkspace);
  const accountIcons = useAppSelector(selectAccountIcons);
  const accountColors = useAppSelector(selectAccountColors);
  const categoryIcons = useAppSelector(selectCategoryIcons);
  const categoryColors = useAppSelector(selectCategoryColors);
  const { getWorkspaceDefaults, setWorkspaceDefaults } = useWorkspaceDefaults();
  const [picker, setPicker] = React.useState<PickerState>(null);
  const [sortPicker, setSortPicker] = React.useState<SortPicker>(null);
  const [budgetThresholdOpen, setBudgetThresholdOpen] =
    React.useState<BudgetThreshold | null>(null);
  const [currencyOpen, setCurrencyOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);
  const accountManagement = useAccountManagement();
  const incomeManagement = useCategoryManagement("income");
  const expenseManagement = useCategoryManagement("expense");

  const defaults = getWorkspaceDefaults(activeWorkspace?.id ?? "personal");
  const currency: WorkspaceCurrency = {
    code: activeWorkspace?.currencyCode ?? "INR",
    name: activeWorkspace?.currencyName ?? "Indian Rupee",
    symbol: activeWorkspace?.currencySymbol ?? "₹",
  };

  const handleCurrencyChange = async (next: WorkspaceCurrency) => {
    if (!activeWorkspace) return;
    try {
      await dispatch(
        updateWorkspaceAsync({
          id: activeWorkspace.id,
          data: {
            currencyCode: next.code,
            currencyName: next.name,
            currencySymbol: next.symbol,
          },
        }) as any,
      ).unwrap();
      setCurrencyOpen(false);
      toast.success("Default currency updated");
    } catch {
      toast.error("Couldn't update currency");
    }
  };

  const handleSelect = (value: string) => {
    if (!activeWorkspace || !picker) return;
    setWorkspaceDefaults(activeWorkspace.id, {
      defaultAccount: picker === "account" ? value : defaults.defaultAccount,
      defaultIncomeCategory:
        picker === "income" ? value : defaults.defaultIncomeCategory,
      defaultExpenseCategory:
        picker === "expense" ? value : defaults.defaultExpenseCategory,
    });
    setPicker(null);
    toast.success("Default updated");
  };

  const handleThresholdChange = (
    key: "budgetSafeBelowPercent" | "budgetNearlyEmptyFromPercent",
    value: number,
  ) => {
    if (!activeWorkspace) return;
    const nextValue = clampPercent(value);
    const nextSafeBelow =
      key === "budgetSafeBelowPercent"
        ? nextValue
        : defaults.budgetSafeBelowPercent;
    const nextNearlyEmpty =
      key === "budgetNearlyEmptyFromPercent"
        ? nextValue
        : defaults.budgetNearlyEmptyFromPercent;

    if (nextSafeBelow > nextNearlyEmpty) {
      toast.info("Safe below must be lower than nearly empty");
      return;
    }

    setWorkspaceDefaults(activeWorkspace.id, { [key]: nextValue });
  };

  const handleSortChange = (
    value: string,
    direction: SortDirectionDefault = "asc",
  ) => {
    if (!activeWorkspace || !sortPicker) return;
    if (sortPicker === "transactions") {
      setWorkspaceDefaults(activeWorkspace.id, {
        transactionSortField: value as TransactionSortFieldDefault,
        transactionSortDirection: direction,
      });
    } else if (sortPicker === "accounts") {
      setWorkspaceDefaults(activeWorkspace.id, {
        accountSortField: value as AccountSortFieldDefault,
        accountSortDirection: direction,
      });
    } else if (sortPicker === "categories") {
      setWorkspaceDefaults(activeWorkspace.id, {
        categorySortField: value as CategorySortFieldDefault,
        categorySortDirection: direction,
      });
    } else {
      setWorkspaceDefaults(activeWorkspace.id, {
        budgetSortField: value as BudgetSortFieldDefault,
        budgetSortDirection: direction,
      });
    }
    setSortPicker(null);
    toast.success("Sort default updated");
  };

  const accountValue = defaults.defaultAccount ?? "";
  const incomeValue = defaults.defaultIncomeCategory ?? "";
  const expenseValue = defaults.defaultExpenseCategory ?? "";
  const accountIcon = accountValue
    ? getAccountIconName(accountValue, accountIcons)
    : "wallet-outline";
  const accountColor = accountValue
    ? getAccountColor(accountValue, accountColors)
    : theme.colors.primary;
  const incomeIcon = incomeValue
    ? getCategoryIconName(incomeValue, "income", categoryIcons)
    : "trending-up";
  const incomeColor = incomeValue
    ? getCategoryColor(incomeValue, "income", categoryColors)
    : theme.colors.primary;
  const expenseIcon = expenseValue
    ? getCategoryIconName(expenseValue, "expense", categoryIcons)
    : "trending-down";
  const expenseColor = expenseValue
    ? getCategoryColor(expenseValue, "expense", categoryColors)
    : theme.colors.primary;
  const safeBelowPercent = clampPercent(defaults.budgetSafeBelowPercent);
  const nearlyEmptyFromPercent = clampPercent(
    defaults.budgetNearlyEmptyFromPercent,
  );
  const transactionSortValue = sortLabel(
    "transactions",
    defaults.transactionSortField,
  );

  const normalizedQuery = query.trim().toLowerCase();
  const rows = [
    {
      id: "currency",
      section: "Transactions",
      icon: "cash-multiple",
      iconText: currency.symbol,
      iconColor: "#D4A72C",
      label: "Currency",
      value: currency.code,
      description: currency.name,
      search: `currency ${currency.code} ${currency.name}`,
      onPress: () => setCurrencyOpen(true),
    },
    {
      id: "account",
      section: "Transactions",
      icon: accountIcon,
      iconColor: accountColor,
      label: "Account",
      value: accountValue || "Auto",
      description: accountValue
        ? "New transactions use this account"
        : "Use recent or first account",
      search: `account ${accountValue}`,
      onPress: () => setPicker("account"),
    },
    {
      id: "income",
      section: "Transactions",
      icon: incomeIcon,
      iconColor: incomeColor,
      label: "Income",
      value: incomeValue || "Auto",
      description: incomeValue
        ? "Income entries use this category"
        : "Use recent or first income",
      search: `income category ${incomeValue}`,
      onPress: () => setPicker("income"),
    },
    {
      id: "expense",
      section: "Transactions",
      icon: expenseIcon,
      iconColor: expenseColor,
      label: "Expense",
      value: expenseValue || "Auto",
      description: expenseValue
        ? "Expense entries use this category"
        : "Use recent or first expense",
      search: `expense category ${expenseValue}`,
      onPress: () => setPicker("expense"),
    },
    {
      id: "transaction-sort",
      section: "Sort",
      icon: "sort-calendar-ascending",
      iconColor: sortColor(defaults.transactionSortField),
      label: "Transactions",
      value: transactionSortValue,
      valueIcon:
        defaults.transactionSortDirection === "desc"
          ? "arrow-down"
          : "arrow-up",
      description: "Default order for the main transactions tab",
      search: `sort transactions ${transactionSortValue}`,
      onPress: () => setSortPicker("transactions"),
    },
    {
      id: "account-sort",
      section: "Sort",
      icon: "wallet-outline",
      iconColor: sortColor(defaults.accountSortField),
      label: "Accounts",
      value: sortLabel("accounts", defaults.accountSortField),
      valueIcon:
        defaults.accountSortDirection === "desc" ? "arrow-down" : "arrow-up",
      description: "Default account list order",
      search: `sort accounts ${defaults.accountSortField} ${defaults.accountSortDirection}`,
      onPress: () => setSortPicker("accounts"),
    },
    {
      id: "category-sort",
      section: "Sort",
      icon: "tag-outline",
      iconColor: sortColor(defaults.categorySortField),
      label: "Categories",
      value: sortLabel("categories", defaults.categorySortField),
      valueIcon:
        defaults.categorySortDirection === "desc" ? "arrow-down" : "arrow-up",
      description: "Default category grid order",
      search: `sort categories ${defaults.categorySortField} ${defaults.categorySortDirection}`,
      onPress: () => setSortPicker("categories"),
    },
    {
      id: "budget-sort",
      section: "Sort",
      icon: "chart-box-outline",
      iconColor: sortColor(defaults.budgetSortField),
      label: "Budget",
      value: sortLabel("budget", defaults.budgetSortField),
      valueIcon:
        defaults.budgetSortDirection === "desc" ? "arrow-down" : "arrow-up",
      description: "Default budget order",
      search: `sort budget ${defaults.budgetSortField} ${defaults.budgetSortDirection}`,
      onPress: () => setSortPicker("budget"),
    },
    {
      id: "safe-budget",
      section: "Budget",
      icon: "shield-check-outline",
      iconColor: "#2E7D32",
      label: "Safe below",
      value: `${safeBelowPercent}%`,
      description: "Categories below this stay Safe",
      search: `budget safe below ${safeBelowPercent}`,
      onPress: () => setBudgetThresholdOpen("safeBelow"),
    },
    {
      id: "nearly-empty-budget",
      section: "Budget",
      icon: "progress-alert",
      iconColor: "#C77700",
      label: "Nearly empty",
      value: `${nearlyEmptyFromPercent}%`,
      description: "Move categories here at this percent",
      search: `budget nearly empty from ${nearlyEmptyFromPercent}`,
      onPress: () => setBudgetThresholdOpen("nearlyEmptyFrom"),
    },
  ].filter((row) =>
    normalizedQuery ? row.search.toLowerCase().includes(normalizedQuery) : true,
  );
  const isSearching = Boolean(normalizedQuery);

  return (
    <SafeAreaView
      style={[
        SettingsStyles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <SettingsSearchHeader
        title="Defaults"
        onBack={() => navigation.goBack()}
        query={query}
        onQueryChange={setQuery}
        searchOpen={searchOpen}
        onSearchOpenChange={setSearchOpen}
        placeholder="Search defaults"
      />
      <ScrollView
        contentContainerStyle={SettingsStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isSearching ? (
          <>
            <SectionLabel label="Matching defaults" />
            <SheetCard theme={theme}>
              {rows.length > 0 ? (
                rows.map((item) => <DefaultOptionRow key={item.id} {...item} />)
              ) : (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons
                    name="magnify"
                    size={20}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text
                    style={[
                      styles.emptyStateText,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    No defaults found
                  </Text>
                </View>
              )}
            </SheetCard>
          </>
        ) : (
          <>
            <SectionLabel label="Transactions" />
            <View style={styles.grid}>
              {rows
                .filter((item) => item.section === "Transactions")
                .map((item, index) => (
                  <DefaultOptionTile
                    key={item.id}
                    {...item}
                    animationIndex={index}
                  />
                ))}
            </View>

            <SectionLabel label="Budget" />
            <View style={styles.grid}>
              {rows
                .filter((item) => item.section === "Budget")
                .map((item, index) => (
                  <DefaultOptionTile
                    key={item.id}
                    {...item}
                    animationIndex={index + 4}
                  />
                ))}
            </View>

            <SectionLabel label="Sort" />
            <View style={styles.grid}>
              {rows
                .filter((item) => item.section === "Sort")
                .map((item, index) => (
                  <DefaultOptionTile
                    key={item.id}
                    {...item}
                    animationIndex={index + 6}
                  />
                ))}
            </View>
          </>
        )}
      </ScrollView>

      <CurrencyPickerModal
        visible={currencyOpen}
        currency={currency}
        onDismiss={() => setCurrencyOpen(false)}
        onSelect={handleCurrencyChange}
      />
      <AccountManagementModal
        isOpen={picker === "account"}
        onClose={() => setPicker(null)}
        management={accountManagement}
        selectedAccount={defaults.defaultAccount ?? ""}
        onSelectAccount={handleSelect}
      />
      <CategoryManagementModal
        isOpen={picker === "income"}
        onClose={() => setPicker(null)}
        management={incomeManagement}
        pickerMode
        selectedValue={defaults.defaultIncomeCategory ?? ""}
        onSelectCategory={handleSelect}
      />
      <SortDefaultsModal
        visible={sortPicker !== null}
        kind={sortPicker}
        selectedValue={
          sortPicker === "transactions"
            ? defaults.transactionSortField
            : sortPicker === "accounts"
              ? defaults.accountSortField
              : sortPicker === "categories"
                ? defaults.categorySortField
                : defaults.budgetSortField
        }
        direction={
          sortPicker === "transactions"
            ? defaults.transactionSortDirection
            : sortPicker === "accounts"
              ? defaults.accountSortDirection
              : sortPicker === "categories"
                ? defaults.categorySortDirection
                : defaults.budgetSortDirection
        }
        onDismiss={() => setSortPicker(null)}
        onApply={handleSortChange}
      />
      <BudgetThresholdModal
        visible={budgetThresholdOpen !== null}
        threshold={budgetThresholdOpen}
        safeBelowPercent={safeBelowPercent}
        nearlyEmptyFromPercent={nearlyEmptyFromPercent}
        onDismiss={() => setBudgetThresholdOpen(null)}
        onSave={(threshold, value) => {
          handleThresholdChange(
            threshold === "safeBelow"
              ? "budgetSafeBelowPercent"
              : "budgetNearlyEmptyFromPercent",
            value,
          );
          setBudgetThresholdOpen(null);
          toast.success("Budget threshold updated");
        }}
      />
      <CategoryManagementModal
        isOpen={picker === "expense"}
        onClose={() => setPicker(null)}
        management={expenseManagement}
        pickerMode
        selectedValue={defaults.defaultExpenseCategory ?? ""}
        onSelectCategory={handleSelect}
      />
    </SafeAreaView>
  );
}

function SortDefaultsModal({
  visible,
  kind,
  selectedValue,
  direction,
  onDismiss,
  onApply,
}: {
  visible: boolean;
  kind: SortPicker;
  selectedValue: string;
  direction: SortDirectionDefault;
  onDismiss: () => void;
  onApply: (value: string, direction?: SortDirectionDefault) => void;
}) {
  if (!kind) return null;
  if (kind === "transactions") {
    return (
      <TransactionSortModal
        visible={visible}
        sortConfig={{
          field: selectedValue as TransactionSortFieldDefault,
          direction: direction,
        }}
        onChange={(next) => onApply(next.field, next.direction)}
        onReset={() => undefined}
        onDismiss={onDismiss}
      />
    );
  }

  return (
    <SortOptionSheet
      visible={visible}
      title={`Default ${kind === "budget" ? "budget" : kind} sort`}
      subtitle="Choose the order used when this section opens."
      options={kind === "budget" ? BUDGET_SORT_OPTIONS : SIMPLE_SORT_OPTIONS}
      value={selectedValue}
      direction={direction}
      resetDirection={kind === "budget" ? "desc" : "asc"}
      onChange={(next) => onApply(next)}
      onDismiss={onDismiss}
      applyLabel="Save default"
      onApply={(next, nextDirection) => onApply(next, nextDirection)}
    />
  );
}

function CurrencyPickerModal({
  currency,
  onDismiss,
  onSelect,
  visible,
}: {
  visible: boolean;
  currency: WorkspaceCurrency;
  onDismiss: () => void;
  onSelect: (currency: WorkspaceCurrency) => void;
}) {
  const theme = useTheme();
  const [query, setQuery] = React.useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredCurrencies = React.useMemo(() => {
    if (!normalizedQuery) return CURRENCIES;
    return CURRENCIES.filter((item) => {
      return (
        item.code.toLowerCase().includes(normalizedQuery) ||
        item.name.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [normalizedQuery]);

  React.useEffect(() => {
    if (!visible) setQuery("");
  }, [visible]);

  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onDismiss}
      presentation="sheet"
      keyboardAware
      contentContainerStyle={{
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: "86%",
        overflow: "hidden",
      }}
      includeBottomInset={false}
    >
      <SheetHandle />
      <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        <TextInput
          mode="outlined"
          placeholder="Search currency"
          value={query}
          onChangeText={setQuery}
          left={<TextInput.Icon icon="magnify" />}
          style={{ backgroundColor: theme.colors.background }}
        />
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          gap: 10,
          paddingHorizontal: 20,
          paddingBottom: 180,
        }}
      >
        {filteredCurrencies.map((item) => {
          const selected = item.code === currency.code;
          const symbol = getDisplayCurrencySymbol(item);
          return (
            <CurrencyOptionCard
              key={item.code}
              item={item}
              selected={selected}
              symbol={symbol}
              onPress={() =>
                onSelect({
                  code: item.code,
                  name: item.name,
                  symbol,
                })
              }
            />
          );
        })}
      </ScrollView>
    </AnimatedPaperModal>
  );
}

function CurrencyOptionCard({
  item,
  onPress,
  selected,
  symbol,
}: {
  item: CurrencyItem;
  onPress: () => void;
  selected: boolean;
  symbol: string;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.currencyCard,
        {
          backgroundColor: selected
            ? theme.colors.primaryContainer
            : theme.colors.surface,
          borderColor: selected
            ? theme.colors.primary
            : theme.colors.outlineVariant,
          opacity: pressed ? 0.65 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.currencyFlagWrap,
          { backgroundColor: theme.colors.elevation.level1 },
        ]}
      >
        <Text style={styles.currencyFlag}>{item.flag_emoji ?? symbol}</Text>
      </View>
      <View style={styles.currencyCardBody}>
        <Text
          numberOfLines={1}
          style={[styles.currencyName, { color: theme.colors.onSurface }]}
        >
          {item.name}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            styles.currencyCode,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          {item.code}
        </Text>
      </View>
      <Text
        numberOfLines={1}
        style={[
          styles.valueText,
          { color: selected ? theme.colors.primary : theme.colors.onSurface },
        ]}
      >
        {symbol}
      </Text>
      <MaterialCommunityIcons
        name={selected ? "check-circle" : "circle-outline"}
        size={18}
        color={selected ? theme.colors.primary : theme.colors.onSurfaceVariant}
        style={{ opacity: selected ? 1 : 0.32 }}
      />
    </Pressable>
  );
}

function SheetHandle() {
  const theme = useTheme();

  return (
    <View style={styles.handleWrap}>
      <View
        style={[
          styles.handle,
          { backgroundColor: theme.colors.outlineVariant },
        ]}
      />
    </View>
  );
}

function BudgetThresholdModal({
  visible,
  threshold,
  safeBelowPercent,
  nearlyEmptyFromPercent,
  onDismiss,
  onSave,
}: {
  visible: boolean;
  threshold: BudgetThreshold | null;
  safeBelowPercent: number;
  nearlyEmptyFromPercent: number;
  onDismiss: () => void;
  onSave: (threshold: BudgetThreshold, value: number) => void;
}) {
  const theme = useTheme();
  const { bottom } = useSafeAreaInsets();
  const [safeBelow, setSafeBelow] = React.useState(safeBelowPercent);
  const [nearlyEmptyFrom, setNearlyEmptyFrom] = React.useState(
    nearlyEmptyFromPercent,
  );
  const wiggle = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      setSafeBelow(safeBelowPercent);
      setNearlyEmptyFrom(nearlyEmptyFromPercent);
    }
  }, [nearlyEmptyFromPercent, safeBelowPercent, visible]);

  const playWiggle = React.useCallback(() => {
    wiggle.stopAnimation();
    wiggle.setValue(0);
    Animated.sequence([
      Animated.timing(wiggle, {
        toValue: 1,
        duration: 55,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(wiggle, {
        toValue: -1,
        duration: 80,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(wiggle, {
        toValue: 0,
        duration: 65,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [wiggle]);

  const wiggleStyle = {
    transform: [
      {
        translateX: wiggle.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [-5, 0, 5],
        }),
      },
    ],
  };

  const changeSafeBelow = (value: number) => {
    const next = clampPercent(value);
    if (next > nearlyEmptyFrom) {
      setSafeBelow(nearlyEmptyFrom);
      playWiggle();
      return;
    }
    setSafeBelow(next);
  };

  const changeNearlyEmptyFrom = (value: number) => {
    const next = clampPercent(value);
    if (next < safeBelow) {
      setNearlyEmptyFrom(safeBelow);
      playWiggle();
      return;
    }
    setNearlyEmptyFrom(next);
  };

  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onDismiss}
      presentation="sheet"
      contentContainerStyle={{
        backgroundColor: theme.colors.background,
        paddingHorizontal: 20,
        paddingBottom: Math.max(24, bottom + 24),
      }}
    >
      <SheetHandle />
      <View style={styles.modalHeader}>
        <View>
          <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            {threshold === "safeBelow" ? "Safe below" : "Nearly empty from"}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close budget thresholds"
          onPress={onDismiss}
          style={styles.modalClose}
        >
          <MaterialCommunityIcons
            name="close"
            size={22}
            color={theme.colors.onSurfaceVariant}
          />
        </Pressable>
      </View>

      <View style={styles.thresholdSectionRow}>
        <Text style={[styles.modalSectionLabel, { color: theme.colors.onSurfaceVariant }]}>
          THRESHOLD
        </Text>
        <Text
          style={[
            styles.thresholdSectionValue,
            { color: theme.colors.onSurface },
          ]}
        >
          {threshold === "safeBelow" ? safeBelow : nearlyEmptyFrom}%
        </Text>
      </View>
      {threshold === "safeBelow" ? (
        <ThresholdSlider
          value={safeBelow}
          accent="#2E7D32"
          onChange={changeSafeBelow}
          minimumValue={0}
          maximumValue={nearlyEmptyFrom}
          onSlidingComplete={() => {
            if (safeBelow === nearlyEmptyFrom) playWiggle();
          }}
          wiggleStyle={wiggleStyle}
        />
      ) : (
        <ThresholdSlider
          value={nearlyEmptyFrom}
          accent="#C77700"
          onChange={changeNearlyEmptyFrom}
          minimumValue={safeBelow}
          maximumValue={100}
          onSlidingComplete={() => {
            if (nearlyEmptyFrom === safeBelow) playWiggle();
          }}
          wiggleStyle={wiggleStyle}
        />
      )}

      <Text style={styles.thresholdHint}>
        {threshold === "safeBelow"
          ? "Allowed up to the lower limit of Nearly empty (" + nearlyEmptyFrom + "%)."
          : "Allowed down to the upper limit of Safe (" + safeBelow + "%)."}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Save budget thresholds"
        onPress={() =>
          onSave(
            threshold ?? "safeBelow",
            threshold === "safeBelow" ? safeBelow : nearlyEmptyFrom,
          )
        }
        style={({ pressed }) => [
          styles.saveButton,
          {
            backgroundColor: theme.colors.primary,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="check"
          size={22}
          color={theme.colors.onPrimary}
        />
        <Text
          style={[styles.saveButtonText, { color: theme.colors.onPrimary }]}
        >
          SAVE
        </Text>
      </Pressable>
    </AnimatedPaperModal>
  );
}

function ThresholdSlider({
  value,
  accent,
  onChange,
  minimumValue,
  maximumValue,
  onSlidingComplete,
  wiggleStyle,
}: {
  value: number;
  accent: string;
  onChange: (value: number) => void;
  minimumValue: number;
  maximumValue: number;
  onSlidingComplete: () => void;
  wiggleStyle: object;
}) {
  const theme = useTheme();

  return (
    <Animated.View
      style={[
        styles.thresholdSliderCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
        },
        wiggleStyle,
      ]}
    >
      <Slider
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={1}
        value={value}
        onValueChange={onChange}
        onSlidingComplete={onSlidingComplete}
        minimumTrackTintColor={accent}
        maximumTrackTintColor={theme.colors.outlineVariant}
        thumbTintColor={accent}
        style={styles.slider}
      />
    </Animated.View>
  );
}

function DefaultOptionTile({
  icon,
  iconText,
  iconColor,
  label,
  onPress,
  value,
  valueIcon,
  animationIndex = 0,
}: {
  icon: string;
  iconText?: string;
  iconColor?: string;
  label: string;
  onPress: () => void;
  value: string;
  valueIcon?: string;
  animationIndex?: number;
}) {
  const theme = useTheme();
  const resolvedIconColor = iconColor ?? theme.colors.primary;
  const entranceAnimation = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(entranceAnimation, {
      toValue: 1,
      delay: animationIndex * 55,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    return () => entranceAnimation.stopAnimation();
  }, [animationIndex, entranceAnimation]);

  return (
    <Animated.View
      style={[
        styles.tileAnimated,
        {
          opacity: entranceAnimation,
          transform: [
            {
              translateY: entranceAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.optionTile,
          {
            backgroundColor: theme.colors.elevation.level1,
            borderColor: theme.colors.outlineVariant,
            opacity: pressed ? 0.72 : 1,
          },
        ]}
      >
      <View
        style={[styles.tileIconWrap, { backgroundColor: resolvedIconColor }]}
      >
        {iconText ? (
          <Text style={styles.tileIconText}>{iconText}</Text>
        ) : (
          <MaterialCommunityIcons name={icon as any} size={22} color="#FFFFFF" />
        )}
      </View>
      <View style={styles.tileCopy}>
        <Text
          style={[styles.tileLabel, { color: theme.colors.onSurface }]}
          numberOfLines={1}
        >
          {label}
        </Text>
        <View style={styles.tileValueRow}>
          <Text
            style={[styles.tileValue, { color: theme.colors.onSurfaceVariant }]}
            numberOfLines={1}
          >
            {value}
          </Text>
          {valueIcon ? (
            <MaterialCommunityIcons
              name={valueIcon as any}
              size={12}
              color={theme.colors.onSurfaceVariant}
              style={styles.tileValueIcon}
            />
          ) : null}
        </View>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={18}
        color={theme.colors.onSurfaceVariant}
        style={styles.tileChevron}
      />
      </Pressable>
    </Animated.View>
  );
}

function DefaultOptionRow({
  description,
  icon,
  iconColor,
  label,
  inputValue,
  onChangeText,
  onPress,
  value,
}: {
  description: string;
  icon: string;
  iconColor?: string;
  label: string;
  inputValue?: string;
  onChangeText?: (value: string) => void;
  onPress?: () => void;
  value: string;
}) {
  const theme = useTheme();
  const resolvedIconColor = iconColor ?? theme.colors.primary;

  if (onChangeText) {
    return (
      <View style={[styles.thresholdRow, styles.defaultsRow]}>
        <View
          style={[
            styles.thresholdIconWrap,
            { backgroundColor: theme.colors.elevation.level1 },
          ]}
        >
          <MaterialCommunityIcons
            name={icon as any}
            size={20}
            color={resolvedIconColor}
          />
        </View>
        <View style={styles.thresholdBody}>
          <Text
            style={[styles.thresholdLabel, { color: theme.colors.onSurface }]}
          >
            {label}
          </Text>
          <Text
            style={[
              styles.thresholdDescription,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {description}
          </Text>
        </View>
        <View style={styles.percentInputWrap}>
          <TextInput
            dense
            keyboardType="number-pad"
            mode="flat"
            onChangeText={onChangeText}
            style={[
              styles.percentInput,
              { backgroundColor: theme.colors.elevation.level1 },
            ]}
            textColor={theme.colors.onSurface}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            value={inputValue ?? ""}
          />
          <Text
            style={[
              styles.percentSymbol,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            %
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ActionRow
      icon={icon}
      iconColor={resolvedIconColor}
      label={label}
      description={description}
      onPress={onPress ?? (() => undefined)}
      rightElement={
        <Text
          numberOfLines={1}
          style={[styles.rowValueText, { color: theme.colors.onSurface }]}
        >
          {value}
        </Text>
      }
      theme={theme}
      style={styles.defaultsRow}
      showChevron={Boolean(onPress)}
    />
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  optionTile: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 60,
    padding: 10,
    flex: 1,
  },
  tileAnimated: {
    width: "47%",
  },
  tileIconWrap: {
    alignItems: "center",
    borderRadius: 13,
    height: 36,
    justifyContent: "center",
    marginRight: 9,
    width: 36,
  },
  tileIconText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  tileLabel: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  tileValue: {
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 15,
    marginTop: 3,
  },
  tileValueRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    minWidth: 0,
  },
  tileValueIcon: {
    marginTop: 1,
  },
  tileCopy: {
    flex: 1,
    minWidth: 0,
  },
  tileChevron: {
    marginLeft: 6,
  },
  modalHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 7,
    marginTop: 4,
  },
  thresholdSectionRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  thresholdSectionValue: {
    fontSize: 17,
    fontWeight: "500",
    marginBottom: 7,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 28,
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  modalClose: {
    alignItems: "center",
    borderRadius: 22,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  thresholdSliderCard: {
    borderRadius: 18,
    marginBottom: 8,
    padding: 8,
  },
  slider: {
    height: 32,
    marginHorizontal: -5,
    marginTop: 2,
  },
  thresholdHint: {
    color: "#85858D",
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 10,
    textAlign: "center",
  },
  thresholdTooltip: {
    alignItems: "flex-start",
    borderRadius: 11,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  thresholdTooltipText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
  },
  saveButton: {
    alignItems: "center",
    borderRadius: 20,
    flexDirection: "row",
    gap: 9,
    justifyContent: "center",
    marginTop: 6,
    minHeight: 50,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  currencyCard: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 70,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  currencyCardBody: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  currencyCode: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  currencyFlag: {
    fontSize: 24,
    lineHeight: 28,
  },
  currencyFlagWrap: {
    alignItems: "center",
    borderRadius: 13,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  currencyName: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19,
  },
  emptyState: {
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    minHeight: 112,
    padding: 20,
  },
  emptyStateText: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  handle: {
    borderRadius: 999,
    height: 4,
    width: 42,
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 14,
  },
  defaultsRow: {
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  rowValueText: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19,
    maxWidth: 120,
    textAlign: "right",
  },
  thresholdBody: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  thresholdDescription: {
    fontSize: 12,
  },
  thresholdIconWrap: {
    alignItems: "center",
    borderRadius: 10,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  thresholdLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  thresholdRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
  },
  percentInput: {
    borderRadius: 10,
    fontSize: 13,
    fontWeight: "800",
    height: 36,
    paddingHorizontal: 0,
    textAlign: "center",
    width: 52,
  },
  percentInputWrap: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  percentSymbol: {
    fontSize: 12,
    fontWeight: "800",
  },
  valueText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "800",
    maxWidth: 110,
  },
});
