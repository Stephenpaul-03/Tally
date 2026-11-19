import React from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { DesignText as Text } from "@/components/DesignText";
import { FlowDisclosure } from "@/components/animations/FlowDisclosure";
import { TransactionRowsPresence } from "@/modules/Management/Transaction/Components/TransactionMutation";
import { TransactionRow } from "@/modules/Management/Transaction/Components/TransactionRow";
import type { Transaction, TransactionDraft } from "@/utils/Types";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { separateLedgerTotals } from "./presentation";

export function TabletTransactionSection({ item, currency, symbol, collapsed, onCollapse, onEdit }: {
  item: { key: string; title: string; grouping?: string; transactions: (Transaction | TransactionDraft)[] };
  currency: string; symbol: string; collapsed: boolean; onCollapse: (key: string) => void; onEdit: (id: string) => void;
}) {
  const theme = useTheme<ExtendedMD3Theme>(), c = theme.colors;
  const totals = separateLedgerTotals(item.transactions, currency, symbol);
  const date = new Date(`${item.key}T12:00:00`);
  const title = (!item.grouping || item.grouping === "date") && Number.isFinite(date.getTime())
    ? date.toLocaleDateString(undefined, { day: "numeric", month: "short", weekday: "short" }) : item.title;
  return <View style={{ marginBottom: 12, padding: 8, borderRadius: theme.expressive ? 22 : 14,
    backgroundColor: c.surface, borderWidth: theme.expressive ? 0 : 0.5, borderColor: c.outlineVariant }}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${collapsed ? "Expand" : "Collapse"} ${title}`}
      accessibilityState={{ expanded: !collapsed }} onPress={() => onCollapse(item.key)}
      style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 8 }}>
      <Text numberOfLines={1} style={{ flex: 1, fontSize: 13, fontWeight: "700", color: c.onSurface }}>{title}</Text>
      <View style={{ alignItems: "flex-end", flexShrink: 1 }}>
        {item.key === "draft" ? <Text style={{ fontSize: 11, color: c.onSurfaceVariant }}>Drafts</Text> : <>
          {totals.income ? <Text style={{ fontSize: 11, color: theme.semantic.income }}>{totals.income}</Text> : null}
          {item.transactions.some(row => row.type === "expense") ? <Text style={{ fontSize: 11, color: theme.semantic.expense }}>{totals.expense}</Text> : null}
        </>}
      </View>
      <Icon name={collapsed ? "chevron-down" : "chevron-up"} size={18} color={c.onSurfaceVariant} />
    </Pressable>
    <FlowDisclosure open={!collapsed}>
      <TransactionRowsPresence rows={item.transactions} renderRow={(row, index, count) => <TransactionRow transaction={row}
        onPressTransaction={onEdit} compact grouped showDivider={index < count - 1}
        groupPosition={count === 1 ? "single" : index === 0 ? "first" : index === count - 1 ? "last" : "middle"}
        secondaryLabelMode={item.grouping && item.grouping !== "date" ? "date" : "time"} />} />
    </FlowDisclosure>
  </View>;
}
