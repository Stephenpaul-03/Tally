import React from "react";
import { FlatList, View } from "react-native";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { DesignText as Text } from "@/components/DesignText";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { typography } from "@/theme/typography";
import { tabletTransactionSections } from "./tabletTransactionSections";

type Section = Parameters<typeof tabletTransactionSections>[0][number];
export function TabletTransactionColumns<S extends Section>({ sections, renderSection, bottomPadding, period, active = true, totals }: {
  sections: S[];
  renderSection: (section: S) => React.ReactElement;
  bottomPadding: number;
  period: string;
  active?: boolean;
  totals?: { income: string | null; expense: string };
}) {
  const theme = useTheme<ExtendedMD3Theme>();
  return <View style={{ flex: 1, minHeight: 0, flexDirection: "row", gap: 16, paddingHorizontal: 16 }}>
    {(["income", "expense"] as const).map(type => {
      const groups = tabletTransactionSections(sections, type);
      const count = groups.reduce((sum, group) => sum + group.transactions.length, 0);
      const color = theme.semantic[type];
      return <View key={type} style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12,
          borderBottomWidth: theme.expressive ? 0 : 0.5, borderColor: theme.colors.outlineVariant }}>
          <MaterialCommunityIcons name={type === "income" ? "arrow-bottom-left" : "arrow-top-right"} size={20} color={color} />
          <Text accessibilityRole="header" style={{ ...(theme.expressive ? { fontSize: 20, fontWeight: "700" } as const : typography.editorial.sectionLabel), color }}>
            {type === "income" ? "Income" : "Expenses"}
          </Text>
          <View style={{ marginLeft: "auto", alignItems: "flex-end", gap: 2, flexShrink: 1 }}>
            {totals ? <Text numberOfLines={1} adjustsFontSizeToFit style={{ color, fontSize: 15, fontWeight: "700" }}>{totals[type] || "—"}</Text> : null}
            <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 11 }}>{count} {count === 1 ? "entry" : "entries"}</Text>
          </View>
        </View>
        <FlatList key={period} data={groups} keyExtractor={group => group.key}
          renderItem={({ item }) => renderSection(item)}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: bottomPadding }}
          ListEmptyComponent={<Text style={{ paddingVertical: 32, textAlign: "center", color: theme.colors.onSurfaceVariant }}>
            No {type === "income" ? "income" : "expenses"} to show
          </Text>}
          scrollEnabled={active} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false} removeClippedSubviews={false} />
      </View>;
    })}
  </View>;
}
