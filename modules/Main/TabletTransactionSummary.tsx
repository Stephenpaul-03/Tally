import React from "react";
import { View } from "react-native";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { DesignText as Text } from "@/components/DesignText";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import type { Transaction, TransactionDraft } from "@/utils/Types";
import { separateLedgerTotals } from "./presentation";

export function TabletTransactionSummary({ rows, currency, symbol }: {
  rows: (Transaction | TransactionDraft)[]; currency: string; symbol: string;
}) {
  const theme = useTheme<ExtendedMD3Theme>(), c = theme.colors;
  const totals = separateLedgerTotals(rows, currency, symbol);
  return <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingBottom: 14 }}>
    {(["income", "expense"] as const).map(type => <View key={type} style={{ flex: 1, minWidth: 0,
      borderRadius: theme.expressive ? 18 : 12, backgroundColor: c.surface, padding: 12, gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Icon name={type === "income" ? "arrow-bottom-left" : "arrow-top-right"} size={16} color={theme.semantic[type]} />
        <Text style={{ fontSize: 12, color: c.onSurfaceVariant }}>{type === "income" ? "Income" : "Expenses"}</Text>
      </View>
      <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 20, fontWeight: "700", color: theme.semantic[type] }}>{totals[type] || "—"}</Text>
    </View>)}
  </View>;
}
