import React, { useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut, ReduceMotion } from "react-native-reanimated";
import { getCategoryColor, getCategoryIconName } from "@/utils/Helpers";
import { CategoryIconBadge } from "@/components/CategoryIconBadge";
import { typography } from "@/theme/typography";
import { amountChangeLabel, percentLabel, type Group } from "../calculations";
import { Section, TextAction } from "./Primitives";
import { CardEmptyState } from "./CardEmptyState";
import { insightLayout, MotionPressable } from "./Motion";

export function CategorySection({ title, type, groups, money, icons, colors, onSelect,
  incomeTotal = 0, budgets, comparison = false, emptyState }: {
  title?: string; type: "income" | "expense"; groups: Group[];
  money: (value: number) => string; icons: Record<string, string>; colors: Record<string, string>;
  onSelect: (group: Group) => void; incomeTotal?: number;
  budgets?: Record<string, number>; comparison?: boolean;
  emptyState?: React.ReactNode;
}) {
  const theme = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 380 || fontScale > 1.25;
  const [all, setAll] = useState(false);
  const rows = groups.filter(group => group.count > 0 || comparison && group.previousCount > 0);
  const visible = all ? rows : rows.slice(0, 3);
  const content = <Animated.View layout={insightLayout}>
    {!rows.length ? emptyState ?? <CardEmptyState message={type === "expense" ? "Nothing spent yet" : "Income still to tally"} /> : null}
    {visible.map((group, index) => {
      const budget = budgets?.[group.name];
      const hasBudget = budget !== undefined && Number.isFinite(budget) && budget > 0;
      const remaining = hasBudget ? budget - group.amount : 0;
      const change = !group.count ? `No entries this month · last month ${money(group.previous)}`
        : !group.previousCount ? "No entries last month"
          : group.amount === group.previous ? "Same as last month" : amountChangeLabel(group.amount, group.previous, money);
      return <Animated.View key={group.name} layout={insightLayout}
        entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)} exiting={FadeOut.duration(120).reduceMotion(ReduceMotion.System)}>
        <MotionPressable onPress={() => onSelect(group)} accessibilityRole="button"
          accessibilityLabel={`${group.name}, ${money(group.amount)}. ${comparison ? change + ". " : ""}View recorded entries.`}
          style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, minHeight: 52, paddingVertical: 10 }}>
          <CategoryIconBadge icon={getCategoryIconName(group.name, type, icons) as React.ComponentProps<typeof MaterialCommunityIcons>["name"]}
            color={getCategoryColor(group.name, type, colors)} />
          <View style={{ flex: 1, gap: 6 }}>
            <View style={{ gap: 4, flexDirection: stacked ? "column" : "row", alignItems: stacked ? "flex-start" : "center", flexWrap: "wrap" }}>
              <Text style={{ ...typography.bodyMedium, fontSize: 14, flexShrink: 1,
                ...(!stacked ? { flexGrow: 1, flexBasis: 90 } : {}) }}>{group.name}</Text>
              <Text style={[{ ...typography.bodyMedium, fontSize: 14, maxWidth: "100%" }]}>{money(group.amount)}</Text>
            </View>
            {incomeTotal > 0 && group.count > 0 ? <Text style={{ ...typography.body, fontSize: 13, color: theme.colors.onSurfaceVariant }}>
              {percentLabel(group.amount / incomeTotal * 100)} of income{type === "expense" ? " used" : " received"}
            </Text> : null}
            {comparison ? <Text style={{ ...typography.body, fontSize: 13, lineHeight: 19, color: theme.colors.onSurfaceVariant }}>{change}</Text> : null}
            {hasBudget ? <Text style={{ ...typography.bodyMedium, fontSize: 13, color: remaining < 0 ? theme.colors.error : theme.colors.onSurfaceVariant }}>
              {money(Math.abs(remaining))} {remaining < 0 ? "over category budget" : "category budget left"}
            </Text> : null}
          </View>
          <MaterialCommunityIcons name="chevron-right" size={16} color={theme.colors.onSurfaceVariant} style={{ marginTop: 6 }} />
        </MotionPressable>
        {index < visible.length - 1 ? <View style={{ marginLeft: 48, height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.outlineVariant }} /> : null}
      </Animated.View>;
    })}
    {rows.length > 3 ? <TextAction label={all ? "Show less" : `View all ${rows.length} categories`} onPress={() => setAll(!all)} /> : null}
  </Animated.View>;
  return title ? <Section title={title}>{content}</Section> : content;
}
