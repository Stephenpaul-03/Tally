// breakdowncard.tsx
import { useFadeSlide } from "@/components/animations/UseFadeSlide";
import { useStagger } from "@/components/animations/UseStagger";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { typography } from "@/theme/typography";
import { withOpacity } from "@/utils/Helpers";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Animated, Pressable, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { PercentDeltaPill } from "../../../Labs/BetterAnalytics/Index";
import type {
    BreakdownItem,
    CategoryComparisonRow,
    MonthSummary,
} from "../../Types";
import { formatInr } from "../../Utils";
import { BreakdownBottomSheet } from "../BottomSheets/BreakdownListSheet";

type BreakdownCardProps = {
  summary: MonthSummary;
  bg: string;
  outline: string;
  textColor: string;
  muted: string;
  trackColor: string;
  categoryComparison?: CategoryComparisonRow[];
  incomeCategoryComparison?: CategoryComparisonRow[];
  onRowPress: (mode: "expense" | "income", item: BreakdownItem) => void;
};

const ICON_SIZE = 40;
const BAR_HEIGHT = 8;
const BAR_RADIUS = 4;

function ProgressBar({
  percentage,
  color,
  track,
}: {
  percentage: number;
  color: string;
  track: string;
}) {
  const clamped = Math.min(Math.max(percentage, 0), 100);

  return (
    <View
      style={{
        height: BAR_HEIGHT,
        borderRadius: BAR_RADIUS,
        backgroundColor: track,
        overflow: "hidden",
        width: "100%",
      }}
    >
      <View
        style={{
          height: "100%",
          width: `${clamped}%`,
          borderRadius: BAR_RADIUS,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

function CategoryRow({
  item,
  textColor,
  muted,
  trackColor,
  comparisonRow,
  maxAmount,
  onPress,
}: {
  item: BreakdownItem;
  textColor: string;
  muted: string;
  trackColor: string;
  comparisonRow?: CategoryComparisonRow;
  maxAmount: number;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { minimalIconsEnabled, betterAnalyticsEnabled } = useAddonPrefs();
  const accent = item.color;
  const iconAccent = minimalIconsEnabled ? theme.colors.primary : accent;

  const showComparison = betterAnalyticsEnabled && !!comparisonRow;

  const currentBarPct = showComparison
    ? ((item.amount as number) / maxAmount) * 100
    : item.percentage;

  const previousBarPct = showComparison
    ? (comparisonRow!.previousAmount / maxAmount) * 100
    : 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: 14,
        backgroundColor: withOpacity(textColor, pressed ? "0A" : "00"),
        paddingVertical: 8,
        paddingHorizontal: 6,
        gap: 10,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {/* Top row: icon, name, amount */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: ICON_SIZE,
            height: ICON_SIZE,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: minimalIconsEnabled
              ? theme.colors.surfaceVariant
              : withOpacity(iconAccent, "18"),
          }}
        >
          <MaterialCommunityIcons
            name={item.icon as any}
            size={20}
            color={iconAccent}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{ fontSize: 15, fontWeight: "600", color: textColor }}
          >
            {item.category}
          </Text>
          {showComparison && (
            <Text style={{ fontSize: 12, color: muted, marginTop: 2 }}>
              {`Last ${formatInr(comparisonRow!.previousAmount)}`}
            </Text>
          )}
        </View>

        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: textColor }}>
            {formatInr(Math.round(item.amount as number))}
          </Text>
          {showComparison ? (
            <PercentDeltaPill value={comparisonRow!.percentChange} />
          ) : (
            <Text style={{ fontSize: 12, color: muted }}>
              {Math.round(item.percentage)}%
            </Text>
          )}
        </View>
      </View>

      {/* Progress bar(s) */}
      {showComparison ? (
        <View style={{ gap: 6 }}>
          <ProgressBar
            percentage={currentBarPct}
            color={accent}
            track={trackColor}
          />
          <ProgressBar
            percentage={previousBarPct}
            color={muted}
            track={trackColor}
          />
        </View>
      ) : (
        <ProgressBar
          percentage={item.percentage}
          color={accent}
          track={trackColor}
        />
      )}
    </Pressable>
  );
}

export function BreakdownCard({
  summary,
  bg,
  outline,
  textColor,
  muted,
  trackColor,
  categoryComparison,
  incomeCategoryComparison,
  onRowPress,
}: BreakdownCardProps) {
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetMode, setSheetMode] = useState<"expense" | "income">("expense");
  const theme = useTheme();
  const { betterAnalyticsEnabled } = useAddonPrefs();
  const { animStyle } = useFadeSlide({
    from: "bottom",
    distance: 20,
    duration: 750,
  });

  const topItems = summary.groupedExpenseBreakdown.slice(0, 3).map((item) => ({
    ...item,
  }));

  const hasData = topItems.length > 0;
  const { getAnimStyle } = useStagger({
    count: topItems.length,
    stagger: 100,
    distance: 20,
    duration: 750,
    dataKey: topItems.map((item) => item.category).join("|"),
  });

  // Build a lookup map so CategoryRow can find its comparison row by name
  const comparisonMap = React.useMemo(() => {
    if (!categoryComparison) return {};
    return Object.fromEntries(
      categoryComparison.map((row) => [row.category, row]),
    );
  }, [categoryComparison]);

  const showComparison = betterAnalyticsEnabled && !!categoryComparison;

  // Normalise bar widths against the largest amount we'll display
  // (either this month or last month) so current vs previous bars
  // are visually comparable across categories.
  const maxAmount = React.useMemo(() => {
    if (!showComparison) return 1;
    let max = 0;
    topItems.forEach((item) => {
      max = Math.max(max, item.amount as number);
      const row = comparisonMap[item.category];
      if (row) max = Math.max(max, row.previousAmount);
    });
    return max || 1;
  }, [topItems, comparisonMap, showComparison]);

  return (
    <>
      <Animated.View
        style={{
          backgroundColor: bg,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: outline,
          paddingHorizontal: 18,
          paddingTop: 18,
          paddingBottom: 16,
          gap: 16,
          marginBottom: 12,
          opacity: animStyle.opacity,
          transform: animStyle.transform,
        }}
      >
        {/* Header */}
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
              color: textColor,
              fontSize: 18,
              letterSpacing: 1,
            }}
          >
            Spending by Category
          </Text>

          {hasData && (
            <Pressable
              onPress={() => setSheetVisible(true)}
              hitSlop={8}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "500",
                  color: muted,
                }}
              >
                View All
              </Text>
              <MaterialCommunityIcons
                name="arrow-right"
                size={14}
                color={muted}
              />
            </Pressable>
          )}
        </View>

        {/* Legend — only shown when comparison data is available */}
        {showComparison && hasData && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <View
                style={{
                  width: 20,
                  height: BAR_HEIGHT,
                  borderRadius: BAR_RADIUS,
                  backgroundColor: theme.colors.primary,
                }}
              />
              <Text style={{ fontSize: 12, color: muted }}>This month</Text>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <View
                style={{
                  width: 20,
                  height: BAR_HEIGHT,
                  borderRadius: BAR_RADIUS,
                  backgroundColor: muted,
                }}
              />
              <Text style={{ fontSize: 12, color: muted }}>Last month</Text>
            </View>
          </View>
        )}

        {/* Row list */}
        {hasData ? (
          <View style={{ gap: 4 }}>
            {topItems.map((item, index) => (
              <Animated.View key={item.category} style={getAnimStyle(index)}>
                <CategoryRow
                  item={item}
                  textColor={textColor}
                  muted={muted}
                  trackColor={trackColor}
                  comparisonRow={comparisonMap[item.category]}
                  maxAmount={maxAmount}
                  onPress={() => onRowPress("expense", item)}
                />
              </Animated.View>
            ))}
          </View>
        ) : (
          <Text
            style={{
              fontSize: 13,
              color: muted,
              textAlign: "center",
              paddingVertical: 22,
              lineHeight: 20,
            }}
          >
            Add transactions to unlock your category breakdown.
          </Text>
        )}
      </Animated.View>

      {/* Bottom sheet */}
      <BreakdownBottomSheet
        visible={sheetVisible}
        onDismiss={() => setSheetVisible(false)}
        breakdown={
          sheetMode === "expense"
            ? summary.fullExpenseBreakdown
            : summary.fullIncomeBreakdown
        }
        mode={sheetMode}
        bg={bg}
        outline={outline}
        textColor={textColor}
        muted={muted}
        trackColor={trackColor}
        categoryComparison={
          sheetMode === "income" ? incomeCategoryComparison : categoryComparison
        }
        onModeChange={setSheetMode}
        onRowPress={(item) => {
          setSheetVisible(false);
          onRowPress(sheetMode, item);
        }}
      />
    </>
  );
}
