import { TransactionType } from "@/modules/Common/Utils/Types";
import { typography } from "@/theme/typography";
import { getContrastColor } from "@/utils/colorHelpers";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";
import { Text, TextInput, useTheme, type MD3Theme } from "react-native-paper";
import { amountHero } from "../Styles";
interface AmountHeroProps {
  value: string;
  onChange: (v: string) => void;
  transactionType: TransactionType;
  error?: string;
}

export function AmountHero({
  value,
  onChange,
  transactionType,
  error,
}: AmountHeroProps) {
  const theme = useTheme<MD3Theme>();
  const isExpense = transactionType === "expense";

  return (
    <View
      style={[
        amountHero.container,
        {
          backgroundColor: theme.colors.elevation.level1,
          borderColor: error ? theme.colors.error : theme.colors.outlineVariant,
        },
      ]}
    >
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
        <MaterialCommunityIcons
          name={isExpense ? "minus" : "plus"}
          size={22}
          style={[
            amountHero.symbol,
            { color: getContrastColor(theme.colors.elevation.level1) },
          ]}
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
            { color: getContrastColor(theme.colors.elevation.level1) },
          ]}
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          textColor={getContrastColor(theme.colors.elevation.level1)}
          selectionColor={getContrastColor(theme.colors.elevation.level1)}
          cursorColor={getContrastColor(theme.colors.elevation.level1)}
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
    </View>
  );
}
