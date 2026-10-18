import { SpotlightTarget } from "@/modules/Onboarding/SpotlightTour";
import { useAppShell } from "@/components/AppShellContext";
import { CategoryIconBadge } from "@/components/CategoryIconBadge";
import {
  useExpandedControls,
  useInsightsHeading,
  type ExpandedControl,
} from "@/components/ExpandedControlsContext";
import { useInsightsExpansion } from "@/components/InsightsExpansionContext";
import { useTabBarHeight } from "@/components/tabbar/TabBarContext";
import { TypeToggle } from "@/components/TypeToggle";
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
import { getAccountColor, getAccountIconName } from "@/utils/Helpers";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  amountChangeLabel,
  calculateInsights,
  monthLabel,
  type Group,
} from "./calculations";
import {
  ActivityHeatmap,
  YearMonthlyTotals,
  YearOverview,
} from "./charts/Charts";
import { InsightsEmptyState } from "./components/InsightsEmptyState";
import { CardEmptyState } from "./components/CardEmptyState";
import { CategorySection } from "./components/CategorySection";
import { MotionPressable } from "./components/Motion";
import { IncomeUsage, InsightCard, MoneyHero } from "./components/Overview";
import {
  BudgetProgress,
  Chip,
  ContextNote,
  Muted,
  styles,
  TextAction,
} from "./components/Primitives";
import { useInsights } from "./hooks/useInsights";
import { ComparisonMonths, ControlOption, ControlsSheet } from "./sheets/ControlsSheet";
import { DetailsSheet, type Detail } from "./sheets/DetailsSheet";
import { formatInsightAmount } from "./Utils";


type Panel = "months" | "view" | "compare";

export function InsightsScreen() {
  const workspace = useAppSelector(selectActiveWorkspace);
  if (!workspace) return null;
  return (
    <WorkspaceInsights
      key={workspace.id}
      workspaceCurrency={workspace.currencyCode}
    />
  );
}

function WorkspaceInsights({
  workspaceCurrency,
}: {
  workspaceCurrency: string;
}) {
  const { activeTab, requestTab } = useAppShell();
  const dispatch = useAppDispatch();
  const theme = useTheme<ExtendedMD3Theme>();
  const tabBarHeight = useTabBarHeight();
  const { bottom } = useSafeAreaInsets();
  const expanded = activeTab === "insights";
  // Keep the same period and hero mounted as Home expands into Insights.
  const a = useInsights(workspaceCurrency);
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
    if (!expanded) scroll.current?.scrollTo({ y: 0, animated: true });
  }, [expanded]);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [pickerYear, setPickerYear] = useState(Number(a.month.slice(0, 4)));
  const compare = a.comparisonMonth !== null;
  const comparisonPeriod = monthLabel(a.data.comparisonMonth);
  const hasConfiguredBudgets = (Number.isFinite(a.overallBudget) && a.overallBudget > 0)
    || Object.values(a.categoryBudgets).some(amount => Number.isFinite(amount) && amount > 0);
  const [selectedViewMode, setViewMode] = useState<"amounts" | "income" | "budget">(
    "amounts",
  );
  const viewMode = selectedViewMode === "budget" && !hasConfiguredBudgets ? "amounts" : selectedViewMode;
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
        setPickerYear(Number(a.month.slice(0, 4)));
        setPanel("months");
      },
    });
    return () => registerHeading?.(null);
  }, [registerHeading, a.month]);
  const controls = useMemo<ExpandedControl[]>(
    () => [
      ...([
        ["amounts", "Amounts", "cash"], ["income", "Income use", "chart-donut"], ["budget", "Budgets", "wallet-outline"],
      ] as const).filter(([key]) => key !== "budget" || hasConfiguredBudgets).map(([key, label, icon]) => ({
        label, icon, group: "views", compact: true, selected: viewMode === key,
        accessibilityLabel: `View: ${label}`, onPress: () => setViewMode(key),
      })),
      ...(a.currencies.length > 1 ? [{ label: "Currency", icon: "currency-usd" as const, group: "views", compact: true,
        accessibilityLabel: `Currency: ${a.currency}`, onPress: () => setPanel("view") }] : []),
      { label: "Compare", icon: "compare-horizontal", group: "compare", compact: true,
        badgeIcon: compare ? "check" : undefined,
        accessibilityLabel: `Compare months. ${a.comparisonMonth ? monthLabel(a.comparisonMonth) : "Off"}`,
        onPress: () => setPanel("compare") },
    ],
    [viewMode, compare, a.comparisonMonth, a.currency, a.currencies.length, hasConfiguredBudgets],
  );
  useEffect(() => {
    registerControls?.(controls);
    return () => registerControls?.([]);
  }, [registerControls, controls]);
  const money = (value: number) => formatInsightAmount(value, a.currency);
  const hasEntries = a.data.current.length > 0;
  const hasYearEntries = a.data.year.months.some(
    (row) => row.incomeCount || row.expenseCount,
  );
  const showExpenses =
    a.data.hasSpending || (compare && a.data.hasPreviousSpending);
  const showIncomeCard =
    a.data.hasIncome || (compare && a.data.hasPreviousIncome);
  const hasBudget =
    a.canCompareBudget &&
    Number.isFinite(a.overallBudget) &&
    a.overallBudget > 0;
  const spendingComparison = a.data.hasSpending
    ? a.data.hasPreviousSpending
      ? amountChangeLabel(a.data.expense, a.data.previousExpense, money, comparisonPeriod)
      : `No spending recorded in ${comparisonPeriod}`
    : "No spending recorded";

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
      comparison: spendingComparison,
      comparisonDescription:
        a.data.hasSpending && a.data.hasPreviousSpending
          ? a.data.comparisonDescription
          : undefined,
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
      comparison: a.data.hasPreviousIncome
        ? amountChangeLabel(a.data.income, a.data.previousIncome, money, comparisonPeriod)
        : `No income recorded in ${comparisonPeriod}`,
      comparisonDescription: a.data.hasPreviousIncome
        ? a.data.comparisonDescription
        : undefined,
      transactions: a.data.current.filter((row) => row.type === "income"),
    });
  const showCategory = (group: Group, type: "income" | "expense") => {
    const hasPrevious =
      type === "expense"
        ? a.data.hasPreviousSpending
        : a.data.hasPreviousIncome;
    const recorded = type === "expense" ? "spending" : "income";
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
      comparison: !hasPrevious
        ? `No ${recorded} recorded in ${comparisonPeriod}.`
        : !group.count
          ? `${money(group.previous)} recorded in ${comparisonPeriod}. No entries in this category this month.`
          : !group.previousCount
            ? `No ${recorded} recorded in this category in ${comparisonPeriod}.`
            : group.amount === group.previous
              ? "Same amount"
              : `${money(Math.abs(group.amount - group.previous))} ${group.amount > group.previous ? "more" : "less"}`,
      comparisonDescription: hasPrevious
        ? `vs ${a.data.comparisonLabel}`
        : undefined,
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
  const overview = (
    <MoneyHero
      data={a.data}
      money={money}
      onIncome={expanded ? showIncome : () => requestTab("insights")}
      onSpending={expanded ? showSpending : () => requestTab("insights")}
    />
  );

  const panelContent =
    panel === "months" ? (
      <View style={{ gap: 20 }}>
        <View style={styles.row}>
          <IconButton
            icon="chevron-left"
            label="Previous year"
            onPress={() => setPickerYear(pickerYear - 1)}
            disabled={pickerYear <= 1}
          />
          <Text style={{ ...typography.bodyStrong, fontSize: 20 }}>
            {pickerYear}
          </Text>
          <IconButton
            icon="chevron-right"
            label="Next year"
            onPress={() => setPickerYear(pickerYear + 1)}
            disabled={pickerYear >= Number(a.currentMonth.slice(0, 4))}
          />
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {Array.from({ length: 12 }, (_, index) => {
            const month = `${String(pickerYear).padStart(4, "0")}-${String(index + 1).padStart(2, "0")}`;
            const selected = month === a.month;
            return (
              <MotionPressable
                key={month}
                onPress={() => selectMonth(month)}
                disabled={month > a.currentMonth}
                accessibilityRole="button"
                accessibilityLabel={monthLabel(month)}
                accessibilityState={{
                  selected,
                  disabled: month > a.currentMonth,
                }}
                style={{
                  flexBasis: "30%",
                  flexGrow: 1,
                  minHeight: 52,
                  padding: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 14,
                  backgroundColor: selected
                    ? theme.colors.primary
                    : theme.colors.elevation.level1,
                  opacity: month > a.currentMonth ? 0.35 : 1,
                }}
              >
                <Text
                  style={{
                    ...typography.bodyMedium,
                    fontSize: 14,
                    color: selected
                      ? theme.colors.onPrimary
                      : theme.colors.onSurface,
                  }}
                >
                  {new Date(`${month}-01T00:00:00`).toLocaleDateString(
                    undefined,
                    { month: "short" },
                  )}
                </Text>
              </MotionPressable>
            );
          })}
        </View>
        <TextAction
          label="Go to this month"
          onPress={() => selectMonth(a.currentMonth)}
        />
      </View>
    ) : null;

  const incomeComparison = !a.data.hasIncome
    ? "No income recorded"
    : a.data.hasPreviousIncome
      ? amountChangeLabel(a.data.income, a.data.previousIncome, money, comparisonPeriod)
      : `No income recorded in ${comparisonPeriod}`;
  const comparisonNote = a.data.comparisonDescription;
  const budgetNote =
    a.currency !== workspaceCurrency
      ? `Budgets are tracked in ${workspaceCurrency}.`
      : !a.canCompareBudget
        ? "Budgets apply to this month only."
        : "No budget set";
  const categoryRows = (type: "expense" | "income", showAll = false) => (
    <CategorySection
      key={a.month + a.currency + type + (showAll ? "all" : "preview")}
      type={type}
      groups={
        type === "expense" ? a.data.expenseCategories : a.data.incomeCategories
      }
      comparison={compare}
      comparisonPeriod={comparisonPeriod}
      incomeTotal={viewMode === "income" ? a.data.income : 0}
      budgets={
        type === "expense" && viewMode === "budget" && a.canCompareBudget
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
            <View style={{ gap: 12 }}>
              {compare ? (
                <ContextNote
                  label={`Comparing with ${comparisonPeriod}`}
                  description={comparisonNote}
                  icon="compare-horizontal"
                />
              ) : null}
              {browse === "expense" && viewMode === "budget" ? (
                hasBudget ? (
                  <BudgetProgress
                    budget={a.overallBudget}
                    spent={a.data.expense}
                    money={money}
                  />
                ) : (
                  <ContextNote label={budgetNote} icon="wallet-outline" />
                )
              ) : null}
              {browse === "income" &&
              viewMode === "income" &&
              a.data.hasIncome ? (
                <IncomeUsage data={a.data} money={money} />
              ) : null}
              {categoryRows(browse, true)}
            </View>
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
          paddingHorizontal: 20,
          paddingTop: 6,
          paddingBottom: tabBarHeight + bottom + 32,
        }}
      >
        <SpotlightTarget id="overview">{overview}</SpotlightTarget>
        {!hasEntries ? (
          <InsightsEmptyState
            expanded={expanded}
            hasOtherMonths={a.comparisonMonths.length > 0}
            onAdd={() => dispatch(openAddModal({ type: "expense", date: null }))}
            onChooseMonth={() => {
              setPickerYear(Number(a.comparisonMonths[0].slice(0, 4)));
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
                title="Expenses"
                icon="arrow-top-right"
                color={theme.semantic.expense}
                value={a.data.hasSpending ? money(a.data.expense) : undefined}
              >
                {compare &&
                (a.data.hasSpending || a.data.hasPreviousSpending) ? (
                  <ContextNote
                    label={spendingComparison}
                    description={comparisonNote}
                    icon="compare-horizontal"
                  />
                ) : null}
                {viewMode === "budget" ? (
                  hasBudget ? (
                    <BudgetProgress
                      budget={a.overallBudget}
                      spent={a.data.expense}
                      money={money}
                    />
                  ) : (
                    <ContextNote label={budgetNote} icon="wallet-outline" />
                  )
                ) : null}
                {categoryRows("expense")}
              </InsightCard>
            </>
          ) : null}
          {showIncomeCard ? (
            <>
              <InsightCard
                title="Income"
                icon="arrow-bottom-left"
                color={theme.semantic.income}
                value={a.data.hasIncome ? money(a.data.income) : undefined}
              >
                {compare && (a.data.hasIncome || a.data.hasPreviousIncome) ? (
                  <ContextNote
                    label={incomeComparison}
                    description={comparisonNote}
                    icon="compare-horizontal"
                  />
                ) : null}
                {viewMode === "income" && a.data.hasIncome ? (
                  <IncomeUsage data={a.data} money={money} />
                ) : null}
                {categoryRows("income")}
              </InsightCard>
            </>
          ) : null}
          {accounts.length ? (
            <InsightCard
              title="Payment accounts"
              icon="wallet-outline"
              color={theme.dark ? "#C4A7F5" : "#7950B5"}
            >
              <View>
                {accounts.map((account) => (
                  <MotionPressable
                    key={account.name}
                    accessibilityRole="button"
                    accessibilityLabel={`${account.name || "Unspecified account"}, ${money(account.expense)} spent. View entries.`}
                    onPress={() =>
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
                      })
                    }
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      minHeight: 44,
                      paddingVertical: 8,
                    }}
                  >
                    <CategoryIconBadge
                      icon={
                        getAccountIconName(
                          account.name,
                          accountIcons,
                        ) as React.ComponentProps<
                          typeof MaterialCommunityIcons
                        >["name"]
                      }
                      color={getAccountColor(account.name, accountColors)}
                    />
                    <Text
                      style={{
                        ...typography.bodyMedium,
                        fontSize: 14,
                        flex: 1,
                      }}
                    >
                      {account.name || "Unspecified account"}
                    </Text>
                    <Text style={{ ...typography.bodyMedium, fontSize: 14 }}>
                      {money(account.expense)}
                    </Text>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={16}
                      color={theme.colors.onSurfaceVariant}
                    />
                  </MotionPressable>
                ))}
              </View>
            </InsightCard>
          ) : null}
          {hasEntries ? (
            <InsightCard
              title="Daily activity"
              icon="calendar-blank-outline"
              color={theme.dark ? "#67C8E8" : "#087FA3"}
              headerAction={
                <View style={{ width: 176, maxWidth: "100%" }}>
                  <TypeToggle
                    value={activityType}
                    onChange={setActivityType}
                    mini
                    radius={22}
                    height={44}
                    trackBackgroundColor={theme.colors.elevation.level1}
                    borderWidth={0}
                  />
                </View>
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
                      setDetail({
                        title: new Date(
                          day.date + "T00:00:00",
                        ).toLocaleDateString(undefined, {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        }),
                        description: "Recorded entries",
                        metrics: [
                          { label: "Income", value: money(day.income) },
                          { label: "Spent", value: money(day.expense) },
                        ],
                        transactions: day.transactions,
                      })
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
              title={a.data.year.label + " at a glance"}
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
      <ControlsSheet
        displayTitle={panel === "compare"}
        visible={panel !== null}
        title={
          panel === "months"
            ? "Choose a month"
            : panel === "compare"
              ? "Compare"
              : "View"
        }
        onClose={closeSheet}
      >
        {panel === "months" ? (
          panelContent
        ) : panel === "compare" ? (
          <>
            <ControlOption
              label="Off"
              icon="minus"
              selected={!compare}
              onPress={() => {
                a.setComparisonMonth(null);
                closeSheet();
              }}
            />
            <ComparisonMonths months={a.comparisonMonths} selectedMonth={a.comparisonMonth}
              onSelect={month => { a.setComparisonMonth(month); closeSheet(); }} />
            {!a.comparisonMonths.length ? <ContextNote label="No other months to compare"
              description="Add entries in another month to compare. Only months with data in the selected currency appear here." /> : null}
            {compare ? <ContextNote label="Comparison period" description={comparisonNote} icon="compare-horizontal" /> : null}
          </>
        ) : (
          <>
            {(
              [
                ["amounts", "Amounts", "cash"],
                ["income", "Income use", "chart-donut"],
                ["budget", "Budgets", "wallet-outline"],
              ] as const
            ).filter(([key]) => key !== "budget" || hasConfiguredBudgets).map(([key, label, icon]) => (
              <ControlOption
                key={key}
                label={label}
                icon={icon}
                selected={viewMode === key}
                onPress={() => {
                  setViewMode(key);
                  closeSheet();
                }}
              />
            ))}
            {a.currencies.length > 1 ? (
              <View style={{ gap: 10, paddingTop: 12 }}>
                <Muted>Currency</Muted>
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
              </View>
            ) : null}
          </>
        )}
      </ControlsSheet>
    </View>
  );
}

function IconButton({
  icon,
  label,
  onPress,
  disabled = false,
}: {
  icon: "chevron-left" | "chevron-right";
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <MotionPressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={{
        minWidth: 44,
        minHeight: 44,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.3 : 1,
      }}
    >
      <MaterialCommunityIcons
        name={icon}
        size={22}
        color={theme.colors.onSurface}
      />
    </MotionPressable>
  );
}
