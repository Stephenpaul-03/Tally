import { useAppSelector } from "@/hooks/Redux";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import {
  GenericBreakdownCard,
  type BreakdownRowItem,
} from "@/modules/Insights/Components/BreakdownCard";
import type { AnalyticsData } from "@/modules/Insights/Types";
import { formatAmount } from "@/modules/Insights/Utils";
import { typography } from "@/theme/typography";
import { withOpacity } from "@/utils/Helpers";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import Svg, { Rect } from "react-native-svg";
import type { PillCardThemeProps } from "../Types";

type WeeklySummaryRowItem = BreakdownRowItem & {
  analytics: AnalyticsData["weeklySpending"];
};

export function WeeklySpendingCard({
  analytics,
  bg,
  outline,
  textColor,
  accentColor,
  muted,
}: PillCardThemeProps & {
  analytics: AnalyticsData["weeklySpending"];
}) {
  const theme = useTheme();
  const activeWorkspace = useAppSelector(selectActiveWorkspace);
  const currencyCode = activeWorkspace?.currencyCode ?? "INR";
  const currencySymbol = activeWorkspace?.currencySymbol ?? "";

  const [containerWidth, setContainerWidth] = useState(0);
  const [selectedWeekKey, setSelectedWeekKey] = useState<string | null>(
    analytics.weeks.find((week) => week.isCurrentWeek)?.key ??
      analytics.weeks[analytics.weeks.length - 1]?.key ??
      null,
  );

  const chartHeight = 92;
  const gap = 8;
  const weekCount = analytics.weeks.length;
  const maxAmount = Math.max(...analytics.weeks.map((week) => week.amount), 0);
  const selectedWeek =
    analytics.weeks.find((week) => week.key === selectedWeekKey) ??
    analytics.weeks.find((week) => week.isCurrentWeek) ??
    analytics.weeks[analytics.weeks.length - 1];

  const barWidth =
    containerWidth > 0 && weekCount > 0
      ? (containerWidth - gap * Math.max(weekCount - 1, 0)) / weekCount
      : 0;

  const getWeekStateColor = (amount: number) => {
    const delta = amount - analytics.averageWeekAmount;
    if (analytics.averageWeekAmount <= 0 || delta === 0) {
      return "#D4A72C";
    }
    return delta > 0 ? theme.colors.error : "#2E9B5F";
  };

  // Trend vs average
  const selectedAmount = selectedWeek?.amount ?? analytics.currentWeekAmount;
  const trendDelta = selectedAmount - analytics.averageWeekAmount;
  const isAboveAvg = trendDelta > 0;
  const hasTrend = analytics.averageWeekAmount > 0 && trendDelta !== 0;
  const selectedStateColor = getWeekStateColor(selectedAmount);
  const differenceLabel = hasTrend
    ? `${isAboveAvg ? "More by " : "Less by "}${formatAmount(
        Math.abs(trendDelta),
        currencyCode,
        currencySymbol,
      )}`
    : formatAmount(0, currencyCode, currencySymbol);

  const summaryWeekName =
    selectedWeek?.label ??
    (selectedWeek?.isCurrentWeek ? "This week" : "Selected week");
  const summaryRangeRaw = selectedWeek?.rangeLabel ?? null;
  const summaryRangeParts = summaryRangeRaw
    ?.split("->")
    .map((part) => part.trim());
  const summaryRangeStart = summaryRangeParts?.[0] ?? null;
  const summaryRangeEnd = summaryRangeParts?.[1] ?? null;
  const cardItems: WeeklySummaryRowItem[] = analytics.hasData
    ? [
        {
          key: "weekly-spending",
          icon: "chart-bar" as const,
          accent: accentColor,
          label: "Weekly Spending",
          amount: selectedAmount,
          percentage: 0,
          analytics,
        },
      ]
    : [];

  return (
    <GenericBreakdownCard
      title="Weekly Spending"
      items={cardItems}
      bg={bg}
      outline={outline}
      textColor={textColor}
      accentColor={accentColor}
      muted={muted}
      formatAmount={(amount) => formatAmount(amount, currencyCode, currencySymbol)}
      emptyMessage="Add a few expenses this month to see weekly bars."
      showViewAll={false}
      padding={{ horizontal: 20, top: 25, bottom: 18 }}
      onRowPress={() => {}}
      buildIcon={() => null}
      renderSheet={() => null}
      renderRow={() => (
        <View>
          <View style={{ gap: 12, paddingBottom: 18 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <Text
                  style={{
                    fontSize: 11,
                    letterSpacing: 0.8,
                    color: muted,
                    textTransform: "uppercase",
                  }}
                >
                  {summaryWeekName}
                </Text>
                <Text
                  style={{
                    ...typography.editorial.sectionLabel,
                    fontSize: 28,
                    lineHeight: 30,
                    color: textColor,
                  }}
                >
                  {formatAmount(selectedAmount, currencyCode, currencySymbol)}
                </Text>
                {summaryRangeStart && summaryRangeEnd ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingBottom: 2,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        lineHeight: 18,
                        color: muted,
                      }}
                    >
                      {summaryRangeStart}
                    </Text>
                    <MaterialCommunityIcons
                      name="arrow-right"
                      size={14}
                      color={muted}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        lineHeight: 18,
                        color: muted,
                      }}
                    >
                      {summaryRangeEnd}
                    </Text>
                  </View>
                ) : summaryRangeRaw ? (
                  <Text
                    style={{
                      fontSize: 12,
                      lineHeight: 18,
                      color: muted,
                    }}
                  >
                    {summaryRangeRaw}
                  </Text>
                ) : null}
                <Text
                  style={{
                    ...typography.editorial.sectionLabel,
                    fontSize: 14,
                    lineHeight: 16,
                    fontWeight: "600",
                    color: selectedStateColor,
                  }}
                >
                  {hasTrend
                    ? isAboveAvg
                      ? "Above weekly average"
                      : "Below weekly average"
                    : "In line with weekly average"}
                </Text>
              </View>

              <View
                style={{
                  minWidth: 118,
                  borderWidth: 0.5,
                  borderColor: withOpacity(outline, "A6"),
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  gap: 8,
                  backgroundColor: withOpacity(accentColor, "06"),
                }}
              >
                <View style={{ gap: 2 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      lineHeight: 14,
                      color: muted,
                      textAlign: "center",
                    }}
                  >
                    Avg / week
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      lineHeight: 18,
                      textAlign: "center",
                      color: textColor,
                    }}
                  >
                    {formatAmount(
                      analytics.averageWeekAmount,
                      currencyCode,
                      currencySymbol,
                    )}
                  </Text>
                </View>
                <View
                  style={{
                    height: 1,
                    backgroundColor: withOpacity(muted, "30"),
                  }}
                />
                <View style={{ gap: 2 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      lineHeight: 14,
                      color: muted,
                      textAlign: "center",
                    }}
                  >
                    Difference
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      lineHeight: 18,
                      textAlign: "center",
                      color: textColor,
                    }}
                  >
                    {hasTrend ? differenceLabel : "On average"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: withOpacity(muted, "30"),
              marginBottom: 16,
            }}
          />

          {/* Chart */}
          <View style={{ gap: 8 }}>
            <View
              onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
            >
              {containerWidth > 0 && (
                <View>
                  <Svg width={containerWidth} height={chartHeight}>
                    {analytics.weeks.map((week, index) => {
                      const height =
                        maxAmount > 0
                          ? Math.max(8, (week.amount / maxAmount) * chartHeight)
                          : 8;
                      const x = index * (barWidth + gap);
                      const y = chartHeight - height;
                      const isSelected = selectedWeek?.key === week.key;
                      const weekStateColor = getWeekStateColor(week.amount);

                      return (
                        <Rect
                          key={week.key}
                          x={x}
                          y={y}
                          rx={6}
                          width={barWidth}
                          height={height}
                          fill={
                            isSelected
                              ? weekStateColor
                              : week.isCurrentWeek
                                ? withOpacity(weekStateColor, "99")
                                : withOpacity(weekStateColor, "59")
                          }
                        />
                      );
                    })}
                  </Svg>

                  <View
                    pointerEvents="box-none"
                    style={{
                      position: "absolute",
                      inset: 0,
                      flexDirection: "row",
                      gap: gap,
                    }}
                  >
                    {analytics.weeks.map((week) => {
                      const isSelected = selectedWeek?.key === week.key;
                      const weekStateColor = getWeekStateColor(week.amount);

                      return (
                        <Pressable
                          key={week.key}
                          accessibilityRole="button"
                          accessibilityLabel={`${week.title} spending ${formatAmount(
                            week.amount,
                            currencyCode,
                            currencySymbol,
                          )}`}
                          onPress={() => setSelectedWeekKey(week.key)}
                          style={{
                            flex: 1,
                            borderRadius: 8,
                            backgroundColor: isSelected
                              ? withOpacity(weekStateColor, "12")
                              : "transparent",
                          }}
                        />
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 8,
                alignItems: "flex-start",
              }}
            >
              {analytics.weeks.map((week) => {
                const isHighlighted =
                  selectedWeek?.key === week.key || week.isCurrentWeek;

                return (
                  <View
                    key={week.key}
                    style={{
                      flex: 1,
                      gap: 2,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        ...typography.editorial.sectionLabel,
                        fontSize: 12,
                        lineHeight: 14,
                        color: isHighlighted ? textColor : muted,
                        textAlign: "center",
                      }}
                    >
                      {week.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}
    />
  );
}
