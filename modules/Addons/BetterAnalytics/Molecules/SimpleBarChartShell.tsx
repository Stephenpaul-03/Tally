import { withOpacity } from "@/modules/Common/Utils/Helpers";
import type { MonthlyPoint } from "@/modules/Insights/Types";
import { typography } from "@/theme/typography";
import React from "react";
import { View, useWindowDimensions } from "react-native";
import { Text } from "react-native-paper";
import Svg, { Rect } from "react-native-svg";
import type { CardThemeProps } from "../Types";

const CHART_HEIGHT = 132;
const BAR_RADIUS = 6;
const MIN_BAR_HEIGHT = 4;
const LABEL_SPACE = 24;

function formatCompact(value: number) {
  if (value >= 1000) {
    const thousands = value / 1000;
    const rounded =
      thousands >= 100
        ? Math.round(thousands)
        : Math.round(thousands * 10) / 10;
    return `${rounded}k`;
  }
  return `${Math.round(value)}`;
}

interface SimpleBarChartShellProps extends Pick<
  CardThemeProps,
  "bg" | "textColor" | "muted"
> {
  points: MonthlyPoint[];
  values: number[];
  defaultColor: string;
  highlightColor: string;
  highlightIndex?: number;
}

export function SimpleBarChartShell({
  points,
  values,
  textColor,
  muted,
  defaultColor,
  highlightColor,
  highlightIndex,
}: SimpleBarChartShellProps) {
  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = Math.max(0, windowWidth - 68);

  const maxValue = Math.max(1, ...values);
  const barAreaHeight = CHART_HEIGHT - LABEL_SPACE;

  const groupCount = points.length || 1;
  const groupWidth = chartWidth / groupCount;
  const barWidth = Math.max(6, groupWidth * 0.62);

  return (
    <View>
      <Svg width={chartWidth} height={CHART_HEIGHT}>
        {points.map((_, index) => {
          const value = values[index] ?? 0;
          const ratio = maxValue > 0 ? value / maxValue : 0;
          const barHeight = Math.max(
            ratio * barAreaHeight,
            value > 0 ? MIN_BAR_HEIGHT : 0,
          );
          const x = groupWidth * index + (groupWidth - barWidth) / 2;
          const y = LABEL_SPACE + (barAreaHeight - barHeight);
          const isHighlight = index === highlightIndex;

          return (
            <Rect
              key={index}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={BAR_RADIUS}
              ry={BAR_RADIUS}
              fill={isHighlight ? highlightColor : defaultColor}
            />
          );
        })}
      </Svg>

      {/* Value labels, positioned above each bar */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: LABEL_SPACE,
          flexDirection: "row",
        }}
      >
        {points.map((point, index) => {
          const value = values[index] ?? 0;
          const isHighlight = index === highlightIndex;
          return (
            <View
              key={point.monthKey}
              style={{ width: groupWidth, alignItems: "center" }}
            >
              <Text
                style={{
                  fontSize: 13,
                  lineHeight: 16,
                  color: isHighlight ? highlightColor : muted,
                }}
              >
                {formatCompact(value)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Month labels */}
      <View style={{ flexDirection: "row", marginTop: 8 }}>
        {points.map((point, index) => {
          const isHighlight = index === highlightIndex;
          return (
            <View key={point.monthKey} style={{ flex: 1, minWidth: 0 }}>
              <Text
                numberOfLines={1}
                style={{
                  ...typography.editorial.sectionLabel,
                  fontSize: 14,
                  lineHeight: 16,
                  color: isHighlight ? highlightColor : muted,
                  textAlign: "center",
                  letterSpacing: 0.5,
                }}
              >
                {point.label.toUpperCase()}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Divider */}
      <View
        style={{
          height: 0.5,
          backgroundColor: withOpacity(textColor, "0A"),
          marginTop: 16,
        }}
      />
    </View>
  );
}
