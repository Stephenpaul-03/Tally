import {
  CurrencyPickerField,
  type WorkspaceCurrency,
} from "@/components/CurrencyPickerField";
import { useAppSelector } from "@/hooks/Redux";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import { typography } from "@/theme/typography";
import { getContrastColor } from "@/utils/ColorHelpers";
import React from "react";
import { Pressable, View } from "react-native";
import { Text, TextInput, useTheme, type MD3Theme } from "react-native-paper";
import { amountHero } from "../Styles";

interface AmountHeroProps {
  value: string;
  onChange: (v: string) => void;
  currency: WorkspaceCurrency;
  onCurrencyChange: (currency: WorkspaceCurrency) => void;
  error?: string;
}

export function AmountHero({
  value,
  onChange,
  currency,
  onCurrencyChange,
  error,
}: AmountHeroProps) {
  const activeWorkspace = useAppSelector(selectActiveWorkspace);
  const fallbackCurrency: WorkspaceCurrency = {
    code: activeWorkspace?.currencyCode ?? "INR",
    name: activeWorkspace?.currencyName ?? "Indian Rupee",
    symbol: activeWorkspace?.currencySymbol ?? "₹",
  };
  const theme = useTheme<MD3Theme>();

  const selectedCurrency = currency ?? fallbackCurrency;

  return (
    <View style={amountHero.container}>
      <Text
        variant="labelSmall"
        style={[
          amountHero.label,
          {
            color: theme.colors.primary,
            ...typography.editorial.sectionLabel,
            letterSpacing: 2,
          },
        ]}
      >
        AMOUNT
      </Text>

      <View style={amountHero.amountRow}>
        <CurrencyPickerField
          currency={selectedCurrency}
          onChange={onCurrencyChange}
          theme={theme}
          renderTrigger={({ open }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change transaction currency"
              onPress={open}
              style={({ pressed }) => [
                amountHero.currencyButton,
                { opacity: pressed ? 0.62 : 1 },
              ]}
            >
              <Text
                style={[
                  amountHero.currencySymbol,
                  { color: getContrastColor(theme.colors.background) },
                ]}
              >
                {selectedCurrency.symbol}
              </Text>
            </Pressable>
          )}
        />

        <TextInput
          mode="flat"
          keyboardType="decimal-pad"
          value={value}
          onChangeText={onChange}
          placeholder="0.00"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          style={[
            amountHero.input,
            { color: getContrastColor(theme.colors.background) },
          ]}
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          textColor={getContrastColor(theme.colors.background)}
          selectionColor={theme.colors.primary}
          cursorColor={getContrastColor(theme.colors.background)}
          contentStyle={{
            paddingHorizontal: 0,
            paddingLeft: 0,
            paddingVertical: 0,
          }}
        />
      </View>

      {error ? (
        <Text style={[amountHero.error, { color: theme.colors.error }]}>
          {error}
        </Text>
      ) : null}

      <View
        style={[
          amountHero.amountDivider,
          { backgroundColor: theme.colors.primary },
        ]}
      />

    </View>
  );
}
