import type { AnalyticsData } from "@/modules/Insights/Types";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { EmptyCardState } from "../Molecules/EmptyCardState";
import { SimpleBarChartShell } from "../Molecules/SimpleBarChartShell";
import type { CardThemeProps } from "../Types";
import { AnalyticsCard } from "./AnalyticsCard";

const SPENDING_BAR_COLOR = "#5C7DA8";
const SPENDING_HIGHLIGHT_DOWN_COLOR = "#6FD8A6";
const SPENDING_HIGHLIGHT_UP_COLOR = "#E08FA0";

export function SpendingTrendCard({
  analytics,
  bg,
  outline,
  textColor,
  muted,
}: CardThemeProps & { analytics: AnalyticsData["spendingTrend"] }) {
  const hasData = analytics.hasEnoughData;

  const isDown = analytics.currentValue < analytics.previousValue;
  const isUp = analytics.currentValue > analytics.previousValue;
  const highlightColor = isUp
    ? SPENDING_HIGHLIGHT_UP_COLOR
    : SPENDING_HIGHLIGHT_DOWN_COLOR;

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
          Spending Trend
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 19, color: muted }}>
          Last 6 months
        </Text>
      </View>

      {hasData ? (
        <>
          <SimpleBarChartShell
            bg={bg}
            textColor={textColor}
            muted={muted}
            points={analytics.points}
            values={analytics.points.map((p) => p.expenseTotal)}
            defaultColor={SPENDING_BAR_COLOR}
            highlightColor={highlightColor}
            highlightIndex={analytics.points.length - 1}
          />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <MaterialCommunityIcons
              name={isUp ? "trending-up" : isDown ? "trending-down" : "minus"}
              size={16}
              color={highlightColor}
            />
            <Text
              style={{
                fontSize: 15,
                lineHeight: 20,
                fontWeight: "600",
                color: highlightColor,
              }}
            >
              {analytics.summary}
            </Text>
          </View>
        </>
      ) : (
        <EmptyCardState
          title="Not enough historical data available."
          muted={muted}
          icon="calendar-blank-outline"
        />
      )}
    </AnalyticsCard>
  );
}
