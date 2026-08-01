import { SheetCard } from "@/components/SheetCard";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { ONBOARDING_PRESETS } from "../presets";
import { useOnboarding } from "../OnboardingContext";
import type { OnboardingStackParamList } from "../OnboardingScreen";
import type { OnboardingPresetItem } from "../types";
import { OnboardingLayout, StepIntro } from "./OnboardingLayout";

type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  "Accounts" | "IncomeCategories" | "ExpenseCategories"
>;

export function CategoriesScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const onboarding = useOnboarding();
  const isAccounts = route.name === "Accounts";
  const type = route.name === "IncomeCategories" ? "income" : "expense";
  const title = isAccounts
    ? "Accounts"
    : type === "income"
      ? "Income Categories"
      : "Expense Categories";
  const icon = isAccounts
    ? "wallet-outline"
    : type === "income"
      ? "trending-up"
      : "trending-down";
  const presets = isAccounts
    ? ONBOARDING_PRESETS.accounts
    : type === "income"
      ? ONBOARDING_PRESETS.incomeCategories
      : ONBOARDING_PRESETS.expenseCategories;
  const selected = isAccounts
    ? onboarding.accounts
    : type === "income"
      ? onboarding.incomeCategories
      : onboarding.expenseCategories;
  const toggle = isAccounts
    ? onboarding.toggleAccount
    : type === "income"
      ? onboarding.toggleIncomeCategory
      : onboarding.toggleExpenseCategory;
  const selectedNames = new Set(selected.map((item) => item.name));

  return (
    <OnboardingLayout routeName={route.name} navigation={navigation}>
      <StepIntro
        icon={icon}
        title={title}
        text="Use the starter list, remove what does not fit, and create anything missing with the same editor used elsewhere in Tally."
      />
      <SheetCard theme={theme}>
        {presets.map((item) => (
          <PresetRow
            key={item.name}
            item={item}
            selected={selectedNames.has(item.name)}
            onPress={() => toggle(item)}
          />
        ))}
      </SheetCard>
      <Button
        icon="plus"
        mode="contained-tonal"
        onPress={() =>
          isAccounts
            ? navigation.navigate("AccountCreate")
            : navigation.navigate("CategoryCreate", { type })
        }
      >
        {isAccounts ? "Create account" : "Create category"}
      </Button>
      {selected.length === 0 ? (
        <Text style={{ color: theme.colors.error }}>
          Keep at least one item selected so new transactions have a default.
        </Text>
      ) : null}
    </OnboardingLayout>
  );
}

function PresetRow({
  item,
  selected,
  onPress,
}: {
  item: OnboardingPresetItem;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { opacity: pressed ? 0.65 : 1 },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: `${item.color}22` }]}>
        <MaterialCommunityIcons name={item.icon as any} size={19} color={item.color} />
      </View>
      <Text style={[styles.label, { color: theme.colors.onSurface }]}>
        {item.name}
      </Text>
      <MaterialCommunityIcons
        name={selected ? "check-circle" : "circle-outline"}
        size={21}
        color={selected ? item.color : theme.colors.onSurfaceVariant}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    minHeight: 58,
    paddingHorizontal: 14,
  },
  icon: {
    alignItems: "center",
    borderRadius: 14,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
});
