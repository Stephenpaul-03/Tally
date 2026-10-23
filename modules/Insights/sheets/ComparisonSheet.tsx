import React from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { DesignText as Text } from "@/components/DesignText";
import { ControlsSheet } from "./ControlsSheet";
import { BudgetProgress } from "../components/Primitives";
import { monthLabel, type calculateInsights } from "../calculations";

type Data = ReturnType<typeof calculateInsights>;
export function ComparisonSheet({
  visible,
  onClose,
  data,
  month,
  budget,
  canCompareBudget,
  money,
  onChooseMonth,
  onSetBudget,
}: {
  visible: boolean;
  onClose: () => void;
  data: Data;
  month: string;
  budget: number;
  canCompareBudget: boolean;
  money: (amount: number) => string;
  onChooseMonth: () => void;
  onSetBudget: () => void;
}) {
  const { colors: c } = useTheme();
  const [mode, setMode] = React.useState<"month" | "budget">("month");
  return (
    <ControlsSheet
      visible={visible}
      title="Compare your month"
      onClose={onClose}
      displayTitle
    >
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
        {(["month", "budget"] as const).map((type) => (
          <Pressable
            key={type}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === type }}
            accessibilityLabel={
              type === "month" ? "Compare months" : "Compare budget"
            }
            onPress={() => setMode(type)}
            style={{
              flex: 1,
              minHeight: 48,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              borderRadius: 24,
              backgroundColor:
                mode === type ? c.primaryContainer : c.surfaceVariant,
            }}
          >
            <Icon
              name={
                type === "month" ? "calendar-month-outline" : "wallet-outline"
              }
              size={20}
              color={mode === type ? c.onPrimaryContainer : c.onSurface}
            />
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: mode === type ? c.onPrimaryContainer : c.onSurface,
              }}
            >
              {type === "month" ? "Month" : "Budget"}
            </Text>
          </Pressable>
        ))}
      </View>
      {mode === "month" ? (
        <>
          <Pressable
            onPress={onChooseMonth}
            accessibilityRole="button"
            accessibilityLabel="Choose comparison month"
            style={{
              minHeight: 52,
              borderRadius: 20,
              backgroundColor: c.secondaryContainer,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                color: c.onSecondaryContainer,
                fontWeight: "700",
                fontSize: 14,
              }}
            >
              {monthLabel(data.comparisonMonth)}
            </Text>
            <Icon
              name="calendar-month-outline"
              size={22}
              color={c.onSecondaryContainer}
            />
          </Pressable>
          <Text
            style={{ fontSize: 12, lineHeight: 18, color: c.onSurfaceVariant }}
          >
            {data.comparisonDescription}
          </Text>
          <View style={{ flexDirection: "row", paddingTop: 10, gap: 8 }}>
            <Text style={{ flex: 1, color: c.onSurfaceVariant }}> </Text>
            <Text
              style={{
                flex: 1,
                textAlign: "right",
                color: c.onSurfaceVariant,
                fontSize: 12,
              }}
            >
              {monthLabel(month)}
            </Text>
            <Text
              style={{
                flex: 1,
                textAlign: "right",
                color: c.onSurfaceVariant,
                fontSize: 12,
              }}
            >
              {monthLabel(data.comparisonMonth)}
            </Text>
          </View>
          {[
            ["Income", data.income, data.previousIncome],
            ["Spent", data.expense, data.previousExpense],
            [
              "Balance",
              data.remaining,
              data.previousIncome - data.previousExpense,
            ],
          ].map(([label, current, previous]) => (
            <View
              key={label}
              style={{
                flexDirection: "row",
                gap: 8,
                padding: 14,
                borderRadius: 16,
                backgroundColor: c.surfaceVariant,
              }}
            >
              <Text
                style={{
                  flex: 1,
                  fontSize: 13,
                  fontWeight: "700",
                  color: c.onSurface,
                }}
              >
                {label}
              </Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{ flex: 1, textAlign: "right", color: c.onSurface }}
              >
                {money(Number(current))}
              </Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{ flex: 1, textAlign: "right", color: c.onSurface }}
              >
                {money(Number(previous))}
              </Text>
            </View>
          ))}
          {!data.previous.length ? (
            <Text style={{ color: c.onSurfaceVariant, fontSize: 12 }}>
              No entries recorded in the comparison period.
            </Text>
          ) : null}
        </>
      ) : canCompareBudget && budget > 0 ? (
        <View
          style={{
            gap: 14,
            padding: 16,
            borderRadius: 24,
            backgroundColor: c.surfaceVariant,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "800", color: c.onSurface }}>
            Monthly spending vs budget
          </Text>
          <Text style={{ color: c.onSurfaceVariant, fontSize: 12 }}>
            Total of your category limits
          </Text>
          <BudgetProgress budget={budget} spent={data.expense} money={money} />
          <Text
            style={{
              fontSize: 24,
              fontWeight: "800",
              color: data.expense > budget ? c.error : c.onSurface,
            }}
          >
            {money(Math.abs(budget - data.expense))}{" "}
            {data.expense > budget ? "over budget" : "remaining"}
          </Text>
        </View>
      ) : (
        <View
          style={{
            gap: 12,
            padding: 16,
            borderRadius: 24,
            backgroundColor: c.surfaceVariant,
          }}
        >
          <Text style={{ fontSize: 14, color: c.onSurface }}>
            {canCompareBudget
              ? "Set category budgets to compare your spending with your limits."
              : "Budget comparisons are available for the current month in your workspace currency."}
          </Text>
          <Pressable
            onPress={onSetBudget}
            accessibilityRole="button"
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <Text style={{ fontWeight: "700", color: c.primary }}>
              View budgets
            </Text>
          </Pressable>
        </View>
      )}
    </ControlsSheet>
  );
}
