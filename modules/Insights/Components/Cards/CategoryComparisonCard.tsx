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
  CategoryComparisonRow,
} from "@/modules/Insights/Types";
import { formatAmount } from "@/modules/Insights/Utils";
import type { PillCardThemeProps } from "@/modules/Labs/BetterAnalytics/Types";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { withOpacity } from "@/utils/Helpers";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

type CategoryComparisonCardProps = PillCardThemeProps & {
  analytics: AnalyticsData["categoryComparison"];
  onRowPress: (item: BreakdownItem) => void;
};

type CategoryComparisonRowItem = BreakdownRowItem & {
  comparison: CategoryComparisonRow;
};

function toRowItem(row: CategoryComparisonRow): CategoryComparisonRowItem {
  return {
    key: row.category,
    icon: row.icon as React.ComponentProps<
      typeof MaterialCommunityIcons
    >["name"],
    accent: row.color,
    label: row.category,
    amount: row.currentAmount,
    percentage: 0,
    comparison: row,
  };
}

function toBreakdownItem(row: CategoryComparisonRow): BreakdownItem {
  return {
    category: row.category,
    amount: row.currentAmount,
    percentage: row.currentShare,
    color: row.color,
    icon: row.icon,
  };
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

function ComparisonIcon({
  item,
  resolvedAccent,
  minimalIconsEnabled,
  surfaceVariant,
}: {
  item: CategoryComparisonRowItem;
  resolvedAccent: string;
  minimalIconsEnabled: boolean;
  surfaceVariant: string;
}) {
  return (
    <View
      style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: minimalIconsEnabled
          ? surfaceVariant
          : withOpacity(resolvedAccent, "18"),
      }}
    >
      <MaterialCommunityIcons
        name={item.icon}
        size={18}
        color={resolvedAccent}
      />
    </View>
  );
}

function ChangePill({
  changePercent,
  increaseTextColor,
  increaseBg,
  decreaseTextColor,
  decreaseBg,
  neutralTextColor,
  neutralBg,
}: {
  changePercent: number | null;
  increaseTextColor: string;
  increaseBg: string;
  decreaseTextColor: string;
  decreaseBg: string;
  neutralTextColor: string;
  neutralBg: string;
}) {
  const isIncrease = (changePercent ?? 0) > 0;
  const isDecrease = (changePercent ?? 0) < 0;

  return (
    <View
      style={{
        minWidth: 64,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: isIncrease
          ? increaseBg
          : isDecrease
            ? decreaseBg
            : neutralBg,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          lineHeight: 16,
          fontWeight: "700",
          color: isIncrease
            ? increaseTextColor
            : isDecrease
              ? decreaseTextColor
              : neutralTextColor,
        }}
      >
        {formatChangeAmount(changePercent)}
      </Text>
    </View>
  );
}

function CategoryComparisonSummaryRow({
  item,
  textColor,
  muted,
  currencyCode,
  currencySymbol,
  iconNode,
  onPress,
  theme,
}: {
  item: CategoryComparisonRowItem;
  textColor: string;
  muted: string;
  currencyCode: string;
  currencySymbol: string;
  iconNode: React.ReactNode;
  onPress: () => void;
  theme: ExtendedMD3Theme;
}) {
  const comparison = item.comparison;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 8,
        opacity: pressed ? 0.85 : 1,
        backgroundColor: withOpacity(textColor, pressed ? "08" : "00"),
      })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        {iconNode}

        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontSize: 14,
            lineHeight: 20,
            fontWeight: "500",
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
            flexShrink: 1,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              fontSize: 11,
              lineHeight: 16,
              color: muted,
            }}
          >
            {formatAmount(
              comparison.lastMonthAmount,
              currencyCode,
              currencySymbol,
            )}
          </Text>
          <MaterialCommunityIcons name="arrow-right" size={14} color={muted} />
          <Text
            numberOfLines={1}
            style={{
              fontSize: 13,
              lineHeight: 18,
              fontWeight: "700",
              color: textColor,
            }}
          >
            {formatAmount(
              comparison.currentAmount,
              currencyCode,
              currencySymbol,
            )}
          </Text>
        </View>

        <ChangePill
          changePercent={comparison.changePercent}
          increaseTextColor={theme.colors.error}
          increaseBg={theme.colors.errorContainer}
          decreaseTextColor={theme.semantic.success}
          decreaseBg={withOpacity(theme.semantic.success, "1A")}
          neutralTextColor={muted}
          neutralBg={withOpacity(muted, "14")}
        />
      </View>
    </Pressable>
  );
}

export function CategoryComparisonCard({
  analytics,
  bg,
  outline,
  textColor,
  accentColor,
  muted,
  onRowPress,
}: CategoryComparisonCardProps) {
  const theme = useTheme() as ExtendedMD3Theme;
  const { minimalIconsEnabled } = useAddonPrefs();
  const activeWorkspace = useAppSelector(selectActiveWorkspace);
  const currencyCode = activeWorkspace?.currencyCode ?? "INR";
  const currencySymbol = activeWorkspace?.currencySymbol ?? "";

  const rowItems = React.useMemo(
    () => analytics.rows.map(toRowItem),
    [analytics.rows],
  );

  const breakdownItems = React.useMemo(
    () => analytics.rows.map(toBreakdownItem),
    [analytics.rows],
  );

  return (
    <GenericBreakdownCard
      title="Category Comparison"
      items={rowItems}
      bg={bg}
      outline={outline}
      textColor={textColor}
      accentColor={accentColor}
      muted={muted}
      formatAmount={(amount) =>
        formatAmount(amount, currencyCode, currencySymbol)
      }
      emptyMessage="Need at least two months of data to compare categories."
      padding={{ horizontal: 10, top: 25, bottom: 10 }}
      onRowPress={(item) => onRowPress(toBreakdownItem(item.comparison))}
      buildIcon={(item) => (
        <ComparisonIcon
          item={item}
          resolvedAccent={
            minimalIconsEnabled ? theme.colors.primary : item.accent
          }
          minimalIconsEnabled={minimalIconsEnabled}
          surfaceVariant={theme.colors.surfaceVariant}
        />
      )}
      renderRow={({ item, textColor, muted, iconNode, onPress }) => (
        <CategoryComparisonSummaryRow
          item={item}
          textColor={textColor}
          muted={muted}
          currencyCode={currencyCode}
          currencySymbol={currencySymbol}
          iconNode={iconNode}
          onPress={onPress}
          theme={theme}
        />
      )}
      renderSheet={({ visible, onDismiss }) => (
        <BreakdownBottomSheet
          title={`Category Comparison · ${analytics.lastMonthLabel} vs ${analytics.currentMonthLabel}`}
          showModeToggle={false}
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
          onRowPress={(item) => {
            onDismiss();
            onRowPress(item);
          }}
          customRows={rowItems}
          renderCustomRow={({
            item,
            textColor,
            muted,
            primaryColor,
            surfaceVariant,
            onPress,
          }) => {
            const comparisonItem = item as CategoryComparisonRowItem;

            return (
              <CategoryComparisonSummaryRow
                item={comparisonItem}
                textColor={textColor}
                muted={muted}
                currencyCode={currencyCode}
                currencySymbol={currencySymbol}
                onPress={onPress}
                theme={theme}
                iconNode={
                  <ComparisonIcon
                    item={comparisonItem}
                    resolvedAccent={
                      minimalIconsEnabled ? primaryColor : comparisonItem.accent
                    }
                    minimalIconsEnabled={minimalIconsEnabled}
                    surfaceVariant={surfaceVariant}
                  />
                }
              />
            );
          }}
        />
      )}
    />
  );
}
