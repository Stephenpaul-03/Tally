import React, { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useExpandedControls, useInsightsHeading, type ExpandedControl } from "@/components/ExpandedControlsContext";
import { useInsightsExpansion } from "@/components/InsightsExpansionContext";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { useAppShell } from "@/components/AppShellContext";
import { useTabBarHeight } from "@/components/tabbar/TabBarContext";
import { useAppDispatch, useAppSelector } from "@/hooks/Redux";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import { openViewModal } from "@/modules/Core/Slices/TransactionSlice";
import { typography } from "@/theme/typography";
import { useInsights } from "./hooks/useInsights";
import { amountChangeLabel, calculateInsights, monthLabel, shiftMonth, type Group } from "./calculations";
import { formatInsightAmount } from "./Utils";
import { BudgetProgress, Chip, Disclosure, Muted, styles, TextAction } from "./components/Primitives";
import { MotionPressable } from "./components/Motion";
import { CategorySection } from "./components/CategorySection";
import { IncomeUsage, InsightCard, MoneyHero } from "./components/Overview";
import { ActivityHeatmap, YearOverview } from "./charts/Charts";
import { DetailsSheet, type Detail } from "./sheets/DetailsSheet";
import { ControlsSheet, ControlOption } from "./sheets/ControlsSheet";
import { CardEmptyState } from "./components/CardEmptyState";

type Panel = "months" | "view" | "compare";

export function InsightsScreen() {
  const workspace = useAppSelector(selectActiveWorkspace);
  if (!workspace) return null;
  return <WorkspaceInsights key={workspace.id} workspaceCurrency={workspace.currencyCode} />;
}

function WorkspaceInsights({ workspaceCurrency }: { workspaceCurrency: string }) {
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
    opacity: expansion ? interpolate(expansion.value, [0, 0.65], [0, 1], "clamp") : expanded ? 1 : 0,
  }));
  const scroll = useRef<ScrollView>(null);
  useEffect(() => {
    if (!expanded) scroll.current?.scrollTo({ y: 0, animated: true });
  }, [expanded]);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [pickerYear, setPickerYear] = useState(Number(a.month.slice(0, 4)));
  const [compare, setCompare] = useState(false);
  const [viewMode, setViewMode] = useState<"amounts" | "income" | "budget">("amounts");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [activityType, setActivityType] = useState<"income" | "expense">("expense");
  const [detail, setDetail] = useState<Detail | null>(null);
  const registerControls = useExpandedControls();
  const registerHeading = useInsightsHeading();
  useEffect(() => {
    registerHeading?.({ label: monthLabel(a.month), onPress: () => {
      setPickerYear(Number(a.month.slice(0, 4))); setPanel("months");
    } });
    return () => registerHeading?.(null);
  }, [registerHeading, a.month]);
  const controls = useMemo<ExpandedControl[]>(() => [
    { label: "View", icon: "tune-variant", badgeIcon: viewMode !== "amounts" ? "check" : undefined,
      accessibilityLabel: `View options. ${viewMode === "amounts" ? "Amounts" : viewMode === "income" ? "Income use" : "Budgets"}`,
      onPress: () => setPanel("view") },
    { label: "Compare", icon: "compare-horizontal", badgeIcon: compare ? "check" : undefined,
      accessibilityLabel: `Comparison options. ${compare ? "Last month" : "Off"}`, onPress: () => setPanel("compare") },
  ], [viewMode, compare]);
  useEffect(() => {
    registerControls?.(controls);
    return () => registerControls?.([]);
  }, [registerControls, controls]);
  const money = (value: number) => formatInsightAmount(value, a.currency);
  const hasEntries = a.data.current.length > 0;
  const hasYearEntries = a.data.year.months.some(row => row.incomeCount || row.expenseCount);
  const showExpenses = a.data.hasSpending || compare && a.data.hasPreviousSpending;
  const showIncomeCard = a.data.hasIncome || compare && a.data.hasPreviousIncome;
  const hasBudget = a.canCompareBudget && Number.isFinite(a.overallBudget) && a.overallBudget > 0;
  const spendingComparison = a.data.hasSpending
    ? a.data.hasPreviousSpending ? amountChangeLabel(a.data.expense, a.data.previousExpense, money)
      : "No earlier spending to compare"
    : "No spending recorded";

  const closeSheet = () => { setDetail(null); setPanel(null); };
  const selectMonth = (month: string) => {
    closeSheet(); a.setMonth(month); scroll.current?.scrollTo({ y: 0, animated: false });
  };
  const showSpending = () => setDetail({
    title: "Monthly spending", description: a.data.periodLabel,
    summary: { label: "Spending recorded", value: money(a.data.expense) },
    comparison: spendingComparison,
    comparisonDescription: a.data.hasSpending && a.data.hasPreviousSpending ? a.data.comparisonDescription : undefined,
    budget: hasBudget ? { amount: a.overallBudget, spent: a.data.expense } : undefined,
    transactions: a.data.current.filter(row => row.type === "expense"),
  });
  const showIncome = () => setDetail({
    title: "Monthly income", description: a.data.periodLabel,
    summary: { label: "Income recorded", value: money(a.data.income) },
    comparison: a.data.hasPreviousIncome ? amountChangeLabel(a.data.income, a.data.previousIncome, money)
      : "No earlier income recorded for comparison.",
    comparisonDescription: a.data.hasPreviousIncome ? a.data.comparisonDescription : undefined,
    transactions: a.data.current.filter(row => row.type === "income"),
  });
  const showCategory = (group: Group, type: "income" | "expense") => {
    const hasPrevious = type === "expense" ? a.data.hasPreviousSpending : a.data.hasPreviousIncome;
    const recorded = type === "expense" ? "spending" : "income";
    const budget = type === "expense" && a.canCompareBudget ? a.categoryBudgets[group.name] : undefined;
    const trend = type === "expense" ? calculateInsights(
      a.transactions.filter(row => row.category === group.name && row.type === type),
      a.month, a.currency, workspaceCurrency, a.matchedDays,
    ).trend : undefined;
    setDetail({
      title: group.name, description: a.data.periodLabel,
      summary: { label: type === "expense" ? "Spending recorded" : "Income recorded", value: money(group.amount) },
      comparison: !hasPrevious ? `No earlier ${recorded} recorded for comparison.`
        : !group.count ? `${money(group.previous)} recorded last month. No entries in this category this month.`
        : !group.previousCount ? `No ${recorded} recorded in this category last month.`
        : amountChangeLabel(group.amount, group.previous, money),
      comparisonDescription: hasPrevious ? a.data.comparisonDescription : undefined,
      budget: budget !== undefined && Number.isFinite(budget) && budget > 0 ? { amount: budget, spent: group.amount } : undefined,
      transactions: group.transactions, trend,
    });
  };
  const accounts = a.data.accounts.filter(account => account.transactions.some(row => row.type === "expense"))
    .sort((left, right) => right.expense - left.expense || left.name.localeCompare(right.name));
  const overview = <MoneyHero data={a.data} money={money}
    onIncome={expanded ? showIncome : () => requestTab("insights")}
    onSpending={expanded ? showSpending : () => requestTab("insights")} />;

  const panelContent = panel === "months" ? <View style={{ gap: 20 }}>
    <View style={styles.row}>
      <IconButton icon="chevron-left" label="Previous year" onPress={() => setPickerYear(pickerYear - 1)} disabled={pickerYear <= 1} />
      <Text style={{ ...typography.bodyStrong, fontSize: 20 }}>{pickerYear}</Text>
      <IconButton icon="chevron-right" label="Next year" onPress={() => setPickerYear(pickerYear + 1)} disabled={pickerYear >= Number(a.currentMonth.slice(0, 4))} />
    </View>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {Array.from({ length: 12 }, (_, index) => {
        const month = `${String(pickerYear).padStart(4, "0")}-${String(index + 1).padStart(2, "0")}`;
        const selected = month === a.month;
        return <MotionPressable key={month} onPress={() => selectMonth(month)} disabled={month > a.currentMonth}
          accessibilityRole="button" accessibilityLabel={monthLabel(month)} accessibilityState={{ selected, disabled: month > a.currentMonth }}
          style={{ flexBasis: "30%", flexGrow: 1, minHeight: 52, padding: 10, alignItems: "center", justifyContent: "center", borderRadius: 14,
            backgroundColor: selected ? theme.colors.primary : theme.colors.elevation.level1, opacity: month > a.currentMonth ? 0.35 : 1 }}>
          <Text style={{ ...typography.bodyMedium, fontSize: 14, color: selected ? theme.colors.onPrimary : theme.colors.onSurface }}>
            {new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, { month: "short" })}
          </Text>
        </MotionPressable>;
      })}
    </View>
    <TextAction label="Go to this month" onPress={() => selectMonth(a.currentMonth)} />
  </View> : null;
  const details = <DetailsSheet detail={detail} onClose={closeSheet} money={money}
    onTransaction={id => { closeSheet(); dispatch(openViewModal(id)); }} />;

  const incomeComparison = !a.data.hasIncome ? "No income recorded" : a.data.hasPreviousIncome
    ? amountChangeLabel(a.data.income, a.data.previousIncome, money) : "No income recorded last month to compare";
  const comparisonNote = a.data.periodCaption === "Full month" ? `Compared with ${monthLabel(shiftMonth(a.month, -1))}`
    : `Comparing the same days · ${a.data.periodCaption.toLowerCase()}`;
  const budgetNote = a.currency !== workspaceCurrency ? `Budgets are tracked in ${workspaceCurrency}.`
    : !a.canCompareBudget ? "Budgets apply to this month only." : "No budget set";
  return <View style={{ flex: 1, minHeight: 0 }}>
    <ScrollView ref={scroll} scrollEnabled={expanded} showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: tabBarHeight + bottom + 32 }}>
      {hasEntries ? overview : <View style={{ paddingVertical: 12 }}>
        <CardEmptyState message={hasYearEntries ? "Nothing tallied this month" : "Your tally starts here"}
          description={hasYearEntries ? "Choose another month to revisit your entries." : "Income, spending, and patterns will appear as you tally."}
          icon={hasYearEntries ? "calendar-search" : "notebook-outline"} />
      </View>}
      <Animated.View pointerEvents={expanded ? "auto" : "none"} accessibilityElementsHidden={!expanded}
        importantForAccessibility={expanded ? "auto" : "no-hide-descendants"} style={[{ gap: 12, paddingTop: 14 }, bodyMotion]}>
        {compare ? <Text style={[local.caption, { color: theme.colors.onSurfaceVariant }]}>{comparisonNote}</Text> : null}
        {showExpenses ? <>
        <InsightCard title="Expenses" icon="arrow-top-right" color={theme.semantic.expense} value={a.data.hasSpending ? money(a.data.expense) : undefined}>
          {compare && (a.data.hasSpending || a.data.hasPreviousSpending) ? <Muted>{spendingComparison}</Muted> : null}
          {viewMode === "budget" ? hasBudget ? <BudgetProgress budget={a.overallBudget} spent={a.data.expense} money={money} /> : <Muted>{budgetNote}</Muted> : null}
          <CategorySection key={a.month + a.currency + "expense"} type="expense" groups={a.data.expenseCategories} comparison={compare}
            incomeTotal={viewMode === "income" ? a.data.income : 0}
            budgets={viewMode === "budget" && a.canCompareBudget ? a.categoryBudgets : undefined}
            money={money} icons={a.icons} colors={a.colors} onSelect={group => showCategory(group, "expense")} />
        </InsightCard>
        </> : null}
        {showIncomeCard ? <>
        <InsightCard title="Income" icon="arrow-bottom-left" color={theme.semantic.income} value={a.data.hasIncome ? money(a.data.income) : undefined}>
          {compare && (a.data.hasIncome || a.data.hasPreviousIncome) ? <Muted>{incomeComparison}</Muted> : null}
          {viewMode === "income" && a.data.hasIncome ? <IncomeUsage data={a.data} money={money} /> : null}
          <CategorySection key={a.month + a.currency + "income"} type="income" groups={a.data.incomeCategories} comparison={compare}
            incomeTotal={viewMode === "income" ? a.data.income : 0}
            money={money} icons={a.icons} colors={a.colors} onSelect={group => showCategory(group, "income")} />
        </InsightCard>
        </> : null}
        {hasEntries ? <InsightCard title="Month activity" icon="calendar-blank-outline" value={`${a.data.current.length} entries`}>
          <>
          <Disclosure label="Daily activity" open={calendarOpen} onPress={() => setCalendarOpen(!calendarOpen)} />
          {calendarOpen ? <View style={{ gap: 12 }}>
            <View style={styles.chips}>
              <Chip label="Spending" selected={activityType === "expense"} onPress={() => setActivityType("expense")} />
              <Chip label="Income" selected={activityType === "income"} onPress={() => setActivityType("income")} />
            </View>
            {(activityType === "expense" ? a.data.hasSpending : a.data.hasIncome) ? <ActivityHeatmap days={a.data.days} type={activityType} money={money} onDay={day => setDetail({
              title: new Date(day.date + "T00:00:00").toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }),
              description: "Recorded entries",
              metrics: [{ label: "Income", value: money(day.income) }, { label: "Spent", value: money(day.expense) }],
              transactions: day.transactions,
            })} /> : <CardEmptyState icon={activityType === "expense" ? "basket-outline" : "cash-plus"}
              message={activityType === "expense" ? "No spending days to show" : "No income days to show"}
              description={activityType === "expense" ? "Switch to income to see when money came in." : "Switch to spending to see where money went."} />}
          </View> : null}
          {accounts.length ? <>
            <Disclosure label="Payment accounts" open={accountsOpen} onPress={() => setAccountsOpen(!accountsOpen)} />
            {accountsOpen ? accounts.map(account => <MotionPressable key={account.name} accessibilityRole="button"
              accessibilityLabel={`${account.name || "Unspecified account"}, ${money(account.expense)} spent. View entries.`}
              onPress={() => setDetail({ title: account.name || "Unspecified account", description: a.data.periodLabel,
                summary: { label: "Spent", value: money(account.expense) },
                transactions: account.transactions.filter(row => row.type === "expense") })}
              style={[styles.row, { minHeight: 44, paddingVertical: 8 }]}>
              <MaterialCommunityIcons name="wallet-outline" size={18} color={theme.colors.primary} />
              <Text style={{ ...typography.body, fontSize: 14, flex: 1 }}>{account.name || "Unspecified account"}</Text>
              <Text style={{ ...typography.bodyMedium, fontSize: 14 }}>{money(account.expense)}</Text>
            </MotionPressable>) : null}
          </> : null}
          </>
        </InsightCard> : null}
        {hasYearEntries ? <InsightCard title={a.data.year.label + " at a glance"} icon="chart-bar">
          <YearOverview year={a.data.year} selectedMonth={a.month} money={money} onMonth={selectMonth} />
        </InsightCard> : null}
        {a.data.hasIncome && a.data.hasSpending ? <Text style={[local.caption, { color: theme.colors.onSurfaceVariant, textAlign: "center" }]}>Balance = recorded income − spending</Text> : null}
      </Animated.View>
    </ScrollView>
    {details}
    <ControlsSheet visible={panel !== null} title={panel === "months" ? "Choose a month" : panel === "compare" ? "Compare" : "View"} onClose={closeSheet}>
      {panel === "months" ? panelContent : panel === "compare" ? <>
        <ControlOption label="Off" icon="minus" selected={!compare} onPress={() => { setCompare(false); closeSheet(); }} />
        <ControlOption label="Last month" icon="compare-horizontal" selected={compare} onPress={() => { setCompare(true); closeSheet(); }} />
        <Muted>{comparisonNote}</Muted>
      </> : <>
        {([
          ["amounts", "Amounts", "cash"], ["income", "Income use", "chart-donut"], ["budget", "Budgets", "wallet-outline"],
        ] as const).map(([key, label, icon]) => <ControlOption key={key} label={label} icon={icon} selected={viewMode === key}
          onPress={() => { setViewMode(key); closeSheet(); }} />)}
        {a.currencies.length > 1 ? <View style={{ gap: 10, paddingTop: 12 }}>
          <Muted>Currency</Muted>
          <View style={styles.chips}>{a.currencies.map(code => <Chip key={code} label={code} selected={a.currency === code}
            onPress={() => a.setCurrency(code)} />)}</View>
        </View> : null}
      </>}
    </ControlsSheet>
  </View>;
}

function IconButton({ icon, label, onPress, disabled = false }: {
  icon: "chevron-left" | "chevron-right"; label: string; onPress: () => void; disabled?: boolean;
}) {
  const theme = useTheme();
  return <MotionPressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label}
    accessibilityState={{ disabled }} style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center", opacity: disabled ? 0.3 : 1 }}>
    <MaterialCommunityIcons name={icon} size={22} color={theme.colors.onSurface} />
  </MotionPressable>;
}
const local = StyleSheet.create({
  caption: { ...typography.body, fontSize: 13, lineHeight: 19 },
});
