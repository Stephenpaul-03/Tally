import { SheetCard } from "@/components/SheetCard";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useOnboarding } from "../OnboardingContext";
import type { OnboardingStackParamList } from "../OnboardingScreen";
import type { OnboardingPresetItem } from "../types";
import { OnboardingLayout, StepIntro } from "./OnboardingLayout";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Defaults">;

export function DefaultsScreen({ navigation }: Props) {
  const onboarding = useOnboarding();

  return (
    <OnboardingLayout routeName="Defaults" navigation={navigation}>
      <StepIntro
        icon="tune-variant"
        title="Choose transaction defaults"
        text="These make the add transaction sheet faster from the very first entry."
      />
      <PickerCard
        label="Default account"
        items={onboarding.accounts}
        selected={onboarding.defaultAccount}
        onSelect={onboarding.setDefaultAccount}
      />
      <PickerCard
        label="Default income"
        items={onboarding.incomeCategories}
        selected={onboarding.defaultIncomeCategory}
        onSelect={onboarding.setDefaultIncomeCategory}
      />
      <PickerCard
        label="Default expense"
        items={onboarding.expenseCategories}
        selected={onboarding.defaultExpenseCategory}
        onSelect={onboarding.setDefaultExpenseCategory}
      />
    </OnboardingLayout>
  );
}

function PickerCard({
  label,
  items,
  selected,
  onSelect,
}: {
  label: string;
  items: OnboardingPresetItem[];
  selected: string | null;
  onSelect: (value: string) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.group}>
      <Text style={[styles.groupLabel, { color: theme.colors.onSurfaceVariant }]}>
        {label}
      </Text>
      <SheetCard theme={theme}>
        {items.map((item) => {
          const active = selected === item.name;
          return (
            <Pressable
              key={item.name}
              onPress={() => onSelect(item.name)}
              style={styles.row}
            >
              <MaterialCommunityIcons
                name={item.icon as any}
                size={19}
                color={item.color}
              />
              <Text style={[styles.label, { color: theme.colors.onSurface }]}>
                {item.name}
              </Text>
              <MaterialCommunityIcons
                name={active ? "check-circle" : "circle-outline"}
                size={20}
                color={active ? item.color : theme.colors.onSurfaceVariant}
              />
            </Pressable>
          );
        })}
      </SheetCard>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 8,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 12,
    textTransform: "uppercase",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
});
