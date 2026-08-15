import { AnimatedPaperModal } from "@/components/modal/modal";
import { budgetStyles } from "@/modules/Management/Budget/Styles";
import { SettingsHeader } from "@/modules/Settings/Components/SettingsHeader";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { Text, useTheme, type MD3Theme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import {
  formatInsightMoney,
  formatPercent,
  useCategorySpendInsights,
  type CategoryInsightCompareMode,
  type CategoryInsightRow,
} from "../Hooks";
import { insightStyles } from "../Styles";

type CategoryInsightViewMode = "income" | "budget" | CategoryInsightCompareMode;
type InsightCardVariant = "category" | "account";

function darkenHex(hex: string, amount = 0.18) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;
  const num = parseInt(clean, 16);
  const r = Math.max(0, Math.round(((num >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((num >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((num & 0xff) * (1 - amount)));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function CategoryCarouselTile({
  row,
  theme,
  minimalIconsEnabled,
}: {
  row: CategoryInsightRow;
  theme: MD3Theme;
  minimalIconsEnabled: boolean;
}) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, row.incomeShare));
  const iconBackground = minimalIconsEnabled
    ? theme.colors.background
    : darkenHex(row.color);
  const secondary = `${formatPercent(row.incomeShare)} of income`;

  return (
    <View
      style={[
        insightStyles.categoryCarouselTile,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <View style={insightStyles.categoryArcIcon}>
        <Svg width={64} height={64} viewBox="0 0 64 64">
          <Circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke={theme.colors.elevation.level3}
            strokeWidth={4}
          />
          <Circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke={row.color}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - progress / 100)}
            rotation="-90"
            origin="32, 32"
          />
        </Svg>
        <View
          style={[
            insightStyles.categoryIconCenter,
            {
              backgroundColor: iconBackground,
              borderColor: minimalIconsEnabled
                ? theme.colors.outlineVariant
                : "transparent",
              shadowColor: row.color,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={row.icon as any}
            size={24}
            color={minimalIconsEnabled ? row.color : "#FFFFFF"}
          />
        </View>
      </View>
      <Text
        numberOfLines={1}
        style={[
          insightStyles.categoryTileName,
          { color: theme.colors.onSurface },
        ]}
      >
        {row.name}
      </Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        style={[
          insightStyles.categoryTileAmount,
          { color: theme.colors.onSurface },
        ]}
      >
        {formatInsightMoney(row.spent)}
      </Text>
      <Text
        numberOfLines={1}
        style={[
          insightStyles.categoryTileMeta,
          { color: theme.colors.onSurfaceVariant },
        ]}
      >
        {secondary}
      </Text>
    </View>
  );
}

function ViewAllCarouselTile({
  onPress,
  theme,
}: {
  onPress: () => void;
  theme: MD3Theme;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="View all categories"
      onPress={onPress}
      style={({ pressed }) => [
        insightStyles.categoryCarouselTile,
        insightStyles.viewAllCarouselTile,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View
        style={[
          insightStyles.viewAllIcon,
          { backgroundColor: theme.colors.elevation.level2 },
        ]}
      >
        <MaterialCommunityIcons
          name="arrow-right"
          size={24}
          color={theme.colors.primary}
        />
      </View>
      <Text
        style={[
          insightStyles.viewAllTileText,
          { color: theme.colors.onSurface },
        ]}
      >
        View all
      </Text>
      <Text
        style={[
          insightStyles.viewAllTileMeta,
          { color: theme.colors.onSurfaceVariant },
        ]}
      >
        Categories
      </Text>
    </Pressable>
  );
}

function getDeltaLabel(row: CategoryInsightRow) {
  if (row.delta === 0) return "Flat";
  const direction = row.delta > 0 ? "up" : "down";
  if (row.deltaPercent === null) return `${direction} now`;
  return `${direction} ${formatPercent(Math.abs(row.deltaPercent))}`;
}

function getHistoryMode(viewMode: CategoryInsightViewMode) {
  return viewMode === "last3Months" ? "last3Months" : "lastMonth";
}

function CategoryInsightSheet({
  visible,
  rows,
  variant,
  viewMode,
  compareLabel,
  minimalIconsEnabled,
  onDismiss,
}: {
  visible: boolean;
  rows: CategoryInsightRow[];
  variant: InsightCardVariant;
  viewMode: CategoryInsightViewMode;
  compareLabel?: string;
  minimalIconsEnabled: boolean;
  onDismiss: () => void;
}) {
  const theme = useTheme();
  const { bottom } = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onDismiss}
      presentation="sheet"
      includeBottomInset={false}
      contentContainerStyle={insightStyles.sheetModalContent}
    >
      <View
        style={[
          insightStyles.sheetPanel,
          {
            backgroundColor: theme.colors.background,
            maxHeight: Math.round(height * 0.72),
            paddingBottom: Math.max(18, bottom + 12),
          },
        ]}
      >
        <View
          style={[
            insightStyles.sheetHandle,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />
        <SettingsHeader
          title={
            variant === "category" ? "Category Breakdown" : "Account Breakdown"
          }
          modal
          onBack={onDismiss}
          rightAccessory={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share category insights"
              onPress={() => undefined}
              style={({ pressed }) => [
                insightStyles.sheetClose,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outlineVariant,
                  borderWidth: 1,
                  opacity: pressed ? 0.72 : 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="share-variant-outline"
                size={18}
                color={theme.colors.onSurface}
              />
            </Pressable>
          }
        />
        <ScrollView
          contentContainerStyle={insightStyles.sheetList}
          showsVerticalScrollIndicator={false}
        >
          {Array.from({ length: Math.ceil(rows.length / 2) }, (_, index) => {
            const pair = rows.slice(index * 2, index * 2 + 2);
            return (
              <View key={index} style={budgetStyles.categoryGridRow}>
                {pair.map((row) => (
                  <View key={row.name} style={budgetStyles.categoryGridItem}>
                    <CategorySheetGridTile
                      row={row}
                      theme={theme}
                      minimalIconsEnabled={minimalIconsEnabled}
                    />
                  </View>
                ))}
                {pair.length === 1 ? (
                  <View style={budgetStyles.categoryGridItem} />
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </AnimatedPaperModal>
  );
}

function CategorySheetGridTile({
  row,
  theme,
  minimalIconsEnabled,
}: {
  row: CategoryInsightRow;
  theme: MD3Theme;
  minimalIconsEnabled: boolean;
}) {
  const progress = Math.min(100, Math.max(0, row.incomeShare));
  const iconColor = minimalIconsEnabled ? row.color : "#FFFFFF";
  const iconBackground = minimalIconsEnabled
    ? theme.colors.background
    : darkenHex(row.color);

  return (
    <View
      style={[
        budgetStyles.accountLikeTile,
        { backgroundColor: theme.colors.elevation.level1 },
      ]}
    >
      <View style={budgetStyles.accountLikeTopRow}>
        <View style={budgetStyles.accountLikeLeading}>
          <View
            style={[
              budgetStyles.accountLikeIconBadge,
              { backgroundColor: iconBackground },
            ]}
          >
            <MaterialCommunityIcons
              name={row.icon as any}
              size={20}
              color={iconColor}
            />
          </View>
          <View style={budgetStyles.accountLikeText}>
            <Text
              numberOfLines={1}
              style={[
                budgetStyles.accountLikeTitle,
                { color: theme.colors.onSurface },
              ]}
            >
              {row.name}
            </Text>
          </View>
        </View>
      </View>
      <View
        style={[
          budgetStyles.accountLikeProgressTrack,
          { backgroundColor: theme.colors.elevation.level3 },
        ]}
      >
        {progress > 0 ? (
          <View
            style={[
              budgetStyles.accountLikeProgressFill,
              {
                width: `${Math.max(progress, 4)}%`,
                backgroundColor: row.color,
              },
            ]}
          />
        ) : null}
      </View>
      <View style={budgetStyles.accountLikeBottomRow}>
        <Text
          style={[
            budgetStyles.accountLikeMeta,
            { color: theme.colors.onSurface },
          ]}
        >
          {formatInsightMoney(row.spent)}
        </Text>
        <Text
          style={[
            budgetStyles.accountLikeMeta,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          {formatPercent(row.incomeShare)} of income
        </Text>
      </View>
    </View>
  );
}

type InsightBreakdownCardProps = {
  variant: InsightCardVariant;
  title: string;
  emptyTitle: string;
  emptySubtitle: string;
  selectedMonthKey: string;
  useData: (
    compareMode: CategoryInsightCompareMode,
    selectedMonthKey: string,
  ) => ReturnType<typeof useCategorySpendInsights>;
};

function InsightBreakdownCard({
  variant,
  title,
  emptyTitle,
  emptySubtitle,
  selectedMonthKey,
  useData,
}: InsightBreakdownCardProps) {
  const theme = useTheme();
  const c = theme.colors;
  const viewMode: CategoryInsightViewMode = "income";
  const [sheetVisible, setSheetVisible] = React.useState(false);
  const { rows, minimalIconsEnabled } = useData(
    getHistoryMode(viewMode),
    selectedMonthKey,
  );
  const topRows = rows.slice(0, 5);

  return (
    <>
      <View style={insightStyles.card}>
        <View style={insightStyles.cardHeader}>
          <View style={insightStyles.titleBlock}>
            <Text
              numberOfLines={1}
              style={[insightStyles.title, { color: c.onSurface }]}
            >
              {title}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View all categories"
            onPress={() => setSheetVisible(true)}
            style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
          >
            <Text style={[insightStyles.viewAllLabel, { color: c.onSurface }]}>
              View all
            </Text>
          </Pressable>
        </View>

        {rows.length > 0 ? (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={insightStyles.categoryCarousel}
            >
              {topRows.map((row) => (
                <CategoryCarouselTile
                  key={row.name}
                  row={row}
                  theme={theme}
                  minimalIconsEnabled={minimalIconsEnabled}
                />
              ))}
              <ViewAllCarouselTile
                onPress={() => setSheetVisible(true)}
                theme={theme}
              />
            </ScrollView>
          </>
        ) : (
          <View style={insightStyles.empty}>
            <MaterialCommunityIcons
              name="chart-donut"
              size={24}
              color={c.onSurfaceVariant}
            />
            <Text style={[insightStyles.emptyTitle, { color: c.onSurface }]}>
              {emptyTitle}
            </Text>
            <Text
              style={[insightStyles.emptyMeta, { color: c.onSurfaceVariant }]}
            >
              {emptySubtitle}
            </Text>
          </View>
        )}
      </View>

      <CategoryInsightSheet
        visible={sheetVisible}
        rows={rows}
        variant={variant}
        viewMode={viewMode}
        compareLabel="income"
        minimalIconsEnabled={minimalIconsEnabled}
        onDismiss={() => setSheetVisible(false)}
      />
    </>
  );
}

export function CategoryBreakdownCard({
  selectedMonthKey,
}: {
  selectedMonthKey: string;
}) {
  return (
    <InsightBreakdownCard
      variant="category"
      title="Spending by category"
      emptyTitle="No category spend yet"
      emptySubtitle="Add expenses this month to see where your money went."
      selectedMonthKey={selectedMonthKey}
      useData={useCategorySpendInsights}
    />
  );
}
