import { formatAmount } from "@/modules/Insights/Utils";
import { InsightPillCard } from "@/modules/Labs/BetterAnalytics/Cards/InsightPillCard";
import React, { useMemo } from "react";
import { Text, View } from "react-native";
import { useTheme } from "react-native-paper";
import { buildCalendarStyles } from "../Styles";
import type { CalendarTokens } from "../Tokens";
import type { SelectedDaySummary } from "../Types";

type DaySummaryCardProps = {
  summary: SelectedDaySummary | null;
  onViewAll: (dateString: string) => void;
  tokens: CalendarTokens;
  currencyCode: string;
  currencySymbol: string;
};

export function DaySummaryCard({
  summary,
  onViewAll,
  tokens,
  currencyCode,
  currencySymbol,
}: DaySummaryCardProps) {
  const theme = useTheme();
  const styles = useMemo(() => buildCalendarStyles(tokens), [tokens]);
  const formatMoney = (amount: number) =>
    formatAmount(amount, currencyCode, currencySymbol);

  const title = summary ? summary.label : "Select a date";

  return (
    <InsightPillCard
      title={title}
      bg={theme.colors.surface}
      outline={theme.colors.outline}
      accentColor={theme.colors.primary}
      textColor={theme.colors.onSurface}
      muted={theme.colors.onSurface}
      onViewAll={summary ? () => onViewAll(summary.dateString) : undefined}
    >
      {/* Metrics row */}
      <View style={styles.summaryHeroMetricsRow}>
        <MetricColumn
          label="Income"
          value={summary ? formatMoney(summary.income) : "--"}
          caption="Money earned"
          isNegative={Boolean(summary && summary.income < 0)}
          styles={styles}
        />
        <View style={styles.summaryHeroMetricDivider} />
        <MetricColumn
          label="Expense"
          value={summary ? formatMoney(summary.expense) : "--"}
          caption="Money spent"
          isNegative={Boolean(summary && summary.expense < 0)}
          styles={styles}
        />
        <View style={styles.summaryHeroMetricDivider} />
        <MetricColumn
          label="Running"
          value={summary ? formatMoney(summary.monthToDateBalance) : "--"}
          caption="balance"
          isNegative={Boolean(summary && summary.monthToDateBalance < 0)}
          styles={styles}
        />
      </View>
    </InsightPillCard>
  );
}

// Small helper to keep the metrics row tidy
function MetricColumn({
  label,
  value,
  caption,
  isNegative,
  styles,
}: {
  label: string;
  value: string;
  caption: string;
  isNegative: boolean;
  styles: ReturnType<typeof buildCalendarStyles>;
}) {
  const theme = useTheme();

  return (
    <View style={styles.summaryHeroMetricColumn}>
      <Text style={styles.summaryHeroMetricLabel}>{label}</Text>
      <Text
        style={[
          styles.summaryHeroMetricValue,
          isNegative ? { color: theme.colors.error } : null,
        ]}
      >
        {value}
      </Text>
      <Text style={styles.summaryHeroMetricCaption}>{caption}</Text>
    </View>
  );
}
