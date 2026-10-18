import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import Animated from "react-native-reanimated";
import { percentLabel, type calculateInsights } from "../calculations";
import { AnimatedBar, MotionPressable, insightLayout } from "./Motion";
import { CardDivider, Muted, styles } from "./Primitives";

type Data = ReturnType<typeof calculateInsights>;
type Icon = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
export function InsightCard({
  title,
  icon = "chart-box-outline",
  color,
  value,
  headerAction,
  children,
}: {
  title?: string;
  icon?: Icon;
  color?: string;
  value?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const accent = color ?? theme.colors.primary;
  return (
    <Animated.View
      layout={insightLayout}
      style={{
        padding: 14,
        borderRadius: 20,
        gap: 10,
        overflow: "hidden",
        backgroundColor: theme.colors.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.outlineVariant,
      }}
    >
      {title ? (
        <>
          <View style={[styles.row, { minHeight: 20 }, headerAction ? { flexWrap: "wrap", gap: 8 } : null]}>
            <MaterialCommunityIcons name={icon} size={26} color={accent} />
            <Text
              accessibilityRole="header"
              style={{
                ...typography.editorial.sectionLabel,
                fontSize: 18,
                lineHeight: 22,
                minWidth: headerAction ? 72 : undefined,
                flex: 1,
                color: theme.colors.onSurface,
              }}
            >
              {title}
            </Text>
            {headerAction ?? (value ? (
              <Text
                style={{
                  ...typography.editorial.sectionLabel,
                  fontSize: 14,
                  lineHeight: 18,
                  color: theme.colors.onSurface,
                  flexShrink: 1,
                }}
              >
                {value}
              </Text>
            ) : null)}
          </View>
          <CardDivider />
        </>
      ) : null}
      {children}
    </Animated.View>
  );
}
export function MoneyHero({
  data,
  money,
  onIncome,
  onSpending,
}: {
  data: Data;
  money: (value: number) => string;
  onIncome: () => void;
  onSpending: () => void;
}) {
  const theme = useTheme<ExtendedMD3Theme>();
  const empty = data.current.length === 0;
  const balanceLabel = "Balance";
  const balance = data.remaining;
  const balanceColor = empty
    ? theme.colors.onSurfaceVariant
    : !data.hasIncome || balance < 0
      ? theme.semantic.expense
      : !data.hasSpending
        ? theme.semantic.income
        : theme.colors.onSurface;
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 10,
        paddingVertical: 8,
      }}
    >
      <View style={{ flexGrow: 1, flexBasis: 120, gap: 4 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={{
              ...typography.body,
              fontSize: 12,
              color: theme.colors.onSurfaceVariant,
            }}
          >
            {balanceLabel}
          </Text>
          <Text
            style={{
              ...typography.bodyMedium,
              fontSize: 22,
              letterSpacing: -0.5,
              color: balanceColor,
            }}
          >
            {empty ? "—" : money(balance)}
          </Text>
        </View>
      </View>
      {empty || data.hasIncome ? (
        <HeroValue
          label="Income"
          icon="arrow-bottom-left"
          color={theme.semantic.income}
          value={empty ? "—" : money(data.income)}
          disabled={empty}
          onPress={onIncome}
        />
      ) : null}
      {empty || data.hasSpending ? (
        <HeroValue
          label="Spent"
          icon="arrow-top-right"
          color={theme.semantic.expense}
          value={empty ? "—" : money(data.expense)}
          disabled={empty}
          onPress={onSpending}
        />
      ) : null}
    </View>
  );
}
function HeroValue({
  label,
  icon,
  color,
  value,
  onPress,
  disabled = false,
}: {
  label: string;
  icon: Icon;
  color: string;
  value: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <MotionPressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={disabled ? "text" : "button"}
      accessibilityLabel={disabled ? `${label}, no entries recorded` : `${label}, ${value}. View entries.`}
      style={{
        flexGrow: 1,
        flexBasis: 90,
        padding: 8,
        borderRadius: 16,
        backgroundColor: color + "0D",
        borderColor: color + "30",
        borderWidth: 0.5,
        gap: 4,
      }}
    >
      <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
        <MaterialCommunityIcons name={icon} size={16} color={color} />
        <Text
          style={{
            ...typography.body,
            fontSize: 12,
            color: theme.colors.onSurfaceVariant,
          }}
        >
          {label}
        </Text>
      </View>
      <Text style={{ ...typography.bodyMedium, fontSize: 16, color }}>
        {value}
      </Text>
    </MotionPressable>
  );
}
export function IncomeUsage({
  data,
  money,
}: {
  data: Data;
  money: (value: number) => string;
}) {
  const theme = useTheme<ExtendedMD3Theme>();
  if (data.usedPercent === null) return <Muted>No income recorded</Muted>;
  return (
    <View style={{ gap: 8, paddingVertical: 6 }}>
      <View style={[styles.row, { flexWrap: "wrap" }]}>
        <Text style={{ ...typography.body, fontSize: 13 }}>
          {percentLabel(data.usedPercent)} used
        </Text>
        <Text
          style={{
            ...typography.body,
            fontSize: 13,
            color:
              data.remaining < 0
                ? theme.semantic.expense
                : theme.semantic.income,
          }}
        >
          {money(Math.abs(data.remaining))}{" "}
          {data.remaining < 0 ? "shortfall" : "left"}
        </Text>
      </View>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Income used by spending"
        accessibilityValue={{
          min: 0,
          max: 100,
          now: Math.min(100, Math.round(data.usedPercent)),
          text: `${percentLabel(data.usedPercent)} of income used`,
        }}
      >
        <AnimatedBar
          fraction={data.usedPercent / 100}
          color={theme.semantic.expense}
          trackColor={theme.semantic.income + "35"}
        />
      </View>
    </View>
  );
}
