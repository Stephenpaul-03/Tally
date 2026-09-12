import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Muted } from "../components/Primitives";
import type { calculateInsights } from "../calculations";
type Data = ReturnType<typeof calculateInsights>;

export function CashFlowChart({ trend, money }: { trend: Data["trend"]; money: (v: number) => string }) {
  const theme = useTheme();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const selected = trend.find(row => row.month === selectedMonth) ?? trend[trend.length - 1];
  const max = Math.max(1, ...trend.flatMap(row => [row.income, row.expense]));
  const label = (month: string) => new Date(month + "-01T00:00:00").toLocaleDateString(undefined, { month: "short" });
  return <View style={{ gap: 20 }}>
    <View style={{ flexDirection: "row", gap: 24 }}>
      <View style={{ flex: 1, gap: 5 }}>
        <Muted>↓ Money in</Muted>
        <Text style={{ fontSize: 19, color: theme.colors.primary }}>{money(selected.income)}</Text>
      </View>
      <View style={{ flex: 1, gap: 5 }}>
        <Muted>↑ Money out</Muted>
        <Text style={{ fontSize: 19 }}>{money(selected.expense)}</Text>
      </View>
    </View>
    <View style={{ flexDirection: "row", gap: 6 }}>
      {trend.map(row => <Pressable key={row.month} onPress={() => setSelectedMonth(row.month)}
        accessibilityRole="button" accessibilityState={{ selected: selected.month === row.month }}
        accessibilityLabel={row.month + ", income " + money(row.income) + ", expenses " + money(row.expense)}
        style={{ flex: 1, gap: 10, alignItems: "center", paddingVertical: 8, borderRadius: 10,
          backgroundColor: selected.month === row.month ? theme.colors.elevation.level2 : "transparent" }}>
        <View style={{ height: 100, flexDirection: "row", alignItems: "flex-end", gap: 4 }}>
          <View style={{ height: Math.max(2, row.income / max * 100), width: 10, borderRadius: 4,
            backgroundColor: theme.colors.primary }} />
          <View style={{ height: Math.max(2, row.expense / max * 100), width: 10, borderRadius: 4,
            backgroundColor: theme.colors.onSurfaceVariant, opacity: 0.5 }} />
        </View>
        <Text style={{ fontSize: 13 }}>{label(row.month)}</Text>
      </Pressable>)}
    </View>
    <Muted>{new Date(selected.month + "-01T00:00:00").toLocaleDateString(undefined, { month: "long", year: "numeric" })}</Muted>
  </View>;
}

export function ActivityHeatmap({ days, type, onDay }: {
  days: Data["days"]; type: "income" | "expense"; onDay: (day: Data["days"][number]) => void;
}) {
  const theme = useTheme();
  const maximum = Math.max(1, ...days.map(day => day[type]));
  const offset = (new Date(days[0].date + "T00:00:00").getDay() + 6) % 7;
  return <View style={{ gap: 8 }}>
    <View style={{ flexDirection: "row" }}>{["M", "T", "W", "T", "F", "S", "S"].map((label, i) =>
      <Text key={i} style={{ width: "14.285%", textAlign: "center", fontSize: 11 }}>{label}</Text>)}</View>
    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
      {Array.from({ length: offset }, (_, i) => <View key={"empty" + i} style={{ width: "14.285%" }} />)}
      {days.map((day, i) => <View key={day.date} style={{ width: "14.285%", padding: 3 }}>
        <Pressable disabled={day.future} accessibilityRole="button"
          accessibilityLabel={day.date + ", " + type + " " + day[type]}
          onPress={() => onDay(day)}
          style={{ aspectRatio: 1, borderRadius: 9, justifyContent: "center", alignItems: "center",
            backgroundColor: day[type] ? theme.colors.primary : theme.colors.elevation.level3,
            opacity: day.future ? 0.2 : day[type] ? 0.35 + 0.65 * day[type] / maximum : 1 }}>
          <Text style={{ fontSize: 11, color: day[type] ? theme.colors.onPrimary : theme.colors.onSurface }}>{i + 1}</Text>
        </Pressable>
      </View>)}
    </View>
    <Muted>Tap a day for details.</Muted>
  </View>;
}
