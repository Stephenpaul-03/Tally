import { tonalButtonSurface } from "@/theme/surfaceTreatment";
import { InsightsLayoutContext } from "./components/InsightsLayoutContext";
import { useMainDesign } from "@/hooks/use-main-design";
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
import { ShareInsightsSheet } from "./sheets/ShareInsightsSheet";
import { reportComparisonMode, reportDetailKey } from "./reportSelection";
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
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { useTheme } from "react-native-paper";
import { DesignText as Text } from "@/components/DesignText";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { calculateInsights, monthLabel, type Group } from "./calculations";
import {
  ActivityHeatmap,
  YearMonthlyTotals,
  YearOverview,
} from "./charts/Charts";
import { InsightsEmptyState } from "./components/InsightsEmptyState";
import { CategorySection } from "./components/CategorySection";
import { MotionPressable } from "./components/Motion";
import { InsightCard, MoneyHero } from "./components/Overview";
import { Chip, styles } from "./components/Primitives";
import { useInsights } from "./hooks/useInsights";
import { MonthPickerSheet } from "@/modules/Main/MonthPickerSheet";
import { DetailsSheet, type Detail } from "./sheets/DetailsSheet";
import { formatInsightAmount } from "./Utils";

type Panel = "months" | "share";

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
  const { design, insightsStyle } = useMainDesign();
  const selectedStyle = insightsStyle ?? design.layout;
  if (!workspace) return null;
  return <InsightsLayoutContext.Provider value={selectedStyle === "sage"}>
    <WorkspaceInsights key={workspace.id} workspaceCurrency={workspace.currencyCode}
      {...props} standalone={props.standalone || selectedStyle === "classic"} expressive={selectedStyle === "sage"} />
  </InsightsLayoutContext.Provider>;
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
  const { fontScale } = useWindowDimensions();
  const tabBarHeight = useTabBarHeight();
  const { bottom } = useSafeAreaInsets();
  const classicB = standalone && !expressive;
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
  const [browse, setBrowse] = useState<"expense" | "income" | "year" | "accounts" | null>(
    null,
  );
  const [activityType, setActivityType] = useState<"income" | "expense">(
    "expense",
  );
  const activityProgress = useSharedValue(activityType === "income" ? 1 : 0);
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
        label: "Share",
        icon: "share-variant-outline",
        onPress: () => setPanel("share"),
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
    { accounts: a.data.accounts.filter(account => account.transactions.length > 0), transactions: a.data.current },
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
  const accountPreviewLimit = expressive && fontScale <= 1.25 ? 6 : 3;
  const accountRows = (showAll = false) => (
    <View style={{ gap: 8 }}>
              <View
                style={{
                  flexDirection: expressive ? "row" : "column",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {(showAll ? accounts : accounts.slice(0, accountPreviewLimit)).map((account, index) => {
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
      {!showAll && accounts.length > accountPreviewLimit ? (
        <MotionPressable accessibilityRole="button" accessibilityLabel={`View ${accounts.length - accountPreviewLimit} more accounts`}
          onPress={() => setBrowse("accounts")}
          style={{ flexDirection: "row", alignItems: "center", gap: 10, minHeight: 48,
            paddingHorizontal: 12, borderRadius: 16, backgroundColor: tonalButtonSurface(theme) }}>
          <MaterialCommunityIcons name="dots-horizontal" size={22} color={theme.colors.onSurfaceVariant} />
          <Text style={{ ...typography.bodyMedium, flex: 1, color: theme.colors.onSurface }}>
            {accounts.length - accountPreviewLimit} more
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color={theme.colors.onSurfaceVariant} />
        </MotionPressable>
      ) : null}
    </View>
  );
  const browsePanel = browse
    ? {
        title:
          browse === "year"
            ? `${a.data.year.label} monthly totals`
            : browse === "accounts"
              ? "All accounts"
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
          ) : browse === "accounts" ? (
            accountRows(true)
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
          flexGrow: 1,
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
                    ? tonalButtonSurface(theme)
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
                accessibilityLabel="Share insights"
                onPress={() => setPanel("share")}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: theme.expressive
                    ? tonalButtonSurface(theme)
                    : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialCommunityIcons
                  name="share-variant-outline"
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
                    ? tonalButtonSurface(theme)
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
          {hasEntries ? overview : null}
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
              {accountRows()}
            </InsightCard>
          ) : null}
          {hasEntries ? (
            <InsightCard
              index={3}
              active={expressive || standalone || activeTab === "insights"}
              initiallyVisible={expressive || standalone}
              title="Activity"
              headerGap={12}
              icon="calendar-blank-outline"
              color={theme.dark ? "#67C8E8" : "#087FA3"}
              headerAction={
                <ActivityTypeToggle
                  pagePan={pagePan}
                  dragProgress={activityProgress}
                  value={activityType}
                  onChange={setActivityType}
                />
              }
            >
              <ActivityHeatmap
                days={a.data.days}
                type={activityType}
                dragProgress={activityProgress}
                money={money}
                onDay={(day) => setDetail(dailyActivityDetail(day, activityType, money))}
              />
            </InsightCard>
          ) : null}
          {hasEntries && hasYearEntries ? (
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
      <ShareInsightsSheet visible={panel === "share"} onClose={closeSheet}
        canCompareBudget={a.canCompareBudget && a.overallBudget > 0}
        previousSections={{ includeIncome: a.data.hasPreviousIncome, includeExpenses: a.data.hasPreviousSpending, includeAccounts: a.data.previous.length > 0 }}
        previousMonth={monthLabel(a.data.comparisonMonth)} sharing={report.isGenerating}
        onShare={(selection) => { void report.shareInsights(reportComparisonMode(selection), selection); }}
        groups={[
          ...a.data.expenseCategories.filter(group => group.count > 0).map(group => ({ key: reportDetailKey("expense", group.name), label: group.name, section: "includeExpenses" as const, count: group.count })),
          ...a.data.incomeCategories.filter(group => group.count > 0).map(group => ({ key: reportDetailKey("income", group.name), label: group.name, section: "includeIncome" as const, count: group.count })),
          ...a.data.accounts.filter(account => account.transactions.length > 0).map(account => ({ key: reportDetailKey("account", account.name), label: account.name, section: "includeAccounts" as const, count: account.transactions.length })),
        ]}
      />
      <MonthPickerSheet visible={panel === "months"} month={a.month} onChange={selectMonth} onDismiss={closeSheet} />
    </View>
  );
}
