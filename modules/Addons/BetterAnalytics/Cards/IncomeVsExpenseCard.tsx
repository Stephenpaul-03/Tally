import type { AnalyticsData } from "@/modules/Insights/Types";
import { formatInr } from "@/modules/Insights/Utils";
import { typography } from "@/theme/typography";
import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { EXPENSE_SERIES_COLOR, INCOME_SERIES_COLOR } from "../Constants";
import { BarChartShell } from "../Molecules/BarChartShell";
import { EmptyCardState } from "../Molecules/EmptyCardState";
import type { CardThemeProps } from "../Types";
import { AnalyticsCard } from "./AnalyticsCard";

export function IncomeVsExpensesCard({
  analytics,
  bg,
  outline,
  textColor,
  muted,
}: CardThemeProps & { analytics: AnalyticsData["incomeVsExpenses"] }) {
  const hasData = analytics.hasEnoughData;

  const legend = (
    <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
      {[
        { color: INCOME_SERIES_COLOR, label: "Income" },
        { color: EXPENSE_SERIES_COLOR, label: "Expenses" },
      ].map(({ color, label }) => (
        <View
          key={label}
          style={{ flexDirection: "row", gap: 6, alignItems: "center" }}
        >
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 4,
              backgroundColor: color,
            }}
          />
          <Text style={{ fontSize: 14, color: textColor }}>{label}</Text>
        </View>
      ))}
    </View>
  );

  // Net for the most recent month
  const lastPoint = analytics.points[analytics.points.length - 1];
  const net = lastPoint ? lastPoint.incomeTotal - lastPoint.expenseTotal : 0;
  const netLabel = lastPoint?.label ?? "";

  // Peak value across both series, and which month it occurred in
  const peak = analytics.points.reduce(
    (acc, point) => {
      const monthMax = Math.max(point.incomeTotal, point.expenseTotal);
      return monthMax > acc.value
        ? { value: monthMax, label: point.label }
        : acc;
    },
    { value: 0, label: "" },
  );

  return (
    <AnalyticsCard
      bg={bg}
      outline={outline}
      textColor={textColor}
      muted={muted}
    >
      <View style={{ gap: 4 }}>
        <Text
          style={{
            ...typography.editorial.sectionLabel,
            color: textColor,
            fontSize: 18,
            letterSpacing: 1,
          }}
        >
          Income vs Expenses
        </Text>
      </View>

      {hasData ? (
        <>
          <BarChartShell
            bg={bg}
            textColor={textColor}
            muted={muted}
            points={analytics.points}
            series={[
              {
                color: INCOME_SERIES_COLOR,
                values: analytics.points.map((p) => p.incomeTotal),
              },
              {
                color: EXPENSE_SERIES_COLOR,
                values: analytics.points.map((p) => p.expenseTotal),
              },
            ]}
            legend={legend}
          />

          {/* Net / Peak footer */}
          <View style={{ flexDirection: "row" }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                style={{
                  ...typography.editorial.sectionLabel,
                  fontSize: 12,
                  color: muted,
                  letterSpacing: 1,
                }}
              >
                {`NET · ${netLabel.toUpperCase()}`}
              </Text>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: net >= 0 ? INCOME_SERIES_COLOR : EXPENSE_SERIES_COLOR,
                  letterSpacing: -0.5,
                }}
              >
                {`${net >= 0 ? "+" : "-"}${formatInr(Math.abs(net))}`}
              </Text>
            </View>

            <View
              style={{
                width: 0.5,
                backgroundColor: muted,
                opacity: 0.25,
                marginHorizontal: 16,
              }}
            />

            <View style={{ flex: 1, gap: 4 }}>
              <Text
                style={{
                  ...typography.editorial.sectionLabel,
                  fontSize: 12,
                  color: muted,
                  letterSpacing: 1,
                }}
              >
                {`PEAK · ${peak.label.toUpperCase()}`}
              </Text>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: textColor,
                  letterSpacing: -0.5,
                }}
              >
                {formatInr(peak.value)}
              </Text>
            </View>
          </View>
        </>
      ) : (
        <EmptyCardState
          title="At least two months of data are required."
          muted={muted}
          icon="chart-line-variant"
        />
      )}
    </AnalyticsCard>
  );
}
