import { useFadeSlide } from "@/components/animations/UseFadeSlide";
import { withOpacity } from "@/modules/Common/Utils/Helpers";
import { palette } from "@/theme/color_palette";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Animated, View } from "react-native";
import { Text } from "react-native-paper";
import type { MonthSummary } from "../../Types";
import { formatChange, formatInr } from "../../Utils";

type HeroCardProps = {
  summary: MonthSummary;
  comparison: ReturnType<typeof formatChange>;
  bg: string;
  outline: string;
  textColor: string;
  muted: string;
};

export function HeroCard({
  summary,
  comparison,
  bg,
  outline,
  textColor,
  muted,
}: HeroCardProps) {
  const isEmpty = summary.expenseTotal === 0 && summary.incomeTotal === 0;
  const savingsRate =
    summary.incomeTotal > 0
      ? Math.round(
          ((summary.incomeTotal - summary.expenseTotal) / summary.incomeTotal) *
            100,
        )
      : 0;

  const comparisonColor =
    comparison.direction === "flat"
      ? muted
      : comparison.direction === "down"
        ? "#89C8AF"
        : "#D9919B";

  const trendIconName =
    comparison.direction === "down"
      ? "trending-down"
      : comparison.direction === "up"
        ? "trending-up"
        : "minus";

  const { animStyle } = useFadeSlide({
    from: "top",
    distance: 20,
    duration: 750,
  });

  const metricRows = [
    {
      label: "Income",
      value: formatInr(summary.incomeTotal),
      valueColor: palette.status.success,
    },
    {
      label: "Balance",
      value: formatInr(summary.balanceInHand),
      valueColor:
        summary.balanceInHand >= 0 ? textColor : palette.status.danger,
    },
    {
      label: "Saved",
      value: `${savingsRate}%`,
      valueColor: savingsRate > 0 ? textColor : palette.status.danger,
    },
  ];

  const previousTotal = summary.previousMonthExpenseTotal ?? 0;

  const formatMonthKeyLabel = (monthKey: string) => {
    const [year, month] = monthKey.split("-").map(Number);
    const date = new Date(year, (month ?? 1) - 1, 1);
    return date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  };

  const currentLabel = formatMonthKeyLabel(summary.monthKey);

  const previousMonthKey = (() => {
    const [year, month] = summary.monthKey.split("-").map(Number);
    const date = new Date(year, (month ?? 1) - 1, 1);
    date.setMonth(date.getMonth() - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  })();

  const previousLabel = formatMonthKeyLabel(previousMonthKey);

  const maxTotal = Math.max(summary.expenseTotal, previousTotal, 1);
  const currentPct = Math.min(100, (summary.expenseTotal / maxTotal) * 100);
  const previousPct = Math.min(100, (previousTotal / maxTotal) * 100);

  return (
    <Animated.View
      style={{
        backgroundColor: bg,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: outline,
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 18,
        gap: 14,
        marginBottom: 12,
        shadowColor: "#000000",
        shadowOpacity: 0.22,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 8,
        opacity: animStyle.opacity,
        transform: animStyle.transform,
      }}
    >
      {isEmpty ? (
        <View style={{ alignItems: "center", paddingVertical: 18, gap: 8 }}>
          <MaterialCommunityIcons
            name="chart-bar-stacked"
            size={22}
            color={muted}
          />
          <Text
            style={{
              fontSize: 13,
              lineHeight: 20,
              color: muted,
              textAlign: "center",
            }}
          >
            No transactions recorded for this month.
          </Text>
        </View>
      ) : (
        <>
          {/* Top row: title + month */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                ...typography.editorial.sectionLabel,
                fontSize: 18,
                lineHeight: 20,
                color: textColor,
                letterSpacing: 0.5,
              }}
            >
              Monthly Summary
            </Text>
            <Text
              style={{
                ...typography.editorial.sectionLabel,
                fontSize: 12,
                fontWeight: "500",
                letterSpacing: 1.5,
                color: muted,
              }}
            >
              {currentLabel}
            </Text>
          </View>

          {/* Total spent */}
          <View style={{ gap: 4 }}>
            <Text
              style={{
                fontSize: 13,
                color: muted,
                lineHeight: 18,
              }}
            >
              Total spent
            </Text>
            <Text
              style={{
                ...typography.display,
                fontSize: 40,
                lineHeight: 46,
                color: textColor,
                letterSpacing: 0.8,
              }}
            >
              {formatInr(summary.expenseTotal)}
            </Text>
          </View>

          {/* Comparison bars */}
          <View style={{ gap: 10, marginTop: 4 }}>
            {/* Previous month bar */}
            <View style={{ gap: 6 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    ...typography.editorial.sectionLabel,
                    fontSize: 12,
                    fontWeight: "500",
                    letterSpacing: 1.5,
                    color: muted,
                  }}
                >
                  {previousLabel}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: muted,
                  }}
                >
                  {formatInr(previousTotal)}
                </Text>
              </View>
              <View
                style={{
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: withOpacity(muted, "20"),
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${previousPct}%`,
                    height: "100%",
                    borderRadius: 999,
                    backgroundColor: withOpacity(muted, "40"),
                  }}
                />
              </View>
            </View>

            {/* Current month bar */}
            <View style={{ gap: 6 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    ...typography.editorial.sectionLabel,
                    fontSize: 12,
                    fontWeight: "500",
                    letterSpacing: 1.5,
                    color: palette.status.success,
                  }}
                >
                  {currentLabel}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: palette.status.success,
                  }}
                >
                  {formatInr(summary.expenseTotal)}
                </Text>
              </View>
              <View
                style={{
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: withOpacity(palette.status.success, "15"),
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${currentPct}%`,
                    height: "100%",
                    borderRadius: 999,
                    backgroundColor: palette.status.success,
                  }}
                />
              </View>
            </View>
          </View>

          {/* Comparison line */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <MaterialCommunityIcons
              name={trendIconName}
              size={14}
              color={comparisonColor}
            />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "500",
                color: comparisonColor,
                lineHeight: 18,
              }}
            >
              {comparison.text}
              {comparison.previousLabel ? ` (${comparison.previousLabel})` : ""}
            </Text>
          </View>

          {/* Divider + metrics */}
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: outline,
              flexDirection: "row",
              paddingTop: 14,
            }}
          >
            {metricRows.map((metric, index) => (
              <View
                key={metric.label}
                style={{
                  flex: 1,
                  gap: 6,
                  paddingLeft: index === 0 ? 0 : 14,
                  marginLeft: index === 0 ? 0 : 14,
                  borderLeftWidth: index === 0 ? 0 : 1,
                  borderLeftColor: outline,
                }}
              >
                <Text
                  style={{
                    ...typography.editorial.sectionLabel,
                    color: muted,
                    fontSize: 12,
                    fontWeight: "500",
                  }}
                >
                  {metric.label}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    color: metric.valueColor,
                    ...typography.editorial.sectionLabel,
                    fontSize: 17,
                    letterSpacing: 1.5,
                  }}
                >
                  {metric.value}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </Animated.View>
  );
}
