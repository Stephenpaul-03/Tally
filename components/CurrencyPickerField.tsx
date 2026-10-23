import { DesignText as Text } from "@/components/DesignText";
import { SettingsHeader } from "@/modules/Settings/Components/SettingsHeader";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { FlatList, Pressable, View, useWindowDimensions } from "react-native";
import { useTheme, type MD3Theme } from "react-native-paper";
import { AnimatedPaperModal } from "./modal/modal";

export type WorkspaceCurrency = {
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

type Props = {
  currency: WorkspaceCurrency;
  onChange: (currency: WorkspaceCurrency) => void;
  theme: MD3Theme;
  label?: string;
  disabled?: boolean;
  variant?: "default" | "editorial";
  renderTrigger?: (args: { open: () => void }) => React.ReactNode;
};

const currencyData = require("@/data/currencies.json") as Record<
  string,
  CurrencyItem
>;

export const DEFAULT_WORKSPACE_CURRENCY: WorkspaceCurrency = {
  code: "INR",
  name: "Indian Rupee",
  symbol: "₹",
};

const CURRENCIES = Object.values(currencyData) as CurrencyItem[];

export function CurrencyPickerModal({
  visible,
  onDismiss,
  currency,
  onSelect,
}: {
  visible: boolean;
  onDismiss: () => void;
  currency: WorkspaceCurrency;
  onSelect: (currency: WorkspaceCurrency) => void;
}) {
  const theme = useTheme<ExtendedMD3Theme>();
  const c = theme.colors;
  const { height } = useWindowDimensions();
  const { bottom } = useSafeAreaInsets();
  const [query, setQuery] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);
  React.useEffect(() => {
    if (!visible) {
      setQuery("");
      setSearchOpen(false);
    }
  }, [visible]);
  const filtered = React.useMemo(() => {
    const term = query.trim().toLowerCase();
    return CURRENCIES.filter(
      (item) =>
        !term || `${item.code} ${item.name}`.toLowerCase().includes(term),
    );
  }, [query]);
  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onDismiss}
      presentation="sheet"
      keyboardAware
      includeBottomInset={false}
      contentContainerStyle={{
        backgroundColor: c.background,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        maxHeight: height * 0.86,
        overflow: "hidden",
      }}
    >
      <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 8 }}>
        <View
          style={{
            width: 44,
            height: 4,
            borderRadius: 4,
            backgroundColor: c.outlineVariant,
          }}
        />
      </View>
      <SettingsHeader
        title="Currency"
        modal
        onBack={onDismiss}
        query={query}
        onQueryChange={setQuery}
        searchOpen={searchOpen}
        onSearchOpenChange={setSearchOpen}
        searchPlaceholder="Search currency"
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.code}
        style={{ flexGrow: 0, flexShrink: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        initialNumToRender={12}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 4,
          paddingBottom: Math.max(bottom, 16),
          gap: 8,
        }}
        ListEmptyComponent={
          <Text style={{ padding: 24, color: c.onSurfaceVariant }}>
            No currencies found
          </Text>
        }
        renderItem={({ item }) => {
          const selected = item.code === currency.code;
          const symbol = getDisplayCurrencySymbol(item);
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${item.name}, ${item.code}`}
              onPress={() =>
                onSelect({ code: item.code, name: item.name, symbol })
              }
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                minHeight: 72,
                padding: 12,
                borderRadius: theme.expressive ? 24 : 16,
                backgroundColor: selected
                  ? c.primaryContainer
                  : c.elevation.level1,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 16,
                  backgroundColor: selected ? c.primary : c.secondaryContainer,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={{
                    paddingHorizontal: 4,
                    fontSize: 20,
                    fontWeight: "700",
                    color: selected ? c.onPrimary : c.onSecondaryContainer,
                  }}
                >
                  {symbol}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontWeight: "700",
                    fontSize: 14,
                    color: c.onSurface,
                  }}
                >
                  {item.name}
                </Text>
                <Text style={{ fontSize: 12, color: c.onSurfaceVariant }}>
                  {item.code}
                </Text>
              </View>
              <MaterialCommunityIcons
                name={selected ? "check-circle" : "circle-outline"}
                size={22}
                color={selected ? c.primary : c.outline}
              />
            </Pressable>
          );
        }}
      />
    </AnimatedPaperModal>
  );
}

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
    // Fall back to package data for currency codes unsupported by Intl.
  }

  if (item.symbol && item.symbol !== item.code) return item.symbol;
  if (item.symbol_native && item.symbol_native !== item.code) {
    return item.symbol_native;
  }

  return item.code;
}

export function CurrencyPickerField({
  currency,
  onChange,
  theme,
  label = "Currency",
  disabled = false,
  variant = "default",
  renderTrigger,
}: Props) {
  const [visible, setVisible] = React.useState(false);
  const c = theme.colors;
  const isEditorial = variant === "editorial";

  return (
    <>
      {renderTrigger ? (
        renderTrigger({ open: () => setVisible(true) })
      ) : (
        <Pressable
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${currency.code}, ${currency.name}`}
          onPress={() => setVisible(true)}
          style={({ pressed }) => ({
            borderRadius: isEditorial ? 0 : 16,
            paddingVertical: isEditorial ? 12 : 8,
            paddingHorizontal: isEditorial ? 14 : 8,
            backgroundColor: isEditorial ? "transparent" : c.background,
            borderWidth: isEditorial ? 0 : 1,
            borderColor: isEditorial ? "transparent" : c.outline,
            opacity: pressed ? 0.72 : 1,
          })}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  color: c.onSurface,
                  fontSize: isEditorial ? 14 : 14,
                  fontWeight: "700",
                  letterSpacing: isEditorial ? 0.6 : 0,
                }}
              >
                {label}
              </Text>
              {!isEditorial ? (
                <Text
                  numberOfLines={1}
                  style={{
                    color: c.onSurfaceVariant,
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  {currency.name}
                </Text>
              ) : null}
            </View>
            <View style={{ alignItems: "flex-end", marginLeft: 12 }}>
              <Text
                style={{
                  color: c.onSurface,
                  fontSize: isEditorial ? 14 : 18,
                  fontWeight: "700",
                }}
              >
                {isEditorial
                  ? `${currency.code} ${currency.symbol}`
                  : currency.symbol}
              </Text>
              {!isEditorial ? (
                <Text
                  style={{
                    color: c.onSurfaceVariant,
                    fontSize: 11,
                    marginTop: 1,
                  }}
                >
                  {currency.code}
                </Text>
              ) : null}
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={c.onSurfaceVariant}
            />
          </View>
        </Pressable>
      )}

      <CurrencyPickerModal
        visible={visible}
        onDismiss={() => setVisible(false)}
        currency={currency}
        onSelect={(next) => {
          onChange(next);
          setVisible(false);
        }}
      />
    </>
  );
}
