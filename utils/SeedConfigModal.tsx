import { AnimatedPaperModal } from "@/components/modal/modal";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Text, TextInput, useTheme } from "react-native-paper";

export type SeedScenarioId =
  | "split-income"
  | "split-budgets"
  | "expenses-under-budget"
  | "expenses-over-budget"
  | "expenses-under-income"
  | "expenses-over-income";

export type SeedScenario = {
  id: SeedScenarioId;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
};

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (scenario: SeedScenario, amount: number) => void;
};

const SCENARIOS: SeedScenario[] = [
  {
    id: "split-income",
    title: "Split income across accounts",
    description: "Uses the amount as income and divides it across accounts.",
    icon: "cash-plus",
  },
  {
    id: "split-budgets",
    title: "Split amount across budgets",
    description: "Uses the amount as monthly budget and divides it by category.",
    icon: "wallet-outline",
  },
  {
    id: "expenses-under-budget",
    title: "Expenses under budget",
    description: "Uses the amount as budget and adds expenses at 70%.",
    icon: "trending-down",
  },
  {
    id: "expenses-over-budget",
    title: "Expenses over budget",
    description: "Uses the amount as budget and adds expenses at 130%.",
    icon: "trending-up",
  },
  {
    id: "expenses-under-income",
    title: "Expenses under income",
    description: "Splits income, then adds expenses at 70% of it.",
    icon: "scale-balance",
  },
  {
    id: "expenses-over-income",
    title: "Expenses over income",
    description: "Splits income, then adds expenses at 130% of it.",
    icon: "alert-circle-outline",
  },
];

export function SeedConfigModal({ open, onClose, onConfirm }: Props) {
  const theme = useTheme();
  const [amountInput, setAmountInput] = React.useState("60000");

  const amount = Number.parseFloat(amountInput) || 0;

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    const next =
      parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : cleaned;
    setAmountInput(next);
  };

  return (
    <AnimatedPaperModal
      visible={open}
      onDismiss={onClose}
      presentation="sheet"
      keyboardAware
      contentContainerStyle={{
        backgroundColor: theme.colors.elevation.level1,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: "82%",
        overflow: "hidden",
      }}
    >
      <View style={{ paddingHorizontal: 18, paddingTop: 12, paddingBottom: 8 }}>
        <View
          style={{
            alignSelf: "center",
            width: 42,
            height: 4,
            borderRadius: 999,
            backgroundColor: theme.colors.outlineVariant,
            marginBottom: 16,
          }}
        />
        <Text
          style={{
            color: theme.colors.onSurface,
            fontSize: 20,
            fontWeight: "800",
          }}
        >
          Seed test data
        </Text>
        <Text
          style={{
            color: theme.colors.onSurfaceVariant,
            fontSize: 13,
            lineHeight: 18,
            marginTop: 4,
          }}
        >
          Pick a small preset to generate useful demo data.
        </Text>
        <TextInput
          mode="outlined"
          value={amountInput}
          onChangeText={handleAmountChange}
          keyboardType="decimal-pad"
          label="Amount"
          placeholder="60000"
          left={<TextInput.Affix text="₹" />}
          style={{
            backgroundColor: theme.colors.elevation.level1,
            marginTop: 14,
          }}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingTop: 8,
          paddingBottom: 28,
          gap: 8,
        }}
      >
        {SCENARIOS.map((scenario) => (
          <Pressable
            key={scenario.id}
            accessibilityRole="button"
            disabled={amount <= 0}
            onPress={() => onConfirm(scenario, amount)}
            style={({ pressed }) => ({
              borderRadius: 14,
              borderWidth: 0.5,
              borderColor: theme.colors.outlineVariant,
              backgroundColor: pressed
                ? theme.colors.elevation.level3
                : theme.colors.elevation.level2,
              paddingHorizontal: 14,
              paddingVertical: 14,
              opacity: amount <= 0 ? 0.45 : pressed ? 0.72 : 1,
            })}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: theme.colors.primaryContainer,
                }}
              >
                <MaterialCommunityIcons
                  name={scenario.icon}
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    color: theme.colors.onSurface,
                    fontSize: 15,
                    fontWeight: "800",
                  }}
                >
                  {scenario.title}
                </Text>
                <Text
                  numberOfLines={2}
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    fontSize: 12,
                    lineHeight: 16,
                    marginTop: 2,
                  }}
                >
                  {scenario.description}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </AnimatedPaperModal>
  );
}
