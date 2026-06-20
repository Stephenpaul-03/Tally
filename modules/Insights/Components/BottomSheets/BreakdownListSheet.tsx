import { useStagger } from "@/components/animations/UseStagger";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { typography } from "@/theme/typography";
import { withOpacity } from "@/utils/Helpers";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Animated, Pressable, ScrollView, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { PercentDeltaPill } from "../../../Labs/BetterAnalytics/Index";
import type { BreakdownItem, CategoryComparisonRow } from "../../Types";
import { formatInr } from "../../Utils";

type BreakdownBottomSheetProps = {
  visible: boolean;
  onDismiss: () => void;
  breakdown: BreakdownItem[];
  mode: "expense" | "income";
  bg: string;
  outline: string;
  textColor: string;
  muted: string;
  trackColor: string;
  onModeChange: (mode: "expense" | "income") => void;
  onRowPress: (item: BreakdownItem) => void;
  categoryComparison?: CategoryComparisonRow[];
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
  onPress,
  minimalIconsEnabled,
  primaryColor,
  surfaceVariant,
  comparisonRow,
  maxAmount,
}: {
  item: BreakdownItem;
  textColor: string;
  muted: string;
  trackColor: string;
  onPress: () => void;
  minimalIconsEnabled: boolean;
  primaryColor: string;
  surfaceVariant: string;
  comparisonRow?: CategoryComparisonRow;
  maxAmount: number;
}) {
  const accent = item.color;
  const iconAccent = minimalIconsEnabled ? primaryColor : accent;
  const showComparison = !!comparisonRow;

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
        paddingVertical: 10,
        paddingHorizontal: 8,
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
              ? surfaceVariant
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

export function BreakdownBottomSheet({
  visible,
  onDismiss,
  breakdown,
  mode,
  bg,
  outline,
  textColor,
  muted,
  trackColor,
  onModeChange,
  onRowPress,
  categoryComparison,
}: BreakdownBottomSheetProps) {
  const theme = useTheme();
  const { minimalIconsEnabled, betterAnalyticsEnabled } = useAddonPrefs();

  const rows = breakdown.map((item) => ({ ...item }));

  // Build lookup map for comparison rows — only when the feature is enabled
  const comparisonMap = React.useMemo(() => {
    if (!betterAnalyticsEnabled || !categoryComparison) return {};
    return Object.fromEntries(
      categoryComparison.map((row) => [row.category, row]),
    );
  }, [betterAnalyticsEnabled, categoryComparison]);

  const showComparison = betterAnalyticsEnabled && !!categoryComparison;

  // Normalise bar widths against the largest amount we'll display
  // (either this month or last month) so current vs previous bars
  // are visually comparable across categories.
  const maxAmount = React.useMemo(() => {
    if (!showComparison) return 1;
    let max = 0;
    rows.forEach((item) => {
      max = Math.max(max, item.amount as number);
      const row = comparisonMap[item.category];
      if (row) max = Math.max(max, row.previousAmount);
    });
    return max || 1;
  }, [rows, comparisonMap, showComparison]);

  const { getAnimStyle } = useStagger({
    count: rows.length,
    stagger: 100,
    distance: 20,
    duration: 750,
    dataKey: `${visible}:${rows.map((item) => item.category).join("|")}`,
  });

  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onDismiss}
      presentation="sheet"
      contentContainerStyle={{
        backgroundColor: bg,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderColor: outline,
        borderTopWidth: 0.5,
        maxHeight: "88%",
      }}
    >
      {/* Handle */}
      <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
        <View
          style={{
            width: 32,
            height: 3,
            borderRadius: 2,
            backgroundColor: outline,
          }}
        />
      </View>

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: 14,
          borderBottomWidth: 0.5,
          borderBottomColor: outline,
          gap: 14,
        }}
      >
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
              fontSize: 20,
              color: textColor,
            }}
          >
            Categories
          </Text>
          <Pressable onPress={onDismiss} hitSlop={10}>
            <MaterialCommunityIcons name="close" size={20} color={muted} />
          </Pressable>
        </View>

        {/* Mode toggle */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: trackColor,
            borderRadius: 11,
            padding: 3,
            gap: 2,
          }}
        >
          {(["expense", "income"] as const).map((itemMode) => {
            const active = mode === itemMode;
            return (
              <Pressable
                key={itemMode}
                onPress={() => onModeChange(itemMode)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 9,
                  alignItems: "center",
                  backgroundColor: active ? bg : "transparent",
                }}
              >
                <Text
                  style={{
                    ...typography.editorial.sectionLabel,
                    fontSize: 14,
                    color: active ? textColor : muted,
                  }}
                >
                  {itemMode === "expense" ? "Expenses" : "Income"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Legend — only shown when comparison data is available */}
        {showComparison && rows.length > 0 && (
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
      </View>

      {/* Row list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 14,
          paddingTop: 8,
          paddingBottom: 36,
          gap: 4,
        }}
      >
        {rows.length === 0 ? (
          <Text
            style={{
              fontSize: 13,
              color: muted,
              textAlign: "center",
              paddingVertical: 32,
            }}
          >
            No data available.
          </Text>
        ) : (
          rows.map((item, index) => (
            <Animated.View key={item.category} style={getAnimStyle(index)}>
              <CategoryRow
                item={item}
                textColor={textColor}
                muted={muted}
                trackColor={trackColor}
                onPress={() => onRowPress(item)}
                minimalIconsEnabled={minimalIconsEnabled}
                primaryColor={theme.colors.primary}
                surfaceVariant={theme.colors.surfaceVariant}
                comparisonRow={comparisonMap[item.category]}
                maxAmount={maxAmount}
              />
            </Animated.View>
          ))
        )}
      </ScrollView>
    </AnimatedPaperModal>
  );
}
