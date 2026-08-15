import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { formatInsightMoney, formatPercent, useCategorySpendInsights, useHeroBalanceSummary } from "../Hooks";
import { insightStyles } from "../Styles";

export function BudgetHealthCard({ selectedMonthKey }: { selectedMonthKey: string }) {
  const theme = useTheme();
  const summary = useHeroBalanceSummary(selectedMonthKey);
  const { rows } = useCategorySpendInsights("lastMonth", selectedMonthKey);
  const budget = summary.budget;
  const used = budget > 0 ? summary.spent / budget * 100 : 0;
  const overBudgetCount = rows.filter((row) => row.budget > 0 && row.budgetLeft < 0).length;
  const status = budget <= 0 ? "No budget set" : used > 100 ? "Over budget" : used >= summary.budgetNearlyEmptyFromPercent ? "Nearly used" : "On track";
  const statusColor = budget <= 0 ? theme.colors.onSurfaceVariant : used > 100 ? theme.colors.error : theme.colors.primary;

  return (
    <View style={insightStyles.card}>
      <View style={insightStyles.cardHeader}>
        <View style={insightStyles.titleBlock}>
          <Text style={[insightStyles.title, { color: theme.colors.onSurface }]}>Budget health</Text>
        </View>
        <MaterialCommunityIcons name="wallet-outline" size={20} color={statusColor} />
      </View>
      {budget > 0 ? (
        <>
          <View style={insightStyles.budgetSummaryRow}>
            <View>
              <Text style={[insightStyles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>Remaining</Text>
              <Text style={[insightStyles.budgetMainValue, { color: statusColor }]}>{formatInsightMoney(summary.budgetLeft)}</Text>
            </View>
            <View style={insightStyles.budgetSummaryRight}>
              <Text style={[insightStyles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>Used</Text>
              <Text style={[insightStyles.summaryValue, { color: theme.colors.onSurface }]}>{formatPercent(used)}</Text>
            </View>
          </View>
          <View style={[insightStyles.progressTrack, { backgroundColor: theme.colors.elevation.level3 }]}>
            <View style={[insightStyles.progressFill, { width: `${Math.min(100, Math.max(0, used))}%`, backgroundColor: statusColor }]} />
          </View>
          <Text style={[insightStyles.budgetStatus, { color: statusColor }]}>
            {status}{overBudgetCount > 0 ? ` · ${overBudgetCount} ${overBudgetCount === 1 ? "category" : "categories"} over` : ""}
          </Text>
        </>
      ) : (
        <View style={insightStyles.emptyInline}>
          <Text style={[insightStyles.emptyTitle, { color: theme.colors.onSurface }]}>Set a budget to track progress</Text>
          <Text style={[insightStyles.emptyMeta, { color: theme.colors.onSurfaceVariant }]}>Your spending will be compared against it each month.</Text>
        </View>
      )}
    </View>
  );
}
