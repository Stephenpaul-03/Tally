import React from "react";
import { View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { AnimatedBar, MotionPressable } from "../components/Motion";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { Muted, styles, CardFooterAction } from "../components/Primitives";
import { monthLabel, type calculateInsights } from "../calculations";
import { typography } from "@/theme/typography";
import { CardEmptyState } from "../components/CardEmptyState";
type Data = ReturnType<typeof calculateInsights>;

export function SpendingHistory({ trend, money, onMonth, type = "expense" }: {
  trend: Data["trend"]; money: (v: number) => string; onMonth?: (month: string) => void; type?: "income" | "expense";
}) {
  const theme = useTheme();
  const max = Math.max(1, ...trend.map(row => row[type]));
  return <View style={{ gap: 10, paddingBottom: 16 }}>
    {[...trend].sort((a, b) => b.month.localeCompare(a.month)).map(row => {
      const label = monthLabel(row.month);
      const content = <View style={{ gap: 10, paddingVertical: 10 }}>
        <View style={[styles.row, { flexWrap: "wrap" }]}>
          <Text style={{ ...typography.bodyMedium, fontSize: 14, flexGrow: 1 }}>{label}{row.isPartial ? " · so far" : ""}</Text>
          {(type === "income" ? row.incomeCount : row.expenseCount) ? <Text style={styles.value}>{money(row[type])}</Text> : <Muted>No entries</Muted>}
        </View>
        <AnimatedBar fraction={row[type] / max} height={5} color={theme.colors.primary} trackColor={theme.colors.elevation.level2} />
      </View>;
      return onMonth ? <MotionPressable key={row.month} onPress={() => onMonth(row.month)}
        accessibilityRole="button" accessibilityLabel={`${label}${row.isPartial ? ", so far" : ""}, ${(type === "income" ? row.incomeCount : row.expenseCount) ? money(row[type]) + (type === "income" ? " received" : " spent") : `no ${type === "income" ? "income" : "spending"} recorded`}. View month.`}>
        {content}
      </MotionPressable> : <View key={row.month}>{content}</View>;
    })}
  </View>;
}

export function ActivityHeatmap({ days, type, money, onDay }: {
  days: Data["days"]; type: "income" | "expense"; money: (value: number) => string;
  onDay: (day: Data["days"][number]) => void;
}) {
  const theme = useTheme<ExtendedMD3Theme>();
  const highlight = theme.semantic[type];
  const offset = (new Date(days[0].date + "T00:00:00").getDay() + 6) % 7;
  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return <View style={{ gap: 8 }}>
    <View style={{ flexDirection: "row" }}>{weekdays.map(label =>
      <Text key={label} accessibilityLabel={label}
        style={{ ...typography.body, width: "14.285%", textAlign: "center", fontSize: 14 }}>{label[0]}</Text>)}</View>
    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
      {Array.from({ length: offset }, (_, i) => <View key={"empty" + i} style={{ width: "14.285%" }} />)}
      {days.map((day, i) => <View key={day.date} style={{ width: "14.285%", padding: 2 }}>
        <MotionPressable disabled={day.future} accessibilityRole="button"
          accessibilityState={{ disabled: day.future }}
          accessibilityLabel={day.date + ", " + (day.future ? "future day" : money(day[type]) + (type === "expense" ? " spending recorded" : " income recorded"))}
          onPress={() => onDay(day)}
          style={{ minHeight: 44, borderRadius: 12, borderWidth: day[type] ? 1 : 0, borderColor: highlight + "60", justifyContent: "center", alignItems: "center",
            backgroundColor: day[type] ? highlight + "24" : theme.colors.elevation.level1,
            opacity: day.future ? 0.4 : 1 }}>
          <Text style={{ ...typography.bodyMedium, fontSize: 15,
            color: day[type] ? highlight : theme.colors.onSurface }}>{i + 1}</Text>
        </MotionPressable>
      </View>)}
    </View>
  </View>;
}

export function YearOverview({ year, selectedMonth, money, onShowTotals }: {
  year: Data["year"]; selectedMonth: string; money: (value: number) => string; onShowTotals: () => void;
}) {
  const theme = useTheme<ExtendedMD3Theme>();
  if (!year.months.some(row => row.incomeCount || row.expenseCount)) {
    return <CardEmptyState message="No entries this year" />;
  }
  const max = Math.max(1, ...year.months.flatMap(row => [row.income, row.expense]));
  return <View style={{ gap: 12 }}>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 18 }}>
      {([ ["Income", year.income, theme.semantic.income], ["Spent", year.expense, theme.semantic.expense] ] as const).map(([label, value, color]) =>
        <View key={label} style={{ flex: 1, minWidth: 110, gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
            <Text style={{ ...typography.body, fontSize: 12, color: theme.colors.onSurfaceVariant }}>{label}</Text>
          </View>
          <Text style={{ ...typography.bodyMedium, fontSize: 18, color }}>{money(value)}</Text>
        </View>)}
    </View>
    <View accessible accessibilityLabel={`${year.label} monthly income and spending chart. Open monthly totals for exact amounts.`}
      style={{ flexDirection: "row", gap: 5, alignItems: "flex-end", height: 112, paddingTop: 8 }}>
      {year.months.map(row => <View key={row.month} style={{ flex: 1, gap: 6, alignItems: "center", opacity: row.future ? 0.3 : 1 }}>
        <View style={{ height: 80, flexDirection: "row", gap: 2, alignItems: "flex-end", width: "100%" }}>
          <View style={{ flex: 1, height: Math.max(2, row.income / max * 80), backgroundColor: row.incomeCount ? theme.semantic.income : theme.colors.outlineVariant, borderRadius: 2 }} />
          <View style={{ flex: 1, height: Math.max(2, row.expense / max * 80), backgroundColor: row.expenseCount ? theme.semantic.expense : theme.colors.outlineVariant, borderRadius: 2 }} />
        </View>
        <Text style={{ ...typography.body, fontSize: 10, color: row.month === selectedMonth ? theme.colors.primary : theme.colors.onSurfaceVariant }}>
          {new Date(`${row.month}-01T00:00:00`).toLocaleDateString(undefined, { month: "narrow" })}
        </Text>
      </View>)}
    </View>
    <CardFooterAction label="Monthly totals" onPress={onShowTotals} />
  </View>;
}

export function YearMonthlyTotals({ year, selectedMonth, money, onMonth }: {
  year: Data["year"]; selectedMonth: string; money: (value: number) => string; onMonth: (month: string) => void;
}) {
  const theme = useTheme<ExtendedMD3Theme>();
  return <View>
      <View style={{ flexDirection: "row", gap: 12, paddingBottom: 8 }}>
        <View style={{ width: 36 }} /><Text style={{ ...typography.body, fontSize: 12, flex: 1, color: theme.semantic.income }}>Income</Text>
        <Text style={{ ...typography.body, fontSize: 12, flex: 1, color: theme.semantic.expense }}>Spent</Text>
      </View>
      {[...year.months].sort((a, b) => a.month.localeCompare(b.month)).map(row => <MotionPressable key={row.month} onPress={() => onMonth(row.month)} disabled={row.future}
        accessibilityRole="button" accessibilityState={{ selected: row.month === selectedMonth, disabled: row.future }}
        accessibilityLabel={`${monthLabel(row.month)}${row.isPartial ? ", so far" : ""}. ${row.future ? "Upcoming" : `Income ${row.incomeCount ? money(row.income) : "not recorded"}, spent ${row.expenseCount ? money(row.expense) : "not recorded"}. View month.`}`}
        style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 48, paddingVertical: 10, marginHorizontal: -20, paddingHorizontal: 20, borderBottomWidth: 0.5, borderColor: theme.colors.outlineVariant }}>
        <Text style={{ ...typography.body, fontSize: 13, width: 36 }}>{new Date(`${row.month}-01T00:00:00`).toLocaleDateString(undefined, { month: "short" })}</Text>
        {row.future ? <Muted>Upcoming</Muted> : <>
          <Text style={{ ...typography.body, fontSize: 13, flex: 1 }}>{row.incomeCount ? money(row.income) : "—"}</Text>
          <Text style={{ ...typography.body, fontSize: 13, flex: 1 }}>{row.expenseCount ? money(row.expense) : "—"}</Text>
        </>}
      </MotionPressable>)}
      <Text style={{ ...typography.body, fontSize: 12, paddingTop: 10, color: theme.colors.onSurfaceVariant }}>— No entries · tap a month to explore</Text>
  </View>;
}
