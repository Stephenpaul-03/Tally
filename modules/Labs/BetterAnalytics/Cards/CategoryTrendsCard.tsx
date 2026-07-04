import { useAppSelector } from "@/hooks/Redux";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import { BreakdownBottomSheet } from "@/modules/Insights/Components/BottomSheets/BreakdownListSheet";
import {
  GenericBreakdownCard,
  type BreakdownRowItem,
} from "@/modules/Insights/Components/BreakdownCard";
import type {
  AnalyticsData,
  BreakdownItem,
  CategoryTrendRow,
} from "@/modules/Insights/Types";
import { formatAmount } from "@/modules/Insights/Utils";
import { withOpacity } from "@/utils/Helpers";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { View, useWindowDimensions } from "react-native";
import { Text, useTheme } from "react-native-paper";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";
import type { PillCardThemeProps } from "../Types";

type CategoryTrendRowItem = BreakdownRowItem & {
  trend: CategoryTrendRow;
};

function toRowItem(row: CategoryTrendRow): CategoryTrendRowItem {
  return {
    key: row.category,
    icon: row.icon as React.ComponentProps<
      typeof MaterialCommunityIcons
    >["name"],
    accent: row.color,
    label: row.category,
    amount: row.currentAmount,
    percentage: 0,
    trend: row,
  };
}

function buildSparklinePath(values: number[], width: number, height: number) {
  if (values.length === 0) return [];

  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const valueRange = maxValue !== minValue ? maxValue - minValue : 1;
  const stepX = values.length > 1 ? width / (values.length - 1) : width;
  const verticalPadding = 3;

  return values.map((value, index) => ({
    x: index * stepX,
    y:
      maxValue !== minValue
        ? height -
          verticalPadding -
          ((value - minValue) / valueRange) * (height - verticalPadding * 2)
        : height / 2,
  }));
}

function pointsToPath(points: { x: number; y: number }[]) {
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function InlineTrendChart({
  values,
  color,
}: {
  values: number[];
  color: string;
}) {
  const width = 80;
  const height = 36;
  const points = buildSparklinePath(values, width, height);
  const path = pointsToPath(points);
  const areaPath =
    points.length > 0
      ? `${path} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`
      : null;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={`fill-${color}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.3" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {areaPath && (
        <Path d={areaPath} fill={`url(#fill-${color})`} stroke="none" />
      )}
      {path && (
        <Path
          d={path}
          stroke={color}
          strokeWidth={1.8}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {points.map((point, index) => (
        <Circle
          key={`${point.x}-${point.y}-${index}`}
          cx={point.x}
          cy={point.y}
          r={index === points.length - 1 ? 2.5 : 1.9}
          fill={color}
        />
      ))}
    </Svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDifferenceAmount(
  amount: number,
  currencyCode: string,
  currencySymbol: string,
) {
  const abs = formatAmount(Math.abs(amount), currencyCode, currencySymbol);
  if (amount > 0) return `+${abs}`;
  if (amount < 0) return `-${abs}`;
  return formatAmount(0, currencyCode, currencySymbol);
}

function formatChangeAmount(changePercent: number | null) {
  if (changePercent == null) return "New";
  const rounded =
    Math.abs(changePercent) >= 10
      ? Math.round(Math.abs(changePercent))
      : Number(Math.abs(changePercent).toFixed(1));
  if (changePercent > 0) return `+${rounded}%`;
  if (changePercent < 0) return `-${rounded}%`;
  return "0%";
}

function getTrendSummary(trend: CategoryTrendRow): string {
  if (trend.changePercent == null) return "New this period";
  if (trend.differenceAmount > 0) return "Above monthly average";
  if (trend.differenceAmount < 0) return "Below monthly average";
  return "Matching monthly average";
}

// ─── CategoryTrendSummaryRow ──────────────────────────────────────────────────

function CategoryTrendSummaryRow({
  item,
  textColor,
  muted,
  currencyCode,
  currencyString,
  comparisonLabel,
  iconNode,
  outline,
  isLast,
}: {
  item: CategoryTrendRowItem;
  textColor: string;
  muted: string;
  currencyCode: string;
  currencyString: string;
  comparisonLabel: string;
  iconNode: React.ReactNode;
  compact: boolean;
  outline: string;
  avgDotColor: string;
  isLast: boolean;
}) {
  const trend = item.trend;
  const chartValues = trend.points.map((p) => p.amount);
  const isUp = trend.differenceAmount >= 0;
  const changeText = formatChangeAmount(trend.changePercent);
  const diffText = formatDifferenceAmount(
    trend.differenceAmount,
    currencyCode,
    currencyString,
  );
  const avgText = formatAmount(
    trend.averageAmount,
    currencyCode,
    currencyString,
  );

  // Budget stat — shown as middle column when available
  const hasBudget = trend.budgetAmount != null && trend.budgetAmount > 0;
  const budgetText = hasBudget
    ? formatAmount(trend.budgetAmount!, currencyCode, currencyString)
    : null;

  return (
    <View
      style={{
        paddingVertical: 12,
        paddingHorizontal: 20,
        ...(!isLast && {
          borderBottomWidth: 0.5,
          borderBottomColor: outline,
        }),
      }}
    >
      {/* ── Top row ─────────────────────────────────── */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          marginBottom: 10,
        }}
      >
        {iconNode}

        {/* Name + period */}
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 14,
              lineHeight: 20,
              fontWeight: "600",
              color: textColor,
            }}
          >
            {item.label}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              minWidth: 0,
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                flexShrink: 1,
                fontSize: 11,
                lineHeight: 15,
                color: muted,
              }}
            >
              {getTrendSummary(trend)}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                flexShrink: 0,
                fontSize: 11,
                lineHeight: 15,
                color: muted,
              }}
            >
              [{comparisonLabel}]
            </Text>
          </View>
        </View>

        {/* Current amount + change badge */}
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <Text
            style={{
              fontSize: 15,
              lineHeight: 20,
              fontWeight: "600",
              color: textColor,
            }}
          >
            {formatAmount(trend.currentAmount, currencyCode, currencyString)}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 3,
              paddingHorizontal: 7,
              paddingVertical: 2,
              borderRadius: 99,
              backgroundColor: withOpacity(item.accent, "18"),
            }}
          >
            <MaterialCommunityIcons
              name={isUp ? "trending-up" : "trending-down"}
              size={11}
              color={item.accent}
            />
            <Text
              style={{
                fontSize: 11,
                lineHeight: 15,
                fontWeight: "600",
                color: item.accent,
              }}
            >
              {changeText}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Bottom: stats + sparkline ────────────────── */}
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 10 }}>
        <View style={{ flex: 1, flexDirection: "row" }}>
          {/* Avg — always first */}
          <View
            style={{
              flex: 1,
              paddingRight: 12,
              marginRight: 12,
              borderRightWidth: 0.5,
              borderRightColor: outline,
              alignItems: "center",
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                fontSize: 10,
                lineHeight: 14,
                color: muted,
                textTransform: "uppercase",
                letterSpacing: 0.4,
                marginBottom: 2,
                textAlign: "center",
              }}
            >
              Avg
            </Text>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 13,
                lineHeight: 18,
                fontWeight: "600",
                color: textColor,
                textAlign: "center",
              }}
            >
              {avgText}
            </Text>
          </View>

          {/* Budget — middle, only when available */}
          {budgetText != null && (
            <View
              style={{
                flex: 1,
                paddingRight: 12,
                marginRight: 12,
                borderRightWidth: 0.5,
                borderRightColor: outline,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  lineHeight: 14,
                  color: muted,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  marginBottom: 2,
                  textAlign: "center",
                }}
              >
                Budget
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 13,
                  lineHeight: 18,
                  fontWeight: "600",
                  color: textColor,
                  textAlign: "center",
                }}
              >
                {budgetText}
              </Text>
            </View>
          )}

          {/* Diff — always last */}
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text
              style={{
                fontSize: 10,
                lineHeight: 14,
                color: muted,
                textTransform: "uppercase",
                letterSpacing: 0.4,
                marginBottom: 2,
                textAlign: "center",
              }}
            >
              Diff (AVG)
            </Text>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 13,
                lineHeight: 18,
                fontWeight: "600",
                color: item.accent,
                textAlign: "center",
              }}
            >
              {diffText}
            </Text>
          </View>
        </View>

        {/* Sparkline */}
        <InlineTrendChart values={chartValues} color={item.accent} />
      </View>
    </View>
  );
}

// ─── TrendIcon ────────────────────────────────────────────────────────────────

function TrendIcon({
  item,
  resolvedAccent,
}: {
  item: CategoryTrendRowItem;
  resolvedAccent: string;
  minimalIconsEnabled: boolean;
  surfaceVariant: string;
}) {
  return (
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: withOpacity(resolvedAccent, "14"),
      }}
    >
      <MaterialCommunityIcons
        name={item.icon}
        size={20}
        color={resolvedAccent}
      />
    </View>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function CategoryTrendsCard({
  analytics,
  bg,
  outline,
  textColor,
  accentColor,
  muted,
}: PillCardThemeProps & {
  analytics: AnalyticsData["categoryTrends"];
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { minimalIconsEnabled } = useAddonPrefs();
  const activeWorkspace = useAppSelector(selectActiveWorkspace);
  const currencyCode = activeWorkspace?.currencyCode ?? "INR";
  const currencySymbol = activeWorkspace?.currencySymbol ?? "";

  const rowItems = React.useMemo(
    () => analytics.rows.map(toRowItem),
    [analytics.rows],
  );

  const breakdownItems = React.useMemo<BreakdownItem[]>(
    () =>
      analytics.rows.map((row) => ({
        category: row.category,
        amount: row.currentAmount,
        percentage: 0,
        color: row.color,
        icon: row.icon,
      })),
    [analytics.rows],
  );

  const comparisonLabel =
    analytics.comparisonStartLabel === analytics.comparisonEndLabel
      ? analytics.comparisonEndLabel
      : `${analytics.comparisonStartLabel}–${analytics.comparisonEndLabel}`;

  const compact = width < 1180;
  const avgDotColor =
    theme.colors.secondary ?? withOpacity(theme.colors.primary, "CC");
  const previewRowCount = Math.min(rowItems.length, 3);

  const sharedRowProps = {
    currencyCode,
    currencyString: currencySymbol,
    comparisonLabel,
    compact,
    outline,
    avgDotColor,
  };

  return (
    <GenericBreakdownCard
      title="Category Trends"
      items={rowItems}
      bg={bg}
      outline={outline}
      textColor={textColor}
      accentColor={accentColor}
      padding={{ horizontal: 0, top: 25, bottom: 0 }}
      muted={muted}
      formatAmount={(amount) =>
        formatAmount(amount, currencyCode, currencySymbol)
      }
      emptyMessage="Need at least two months of category history to show trends."
      onRowPress={() => {}}
      buildIcon={(item) => (
        <TrendIcon
          item={item}
          resolvedAccent={
            minimalIconsEnabled ? theme.colors.primary : item.accent
          }
          minimalIconsEnabled={minimalIconsEnabled}
          surfaceVariant={theme.colors.surfaceVariant}
        />
      )}
      renderRow={({ item, textColor, muted, iconNode, index }) => (
        <CategoryTrendSummaryRow
          item={item}
          textColor={textColor}
          muted={muted}
          iconNode={iconNode}
          isLast={index === previewRowCount - 1}
          {...sharedRowProps}
        />
      )}
      renderSheet={({ visible, onDismiss }) => (
        <BreakdownBottomSheet
          title="Category Trends"
          showModeToggle={false}
          interactiveRows={false}
          showChevron={false}
          visible={visible}
          onDismiss={onDismiss}
          breakdown={breakdownItems}
          mode="expense"
          bg={bg}
          outline={outline}
          textColor={textColor}
          muted={muted}
          trackColor={withOpacity(textColor, "08")}
          onModeChange={() => {}}
          onRowPress={() => {}}
          customRows={rowItems}
          renderCustomRow={({
            item,
            textColor,
            muted,
            primaryColor,
            surfaceVariant,
            index,
          }) => {
            const trendRow = item as CategoryTrendRowItem;
            return (
              <CategoryTrendSummaryRow
                item={trendRow}
                textColor={textColor}
                muted={muted}
                iconNode={
                  <TrendIcon
                    item={trendRow}
                    resolvedAccent={
                      minimalIconsEnabled ? primaryColor : trendRow.accent
                    }
                    minimalIconsEnabled={minimalIconsEnabled}
                    surfaceVariant={surfaceVariant}
                  />
                }
                isLast={index === rowItems.length - 1}
                {...sharedRowProps}
              />
            );
          }}
        />
      )}
    />
  );
}
