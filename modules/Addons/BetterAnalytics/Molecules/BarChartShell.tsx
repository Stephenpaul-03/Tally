import { withOpacity } from "@/modules/Common/Utils/Helpers";
import type { MonthlyPoint } from "@/modules/Insights/Types";
import { typography } from "@/theme/typography";
import React from "react";
import { View, useWindowDimensions } from "react-native";
import { Text } from "react-native-paper";
import Svg, { Rect } from "react-native-svg";
import type { CardThemeProps } from "../Types";

const CHART_HEIGHT = 132;
const BAR_RADIUS = 4;
const MIN_BAR_HEIGHT = 4;

interface BarChartShellProps extends Pick<
  CardThemeProps,
  "bg" | "textColor" | "muted"
> {
  points: MonthlyPoint[];
  series: { color: string; values: number[] }[];
  legend?: React.ReactNode;
}

export function BarChartShell({
  points,
  series,
  textColor,
  muted,
  legend,
}: BarChartShellProps) {
  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = Math.max(0, windowWidth - 68);

  const maxValue = Math.max(
    1,
    ...points.map((_, i) => Math.max(...series.map((s) => s.values[i] ?? 0))),
  );

  const groupCount = points.length || 1;
  const groupWidth = chartWidth / groupCount;
  const barGap = 4;
  const barWidth = Math.max(
    4,
    (groupWidth - barGap * (series.length - 1) - 16) / series.length,
  );
  const totalBarsWidth =
    barWidth * series.length + barGap * (series.length - 1);

  return (
    <View style={{ gap: 12 }}>
      {legend}
      <View>
        <Svg width={chartWidth} height={CHART_HEIGHT}>
          {points.map((_, groupIndex) => {
            const groupX = groupWidth * groupIndex;
            const groupStart = groupX + (groupWidth - totalBarsWidth) / 2;

            return series.map((entry, seriesIndex) => {
              const value = entry.values[groupIndex] ?? 0;
              const ratio = maxValue > 0 ? value / maxValue : 0;
              const barHeight = Math.max(
                ratio * CHART_HEIGHT,
                value > 0 ? MIN_BAR_HEIGHT : 0,
              );
              const x = groupStart + seriesIndex * (barWidth + barGap);
              const y = CHART_HEIGHT - barHeight;

              return (
                <Rect
                  key={`${groupIndex}-${seriesIndex}`}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={BAR_RADIUS}
                  ry={BAR_RADIUS}
                  fill={entry.color}
                />
              );
            });
          })}
        </Svg>

        <View style={{ flexDirection: "row", marginTop: 8 }}>
          {points.map((point) => (
            <View key={point.monthKey} style={{ flex: 1, minWidth: 0 }}>
              <Text
                numberOfLines={1}
                style={{
                  ...typography.editorial.sectionLabel,
                  fontSize: 14,
                  lineHeight: 14,
                  color: muted,
                  textAlign: "center",
                }}
              >
                {point.label.toUpperCase()}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Divider, rendered by parent if needed */}
      <View
        style={{ height: 0.5, backgroundColor: withOpacity(textColor, "0A") }}
      />
    </View>
  );
}
