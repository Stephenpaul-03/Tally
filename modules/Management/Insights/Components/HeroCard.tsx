import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import type { RootParamList } from "@/navigation/types";
import { formatInsightMoney, useHeroBalanceSummary } from "../Hooks";
import { insightStyles } from "../Styles";

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatMonthYear(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function HeroCard() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const summary = useHeroBalanceSummary();
  const today = new Date();
  const hasBudget = summary.budget > 0;
  const averagePerDay = summary.spent / Math.max(1, today.getDate());
  const metrics = [
    ["arrow-down-left", "Income", summary.income, theme.colors.primary],
    ["arrow-up-right", "Expense", summary.spent, theme.colors.error],
    ["wallet-outline", "Budget left", summary.budgetLeft, summary.budgetLeft < 0 ? theme.colors.error : theme.colors.primary],
    ["chart-line", "Avg. per day", averagePerDay, theme.colors.onSurface],
  ] as const;

  return (
    <View style={insightStyles.heroLayout}>
      <View style={[insightStyles.heroMain, { backgroundColor: theme.colors.elevation.level1 }]}>
        <Text
          numberOfLines={1}
          style={[insightStyles.heroGreeting, { color: theme.colors.onSurface }]}
        >
          {greetingForHour(today.getHours())}
        </Text>
        <Text style={[insightStyles.heroDate, { color: theme.colors.onSurface }]}>
          {formatMonthYear(today)}
        </Text>
        <Text style={[insightStyles.heroRemainingLabel, { color: theme.colors.onSurfaceVariant }]}>You have left</Text>
        <Text style={[insightStyles.heroRemaining, { color: summary.budgetLeft >= 0 ? theme.colors.primary : theme.colors.error }]}>
          {hasBudget ? formatInsightMoney(summary.budgetLeft) : "Set a budget"}
        </Text>
        {hasBudget && (
          <View style={insightStyles.heroProgressRow}>
            <View style={[insightStyles.heroProgressTrack, { backgroundColor: theme.colors.outlineVariant }]}>
              <View
                style={[
                  insightStyles.heroProgressFill,
                  {
                    backgroundColor: theme.colors.primary,
                    flex: Math.max(0.01, Math.min(100, 100 - summary.budgetUsed)),
                  },
                ]}
              />
              <View
                style={{
                  flex: Math.max(0.01, Math.min(100, summary.budgetUsed)),
                }}
              />
            </View>
            <Text style={[insightStyles.heroProgressLabel, { color: theme.colors.onSurfaceVariant }]}>
              {Math.max(0, Math.round(100 - summary.budgetUsed))}% left
            </Text>
          </View>
        )}
        <View style={[insightStyles.heroDivider, { backgroundColor: theme.colors.outlineVariant }]} />
        <View style={[insightStyles.heroTodayChip, { backgroundColor: theme.colors.elevation.level2 }]}>
          <View style={[insightStyles.heroTodayDot, { backgroundColor: theme.colors.primary }]} />
          <Text style={[insightStyles.heroTodayText, { color: theme.colors.onSurfaceVariant }]}>
            Today · {today.getDate()} {new Intl.DateTimeFormat("en-IN", { month: "short" }).format(today)}
          </Text>
        </View>
      </View>

      <View style={insightStyles.heroMetrics}>
        {metrics.map(([icon, label, amount, color]) => (
          <View key={label} style={[insightStyles.heroMetric, { backgroundColor: theme.colors.elevation.level1 }]}>
            <View style={[insightStyles.heroMetricIcon, { borderColor: color }]}>
              <MaterialCommunityIcons name={icon} size={25} color={color} />
            </View>
            <View style={insightStyles.heroMetricText}>
              <Text numberOfLines={1} style={[insightStyles.heroMetricLabel, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
              <Text numberOfLines={1} adjustsFontSizeToFit style={[insightStyles.heroMetricValue, { color: theme.colors.onSurface }]}>{formatInsightMoney(amount)}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
          </View>
        ))}
        {!hasBudget && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Set budget"
            onPress={() => navigation.navigate("Settings", { section: "budget" })}
            style={[insightStyles.setBudgetButton, { backgroundColor: theme.colors.elevation.level1 }]}
          >
            <MaterialCommunityIcons name="plus-circle-outline" size={18} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.primary }}>Set budget</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
