import React from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { DesignText as Text } from "@/components/DesignText";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import type { workspaceSnapshot } from "./snapshot";

export function WorkspaceSummaryCard({ snapshot, money, onPress, contained = false, compact = false, fill = false }: {
  snapshot: ReturnType<typeof workspaceSnapshot>;
  money: (amount: number) => string; onPress?: () => void; contained?: boolean; compact?: boolean; fill?: boolean;
}) {
  const theme = useTheme<ExtendedMD3Theme>(), c = theme.colors;
  return <View style={{ flexGrow: fill ? 1 : undefined, justifyContent: fill ? "space-between" : undefined, backgroundColor: c.surface, borderRadius: theme.expressive ? 28 : 20, padding: contained ? 0 : 16, gap: compact ? 12 : 18 }}>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
      {([['Income', snapshot.income, theme.semantic.income], ['Expenses', snapshot.spent, theme.semantic.expense]] as const).map(([label, amount, color]) =>
        <View key={label} style={{ flex: 1, minWidth: compact ? 90 : 120, gap: 6 }}>
          <Text style={{ fontSize: 12, color: c.onSurfaceVariant }}>{label}</Text>
          <Text numberOfLines={compact ? 1 : undefined} adjustsFontSizeToFit={compact} style={{ fontSize: compact ? 17 : 20, fontWeight: "800", color }}>{money(amount)}</Text>
        </View>)}
    </View>
    <View accessible accessibilityLabel={`Income ${money(snapshot.income)}, expenses ${money(snapshot.spent)}`}
      style={{ height: 6, borderRadius: 3, overflow: "hidden", flexDirection: "row", backgroundColor: c.surfaceVariant }}>
      {snapshot.income + snapshot.spent > 0 ? <>
        <View style={{ flex: 1 - snapshot.expenseShare, backgroundColor: theme.semantic.income }} />
        <View style={{ flex: snapshot.expenseShare, backgroundColor: theme.semantic.expense }} />
      </> : null}
    </View>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
      {[[snapshot.count, "entries"], [snapshot.activeDays, "active days"], [snapshot.accounts, "accounts"]].map(([value, label]) =>
        <View key={label} style={{ flex: 1, minWidth: 70, gap: 3 }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: c.onSurface }}>{value}</Text>
          <Text style={{ fontSize: 12, color: c.onSurfaceVariant }}>{label}</Text>
        </View>)}
    </View>
    {onPress ? <Pressable accessibilityRole="button"
      accessibilityLabel="Explore workspace summary"
      onPress={onPress} style={({ pressed }) => ({ minHeight: compact ? 44 : 48, borderRadius: 24,
        alignSelf: compact ? "flex-start" : "stretch", backgroundColor: c.secondaryContainer, paddingHorizontal: 16, flexDirection: "row", gap: 8,
        alignItems: "center", justifyContent: "space-between", opacity: pressed ? 0.7 : 1 })}>
      <Text style={{ flex: compact ? undefined : 1, fontWeight: "700", color: c.onSecondaryContainer }}>Explore summary</Text>
      <Icon name="arrow-right" size={20} color={c.onSecondaryContainer} />
    </Pressable> : null}
  </View>;
}
