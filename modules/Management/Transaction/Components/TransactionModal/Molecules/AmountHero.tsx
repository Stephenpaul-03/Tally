import { typography } from "@/theme/typography";
import { getContrastColor } from "@/utils/ColorHelpers";
import { TransactionType } from "@/utils/Types";
import React from "react";
import { Pressable, View } from "react-native";
import { Text, TextInput, useTheme, type MD3Theme } from "react-native-paper";
import { amountHero } from "../Styles";

interface AmountHeroProps {
  value: string;
  onChange: (v: string) => void;
  transactionType: TransactionType;
  error?: string;
}

const QUICK_ADD = [10, 50, 100, 500];

export function AmountHero({
  value,
  onChange,
  transactionType,
  error,
}: AmountHeroProps) {
  const theme = useTheme<MD3Theme>();

  const handleQuickAdd = (amount: number) => {
    const current = parseFloat(value) || 0;
    const next = current + amount;
    // Keep up to 2 decimal places, strip trailing zeros
    onChange(String(parseFloat(next.toFixed(2))));
  };

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
        {/* Currency symbol */}
        <Text
          style={[
            amountHero.currencySymbol,
            { color: getContrastColor(theme.colors.background) },
          ]}
        >
          ₹
        </Text>

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

      {/* Quick-add buttons */}
      <View
        style={[
          amountHero.quickAddRow,
          {
            backgroundColor: theme.colors.elevation.level2,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        {QUICK_ADD.map((amt, i) => (
          <React.Fragment key={amt}>
            {i > 0 && (
              <View
                style={[
                  amountHero.quickAddDivider,
                  { backgroundColor: theme.colors.outlineVariant },
                ]}
              />
            )}
            <Pressable
              onPress={() => handleQuickAdd(amt)}
              style={({ pressed }) => [
                amountHero.quickAddButton,
                { opacity: pressed ? 0.6 : 1 },
              ]}
              accessibilityLabel={`Add ${amt}`}
            >
              <Text
                variant="labelMedium"
                style={[
                  amountHero.quickAddLabel,
                  { color: theme.colors.primary },
                ]}
              >
                +{amt}
              </Text>
            </Pressable>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}
