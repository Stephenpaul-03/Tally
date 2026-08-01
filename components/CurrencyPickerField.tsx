import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Text, TextInput, type MD3Theme } from "react-native-paper";
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
  variant?: "default" | "editorial";
  renderTrigger?: (args: { open: () => void }) => React.ReactNode;
};

const currencyData =
  require("../node_modules/@youssefprodev/rn-currency-picker/src/constants/CommonCurrency.json") as Record<
    string,
    CurrencyItem
  >;

export const DEFAULT_WORKSPACE_CURRENCY: WorkspaceCurrency = {
  code: "INR",
  name: "Indian Rupee",
  symbol: "₹",
};

const CURRENCIES = Object.values(currencyData) as CurrencyItem[];

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
  variant = "default",
  renderTrigger,
}: Props) {
  const [visible, setVisible] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const c = theme.colors;
  const isEditorial = variant === "editorial";

  const filteredCurrencies = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return CURRENCIES;
    return CURRENCIES.filter((item) => {
      return (
        item.code.toLowerCase().includes(normalized) ||
        item.name.toLowerCase().includes(normalized)
      );
    });
  }, [query]);

  const handleSelect = (item: CurrencyItem) => {
    onChange({
      code: item.code,
      name: item.name,
      symbol: getDisplayCurrencySymbol(item),
    });
    setQuery("");
    setVisible(false);
  };

  return (
    <>
      {renderTrigger ? (
        renderTrigger({ open: () => setVisible(true) })
      ) : (
        <Pressable
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

      <AnimatedPaperModal
        visible={visible}
        onDismiss={() => setVisible(false)}
        presentation="sheet"
        keyboardAware
        contentContainerStyle={{
          backgroundColor: c.elevation.level1,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: "82%",
          overflow: "hidden",
        }}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          <View
            style={{
              alignSelf: "center",
              width: 42,
              height: 4,
              borderRadius: 2,
              backgroundColor: c.outlineVariant,
              marginBottom: 14,
            }}
          />
          <Text
            style={{
              color: c.onSurface,
              fontSize: 18,
              fontWeight: "800",
              marginBottom: 12,
            }}
          >
            Select currency
          </Text>
          <TextInput
            mode="outlined"
            placeholder="Search currency"
            value={query}
            onChangeText={setQuery}
            left={<TextInput.Icon icon="magnify" />}
            style={{ backgroundColor: c.elevation.level1, marginBottom: 12 }}
          />
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollIndicatorInsets={{ bottom: 56 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 200 }}
        >
          {filteredCurrencies.map((item) => {
            const selected = item.code === currency.code;
            return (
              <Pressable
                key={item.code}
                onPress={() => handleSelect(item)}
                style={({ pressed }) => ({
                  borderRadius: 14,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  marginBottom: 6,
                  backgroundColor: selected
                    ? c.primaryContainer
                    : pressed
                      ? c.surfaceVariant
                      : "transparent",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                })}
              >
                <Text style={{ fontSize: 18, width: 24 }}>
                  {item.flag_emoji ?? "¤"}
                </Text>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      color: c.onSurface,
                      fontSize: 14,
                      fontWeight: "700",
                    }}
                  >
                    {item.name}
                  </Text>
                  <Text style={{ color: c.onSurfaceVariant, fontSize: 12 }}>
                    {item.code}
                  </Text>
                </View>
                <Text
                  style={{
                    color: selected ? c.primary : c.onSurfaceVariant,
                    fontSize: 14,
                    fontWeight: "800",
                  }}
                >
                  {getDisplayCurrencySymbol(item)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </AnimatedPaperModal>
    </>
  );
}
