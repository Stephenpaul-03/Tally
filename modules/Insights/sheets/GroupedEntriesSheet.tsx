import React from "react";
import { FlatList, View, useWindowDimensions } from "react-native";
import { useTheme } from "react-native-paper";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { SettingsHeader } from "@/modules/Settings/Components/SettingsHeader";
import { TransactionRow } from "@/modules/Management/Transaction/Components/TransactionRow";
import { DesignText as Text } from "@/components/DesignText";
import { ledgerMoney } from "@/modules/Main/presentation";
import type { InsightEntryGroup } from "../entryGrouping";

export function GroupedEntriesSheet({ group, suspended, onClose, onTransaction }: {
  group: InsightEntryGroup | null; suspended: boolean; onClose: () => void; onTransaction: (id: string) => void;
}) {
  const theme = useTheme();
  const { height } = useWindowDimensions();
  const retained = React.useRef(group);
  if (group) retained.current = group;
  const current = retained.current;
  const dates = current?.transactions.map(row => row.date).sort() ?? [];
  const formatDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  const range = dates.length ? (dates[0] === dates[dates.length - 1] ? formatDate(dates[0])
    : `${formatDate(dates[0])} – ${formatDate(dates[dates.length - 1])}`) : "";
  return <AnimatedPaperModal visible={Boolean(group)} onDismiss={onClose} presentation="sheet" zIndex={930}
    dismissable={!suspended} escapeEnabled={!suspended} contentWrapperStyle={{ flex: 1 }}
    contentContainerStyle={{ backgroundColor: theme.colors.background,
      height: Math.min(height * 0.84, 260 + (current?.transactions.length || 0) * 88) }}>
    <SettingsHeader title={current?.title || "Grouped entries"} modal onBack={onClose} />
    <View style={{ paddingHorizontal: 20, paddingBottom: 20, gap: 10 }}>
      <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>{range} · {current?.transactions.length || 0} grouped entries</Text>
      <View style={{ flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <Text style={{ color: theme.colors.onSurface, fontSize: 34, fontWeight: "800" }}>
          {ledgerMoney(current?.amount || 0, current?.currencyCode || "INR", current?.transactions[0]?.currencySymbol)}
        </Text>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>{current?.type === "income" ? "received" : "spent"}</Text>
      </View>
      <Text style={{ color: theme.colors.onSurfaceVariant }}>{current?.category} · {current?.account}</Text>
    </View>
    <FlatList data={current?.transactions || []} keyExtractor={row => row.id} style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 4 }}
      renderItem={({ item }) => <TransactionRow transaction={item} onPressTransaction={onTransaction}
        disableLongPress secondaryLabelMode="date" />} />
  </AnimatedPaperModal>;
}
