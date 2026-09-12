import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getCategoryColor, getCategoryIconName } from "@/utils/Helpers";
import type { Group } from "../calculations";
import { Chip, Muted, Section, styles } from "./Primitives";

export function CategorySection({ title, type, groups, budgets, money, icons, colors, onSelect }: {
  title: string; type: "income" | "expense"; groups: Group[];
  budgets: Record<string, number> | null; money: (value: number) => string;
  icons: Record<string, string>; colors: Record<string, string>;
  onSelect: (group: Group) => void;
}) {
  const theme = useTheme();
  const [all, setAll] = useState(false);
  const rows = [...groups, ...Object.keys(budgets ?? {}).filter(name => !groups.some(group => group.name === name))
    .map(name => ({ name, amount: 0, previous: 0, count: 0, share: 0, transactions: [] }))];
  const maximum = Math.max(1, ...rows.map(row => row.amount));
  return <Section title={title}>
    {!rows.length ? <Muted>No {type === "expense" ? "spending" : "income"} yet.</Muted> : null}
    {(all ? rows : rows.slice(0, 3)).map(group => {
      const color = getCategoryColor(group.name, type, colors);
      return <Pressable key={group.name} onPress={() => onSelect(group)} accessibilityRole="button"
        accessibilityLabel={group.name + ", " + money(group.amount) + ". View comparison and transactions."}
        style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 64 }}>
        <View style={{ width: 42, height: 42, borderRadius: 14, alignItems: "center",
          justifyContent: "center", backgroundColor: theme.colors.elevation.level2 }}>
          <MaterialCommunityIcons name={getCategoryIconName(group.name, type, icons) as React.ComponentProps<typeof MaterialCommunityIcons>["name"]} size={22} color={color} />
        </View>
        <View style={{ flex: 1, gap: 10 }}>
          <View style={styles.row}>
            <Text numberOfLines={1} style={{ flex: 1, fontSize: 16 }}>{group.name}</Text>
            <Text style={styles.value}>{money(group.amount)}</Text>
          </View>
          <View style={{ height: 4, borderRadius: 2, backgroundColor: theme.colors.elevation.level2 }}>
            <View style={{ height: 4, borderRadius: 2, width: `${group.amount / maximum * 100}%`, backgroundColor: color }} />
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
      </Pressable>;
    })}
    {rows.length > 3 ? <Chip label={all ? "Show less" : "See all categories"} onPress={() => setAll(!all)} /> : null}
  </Section>;
}
