import React from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, View } from "react-native";
import { ActivityIndicator, Button, Chip, SegmentedButtons, TextInput, useTheme } from "react-native-paper";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { DesignText as Text } from "@/components/DesignText";
import { SettingsPage } from "@/modules/Settings/Components/SettingsPage";
import { SettingsHeader } from "@/modules/Settings/Components/SettingsHeader";
import { workspaceRepository } from "@/modules/Core/Repository/Index";
import type { DatabaseTransaction } from "@/modules/Core/Repository/SQLiteRepo";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { MonthPickerSheet } from "@/modules/Main/MonthPickerSheet";
import { monthKey, monthLabel } from "@/modules/Insights/calculations";
import { ledgerMoney } from "@/modules/Main/presentation";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { databaseSummary } from "./model";

export function DatabaseSummaryScreen() {
  const theme = useTheme<ExtendedMD3Theme>();
  const c = theme.colors;
  const navigation = useNavigation();
  const [rows, setRows] = React.useState<DatabaseTransaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [currency, setCurrency] = React.useState("");
  const [month, setMonth] = React.useState<string | null>(null);
  const [picker, setPicker] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [type, setType] = React.useState("all");
  const [selected, setSelected] = React.useState<DatabaseTransaction | null>(null);
  const [retry, setRetry] = React.useState(0);
  useFocusEffect(React.useCallback(() => {
    let alive = true;
    setLoading(true);
    void workspaceRepository.getAllTransactions().then(data => {
      if (!alive) return;
      setRows(data); setError("");
      setCurrency(previous => data.some(row => row.currencyCode === previous) ? previous : data[0]?.currencyCode || "");
    }).catch(e => { if (alive) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  // Refresh deliberately replaces the focused request and cancels its previous result.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retry]));
  const summary = React.useMemo(() => databaseSummary(rows, currency, month), [rows, currency, month]);
  const entries = summary.entries.filter(row => (type === "all" || row.type === type) && `${row.title} ${row.category} ${row.account} ${row.workspaceName} ${row.notes || ""}`.toLowerCase().includes(query.trim().toLowerCase()));
  const symbol = summary.entries[0]?.currencySymbol || rows.find(row => row.currencyCode === currency)?.currencySymbol || currency;
  const money = (value: number) => ledgerMoney(value, currency || "INR", symbol);
  const card = { backgroundColor: c.surface, borderRadius: theme.expressive ? 28 : 16, padding: 18, gap: 12 };
  return <SettingsPage style={{ backgroundColor: c.background }}>
    <SettingsHeader title="All workspaces" onBack={() => navigation.goBack()} rightIcon="refresh" rightAccessibilityLabel="Refresh database summary" onRightPress={() => setRetry(value => value + 1)} />
    <FlatList data={entries} keyExtractor={row => row.id} contentContainerStyle={{ padding: 16, gap: 3, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => setRetry(value => value + 1)} tintColor={c.primary} />}
      ListHeaderComponent={<View style={{ gap: 14, paddingBottom: 14 }}>
        <Text style={{ color: c.onSurfaceVariant, fontSize: 13, lineHeight: 20 }}>A read-only view of the whole database. Each entry stays in its original workspace. Currencies are shown separately.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {[...new Set(rows.map(row => row.currencyCode).filter((code): code is string => Boolean(code)))].map(code => <Chip key={code} selected={currency === code} onPress={() => setCurrency(code)}>{code}</Chip>)}
        </ScrollView>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button mode={month ? "outlined" : "contained-tonal"} onPress={() => setMonth(null)}>All time</Button>
          <Button mode={month ? "contained-tonal" : "outlined"} icon="calendar-blank-outline" onPress={() => setPicker(true)}>{month ? monthLabel(month) : "Choose month"}</Button>
        </View>
        {!!error && <View style={card}><Text accessibilityRole="alert" style={{ color: c.error }}>Could not load the summary: {error}</Text><Button onPress={() => setRetry(value => value + 1)}>Retry</Button></View>}
        {loading && !rows.length ? <ActivityIndicator /> : null}
        {!!summary.entries.length && <>
          <View style={[card, { backgroundColor: c.primaryContainer }]}>
            <Text style={{ color: c.onPrimaryContainer, fontWeight: "700" }}>Balance · {currency}</Text>
            <Text style={{ fontSize: 36, fontWeight: "800", color: c.onPrimaryContainer }}>{summary.balance < 0 ? "−" : ""}{money(summary.balance)}</Text>
            <View style={{ flexDirection: "row", gap: 20 }}>
              <View style={{ flex: 1 }}><Text style={{ color: c.onPrimaryContainer }}>Income</Text><Text style={{ color: c.onPrimaryContainer, fontWeight: "800", fontSize: 19 }}>{money(summary.income)}</Text></View>
              <View style={{ flex: 1 }}><Text style={{ color: c.onPrimaryContainer }}>Spent</Text><Text style={{ color: c.onPrimaryContainer, fontWeight: "800", fontSize: 19 }}>{money(summary.spent)}</Text></View>
            </View>
          </View>
          <View style={card}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: c.onSurface }}>By workspace</Text>
            {summary.workspaces.map(workspace => <View key={workspace.id} style={{ gap: 4, paddingVertical: 6 }}>
              <Text style={{ color: c.onSurface, fontWeight: "700" }}>{workspace.name} · {workspace.count} entries</Text>
              <Text style={{ color: c.onSurfaceVariant }}>Income {money(workspace.income)} · Spent {money(workspace.spent)}</Text>
            </View>)}
          </View>
        </>}
        <Text style={{ color: c.onSurface, fontSize: 20, fontWeight: "800" }}>Transactions · {entries.length}</Text>
        <SegmentedButtons value={type} onValueChange={setType} buttons={[{ value: "all", label: "All" }, { value: "income", label: "Income" }, { value: "expense", label: "Expenses" }]} />
        <TextInput mode="outlined" label="Search across workspaces" value={query} onChangeText={setQuery} right={query ? <TextInput.Icon icon="close" onPress={() => setQuery("")} /> : undefined} />
      </View>}
      ListEmptyComponent={!loading && !error ? <View style={card}><Text style={{ color: c.onSurface }}>No entries {query || type !== "all" ? "match these filters" : month ? "in this month" : "in the database yet"}.</Text></View> : null}
      renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`View ${item.title} from ${item.workspaceName}`} onPress={() => setSelected(item)} style={[card, { padding: 14, borderRadius: 12 }]}>
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <View style={{ flex: 1, gap: 4 }}><Text style={{ color: c.onSurface, fontWeight: "700" }}>{item.title}</Text><Text style={{ color: c.onSurfaceVariant, fontSize: 12 }}>{item.workspaceName} · {item.category} · {item.date}</Text></View>
          <Text style={{ color: item.type === "income" ? theme.semantic.income : theme.semantic.expense, fontWeight: "800" }}>{item.type === "income" ? "+" : "−"}{money(Math.abs(item.amount))}</Text>
        </View>
      </Pressable>} />
    <MonthPickerSheet visible={picker} month={month || monthKey(new Date())} onChange={setMonth} onDismiss={() => setPicker(false)} />
    <AnimatedPaperModal visible={Boolean(selected)} onDismiss={() => setSelected(null)} presentation="sheet" contentContainerStyle={{ backgroundColor: c.background, padding: 24, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}>
      {selected ? <View style={{ gap: 16 }}>
        <Text style={{ color: c.onSurfaceVariant }}>{selected.workspaceName} · Read-only</Text>
        <Text style={{ color: c.onSurface, fontSize: 24, fontWeight: "800" }}>{selected.title}</Text>
        <Text style={{ color: c.onSurface, fontSize: 32, fontWeight: "800" }}>{selected.type === "income" ? "+" : "−"}{money(Math.abs(selected.amount))}</Text>
        <Text style={{ color: c.onSurfaceVariant }}>{selected.category} · {selected.account} · {selected.date}</Text>
        {!!selected.notes && <Text style={{ color: c.onSurface }}>{selected.notes}</Text>}
        <Text style={{ color: c.onSurfaceVariant, fontSize: 12 }}>To edit this entry, open its original workspace.</Text>
        <Button onPress={() => setSelected(null)}>Close</Button>
      </View> : null}
    </AnimatedPaperModal>
  </SettingsPage>;
}
