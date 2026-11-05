import { useAppSelector } from "@/hooks/Redux";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import { ControlsSheet } from "@/modules/Insights/sheets/ControlsSheet";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { workspaceSummaryReport } from "./report";
import { ShareInsightsSheet } from "@/modules/Insights/sheets/ShareInsightsSheet";
import { useQuickShareInsights } from "@/hooks/use-quickshare-insights";
import { reportComparisonMode } from "@/modules/Insights/reportSelection";
import { TransactionModal } from "@/modules/Management/Transaction/Components/TransactionModal/Index";
import React from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";
import { ActivityIndicator, Button, Chip, SegmentedButtons, TextInput, useTheme } from "react-native-paper";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { DesignText as Text } from "@/components/DesignText";
import { SettingsPage } from "@/modules/Settings/Components/SettingsPage";
import { SettingsHeader } from "@/modules/Settings/Components/SettingsHeader";
import { workspaceRepository } from "@/modules/Core/Repository/Index";
import type { DatabaseTransaction } from "@/modules/Core/Repository/SQLiteRepo";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { MonthPickerSheet } from "@/modules/Main/MonthPickerSheet";
import { monthKey, monthLabel, shiftMonth } from "@/modules/Insights/calculations";
import { ledgerMoney } from "@/modules/Main/presentation";
import { databaseSummary } from "./model";

export function DatabaseSummaryScreen() {
  const theme = useTheme<ExtendedMD3Theme>();
  const c = theme.colors;
  const navigation = useNavigation();
  const workspace = useAppSelector(selectActiveWorkspace);
  const workspaceId = workspace?.id;
  const [databaseRows, setRows] = React.useState<DatabaseTransaction[]>([]);
  const rows = React.useMemo(() => databaseRows.filter(row => row.workspaceId === workspaceId), [databaseRows, workspaceId]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [currency, setCurrency] = React.useState("");
  const [month, setMonth] = React.useState<string | null>(null);
  const [optionsOpen, setOptionsOpen] = React.useState(false);
  const [picker, setPicker] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [type, setType] = React.useState("all");
  const [shareOpen, setShareOpen] = React.useState(false);
  const [viewOpen, setViewOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<DatabaseTransaction | null>(null);
  const [retry, setRetry] = React.useState(0);
  useFocusEffect(React.useCallback(() => {
    let alive = true;
    setLoading(true);
    if (!workspaceId) { setRows([]); setLoading(false); return; }
    void workspaceRepository.getSummaryTransactions(workspaceId).then(data => {
      if (!alive) return;
      setRows(data); setError("");
      setCurrency(previous => data.some(row => row.currencyCode === previous) ? previous : data[0]?.currencyCode || "");
    }).catch(e => { if (alive) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  // Refresh deliberately replaces the focused request and cancels its previous result.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retry, workspaceId]));
  const summary = React.useMemo(() => databaseSummary(rows, currency, month), [rows, currency, month]);
  const entries = summary.entries.filter(row => (type === "all" || row.type === type) && `${row.title} ${row.category} ${row.account} ${row.workspaceName} ${row.notes || ""}`.toLowerCase().includes(query.trim().toLowerCase()));
  const symbol = summary.entries[0]?.currencySymbol || rows.find(row => row.currencyCode === currency)?.currencySymbol || currency;
  const money = (value: number) => ledgerMoney(value, currency || "INR", symbol);
  const reportData = React.useMemo(() => workspaceSummaryReport(rows, currency, month), [rows, currency, month]);
  const periodLabel = month ? monthLabel(month) : "All time";
  const previousLabel = month ? monthLabel(shiftMonth(month, -1)) : "Not available for all time";
  const report = useQuickShareInsights(reportData.summary, periodLabel, previousLabel, workspace?.name || "Summary", currency, symbol,
    reportData.expenseComparison, reportData.incomeComparison, undefined, undefined, undefined,
    `${periodLabel} · ${workspace?.name || "Workspace"} · ${currency}`, { accounts: reportData.accounts, transactions: reportData.transactions, reportTitle: "Summary", recordedPeriodDescription: `${periodLabel} · ${workspace?.name || "Workspace"} · ${currency}` });
  const card = { backgroundColor: c.surface, borderRadius: theme.expressive ? 28 : 16, padding: 18, gap: 12 };
  return <SettingsPage style={{ backgroundColor: c.background }}>
    <SettingsHeader title="Summary" onBack={() => navigation.goBack()} rightIcon="share-variant-outline" rightAccessibilityLabel="Share Summary PDF" onRightPress={() => setShareOpen(true)} />
    <FlatList data={entries} keyExtractor={row => row.id} contentContainerStyle={{ padding: 16, gap: 3, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => setRetry(value => value + 1)} tintColor={c.primary} />}
      ListHeaderComponent={<View style={{ gap: 14, paddingBottom: 14 }}>
        {!!error && <View style={card}><Text accessibilityRole="alert" style={{ color: c.error }}>Could not load the summary: {error}</Text><Button onPress={() => setRetry(value => value + 1)}>Retry</Button></View>}
        {loading && !rows.length ? <ActivityIndicator /> : null}
        <>
          <View style={[card, { backgroundColor: c.primaryContainer }]}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <Text numberOfLines={1} style={{ color: c.onPrimaryContainer, fontWeight: "700", flex: 1 }}>Balance · {workspace?.name || "Workspace"}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={`Change currency and period, ${currency || "no currency"}, ${periodLabel}`} onPress={() => setOptionsOpen(true)}
                style={({ pressed }) => ({ minHeight: 44, flexShrink: 1, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, borderRadius: theme.expressive ? 22 : 12, backgroundColor: c.surface, opacity: pressed ? 0.7 : 1 })}>
                <Text numberOfLines={1} style={{ color: c.onSurface, fontWeight: "700", fontSize: 12 }}>{currency || "Currency"} · {month ? new Date(`${month}-01T12:00:00`).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "All time"}</Text>
                <Icon name="chevron-down" size={18} color={c.onSurface} />
              </Pressable>
            </View>
            {summary.entries.length ? <>
            <Text style={{ fontSize: 36, fontWeight: "800", color: c.onPrimaryContainer }}>{summary.balance < 0 ? "−" : ""}{money(summary.balance)}</Text>
            <View style={{ flexDirection: "row", gap: 20 }}>
              <View style={{ flex: 1 }}><Text style={{ color: c.onPrimaryContainer }}>Income</Text><Text style={{ color: c.onPrimaryContainer, fontWeight: "800", fontSize: 19 }}>{money(summary.income)}</Text></View>
              <View style={{ flex: 1 }}><Text style={{ color: c.onPrimaryContainer }}>Spent</Text><Text style={{ color: c.onPrimaryContainer, fontWeight: "800", fontSize: 19 }}>{money(summary.spent)}</Text></View>
            </View>
            </> : <Text style={{ color: c.onPrimaryContainer, lineHeight: 21 }}>{loading ? "Loading summary…" : "No entries in this period. Choose another month or currency."}</Text>}
          </View>
        </>
        <Text style={{ color: c.onSurface, fontSize: 20, fontWeight: "800" }}>Transactions · {entries.length}</Text>
        <SegmentedButtons value={type} onValueChange={setType} buttons={[{ value: "all", label: "All" }, { value: "income", label: "Income" }, { value: "expense", label: "Expenses" }]} />
        <TextInput mode="outlined" label="Search transactions" value={query} onChangeText={setQuery} right={query ? <TextInput.Icon icon="close" onPress={() => setQuery("")} /> : undefined} />
      </View>}
      ListEmptyComponent={!loading && !error ? <View style={card}><Text style={{ color: c.onSurface }}>No entries {query || type !== "all" ? "match these filters" : month ? "in this month" : "in the database yet"}.</Text></View> : null}
      renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`View ${item.title} from ${item.workspaceName}`} onPress={() => { setSelected(item); setViewOpen(true); }} style={[card, { padding: 14, borderRadius: 12 }]}>
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <View style={{ flex: 1, gap: 4 }}><Text style={{ color: c.onSurface, fontWeight: "700" }}>{item.title}</Text><Text style={{ color: c.onSurfaceVariant, fontSize: 12 }}>{item.workspaceName} · {item.category} · {item.date}</Text></View>
          <Text style={{ color: item.type === "income" ? theme.semantic.income : theme.semantic.expense, fontWeight: "800" }}>{item.type === "income" ? "+" : "−"}{money(Math.abs(item.amount))}</Text>
        </View>
      </Pressable>} />
    <ControlsSheet visible={optionsOpen} title="Currency and period" displayTitle suspended={picker} onClose={() => setOptionsOpen(false)}>
      <Text style={{ color: c.onSurface, fontWeight: "800", fontSize: 16 }}>Currency</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {[...new Set(rows.map(row => row.currencyCode).filter((code): code is string => Boolean(code)))].map(code => <Chip key={code} selected={currency === code} onPress={() => setCurrency(code)}>{code}</Chip>)}
        </View>
        <Text style={{ color: c.onSurface, fontWeight: "800", fontSize: 16 }}>Period</Text>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <Button mode={month ? "outlined" : "contained-tonal"} onPress={() => setMonth(null)}>All time</Button>
          <Button mode={month ? "contained-tonal" : "outlined"} icon="calendar-blank-outline" onPress={() => setPicker(true)}>{month ? monthLabel(month) : "Choose month"}</Button>
        </View>

      {!currency && <Text style={{ color: c.onSurfaceVariant }}>Currencies appear when transactions are recorded.</Text>}
      <Button mode="contained" onPress={() => setOptionsOpen(false)}>Done</Button>
    </ControlsSheet>
    <MonthPickerSheet visible={picker} month={month || monthKey(new Date())} onChange={setMonth} onDismiss={() => setPicker(false)} />
    <TransactionModal isOpen={viewOpen} onClose={() => setViewOpen(false)} readOnlyTransaction={selected} readOnlySourceLabel={selected?.workspaceName} />
    <ShareInsightsSheet visible={shareOpen} onClose={() => setShareOpen(false)} sharing={report.isGenerating}
      canCompareBudget={false} previousSections={reportData.previousSections} previousMonth={previousLabel} groups={reportData.groups} externalCatalog
      onShare={selection => { void report.shareInsights(reportComparisonMode(selection), selection); }} />
  </SettingsPage>;
}
