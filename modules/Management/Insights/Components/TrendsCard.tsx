import { palette } from "@/theme/color_palette";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import Svg, { Circle, Path } from "react-native-svg";
import {
  formatInsightMoney,
  formatPercent,
  useCategoryTrendInsights,
  type CategoryTrendRow,
} from "../Hooks";
import { insightStyles } from "../Styles";

const CHART_WIDTH = 112;
const CHART_HEIGHT = 42;
const CHART_PADDING = 4;
const VISIBLE_TREND_ROWS = 6;

function darkenHex(hex: string, amount = 0.18) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;
  const num = parseInt(clean, 16);
  const r = Math.max(0, Math.round(((num >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((num >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((num & 0xff) * (1 - amount)));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function buildSparklinePath(values: number[]) {
  if (values.length === 0) return "";
  const maxValue = Math.max(...values, 1);
  const step =
    values.length > 1
      ? (CHART_WIDTH - CHART_PADDING * 2) / (values.length - 1)
      : 0;

  return values
    .map((value, index) => {
      const x = CHART_PADDING + step * index;
      const y =
        CHART_HEIGHT -
        CHART_PADDING -
        (value / maxValue) * (CHART_HEIGHT - CHART_PADDING * 2);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function getLastPoint(values: number[]) {
  if (values.length === 0) return { x: CHART_PADDING, y: CHART_HEIGHT / 2 };
  const maxValue = Math.max(...values, 1);
  const step =
    values.length > 1
      ? (CHART_WIDTH - CHART_PADDING * 2) / (values.length - 1)
      : 0;
  const value = values[values.length - 1] ?? 0;
  return {
    x: CHART_PADDING + step * (values.length - 1),
    y:
      CHART_HEIGHT -
      CHART_PADDING -
      (value / maxValue) * (CHART_HEIGHT - CHART_PADDING * 2),
  };
}

function TrendSparkline({ row }: { row: CategoryTrendRow }) {
  const theme = useTheme();
  const path = buildSparklinePath(row.values);
  const lastPoint = getLastPoint(row.values);
  const guideY = CHART_HEIGHT - CHART_PADDING;

  return (
    <View
      style={[
        insightStyles.trendChart,
        { backgroundColor: theme.colors.elevation.level1 },
      ]}
    >
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Path
          d={`M ${CHART_PADDING} ${guideY} L ${CHART_WIDTH - CHART_PADDING} ${guideY}`}
          stroke={theme.colors.outlineVariant}
          strokeWidth={1}
          strokeLinecap="round"
        />
        <Path
          d={path}
          fill="none"
          stroke={row.color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={lastPoint.x} cy={lastPoint.y} r={3} fill={row.color} />
      </Svg>
    </View>
  );
}

function TrendRow({
  row,
  minimalIconsEnabled,
  isLast,
}: {
  row: CategoryTrendRow;
  minimalIconsEnabled: boolean;
  isLast?: boolean;
}) {
  const theme = useTheme();
  const c = theme.colors;
  const deltaColor =
    row.delta > 0
      ? palette.status.danger
      : row.delta < 0
        ? palette.status.success
        : c.onSurfaceVariant;
  const deltaLabel =
    row.delta === 0
      ? "Flat"
      : row.deltaPercent === null
        ? row.delta > 0
          ? "New spend"
          : "No spend"
        : `${row.delta > 0 ? "up" : "down"} ${formatPercent(
            Math.abs(row.deltaPercent),
          )}`;
  const iconBackground = minimalIconsEnabled
    ? c.background
    : darkenHex(row.color);

  return (
    <View style={insightStyles.trendRowWrap}>
      <View style={insightStyles.trendRow}>
        <View style={insightStyles.trendIdentity}>
          <View
            style={[
              insightStyles.iconCircle,
              {
                backgroundColor: iconBackground,
                borderColor: minimalIconsEnabled
                  ? c.elevation.level1
                  : undefined,
                borderWidth: minimalIconsEnabled ? 1 : 0,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={row.icon as any}
              size={20}
              color={minimalIconsEnabled ? row.color : "#FFFFFF"}
            />
          </View>
          <View style={insightStyles.trendText}>
            <Text
              numberOfLines={1}
              style={[insightStyles.rowTitle, { color: c.onSurface }]}
            >
              {row.name}
            </Text>
            <Text
              numberOfLines={1}
              style={[insightStyles.rowMeta, { color: c.onSurfaceVariant }]}
            >
              {formatInsightMoney(row.total)} over 6 months
            </Text>
          </View>
        </View>
        <TrendSparkline row={row} />
        <View style={insightStyles.trendValueBlock}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.76}
            style={[insightStyles.rowValue, { color: c.onSurface }]}
          >
            {formatInsightMoney(row.latest)}
          </Text>
          <Text
            numberOfLines={1}
            style={[insightStyles.rowCompare, { color: deltaColor }]}
          >
            {deltaLabel}
          </Text>
        </View>
      </View>
      {!isLast ? (
        <View
          style={[insightStyles.divider, { backgroundColor: c.outlineVariant }]}
        />
      ) : null}
    </View>
  );
}

export function TrendsCard({
  selectedMonthKey,
}: {
  selectedMonthKey: string;
}) {
  const theme = useTheme();
  const c = theme.colors;
  const { rows, monthLabels, minimalIconsEnabled } =
    useCategoryTrendInsights(selectedMonthKey);
  const visibleRows = rows.slice(0, VISIBLE_TREND_ROWS);

  return (
    <View style={insightStyles.card}>
      <View style={insightStyles.cardHeader}>
        <View style={insightStyles.titleBlock}>
          <Text
            numberOfLines={1}
            style={[insightStyles.title, { color: c.onSurface }]}
          >
            Trends
          </Text>
        </View>
        <View
          style={[
            insightStyles.trendRangePill,
            {
              backgroundColor: c.elevation.level1,
              borderColor: c.outlineVariant,
            },
          ]}
        >
          <Text style={[insightStyles.trendRangeText, { color: c.onSurface }]}>
            {monthLabels[0]} - {monthLabels[monthLabels.length - 1]}
          </Text>
        </View>
      </View>

      {visibleRows.length > 0 ? (
        visibleRows.map((row, index) => (
          <TrendRow
            key={row.name}
            row={row}
            minimalIconsEnabled={minimalIconsEnabled}
            isLast={index === visibleRows.length - 1}
          />
        ))
      ) : (
        <View style={insightStyles.empty}>
          <MaterialCommunityIcons
            name="chart-line"
            size={24}
            color={c.onSurfaceVariant}
          />
          <Text style={[insightStyles.emptyTitle, { color: c.onSurface }]}>
            No category trends yet
          </Text>
          <Text
            style={[insightStyles.emptyMeta, { color: c.onSurfaceVariant }]}
          >
            Add expenses across months to see category trend lines.
          </Text>
        </View>
      )}
    </View>
  );
}
