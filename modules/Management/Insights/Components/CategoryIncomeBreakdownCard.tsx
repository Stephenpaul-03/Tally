import { AnimatedPaperModal } from "@/components/modal/modal";
import { palette } from "@/theme/color_palette";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { Menu, Text, useTheme, type MD3Theme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  formatInsightMoney,
  formatPercent,
  useCategorySpendInsights,
  useIncomeAccountSpendInsights,
  type CategoryInsightCompareMode,
  type CategoryInsightRow,
} from "../Hooks";
import { insightStyles } from "../Styles";

const COMPARE_OPTIONS: {
  key: CategoryInsightViewMode;
  label: string;
  rowLabel?: string;
}[] = [
  { key: "income", label: "Vs income" },
  { key: "budget", label: "Vs budget" },
  { key: "lastMonth", label: "Last month", rowLabel: "last month" },
  { key: "last3Months", label: "Last 3 months", rowLabel: "3 mo avg" },
];

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

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(date.getTime())) return monthKey;
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
  }).format(date);
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

function getBudgetUsePercent(row: CategoryInsightRow) {
  return row.budgetUsed;
}

function getBudgetStatusColor(row: CategoryInsightRow, theme: MD3Theme) {
  if (row.budget <= 0) return theme.colors.onSurfaceVariant;
  if (row.budgetLeft < 0) return palette.status.danger;
  if (getBudgetUsePercent(row) >= 80) return "#D4AF45";
  return palette.status.success;
}

function CategoryInsightLine({
  row,
  theme,
  minimalIconsEnabled,
  variant,
  viewMode,
  compareLabel,
  isLast,
}: {
  row: CategoryInsightRow;
  theme: MD3Theme;
  minimalIconsEnabled: boolean;
  variant: InsightCardVariant;
  viewMode: CategoryInsightViewMode;
  compareLabel?: string;
  isLast?: boolean;
}) {
  const c = theme.colors;
  const iconBackground = minimalIconsEnabled
    ? c.background
    : darkenHex(row.color);
  const deltaColor =
    row.delta > 0
      ? palette.status.danger
      : row.delta < 0
        ? palette.status.success
        : c.onSurfaceVariant;
  const budgetUsePercent = getBudgetUsePercent(row);
  const budgetStatusColor = getBudgetStatusColor(row, theme);
  const rowCopy = (() => {
    if (viewMode === "income") {
      if (variant === "category") {
        const budgetText =
          row.budget > 0
            ? row.budgetLeft >= 0
              ? `${formatInsightMoney(row.budgetLeft)} left`
              : `${formatInsightMoney(Math.abs(row.budgetLeft))} over`
            : "No budget";

        return {
          meta: budgetText,
          value: formatInsightMoney(row.spent),
          compare: `${formatPercent(row.incomeShare)} of income`,
          compareColor: c.onSurfaceVariant,
          progress: row.incomeShare,
          progressColor: row.color,
        };
      }

      return {
        meta: `${formatInsightMoney(row.income)} income`,
        value: formatInsightMoney(row.spent),
        compare: `${formatPercent(row.incomeShare)} spent`,
        compareColor: c.onSurfaceVariant,
        progress: row.incomeShare,
        progressColor: row.color,
      };
    }

    if (viewMode === "budget") {
      const remainingValue =
        row.budget > 0
          ? row.budgetLeft >= 0
            ? `${formatInsightMoney(row.budgetLeft)} left`
            : `${formatInsightMoney(Math.abs(row.budgetLeft))} over`
          : "No budget";
      return {
        meta:
          row.budget > 0
            ? variant === "category"
              ? `${formatInsightMoney(row.spent)} of ${formatInsightMoney(
                  row.budget,
                )}`
              : `${formatInsightMoney(row.spent)} of total budget`
            : variant === "category"
              ? `${formatInsightMoney(row.spent)} spent`
              : `${formatInsightMoney(row.spent)} from account`,
        value:
          variant === "category"
            ? remainingValue
            : row.budget > 0
              ? formatPercent(budgetUsePercent)
              : remainingValue,
        compare:
          row.budget > 0
            ? variant === "category"
              ? `${formatPercent(budgetUsePercent)} used`
              : remainingValue
            : "Set budget",
        compareColor: budgetStatusColor,
        progress: budgetUsePercent,
        progressColor: budgetStatusColor,
      };
    }

    if (variant === "category") {
      const budgetText =
        row.budget > 0
          ? row.budgetLeft >= 0
            ? `${formatInsightMoney(row.budgetLeft)} left`
            : `${formatInsightMoney(Math.abs(row.budgetLeft))} over`
          : "No budget";

      return {
        meta: `${budgetText} · ${formatPercent(row.incomeShare)} of income`,
        value: formatInsightMoney(row.spent),
        compare: `vs ${formatInsightMoney(row.comparisonSpent)} ${compareLabel}`,
        compareColor: deltaColor,
        progress: row.incomeShare,
        progressColor: row.color,
      };
    }

    return {
      meta: `${formatInsightMoney(row.income)} income · ${formatPercent(
        row.incomeShare,
      )} spent`,
      value: formatInsightMoney(row.spent),
      compare: `vs ${formatInsightMoney(row.comparisonSpent)} ${compareLabel}`,
      compareColor: deltaColor,
      progress: row.incomeShare,
      progressColor: row.color,
    };
  })();

  return (
    <View style={insightStyles.rowWrap}>
      <View style={insightStyles.row}>
        <View style={insightStyles.rowLeft}>
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
          <View style={insightStyles.rowText}>
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
              {rowCopy.meta}
            </Text>
          </View>
        </View>
        <View style={insightStyles.rowRight}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.78}
            style={[insightStyles.rowValue, { color: c.onSurface }]}
          >
            {rowCopy.value}
          </Text>
          <Text
            numberOfLines={1}
            style={[insightStyles.rowCompare, { color: rowCopy.compareColor }]}
          >
            {viewMode === "lastMonth" || viewMode === "last3Months"
              ? `${getDeltaLabel(row)} · ${rowCopy.compare}`
              : rowCopy.compare}
          </Text>
        </View>
      </View>
      <View
        style={[
          insightStyles.progressTrack,
          { backgroundColor: c.elevation.level3 },
        ]}
      >
        <View
          style={[
            insightStyles.progressFill,
            {
              width: `${Math.min(100, Math.max(0, rowCopy.progress))}%`,
              backgroundColor: rowCopy.progressColor,
            },
          ]}
        />
      </View>
      {!isLast ? (
        <View
          style={[insightStyles.divider, { backgroundColor: c.outlineVariant }]}
        />
      ) : null}
    </View>
  );
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
        <View style={insightStyles.sheetHeader}>
          <Text
            numberOfLines={1}
            style={[
              insightStyles.sheetTitle,
              { color: theme.colors.onSurface },
            ]}
          >
            {variant === "category" ? "Category Breakdown" : "Account Breakdown"}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Close ${variant} insights`}
            onPress={onDismiss}
            style={({ pressed }) => [
              insightStyles.sheetClose,
              {
                backgroundColor: theme.colors.surface,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="close"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={insightStyles.sheetList}
          showsVerticalScrollIndicator={false}
        >
          {rows.map((row, index) => (
            <CategoryInsightLine
              key={row.name}
              row={row}
              variant={variant}
              viewMode={viewMode}
              compareLabel={compareLabel}
              isLast={index === rows.length - 1}
              minimalIconsEnabled={minimalIconsEnabled}
              theme={theme}
            />
          ))}
        </ScrollView>
      </View>
    </AnimatedPaperModal>
  );
}

type InsightBreakdownCardProps = {
  variant: InsightCardVariant;
  title: string;
  subtitleNoun: string;
  emptyTitle: string;
  emptySubtitle: string;
  useData: (
    compareMode: CategoryInsightCompareMode,
  ) => ReturnType<typeof useCategorySpendInsights>;
};

function InsightBreakdownCard({
  variant,
  title,
  subtitleNoun,
  emptyTitle,
  emptySubtitle,
  useData,
}: InsightBreakdownCardProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [viewMode, setViewMode] =
    React.useState<CategoryInsightViewMode>("income");
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [sheetVisible, setSheetVisible] = React.useState(false);
  const {
    rows,
    currentMonthKey,
    minimalIconsEnabled,
    overallBudget,
    totalIncome,
  } = useData(getHistoryMode(viewMode));
  const selectedOption =
    COMPARE_OPTIONS.find((option) => option.key === viewMode) ??
    COMPARE_OPTIONS[0];
  const topRows = rows.slice(0, 3);
  const remainingRows = rows.slice(3);
  const totalSpent = rows.reduce((sum, row) => sum + row.spent, 0);
  const totalBudgetUsed =
    overallBudget > 0 ? (totalSpent / overallBudget) * 100 : 0;
  const totalBudgetLeft =
    variant === "category"
      ? rows.reduce((sum, row) => sum + row.budgetLeft, 0)
      : 0;

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
            <Text
              numberOfLines={1}
              style={[insightStyles.subtitle, { color: c.onSurfaceVariant }]}
            >
              {formatMonthLabel(currentMonthKey)} {subtitleNoun} breakdown
            </Text>
          </View>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Select comparison period"
                onPress={() => setMenuVisible(true)}
                style={({ pressed }) => [
                  insightStyles.selectButton,
                  {
                    backgroundColor: c.elevation.level1,
                    borderColor: c.outlineVariant,
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[insightStyles.selectLabel, { color: c.onSurface }]}
                >
                  {selectedOption.label}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={16}
                  color={c.onSurfaceVariant}
                />
              </Pressable>
            }
          >
            {COMPARE_OPTIONS.map((option) => (
              <Menu.Item
                key={option.key}
                title={option.label}
                onPress={() => {
                  setViewMode(option.key);
                  setMenuVisible(false);
                }}
              />
            ))}
          </Menu>
        </View>

        {rows.length > 0 ? (
          <>
            <View style={insightStyles.summaryStrip}>
              <View style={insightStyles.summaryItem}>
                <Text
                  numberOfLines={1}
                  style={[
                    insightStyles.summaryLabel,
                    { color: c.onSurfaceVariant },
                  ]}
                >
                  Spent
                </Text>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.76}
                  style={[insightStyles.summaryValue, { color: c.onSurface }]}
                >
                  {formatInsightMoney(totalSpent)}
                </Text>
              </View>
              <View
                style={[
                  insightStyles.summaryDivider,
                  { backgroundColor: c.outlineVariant },
                ]}
              />
              <View style={insightStyles.summaryItem}>
                <Text
                  numberOfLines={1}
                  style={[
                    insightStyles.summaryLabel,
                    { color: c.onSurfaceVariant },
                  ]}
                >
                  Income
                </Text>
                <Text
                  numberOfLines={1}
                  style={[insightStyles.summaryValue, { color: c.onSurface }]}
                >
                  {formatInsightMoney(totalIncome)}
                </Text>
              </View>
              <View
                style={[
                  insightStyles.summaryDivider,
                  { backgroundColor: c.outlineVariant },
                ]}
              />
              <View style={insightStyles.summaryItem}>
                <Text
                  numberOfLines={1}
                  style={[
                    insightStyles.summaryLabel,
                    { color: c.onSurfaceVariant },
                  ]}
                >
                  {variant === "category" ? "Budget left" : "Budget used"}
                </Text>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.76}
                  style={[
                    insightStyles.summaryValue,
                    {
                      color:
                        variant === "category"
                          ? totalBudgetLeft < 0
                            ? palette.status.danger
                            : c.onSurface
                          : totalBudgetUsed > 100
                            ? palette.status.danger
                            : c.onSurface,
                    },
                  ]}
                >
                  {variant === "category"
                    ? formatInsightMoney(totalBudgetLeft)
                    : formatPercent(totalBudgetUsed)}
                </Text>
              </View>
            </View>
            {topRows.map((row, index) => (
              <CategoryInsightLine
                key={row.name}
                row={row}
                variant={variant}
                viewMode={viewMode}
                compareLabel={selectedOption.rowLabel}
                isLast={index === topRows.length - 1 && rows.length <= 3}
                minimalIconsEnabled={minimalIconsEnabled}
                theme={theme}
              />
            ))}
            {remainingRows.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Show all ${variant} insights`}
                onPress={() => setSheetVisible(true)}
                style={({ pressed }) => [
                  insightStyles.seeAllButton,
                  {
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
                <Text style={[insightStyles.seeAllText, { color: c.primary }]}>
                  View {remainingRows.length} more
                </Text>
                <MaterialCommunityIcons
                  name="chevron-up"
                  size={16}
                  color={c.primary}
                />
              </Pressable>
            ) : null}
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
        rows={remainingRows}
        variant={variant}
        viewMode={viewMode}
        compareLabel={selectedOption.rowLabel}
        minimalIconsEnabled={minimalIconsEnabled}
        onDismiss={() => setSheetVisible(false)}
      />
    </>
  );
}

export function CategoryIncomeBreakdownCard() {
  return (
    <InsightBreakdownCard
      variant="category"
      title="Income Spend Mix"
      subtitleNoun="category"
      emptyTitle="No category spend yet"
      emptySubtitle="Add expenses and income this month to see the breakdown."
      useData={useCategorySpendInsights}
    />
  );
}

export function IncomeAccountBreakdownCard() {
  return (
    <InsightBreakdownCard
      variant="account"
      title="Income Account Mix"
      subtitleNoun="account"
      emptyTitle="No account spend yet"
      emptySubtitle="Add income and expenses this month to see the breakdown."
      useData={useIncomeAccountSpendInsights}
    />
  );
}
