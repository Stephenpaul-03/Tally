import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DesignText as Text } from "@/components/DesignText";
import { useAppShell } from "@/components/AppShellContext";
import { useAppSelector } from "@/hooks/Redux";
import { useTabletLandscape } from "@/hooks/use-tablet-landscape";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import { selectActiveAccounts, selectAccountIcons, selectAccountColors } from "@/modules/Core/Slices/TransactionSlice";
import { TransactionRow } from "@/modules/Management/Transaction/Components/TransactionRow";
import { useGoals } from "@/modules/Goals/store";
import { goalProgress } from "@/modules/Goals/model";
import { useRecurring } from "@/modules/Recurring/useRecurring";
import { RecurringActions, type RecurringSelection } from "@/modules/Recurring/RecurringActions";
import { localDate } from "@/modules/Recurring/model";
import { DetailsSheet, type Detail } from "@/modules/Insights/sheets/DetailsSheet";
import { monthLabel } from "@/modules/Insights/calculations";
import type { Transaction } from "@/utils/Types";
import type { RootParamList } from "@/navigation/types";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { typography } from "@/theme/typography";
import { homeOverview } from "./homeOverview";
import { ledgerMoney } from "./presentation";
import { HomeWelcome } from "./HomeWelcome";
import { HomeDraftAction } from "./HomeDraftAction";
import { MonthPickerSheet } from "./MonthPickerSheet";
import { TabletCard, TabletMetrics, TabletWorkspaceButton } from "./TabletDashboard";
import { getAccountIconName, getAccountColor } from "@/utils/Helpers";
import { categoryTone } from "@/theme/sage";
import { tabletHomeData } from "./tabletHomeData";

export function TabletHomePage({ active, raw, month, currency, symbol, onMonth, onEdit }: {
  active: boolean; raw: Transaction[]; month: string; currency: string; symbol: string;
  onMonth: (month: string) => void; onEdit: (id: string) => void;
}) {
  const theme = useTheme<ExtendedMD3Theme>(), c = theme.colors;
  const landscape = useTabletLandscape(), { bottom } = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const shell = useAppShell();
  const workspace = useAppSelector(selectActiveWorkspace);
  const accountNames = useAppSelector(selectActiveAccounts);
  const accountIcons = useAppSelector(selectAccountIcons);
  const accountColors = useAppSelector(selectAccountColors);
  const { goals, error: goalError } = useGoals(workspace?.id || "personal");
  const recurring = useRecurring(workspace?.id || "", active);
  const [selection, setSelection] = React.useState<RecurringSelection | null>(null);
  const [detail, setDetail] = React.useState<Detail | null>(null);
  const [picker, setPicker] = React.useState(false);
  const model = React.useMemo(() => homeOverview(raw, month, currency), [raw, month, currency]);
  const today = localDate();
  const { posted, recent, accounts } = React.useMemo(() => tabletHomeData(raw, month, currency, today, accountNames), [raw, month, currency, today, accountNames]);
  const money = (value: number) => ledgerMoney(value, currency, symbol);
  const showType = (type: "income" | "expense") => setDetail({ title: type === "income" ? "Income" : "Spent",
    description: monthLabel(month), transactions: posted.filter(row => row.type === type),
    summary: { label: type === "income" ? "Income" : "Spent", value: money(type === "income" ? model.income : model.spent) } });
  const goal = goals.find(item => !goalProgress(item).complete) ?? goals[0];
  const progress = goal ? goalProgress(goal) : null;
  const upcoming = recurring.templates.filter(item => !item.paused && !item.deleted).map(template => ({ template,
    occurrence: recurring.actionable.filter(item => item.templateId === template.id).sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] }))
    .sort((a, b) => (a.occurrence?.dueDate || a.template.nextDate).localeCompare(b.occurrence?.dueDate || b.template.nextDate)).slice(0, 3);
  const empty = (message: string) => <Text style={{ fontSize: 13, lineHeight: 20, color: c.onSurfaceVariant, paddingVertical: 8 }}>{message}</Text>;
  const upcomingCard = upcoming.length > 0 ? <TabletCard title="Upcoming" onAction={() => navigation.navigate("Settings", { section: "recurring" })}>
    {recurring.error ? empty("Upcoming payments could not be loaded. Open recurring to retry.") : !upcoming.length ? empty(recurring.loading ? "Loading upcoming payments…" : "No upcoming payments. Add a recurring transaction to see it here.") : upcoming.map(({ template, occurrence }) =>
      <Pressable key={template.id} accessibilityRole="button" accessibilityLabel={`View ${template.form.title}`}
        onPress={() => occurrence ? setSelection({ template, occurrence }) : navigation.navigate("Settings", { section: "recurring" })}
        style={{ minHeight: 56, flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Icon name="calendar-refresh-outline" size={22} color={c.primary} />
        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
          <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "600", color: c.onSurface }}>{template.form.title}</Text>
          <Text style={{ fontSize: 11, color: c.onSurfaceVariant }}>{occurrence?.dueDate || template.nextDate} · {template.form.account}</Text>
        </View>
        <Text style={{ fontSize: 13, fontWeight: "700", color: c.onSurface }}>{ledgerMoney(template.form.amount, template.form.currencyCode || currency, template.form.currencySymbol)}</Text>
      </Pressable>)}
  </TabletCard> : null;
  const goalCard = goal ? <TabletCard title="Goals" action={goal ? "View all" : "Create"} onAction={() => navigation.navigate("Settings", { section: "goals" })}>
    {goalError ? empty("Goals could not be loaded. Open goals to retry.") : goal && progress ? <Pressable accessibilityRole="button" accessibilityLabel={`View ${goal.name}`}
      onPress={() => navigation.navigate("Settings", { section: "goals" })} style={{ minHeight: 64, gap: 10 }}>
      <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
        <Icon name={goal.icon as React.ComponentProps<typeof Icon>["name"]} size={24} color={c.primary} />
        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
          <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "700", color: c.onSurface }}>{goal.name}</Text>
          <Text style={{ fontSize: 12, color: c.onSurfaceVariant }}>{ledgerMoney(goal.saved, goal.currencyCode, goal.currencySymbol)} / {ledgerMoney(goal.target, goal.currencyCode, goal.currencySymbol)}</Text>
        </View>
        <Text style={{ fontSize: 12, color: c.onSurfaceVariant }}>{Math.round(progress.fraction * 100)}%</Text>
      </View>
      <View style={{ height: 6, borderRadius: 3, overflow: "hidden", backgroundColor: c.surfaceVariant }}>
        <View style={{ width: `${Math.min(100, Math.max(0, progress.fraction * 100))}%`, height: 6, backgroundColor: c.primary }} />
      </View>
    </Pressable> : empty("Set a savings goal and follow your progress here.")}
  </TabletCard> : null;
  const recentCard = <TabletCard title="Recent transactions" onAction={() => shell.requestTab("calendar")}>
    {recent.length ? recent.map((row, index) => <TransactionRow key={row.id} transaction={row} onPressTransaction={onEdit}
      compact grouped groupPosition={index === recent.length - 1 ? "last" : "middle"} secondaryLabelMode="date" />) : empty("No transactions recorded for this month.")}
  </TabletCard>;
  return <View style={{ flex: 1 }}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, gap: 16, paddingBottom: (landscape ? 24 : 112) + bottom }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text accessibilityRole="header" style={{ ...(theme.expressive ? { fontSize: 28, fontWeight: "800" } as const : typography.editorial.hero), color: c.onSurface }}>{theme.expressive ? "tally" : "TALLY"}</Text>
          <HomeWelcome active={active} hour={new Date().getHours()} compact />
        </View>
        <TabletWorkspaceButton />
        <Pressable accessibilityRole="button" accessibilityLabel="Choose Home month" onPress={() => setPicker(true)} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 12, borderRadius: 22, backgroundColor: c.surface }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ fontSize: 13, color: c.onSurface }}>{new Date(`${month}-01T12:00:00`).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</Text>
            <Icon name="chevron-down" size={18} color={c.onSurfaceVariant} />
          </View>
        </Pressable>
        <HomeDraftAction active={active} currency={currency} symbol={symbol} />
        {!landscape ? <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => navigation.navigate("Settings")} style={{ padding: 10, minHeight: 44 }}><Icon name="cog-outline" size={22} color={c.onSurface} /></Pressable> : null}
      </View>
      <TabletMetrics income={model.income} spent={model.spent} balance={model.left} money={money} onIncome={() => showType("income")} onSpent={() => showType("expense")} />
      {landscape ? <View style={{ flexDirection: "row", gap: 18, alignItems: "flex-start" }}>
        <View style={{ flex: 1.6, minWidth: 0 }}>{recentCard}</View>
        {upcomingCard || goalCard ? <View style={{ flex: 1, minWidth: 0, gap: 18 }}>{upcomingCard}{goalCard}</View> : null}
      </View> : <>
        {upcomingCard || goalCard ? <View style={{ flexDirection: "row", gap: 16 }}>{upcomingCard ? <View style={{ flex: 1, minWidth: 0 }}>{upcomingCard}</View> : null}{goalCard ? <View style={{ flex: 1, minWidth: 0 }}>{goalCard}</View> : null}</View> : null}
        {recentCard}
      </>}
      <TabletCard title="Accounts · Net this month">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {accounts.map(({ name, rows, net }) => {
            const [background, foreground] = categoryTone("", theme.dark, getAccountColor(name, accountColors));
            return <Pressable key={name} accessibilityRole="button" accessibilityLabel={`View ${name} transactions`}
              onPress={() => setDetail({ title: name, description: monthLabel(month), transactions: rows, summary: { label: "Net", value: `${net < 0 ? "−" : ""}${money(net)}` } })}
              style={{ flex: 1, minWidth: 130, minHeight: 64, padding: 12, borderRadius: 16, backgroundColor: theme.expressive ? background : c.surfaceVariant, flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Icon name={getAccountIconName(name, accountIcons) as React.ComponentProps<typeof Icon>["name"]} size={22} color={theme.expressive ? foreground : c.primary} />
              <View style={{ flex: 1, gap: 3 }}><Text style={{ fontSize: 12, color: c.onSurfaceVariant }}>{name}</Text>
                <Text style={{ fontSize: 16, fontWeight: "700", color: net < 0 ? theme.semantic.expense : c.onSurface }}>{net < 0 ? "−" : ""}{money(net)}</Text></View>
            </Pressable>;
          })}
          {!accountNames.length ? empty("Add an account in Settings to see it here.") : null}
        </View>
      </TabletCard>
    </ScrollView>
    <MonthPickerSheet visible={picker} month={month} onChange={onMonth} onDismiss={() => setPicker(false)} />
    <DetailsSheet detail={active ? detail : null} onClose={() => setDetail(null)} money={money} onTransaction={onEdit} />
    <RecurringActions selection={selection} onClose={() => setSelection(null)} occurrences={recurring.occurrences} />
  </View>;
}
