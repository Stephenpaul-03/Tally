import { useQuickShareInsights } from "@/hooks/use-quickshare-insights";
import { ClassicSpending } from "./components/ClassicSpending";
import { Gesture } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootParamList } from "@/navigation/types";
import { TonalSummaryTile } from "./components/TonalSummaryTile";
import { categoryTone } from "@/theme/sage";
import { ExpressiveOverview } from "./components/ExpressiveOverview";
import { ActivityTypeToggle } from "./components/ActivityTypeToggle";
import { ComparisonSheet } from "./sheets/ComparisonSheet";
import { dailyActivityDetail } from "./dailyActivityDetail";
import { SpotlightTarget } from "@/modules/Onboarding/SpotlightTour";
import { useAppShell } from "@/components/AppShellContext";
import { CategoryIconBadge } from "@/components/CategoryIconBadge";
import {
  useExpandedControls,
  useInsightsHeading,
} from "@/components/ExpandedControlsContext";
import { useInsightsExpansion } from "@/components/InsightsExpansionContext";
import { useTabBarHeight } from "@/components/tabbar/TabBarContext";
import { useAppDispatch, useAppSelector } from "@/hooks/Redux";
import {
  openAddModal,
  openViewModal,
  selectAccountColors,
  selectAccountIcons,
} from "@/modules/Core/Slices/TransactionSlice";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { typography } from "@/theme/typography";
import {
  getAccountColor,
  getAccountIconName,
  getCategoryColor,
} from "@/utils/Helpers";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { DesignText as Text } from "@/components/DesignText";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { calculateInsights, monthLabel, type Group } from "./calculations";
import {
  ActivityHeatmap,
  YearMonthlyTotals,
  YearOverview,
} from "./charts/Charts";
import { InsightsEmptyState } from "./components/InsightsEmptyState";
import { CardEmptyState } from "./components/CardEmptyState";
import { CategorySection } from "./components/CategorySection";
import { MotionPressable } from "./components/Motion";
import { InsightCard, MoneyHero } from "./components/Overview";
import { Chip, styles } from "./components/Primitives";
import { useInsights } from "./hooks/useInsights";
import { MonthPickerSheet } from "@/modules/Main/MonthPickerSheet";
import { DetailsSheet, type Detail } from "./sheets/DetailsSheet";
import { formatInsightAmount } from "./Utils";

type Panel = "months" | "compare" | "comparison-month";

type InsightsProps = {
  pagePan?: ReturnType<typeof Gesture.Pan>;
  initialMonth?: string;
  expressive?: boolean;
  standalone?: boolean;
  month?: string;
  onMonthChange?: (month: string) => void;
};
export function InsightsScreen(props: InsightsProps = {}) {
  const workspace = useAppSelector(selectActiveWorkspace);
  if (!workspace) return null;
  return (
    <WorkspaceInsights
      key={workspace.id}
      workspaceCurrency={workspace.currencyCode}
      {...props}
    />
  );
}

function WorkspaceInsights({
  workspaceCurrency,
  pagePan,
  initialMonth,
  expressive = false,
  standalone = false,
  month,
  onMonthChange,
}: InsightsProps & {
  workspaceCurrency: string;
}) {
  const { activeTab, requestTab } = useAppShell();
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const dispatch = useAppDispatch();
  const theme = useTheme<ExtendedMD3Theme>();
  const tabBarHeight = useTabBarHeight();
  const { bottom } = useSafeAreaInsets();
  const classicB = standalone && !expressive && !theme.expressive;
  const expanded = expressive || standalone || activeTab === "insights";
  // Keep the same period and hero mounted as Home expands into Insights.
  const a = useInsights(workspaceCurrency, true, { month, onMonthChange });
  useEffect(() => {
    if (initialMonth) a.setMonth(initialMonth);
  }, [initialMonth]); // eslint-disable-line react-hooks/exhaustive-deps
  const expansion = useInsightsExpansion();
  const bodyMotion = useAnimatedStyle(() => ({
    opacity: expansion
      ? interpolate(expansion.value, [0, 0.65], [0, 1], "clamp")
      : expanded
        ? 1
        : 0,
  }));
  const scroll = useRef<ScrollView>(null);
  useEffect(() => {
    if (expressive) scroll.current?.scrollTo({ y: 0, animated: false });
  }, [a.month, expressive]);
  useEffect(() => {
    if (!expanded) scroll.current?.scrollTo({ y: 0, animated: true });
  }, [expanded]);
  const [panel, setPanel] = useState<Panel | null>(null);
  const accountIcons = useAppSelector(selectAccountIcons);
  const accountColors = useAppSelector(selectAccountColors);
  const [browse, setBrowse] = useState<"expense" | "income" | "year" | null>(
    null,
  );
  const [activityType, setActivityType] = useState<"income" | "expense">(
    "expense",
  );
  const [detail, setDetail] = useState<Detail | null>(null);
  const registerControls = useExpandedControls();
  const registerHeading = useInsightsHeading();
  useEffect(() => {
    registerHeading?.({
      label: monthLabel(a.month),
      onPress: () => {
        setPanel("months");
      },
    });
    return () => registerHeading?.(null);
  }, [registerHeading, a.month]);
  useEffect(() => {
    registerControls?.([
      {
        label: "Compare",
        icon: "compare-horizontal",
        onPress: () => setPanel("compare"),
      },
    ]);
    return () => registerControls?.([]);
  }, [registerControls]);
  const money = (value: number) => formatInsightAmount(value, a.currency);
  const reportWorkspace = useAppSelector(selectActiveWorkspace);
  const reportSummary = React.useMemo(
    () => ({
      incomeTotal: a.data.income,
      expenseTotal: a.data.expense,
      balanceInHand: a.data.remaining,
      fullExpenseBreakdown: a.data.expenseCategories
        .filter((g) => g.count > 0)
        .map((g) => ({
          category: g.name,
          amount: g.amount,
          color: getCategoryColor(g.name, "expense", a.colors),
        })),
      fullIncomeBreakdown: a.data.incomeCategories
        .filter((g) => g.count > 0)
        .map((g) => ({
          category: g.name,
          amount: g.amount,
          color: getCategoryColor(g.name, "income", a.colors),
        })),
    }),
    [a.data, a.colors],
  );
  const reportExpenseComparison = React.useMemo(
    () =>
      a.data.expenseCategories.map((g) => ({
        category: g.name,
        currentAmount: g.amount,
        previousAmount: g.previous,
      })),
    [a.data.expenseCategories],
  );
  const reportIncomeComparison = React.useMemo(
    () =>
      a.data.incomeCategories.map((g) => ({
        category: g.name,
        currentAmount: g.amount,
        previousAmount: g.previous,
      })),
    [a.data.incomeCategories],
  );
  const report = useQuickShareInsights(
    reportSummary,
    monthLabel(a.month),
    monthLabel(a.data.comparisonMonth),
    reportWorkspace?.name,
    a.currency,
    reportWorkspace?.currencyCode === a.currency
      ? reportWorkspace.currencySymbol
      : formatInsightAmount(0, a.currency).replace(/[\d.,\s]/g, ""),
    reportExpenseComparison,
    reportIncomeComparison,
    a.canCompareBudget ? a.overallBudget : undefined,
    a.canCompareBudget ? a.categoryBudgets : undefined,
    undefined,
    a.data.comparisonDescription,
  );

  const hasEntries = a.data.current.length > 0;
  const hasYearEntries = a.data.year.months.some(
    (row) => row.incomeCount || row.expenseCount,
  );
  const showExpenses = a.data.hasSpending;
  const showIncomeCard = a.data.hasIncome;
  const hasBudget =
    a.canCompareBudget &&
    Number.isFinite(a.overallBudget) &&
    a.overallBudget > 0;
  const closeSheet = () => {
    setDetail(null);
    setPanel(null);
    setBrowse(null);
  };
  const selectMonth = (month: string) => {
    closeSheet();
    a.setMonth(month);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  const showSpending = () =>
    setDetail({
      title: "Monthly spending",
      description: a.data.periodLabel,
      summary: { label: "Spending recorded", value: money(a.data.expense) },
      budget: hasBudget
        ? { amount: a.overallBudget, spent: a.data.expense }
        : undefined,
      transactions: a.data.current.filter((row) => row.type === "expense"),
    });
  const showIncome = () =>
    setDetail({
      title: "Monthly income",
      description: a.data.periodLabel,
      summary: { label: "Income recorded", value: money(a.data.income) },
      transactions: a.data.current.filter((row) => row.type === "income"),
    });
  const showCategory = (group: Group, type: "income" | "expense") => {
    const budget =
      type === "expense" && a.canCompareBudget
        ? a.categoryBudgets[group.name]
        : undefined;
    const trend = calculateInsights(
      a.transactions.filter(
        (row) => row.category === group.name && row.type === type,
      ),
      a.month,
      a.currency,
      workspaceCurrency,
      a.matchedDays,
      new Date(),
      a.comparisonMonth ?? undefined,
    ).trend;
    setDetail({
      title: group.name,
      description: a.data.periodLabel,
      categoryType: type,
      summary: {
        label: type === "expense" ? "Spending recorded" : "Income recorded",
        value: money(group.amount),
      },
      budget:
        budget !== undefined && Number.isFinite(budget) && budget > 0
          ? { amount: budget, spent: group.amount }
          : undefined,
      transactions: group.transactions,
      trend,
    });
  };
  const accounts = a.data.accounts
    .filter((account) =>
      account.transactions.some((row) => row.type === "expense"),
    )
    .sort(
      (left, right) =>
        right.expense - left.expense || left.name.localeCompare(right.name),
    );
  const overview = expressive ? (
    <ExpressiveOverview
      data={a.data}
      money={money}
      onIncome={showIncome}
      onSpending={showSpending}
    />
  ) : (
    <MoneyHero
      contained={classicB}
      data={a.data}
      money={money}
      onIncome={expanded ? showIncome : () => requestTab("insights")}
      onSpending={expanded ? showSpending : () => requestTab("insights")}
    />
  );

  const categoryRows = (type: "expense" | "income", showAll = false) => (
    <CategorySection
      key={a.month + a.currency + type + (showAll ? "all" : "preview")}
      expressive={expressive}
      type={type}
      groups={
        type === "expense" ? a.data.expenseCategories : a.data.incomeCategories
      }
      budgets={
        type === "expense" && showAll && a.canCompareBudget
          ? a.categoryBudgets
          : undefined
      }
      money={money}
      icons={a.icons}
      colors={a.colors}
      onSelect={(group) => showCategory(group, type)}
      showAll={showAll}
      inset={showAll ? 20 : 14}
      onShowAll={() => setBrowse(type)}
    />
  );
  const browsePanel = browse
    ? {
        title:
          browse === "year"
            ? `${a.data.year.label} monthly totals`
            : browse === "expense"
              ? "All expense categories"
              : "All income categories",
        description:
          browse === "year"
            ? "Income and spending by month"
            : a.data.periodLabel,
        content:
          browse === "year" ? (
            <YearMonthlyTotals
              year={a.data.year}
              selectedMonth={a.month}
              money={money}
              onMonth={selectMonth}
            />
          ) : (
            <View style={{ gap: 12 }}>{categoryRows(browse, true)}</View>
          ),
      }
    : null;
  const details = (
    <DetailsSheet
      detail={detail}
      panel={browsePanel}
      onBack={detail && browsePanel ? () => setDetail(null) : undefined}
      onClose={closeSheet}
      money={money}
      onTransaction={(id) => dispatch(openViewModal(id))}
    />
  );
  return (
    <View style={{ flex: 1, minHeight: 0 }}>
      <ScrollView
        ref={scroll}
        scrollEnabled={expanded}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: expressive ? 16 : 20,
          paddingTop: expressive ? 16 : 6,
          paddingBottom:
            (expressive ? Math.max(tabBarHeight, 76) : tabBarHeight) +
            bottom +
            32,
        }}
      >
        {expressive || standalone ? (
          <>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <Text
                accessibilityRole="header"
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{
                  ...(theme.expressive
                    ? {
                        fontSize: 34,
                        fontWeight: "800" as const,
                        letterSpacing: -1,
                      }
                    : typography.editorial.hero),
                  color: theme.colors.onSurface,
                  flex: 1,
                }}
              >
                Insights
              </Text>
              <MotionPressable
                accessibilityRole="button"
                accessibilityLabel={`Choose month, ${monthLabel(a.month)}`}
                onPress={() => {
                  setPanel("months");
                }}
                style={{
                  minHeight: 44,
                  paddingHorizontal: 12,
                  borderRadius: 24,
                  backgroundColor: theme.expressive
                    ? theme.colors.surfaceVariant
                    : theme.colors.surface,
                  borderWidth: theme.expressive ? 0 : StyleSheet.hairlineWidth,
                  borderColor: theme.colors.outlineVariant,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "800",
                    color: theme.colors.onSurface,
                  }}
                >
                  {new Date(`${a.month}-01T12:00:00`).toLocaleDateString(
                    undefined,
                    { month: "short", year: "numeric" },
                  )}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={20}
                  color={theme.colors.onSurface}
                />
              </MotionPressable>
              <MotionPressable
                accessibilityRole="button"
                accessibilityLabel="Compare insights"
                onPress={() => setPanel("compare")}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: theme.expressive
                    ? theme.colors.surfaceVariant
                    : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialCommunityIcons
                  name="compare-horizontal"
                  size={22}
                  color={theme.colors.onSurface}
                />
              </MotionPressable>
              <MotionPressable
                accessibilityRole="button"
                accessibilityLabel="Settings"
                onPress={() => navigation.navigate("Settings")}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: theme.expressive
                    ? theme.colors.surfaceVariant
                    : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialCommunityIcons
                  name="cog-outline"
                  size={21}
                  color={theme.colors.onSurface}
                />
              </MotionPressable>
            </View>
            {a.currencies.length > 1 ? (
              <View style={{ flexDirection: "row", gap: 6, marginBottom: 14 }}>
                {a.currencies.map((code) => (
                  <Chip
                    key={code}
                    label={code}
                    selected={a.currency === code}
                    onPress={() => a.setCurrency(code)}
                  />
                ))}
              </View>
            ) : null}
          </>
        ) : null}
        {!expressive && !standalone && a.currencies.length > 1 ? (
          <View style={styles.chips}>
            {a.currencies.map((code) => (
              <Chip
                key={code}
                label={code}
                selected={a.currency === code}
                onPress={() => a.setCurrency(code)}
              />
            ))}
          </View>
        ) : null}
        <SpotlightTarget
          id="overview"
          enabled={(!expressive && !standalone) || activeTab === "insights"}
        >
          {overview}
        </SpotlightTarget>
        {!hasEntries ? (
          <InsightsEmptyState
            expanded={expanded}
            hasOtherMonths={a.comparisonMonths.length > 0}
            onAdd={() =>
              dispatch(openAddModal({ type: "expense", date: null }))
            }
            onChooseMonth={() => {
              setPanel("months");
            }}
          />
        ) : null}
        <Animated.View
          pointerEvents={expanded ? "auto" : "none"}
          accessibilityElementsHidden={!expanded}
          importantForAccessibility={expanded ? "auto" : "no-hide-descendants"}
          style={[{ gap: 12, paddingTop: 14 }, bodyMotion]}
        >
          {showExpenses ? (
            <>
              <InsightCard
                index={0}
                active={expressive || standalone || activeTab === "insights"}
                initiallyVisible={expressive || standalone}
                title="Spending"
                icon="arrow-top-right"
                color={theme.semantic.expense}
              >
                {classicB ? (
                  <ClassicSpending
                    groups={a.data.expenseCategories}
                    total={a.data.expense}
                    money={money}
                    icons={a.icons}
                    colors={a.colors}
                    onSelect={(group) => showCategory(group, "expense")}
                    onShowAll={() => setBrowse("expense")}
                  />
                ) : (
                  categoryRows("expense")
                )}
              </InsightCard>
            </>
          ) : null}
          {showIncomeCard ? (
            <>
              <InsightCard
                index={1}
                active={expressive || standalone || activeTab === "insights"}
                initiallyVisible={expressive || standalone}
                title="Income"
                icon="arrow-bottom-left"
                color={theme.semantic.income}
              >
                {classicB ? (
                  <ClassicSpending
                    type="income"
                    groups={a.data.incomeCategories}
                    total={a.data.income}
                    money={money}
                    icons={a.icons}
                    colors={a.colors}
                    onSelect={(group) => showCategory(group, "income")}
                    onShowAll={() => setBrowse("income")}
                  />
                ) : (
                  categoryRows("income")
                )}
              </InsightCard>
            </>
          ) : null}
          {accounts.length ? (
            <InsightCard
              index={2}
              active={expressive || standalone || activeTab === "insights"}
              initiallyVisible={expressive || standalone}
              title="Accounts"
              icon="wallet-outline"
              color={theme.dark ? "#C4A7F5" : "#7950B5"}
            >
              <View
                style={{
                  flexDirection: expressive ? "row" : "column",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {accounts.map((account, index) => {
                  const color = getAccountColor(account.name, accountColors);
                  const icon = getAccountIconName(
                    account.name,
                    accountIcons,
                  ) as React.ComponentProps<
                    typeof MaterialCommunityIcons
                  >["name"];
                  const [background, foreground] = categoryTone(
                    "",
                    theme.dark,
                    color,
                  );
                  const onPress = () =>
                    setDetail({
                      title: account.name || "Unspecified account",
                      description: a.data.periodLabel,
                      summary: {
                        label: "Spent",
                        value: money(account.expense),
                      },
                      transactions: account.transactions.filter(
                        (row) => row.type === "expense",
                      ),
                    });
                  return expressive ? (
                    <TonalSummaryTile
                      key={account.name}
                      index={index}
                      icon={icon}
                      background={background}
                      foreground={foreground}
                      value={money(account.expense)}
                      caption={account.name || "Unspecified account"}
                      onPress={onPress}
                    />
                  ) : (
                    <MotionPressable
                      key={account.name}
                      accessibilityRole="button"
                      accessibilityLabel={`${account.name || "Unspecified account"}, ${money(account.expense)} spent. View entries.`}
                      onPress={onPress}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        width: "100%",
                        gap: 10,
                        minHeight: 44,
                        paddingVertical: 8,
                        paddingHorizontal: 8,
                        borderRadius: 12,
                        backgroundColor: theme.colors.surfaceVariant,
                      }}
                    >
                      <CategoryIconBadge
                        icon={icon}
                        color={color}
                        style={{ width: 34, height: 34, borderRadius: 12 }}
                      />
                      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                        <Text
                          numberOfLines={1}
                          style={{
                            ...typography.bodyMedium,
                            fontSize: 14,
                            color: theme.colors.onSurface,
                          }}
                        >
                          {account.name || "Unspecified account"}
                        </Text>
                        <Text
                          style={{
                            ...typography.body,
                            fontSize: 11,
                            color: theme.colors.onSurfaceVariant,
                          }}
                        >
                          Spent this month
                        </Text>
                      </View>
                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        style={{
                          ...typography.bodyStrong,
                          maxWidth: "40%",
                          fontSize: 15,
                          color: theme.colors.onSurface,
                        }}
                      >
                        {money(account.expense)}
                      </Text>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={16}
                        color={theme.colors.onSurfaceVariant}
                      />
                    </MotionPressable>
                  );
                })}
              </View>
            </InsightCard>
          ) : null}
          {hasEntries ? (
            <InsightCard
              index={3}
              active={expressive || standalone || activeTab === "insights"}
              initiallyVisible={expressive || standalone}
              title="Activity"
              icon="calendar-blank-outline"
              color={theme.dark ? "#67C8E8" : "#087FA3"}
              headerAction={
                <ActivityTypeToggle
                  pagePan={pagePan}
                  value={activityType}
                  onChange={setActivityType}
                />
              }
            >
              <View style={{ gap: 12 }}>
                {(
                  activityType === "expense"
                    ? a.data.hasSpending
                    : a.data.hasIncome
                ) ? (
                  <ActivityHeatmap
                    days={a.data.days}
                    type={activityType}
                    money={money}
                    onDay={(day) =>
                      setDetail(dailyActivityDetail(day, activityType, money))
                    }
                  />
                ) : (
                  <CardEmptyState
                    icon={
                      activityType === "expense"
                        ? "basket-outline"
                        : "cash-plus"
                    }
                    message={
                      activityType === "expense"
                        ? "No spending days to show"
                        : "No income days to show"
                    }
                    description={
                      activityType === "expense"
                        ? "Switch to income to see when money came in."
                        : "Switch to spending to see where money went."
                    }
                  />
                )}
              </View>
            </InsightCard>
          ) : null}
          {hasYearEntries ? (
            <InsightCard
              index={4}
              active={expressive || standalone || activeTab === "insights"}
              initiallyVisible={expressive || standalone}
              title="Yearly"
              value={a.data.year.label}
              icon="chart-bar"
            >
              <YearOverview
                year={a.data.year}
                selectedMonth={a.month}
                money={money}
                onShowTotals={() => setBrowse("year")}
              />
            </InsightCard>
          ) : null}
        </Animated.View>
      </ScrollView>
      {details}
      <ComparisonSheet
        visible={panel === "compare"}
        onClose={closeSheet}
        data={a.data}
        month={a.month}
        budget={a.overallBudget}
        canCompareBudget={a.canCompareBudget}
        money={money}
        onChooseMonth={() => setPanel("comparison-month")}
        onShare={() => {
          void report.shareInsights(a.canCompareBudget ? "both" : "lastMonth");
        }}
        sharing={report.isGenerating}
        onSetBudget={() => {
          closeSheet();
          navigation.navigate("Settings", { section: "budget" });
        }}
      />
      <MonthPickerSheet
        disabledMonth={panel === "comparison-month" ? a.month : undefined}
        maximumMonth={panel === "comparison-month" ? a.currentMonth : undefined}
        visible={panel === "months" || panel === "comparison-month"}
        month={panel === "comparison-month" ? a.data.comparisonMonth : a.month}
        onChange={(value) => {
          if (panel === "comparison-month") a.setComparisonMonth(value);
          else selectMonth(value);
        }}
        onDismiss={() => {
          if (panel === "comparison-month") setPanel("compare");
          else closeSheet();
        }}
      />
    </View>
  );
}
