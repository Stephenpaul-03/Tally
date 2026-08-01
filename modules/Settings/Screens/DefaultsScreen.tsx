import { AnimatedPaperModal } from "@/components/modal/modal";
import { ActionRow } from "@/components/ActionRow";
import { SheetCard } from "@/components/SheetCard";
import { toast } from "@/components/toast/ToastProvider";
import { useAppDispatch, useAppSelector } from "@/hooks/Redux";
import { useAccountManagement } from "@/hooks/use-account-manangement";
import { useCategoryManagement } from "@/hooks/use-category-manamgement";
import { useWorkspaceDefaults } from "@/hooks/use-workspace-defaults";
import { AccountManagementModal } from "@/modules/Management/Account/Index";
import { CategoryManagementModal } from "@/modules/Management/Category/Index";
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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text, TextInput, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getAccountColor,
  getAccountIconName,
  getCategoryColor,
  getCategoryIconName,
} from "@/utils/Helpers";
import { SectionLabel } from "../Components/SectionLabel";
import { SettingsSearchHeader } from "../Components/SettingsSearchHeader";
import type { SettingsStackParamList } from "../Navigation";
import { SettingsStyles } from "../Styles";

type PickerState = "account" | "income" | "expense" | null;

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
    value: string,
  ) => {
    if (!activeWorkspace) return;
    const numeric = Number(value.replace(/\D/g, ""));
    const nextValue = Number.isFinite(numeric) ? clampPercent(numeric) : 0;
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

  const normalizedQuery = query.trim().toLowerCase();
  const rows = [
    {
      id: "currency",
      section: "Workspace",
      icon: "cash-multiple",
      iconColor: theme.colors.primary,
      label: "Currency",
      value: `${currency.symbol} ${currency.code}`,
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
      id: "safe-budget",
      section: "Budget",
      icon: "shield-check-outline",
      iconColor: "#2E7D32",
      label: "Safe below",
      value: `${safeBelowPercent}%`,
      description: "Categories below this stay in Safe",
      search: `budget safe below ${safeBelowPercent}`,
      onPress: undefined,
      inputValue: String(safeBelowPercent),
      onChangeText: (value: string) =>
        handleThresholdChange("budgetSafeBelowPercent", value),
    },
    {
      id: "nearly-empty-budget",
      section: "Budget",
      icon: "progress-alert",
      iconColor: "#C77700",
      label: "Nearly empty from",
      value: `${nearlyEmptyFromPercent}%`,
      description: "Categories at this percent move to Nearly empty",
      search: `budget nearly empty from ${nearlyEmptyFromPercent}`,
      onPress: undefined,
      inputValue: String(nearlyEmptyFromPercent),
      onChangeText: (value: string) =>
        handleThresholdChange("budgetNearlyEmptyFromPercent", value),
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
                rows.map((item) => (
                  <DefaultOptionRow key={item.id} {...item} />
                ))
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
            <SectionLabel label="Workspace" />
            <SheetCard theme={theme}>
              {rows
                .filter((item) => item.section === "Workspace")
                .map((item) => (
                  <DefaultOptionRow key={item.id} {...item} />
                ))}
            </SheetCard>

            <SectionLabel label="Transactions" />
            <SheetCard theme={theme}>
              {rows
                .filter((item) => item.section === "Transactions")
                .map((item) => (
                  <DefaultOptionRow key={item.id} {...item} />
                ))}
            </SheetCard>

            <SectionLabel label="Budget" />
            <SheetCard theme={theme}>
              {rows
                .filter((item) => item.section === "Budget")
                .map((item) => (
                  <DefaultOptionRow key={item.id} {...item} />
                ))}
            </SheetCard>
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
        style={[styles.handle, { backgroundColor: theme.colors.outlineVariant }]}
      />
    </View>
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
