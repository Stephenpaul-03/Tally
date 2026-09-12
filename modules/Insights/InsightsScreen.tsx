import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppShell } from "@/components/AppShellContext";
import { useAppDispatch, useAppSelector } from "@/hooks/Redux";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import { openViewModal } from "@/modules/Core/Slices/TransactionSlice";
import { typography } from "@/theme/typography";
import { useInsights } from "./hooks/useInsights";
import { calculateInsights, changeLabel, monthKey, monthLabel, shiftMonth, type Group } from "./calculations";
import { formatAmount } from "./Utils";
import { Chip, Muted, Section, styles } from "./components/Primitives";
import { CategorySection } from "./components/CategorySection";
import { ActivityHeatmap, CashFlowChart } from "./charts/Charts";
import { DetailsSheet, type Detail } from "./sheets/DetailsSheet";
import { SampleDataButton } from "./components/SampleDataButton";

export function InsightsScreen() {
  const workspace = useAppSelector(selectActiveWorkspace);
  if (!workspace) return null;
  return <WorkspaceInsights key={workspace.id} workspaceCurrency={workspace.currencyCode} />;
}
function WorkspaceInsights({ workspaceCurrency }: { workspaceCurrency: string }) {
  const { activeTab, requestTab } = useAppShell();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const expanded = activeTab === "insights";
  const a = useInsights(workspaceCurrency);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityType, setActivityType] = useState<"income" | "expense">("expense");
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [detail, setDetail] = useState<Detail | null>(null);
  const money = (value: number) => formatAmount(value, a.currency);
  const net = a.data.income - a.data.expense;
  const oldNet = a.data.previousIncome - a.data.previousExpense;
  const hasBudget = a.canCompareBudget && a.overallBudget > 0;
  const remaining = a.overallBudget - a.data.expense;
  const comparison = (current: number, previous: number) => [
    { label: "This month", value: money(current) },
    { label: "Last month", value: money(previous) },
    { label: "Difference", value: money(current - previous) },
    { label: "Change", value: changeLabel(current, previous).replace(" vs previous period", "") },
  ];
  const showOverview = () => setDetail({
    title: "Your month",
    description: "Compared with " + a.data.comparisonLabel,
    metrics: [
      ...comparison(net, oldNet),
      { label: "Money in", value: money(a.data.income) },
      { label: "Money out", value: money(a.data.expense) },
      ...(hasBudget ? [{ label: "Budget", value: money(a.overallBudget) },
        { label: remaining < 0 ? "Over budget" : "Budget left", value: money(Math.abs(remaining)) }] : []),
    ],
    transactions: a.data.current,
  });
  const overview = <View style={{ padding: 22, borderRadius: 28, gap: 18, backgroundColor: theme.colors.elevation.level1 }}>
    <Pressable onPress={expanded ? showOverview : () => requestTab("insights")}
      accessibilityRole="button" accessibilityLabel="Money left this month. View details."
      style={{ gap: 7, minHeight: 80 }}>
      <View style={styles.row}>
        <Muted>{net < 0 ? "Spent more than earned" : "Left this month"}</Muted>
        <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.onSurfaceVariant} />
      </View>
      <Text style={{ ...typography.bodyBold, fontSize: 38 }}>{money(Math.abs(net))}</Text>
    </Pressable>
    <View style={{ flexDirection: "row", gap: 20 }}>
      {([{ label: "↓ Money in", amount: a.data.income, previous: a.data.previousIncome, type: "income" },
        { label: "↑ Money out", amount: a.data.expense, previous: a.data.previousExpense, type: "expense" }] as const).map(item =>
        <Pressable key={item.type} style={{ flex: 1, minHeight: 54, gap: 7 }} accessibilityRole="button"
          accessibilityLabel={item.label + ". View comparison."}
          onPress={() => setDetail({ title: item.type === "income" ? "Money in" : "Money out",
            description: "Compared with " + a.data.comparisonLabel,
            metrics: comparison(item.amount, item.previous),
            transactions: a.data.current.filter(row => row.type === item.type) })}>
          <Muted>{item.label}</Muted><Text style={styles.value}>{money(item.amount)}</Text>
        </Pressable>)}
    </View>
    {expanded && hasBudget ? <Pressable onPress={showOverview} accessibilityRole="button" accessibilityLabel="View budget details" style={{ gap: 10, paddingTop: 5 }}>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: theme.colors.elevation.level3 }}>
        <View style={{ height: 6, borderRadius: 3, width: `${Math.min(100, a.data.expense / a.overallBudget * 100)}%`,
          backgroundColor: remaining < 0 ? theme.colors.error : theme.colors.primary }} />
      </View>
      <Muted>{money(Math.abs(remaining))} {remaining < 0 ? "over budget" : "of your budget left"}</Muted>
    </Pressable> : null}
  </View>;

  const showCategory = (group: Group, type: "income" | "expense") => {
    const trend = calculateInsights(a.transactions.filter(row => row.category === group.name && row.type === type),
      a.month, a.currency, workspaceCurrency, a.matchedDays).trend;
    const budget = type === "expense" && a.canCompareBudget ? a.categoryBudgets[group.name] : undefined;
    setDetail({ title: group.name, transactions: group.transactions, trend,
      description: "Compared with " + a.data.comparisonLabel,
      metrics: [...comparison(group.amount, group.previous),
        { label: "Share of " + (type === "income" ? "income" : "spending"), value: (group.share * 100).toFixed(0) + "%" },
        { label: "Transactions", value: String(group.count) },
        { label: "Average", value: money(group.count ? group.amount / group.count : 0) },
        ...(budget ? [{ label: "Budget", value: money(budget) },
          { label: group.amount > budget ? "Over budget" : "Budget left", value: money(Math.abs(budget - group.amount)) }] : [])],
    });
  };
  const disclosure = (label: string, open: boolean, toggle: () => void) =>
    <Pressable onPress={toggle} accessibilityRole="button" accessibilityState={{ expanded: open }}
      style={[styles.row, { minHeight: 60, borderTopWidth: 0.5, borderTopColor: theme.colors.outlineVariant }]}>
      <Text style={styles.title}>{label}</Text>
      <MaterialCommunityIcons name={open ? "chevron-up" : "chevron-down"} size={24} color={theme.colors.onSurfaceVariant} />
    </Pressable>;
  const details = <DetailsSheet detail={detail} onClose={() => setDetail(null)} money={money}
    onTransaction={id => { setDetail(null); dispatch(openViewModal(id)); }} />;
  if (!expanded) return <View style={{ paddingHorizontal: 20 }}>{overview}{details}</View>;

  return <View style={{ flex: 1, minHeight: 0 }}>
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110, gap: 12 }}>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous month"
          style={{ padding: 12, minHeight: 48, minWidth: 48 }} onPress={() => a.setMonth(shiftMonth(a.month, -1))}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={theme.colors.onSurface} />
        </Pressable>
        <Text style={{ ...typography.bodyStrong, fontSize: 18, flex: 1, textAlign: "center" }}>{monthLabel(a.month)}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Next month"
          accessibilityState={{ disabled: a.month >= monthKey(new Date()) }} disabled={a.month >= monthKey(new Date())}
          style={{ padding: 12, minHeight: 48, minWidth: 48, opacity: a.month >= monthKey(new Date()) ? 0.25 : 1 }}
          onPress={() => a.setMonth(shiftMonth(a.month, 1))}>
          <MaterialCommunityIcons name="chevron-right" size={26} color={theme.colors.onSurface} />
        </Pressable>
      </View>
      {a.currencies.length > 1 ? <View style={styles.chips}>{a.currencies.map(code =>
        <Chip key={code} label={code} selected={a.currency === code} onPress={() => a.setCurrency(code)} />)}</View> : null}
      {overview}
      {__DEV__ ? <SampleDataButton /> : null}
      <CategorySection key={"expense" + a.month} title="Where your money went" type="expense" groups={a.data.expenseCategories}
        budgets={a.canCompareBudget ? a.categoryBudgets : null} money={money} icons={a.icons} colors={a.colors}
        onSelect={group => showCategory(group, "expense")} />
      <CategorySection key={"income" + a.month} title="Where it came from" type="income" groups={a.data.incomeCategories}
        budgets={null} money={money} icons={a.icons} colors={a.colors} onSelect={group => showCategory(group, "income")} />
      <Section title="Over the months"><CashFlowChart trend={a.data.trend} money={money} /></Section>
      {disclosure("Spending by day", activityOpen, () => setActivityOpen(!activityOpen))}
      {activityOpen ? <View style={{ gap: 12 }}>
        <View style={styles.chips}>
          <Chip label="Money out" selected={activityType === "expense"} onPress={() => setActivityType("expense")} />
          <Chip label="Money in" selected={activityType === "income"} onPress={() => setActivityType("income")} />
        </View>
        <ActivityHeatmap days={a.data.days} type={activityType} onDay={day => setDetail({
          title: new Date(day.date + "T00:00:00").toLocaleDateString(undefined, { month: "long", day: "numeric" }),
          description: "", metrics: [{ label: "Money in", value: money(day.income) }, { label: "Money out", value: money(day.expense) }],
          transactions: day.transactions,
        })} /></View> : null}
      {disclosure("Your accounts", accountsOpen, () => setAccountsOpen(!accountsOpen))}
      {accountsOpen ? a.data.accounts.length ? a.data.accounts.map(account =>
        <Pressable key={account.name} style={[styles.row, { minHeight: 60 }]} accessibilityRole="button"
          onPress={() => setDetail({ title: account.name, description: "Compared with " + a.data.comparisonLabel,
            metrics: [{ label: "Money in", value: money(account.income) }, { label: "Money out", value: money(account.expense) },
              { label: "Last month in", value: money(account.previousIncome) }, { label: "Last month out", value: money(account.previousExpense) },
              { label: "Left", value: money(account.income - account.expense) }],
            transactions: account.transactions })}>
          <Text style={{ fontSize: 17, flex: 1 }}>{account.name}</Text>
          <View style={{ alignItems: "flex-end" }}><Text style={styles.value}>{money(account.expense)}</Text><Muted>Spent</Muted></View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.onSurfaceVariant} />
        </Pressable>) : <Muted>No account activity yet.</Muted> : null}
    </ScrollView>
    {details}
  </View>;
}
