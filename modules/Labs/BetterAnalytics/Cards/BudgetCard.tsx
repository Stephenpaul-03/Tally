import {
    GenericBreakdownCard,
    type BreakdownRowItem,
} from "@/modules/Insights/Components/BreakdownCard";
import { formatAmount } from "@/modules/Insights/Utils";
import { typography } from "@/theme/typography";
import React from "react";
import { View } from "react-native";
import { Text, type MD3Theme } from "react-native-paper";

type Props = {
  theme: MD3Theme;
  totalBudget: number;
  spent: number;
  currencyCode: string;
  currencySymbol: string;
  remaining: number;
  categoryEntries: {
    name: string;
    budget: number;
    spent: number;
  }[];
};

type BudgetSummaryRowItem = BreakdownRowItem & {
  totalBudget: number;
  spent: number;
  remaining: number;
};

export function BudgetSummaryCard({
  theme,
  totalBudget,
  spent,
  remaining,
  currencyCode,
  currencySymbol,
}: Props) {
  const isOverBudget = remaining < 0;
  const items: BudgetSummaryRowItem[] = [
    {
      key: "budget-summary",
      icon: "wallet-outline",
      accent: theme.colors.primary,
      label: "Budget Summary",
      amount: totalBudget,
      percentage: 0,
      totalBudget,
      spent,
      remaining,
    },
  ];

  return (
    <GenericBreakdownCard
      title="BUDGET SUMMARY"
      items={items}
      bg={theme.colors.surface}
      outline={theme.colors.outline}
      textColor={theme.colors.onSurface}
      accentColor={theme.colors.primary}
      muted={theme.colors.onSurface}
      formatAmount={(amount) =>
        formatAmount(amount, currencyCode, currencySymbol)
      }
      emptyMessage="No budget summary available."
      showViewAll={false}
      padding={{ horizontal: 20, top: 25, bottom: 18 }}
      onRowPress={() => {}}
      buildIcon={() => null}
      renderSheet={() => null}
      renderRow={() => (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <SummaryColumn
            label="BUDGET"
            value={formatAmount(totalBudget, currencyCode, currencySymbol)}
            caption="total budget"
            theme={theme}
          />
          <SummaryColumn
            label="SPENT"
            value={formatAmount(spent, currencyCode, currencySymbol)}
            caption="spent this month"
            theme={theme}
          />
          <SummaryColumn
            label="LEFT"
            value={formatAmount(remaining, currencyCode, currencySymbol)}
            caption="money left"
            valueColor={isOverBudget ? theme.colors.error : undefined}
            theme={theme}
          />
        </View>
      )}
    />
  );
}

function SummaryColumn({
  label,
  value,
  caption,
  valueColor,
  theme,
}: {
  label: string;
  value: string;
  caption: string;
  valueColor?: string;
  theme: MD3Theme;
}) {
  return (
    <View style={{ flex: 1, gap: 4, alignItems: "center" }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: "700",
          letterSpacing: 0.6,
          color: theme.colors.onSurfaceVariant,
          textAlign: "center",
        }}
      >
        {label}
      </Text>
      <Text
        adjustsFontSizeToFit
        numberOfLines={1}
        style={{
          ...typography.editorial.sectionLabel,
          fontSize: 22,
          color: valueColor ?? theme.colors.onSurface,
          textAlign: "center",
        }}
      >
        {value}
      </Text>
      <Text
        numberOfLines={1}
        style={{
          fontSize: 12,
          color: theme.colors.onSurfaceVariant,
          textAlign: "center",
        }}
      >
        {caption}
      </Text>
    </View>
  );
}
