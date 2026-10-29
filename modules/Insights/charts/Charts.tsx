import React from "react";
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from "react-native-reanimated";
import { useMotionEnabled } from "@/components/animations/Motion";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colorTreatment } from "@/theme/colorTreatment";
import { View } from "react-native";
import { useTheme } from "react-native-paper";
import { DesignText as Text, resolveDesignTextStyle } from "@/components/DesignText";
import { AnimatedBar, MotionPressable } from "../components/Motion";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { Muted, styles, CardFooterAction } from "../components/Primitives";
import { monthLabel, type calculateInsights } from "../calculations";
import { typography } from "@/theme/typography";
import { CardEmptyState } from "../components/CardEmptyState";
type Data = ReturnType<typeof calculateInsights>;

export function SpendingHistory({
  trend,
  money,
  onMonth,
  type = "expense",
}: {
  trend: Data["trend"];
  money: (v: number) => string;
  onMonth?: (month: string) => void;
  type?: "income" | "expense";
}) {
  const theme = useTheme();
  const max = Math.max(1, ...trend.map((row) => row[type]));
  return (
    <View style={{ gap: 10, paddingBottom: 16 }}>
      {[...trend]
        .sort((a, b) => b.month.localeCompare(a.month))
        .map((row) => {
          const label = monthLabel(row.month);
          const content = (
            <View style={{ gap: 10, paddingVertical: 10 }}>
              <View style={[styles.row, { flexWrap: "wrap" }]}>
                <Text
                  style={{
                    ...typography.bodyMedium,
                    fontSize: 14,
                    flexGrow: 1,
                  }}
                >
                  {label}
                  {row.isPartial ? " · so far" : ""}
                </Text>
                {(type === "income" ? row.incomeCount : row.expenseCount) ? (
                  <Text style={styles.value}>{money(type === "income" ? row.income : row.expense)}</Text>
                ) : (
                  <Muted>No entries</Muted>
                )}
              </View>
              <AnimatedBar
                fraction={row[type] / max}
                height={5}
                color={theme.colors.primary}
                trackColor={theme.colors.elevation.level2}
              />
            </View>
          );
          return onMonth ? (
            <MotionPressable
              key={row.month}
              onPress={() => onMonth(row.month)}
              accessibilityRole="button"
              accessibilityLabel={`${label}${row.isPartial ? ", so far" : ""}, ${(type === "income" ? row.incomeCount : row.expenseCount) ? money(type === "income" ? row.income : row.expense) + (type === "income" ? " received" : " spent") : `no ${type === "income" ? "income" : "spending"} recorded`}. View month.`}
            >
              {content}
            </MotionPressable>
          ) : (
            <View key={row.month}>{content}</View>
          );
        })}
    </View>
  );
}

/** Highlight layers share the same drag progress as the date-number colors. */
function DayHighlight({ day, progress }: { day: Data["days"][number]; progress: SharedValue<number> }) {
  const theme = useTheme<ExtendedMD3Theme>();
  const expense = useAnimatedStyle(() => ({ opacity: day.expense ? 1 - progress.value : 0 }));
  const income = useAnimatedStyle(() => ({ opacity: day.income ? progress.value : 0 }));
  return <>
    {(["expense", "income"] as const).map((kind) => <Animated.View key={kind} pointerEvents="none"
      style={[{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, borderRadius: 12,
        borderWidth: 1, borderColor: theme.semantic[kind] + "60", backgroundColor: theme.semantic[kind] + "24" },
        kind === "expense" ? expense : income]} />)}
  </>;
}

function DayNumber({ day, number, progress }: {
  day: Data["days"][number]; number: number; progress: SharedValue<number>;
}) {
  const theme = useTheme<ExtendedMD3Theme>();
  const expenseColor = day.expense ? theme.semantic.expense : theme.colors.onSurface;
  const incomeColor = day.income ? theme.semantic.income : theme.colors.onSurface;
  const color = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [expenseColor, incomeColor]),
  }));
  return <Animated.Text style={[resolveDesignTextStyle(theme, { ...typography.bodyMedium, fontSize: 15 }), color]}>
    {number}
  </Animated.Text>;
}

export function ActivityHeatmap({
  days,
  type,
  money,
  onDay,
  dragProgress,
}: {
  dragProgress?: SharedValue<number>;
  days: Data["days"];
  type: "income" | "expense";
  money: (value: number) => string;
  onDay: (day: Data["days"][number]) => void;
}) {
  const theme = useTheme<ExtendedMD3Theme>();
  const enabled = useMotionEnabled();
  const localProgress = useSharedValue(type === "income" ? 1 : 0);
  const progress = dragProgress ?? localProgress;
  React.useEffect(() => {
    if (!dragProgress) localProgress.value = withTiming(type === "income" ? 1 : 0, { duration: enabled ? 160 : 0 });
  }, [dragProgress, type, enabled, localProgress]);
  const offset = (new Date(days[0].date + "T00:00:00").getDay() + 6) % 7;
  const weekdays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row" }}>
        {weekdays.map((label) => (
          <Text
            key={label}
            accessibilityLabel={label}
            style={{
              ...typography.body,
              width: "14.285%",
              textAlign: "center",
              fontSize: 14,
            }}
          >
            {label[0]}
          </Text>
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {Array.from({ length: offset }, (_, i) => (
          <View key={"empty" + i} style={{ width: "14.285%" }} />
        ))}
        {days.map((day, i) => (
          <View key={day.date} style={{ width: "14.285%", padding: 2 }}>
            <MotionPressable
              disabled={day.future}
              accessibilityRole="button"
              accessibilityState={{ disabled: day.future }}
              accessibilityLabel={
                day.date +
                ", " +
                (day.future
                  ? "future day"
                  : money(day[type]) +
                    (type === "expense"
                      ? " spending recorded"
                      : " income recorded"))
              }
              onPress={() => onDay(day)}
              style={{
                minHeight: 44,
                borderRadius: 12,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: theme.colors.elevation.level1,
                opacity: day.future ? 0.4 : 1,
              }}
            >
              <DayHighlight day={day} progress={progress} />
              <DayNumber day={day} number={i + 1} progress={progress} />
            </MotionPressable>
          </View>
        ))}
      </View>
    </View>
  );
}

export function YearOverview({
  year,
  selectedMonth,
  money,
  onShowTotals,
}: {
  year: Data["year"];
  selectedMonth: string;
  money: (value: number) => string;
  onShowTotals: () => void;
}) {
  const theme = useTheme<ExtendedMD3Theme>();
  if (!year.months.some((row) => row.incomeCount || row.expenseCount)) {
    return <CardEmptyState message="No entries this year" />;
  }
  const incomeTone = colorTreatment(theme.semantic.income, theme.dark, false, theme.colors.surface);
  const expenseTone = colorTreatment(theme.semantic.expense, theme.dark, false, theme.colors.surface);
  const incomeBackground = incomeTone.backgroundColor;
  const incomeForeground = incomeTone.foregroundColor;
  const expenseBackground = expenseTone.backgroundColor;
  const expenseForeground = expenseTone.foregroundColor;
  const max = Math.max(
    1,
    ...year.months.flatMap((row) => [row.income, row.expense]),
  );
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 18 }}>
        {(
          [
            ["Income", year.income, incomeForeground, incomeBackground],
            ["Spent", year.expense, expenseForeground, expenseBackground],
          ] as const
        ).map(([label, value, color, background]) => (
          <View
            key={label}
            style={{
              flex: 1,
              minWidth: 110,
              gap: 4,
              padding: 12,
              borderRadius: 18,
              backgroundColor: background,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: color,
                }}
              />
              <Text
                style={{
                  ...typography.body,
                  fontSize: 12,
                  color,
                }}
              >
                {label}
              </Text>
            </View>
            <Text style={{ ...typography.bodyMedium, fontSize: 18, color }}>
              {money(value)}
            </Text>
          </View>
        ))}
      </View>
      <View
        accessible
        accessibilityLabel={`${year.label} monthly income and spending chart. Open monthly totals for exact amounts.`}
        style={{
          flexDirection: "row",
          gap: 5,
          alignItems: "flex-end",
          height: 112,
          paddingTop: 8,
        }}
      >
        {year.months.map((row) => (
          <View
            key={row.month}
            style={{
              flex: 1,
              gap: 6,
              alignItems: "center",
              opacity: row.future ? 0.3 : 1,
            }}
          >
            <View
              style={{
                height: 80,
                flexDirection: "row",
                gap: 2,
                alignItems: "flex-end",
                width: "100%",
              }}
            >
              <View
                style={{
                  flex: 1,
                  height: Math.max(2, (row.income / max) * 80),
                  backgroundColor: row.incomeCount
                    ? incomeForeground
                    : theme.colors.outlineVariant,
                  borderRadius: 2,
                }}
              />
              <View
                style={{
                  flex: 1,
                  height: Math.max(2, (row.expense / max) * 80),
                  backgroundColor: row.expenseCount
                    ? expenseForeground
                    : theme.colors.outlineVariant,
                  borderRadius: 2,
                }}
              />
            </View>
            <Text
              style={{
                ...typography.body,
                fontSize: 10,
                color:
                  row.month === selectedMonth
                    ? theme.colors.primary
                    : theme.colors.onSurfaceVariant,
              }}
            >
              {new Date(`${row.month}-01T00:00:00`).toLocaleDateString(
                undefined,
                { month: "narrow" },
              )}
            </Text>
          </View>
        ))}
      </View>
      <CardFooterAction label="Monthly totals" onPress={onShowTotals} />
    </View>
  );
}

export function YearMonthlyTotals({
  year,
  selectedMonth,
  money,
  onMonth,
}: {
  year: Data["year"];
  selectedMonth: string;
  money: (value: number) => string;
  onMonth: (month: string) => void;
}) {
  const theme = useTheme<ExtendedMD3Theme>();
  return (
    <View style={{ gap: 8 }}>
      {[...year.months].sort((a, b) => a.month.localeCompare(b.month)).map((row) => {
        const selected = row.month === selectedMonth;
        return (
          <MotionPressable key={row.month} onPress={() => onMonth(row.month)} disabled={row.future}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled: row.future }}
            accessibilityLabel={`${monthLabel(row.month)}${row.isPartial ? ", so far" : ""}. ${row.future ? "Upcoming" : `Income ${row.incomeCount ? money(row.income) : "not recorded"}, spent ${row.expenseCount ? money(row.expense) : "not recorded"}. View month.`}`}
            style={{ padding: 14, gap: 12, borderRadius: theme.expressive ? 24 : 16,
              backgroundColor: selected ? theme.colors.secondaryContainer : theme.colors.surface,
              opacity: row.future ? 0.5 : 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ ...typography.bodyStrong, fontSize: 16, flex: 1 }}>
                {new Date(`${row.month}-01T00:00:00`).toLocaleDateString(undefined, { month: "long" })}
              </Text>
              <Text style={{ ...typography.body, fontSize: 11, color: theme.colors.onSurfaceVariant }}>
                {row.future ? "Upcoming" : row.isPartial ? "So far" : selected ? "Selected" : ""}
              </Text>
              {!row.future ? <MaterialCommunityIcons name="chevron-right" size={18} color={theme.colors.onSurfaceVariant} /> : null}
            </View>
            {!row.future ? <View style={{ flexDirection: "row", gap: 12 }}>
              {(["income", "expense"] as const).map((type) => <View key={type} style={{ flex: 1, gap: 4 }}>
                <Text style={{ ...typography.body, fontSize: 11, color: theme.colors.onSurfaceVariant }}>{type === "income" ? "Income" : "Spent"}</Text>
                <Text numberOfLines={1} adjustsFontSizeToFit style={{ ...typography.bodyStrong, fontSize: 16, color: theme.semantic[type] }}>
                  {(type === "income" ? row.incomeCount : row.expenseCount) ? money(type === "income" ? row.income : row.expense) : "—"}
                </Text>
              </View>)}
            </View> : null}
          </MotionPressable>
        );
      })}
      <Text style={{ ...typography.body, fontSize: 12, paddingTop: 4, color: theme.colors.onSurfaceVariant }}>— No entries · tap a month to explore</Text>
    </View>
  );
}
