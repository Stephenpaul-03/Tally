import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { typography } from "@/theme/typography";
import { AnimatedBar, MotionPressable } from "./Motion";

export const styles = StyleSheet.create({
  section: { gap: 12 },
  title: { ...typography.editorial.sectionLabel, fontSize: 18, letterSpacing: 0.8 },
  muted: { ...typography.body, fontSize: 13, lineHeight: 19 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  value: { ...typography.bodyStrong, fontSize: 16, fontVariant: ["tabular-nums"], flexShrink: 1 },
  heroValue: { ...typography.bodyStrong, fontSize: 46, letterSpacing: -1.4, fontVariant: ["tabular-nums"] },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 20 },
  metric: { gap: 5, flexGrow: 1, flexBasis: 130 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});

export function Section({ title, children, action }: {
  title: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  const theme = useTheme();
  return <View style={styles.section}>
    <View style={styles.row}>
      <Text accessibilityRole="header" style={[styles.title, { flex: 1, color: theme.colors.onSurfaceVariant }]}>{title}</Text>
      {action}
    </View>
    {children}
  </View>;
}
export function Muted({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return <Text style={[styles.muted, { color: theme.colors.onSurfaceVariant }]}>{children}</Text>;
}
export function Chip({ label, selected = false, onPress, disabled = false }: {
  label: string; selected?: boolean; onPress: () => void; disabled?: boolean;
}) {
  const theme = useTheme();
  return <MotionPressable accessibilityRole="button" accessibilityState={{ selected, disabled }}
    accessibilityLabel={label} disabled={disabled} onPress={onPress}
    style={{ paddingHorizontal: 16, paddingVertical: 10, minHeight: 44, justifyContent: "center", borderRadius: 22,
      opacity: disabled ? 0.35 : 1, alignSelf: "flex-start", maxWidth: "100%",
      backgroundColor: selected ? theme.colors.primary : theme.colors.elevation.level1 }}>
    <Text style={{ ...typography.bodyMedium, color: selected ? theme.colors.onPrimary : theme.colors.onSurface, fontSize: 14 }}>{label}</Text>
  </MotionPressable>;
}
export function TextAction({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return <MotionPressable accessibilityRole="button" onPress={onPress}
    style={{ minHeight: 44, justifyContent: "center", alignSelf: "flex-start", maxWidth: "100%" }}>
    <Text style={{ ...typography.bodyMedium, fontSize: 14, color: theme.colors.primary }}>{label}</Text>
  </MotionPressable>;
}
export function Disclosure({ label, open, onPress }: {
  label: string; open: boolean; onPress: () => void;
}) {
  const theme = useTheme();
  const rotation = useSharedValue(open ? 180 : 0);
  useEffect(() => { rotation.value = withTiming(open ? 180 : 0, { duration: 220, reduceMotion: ReduceMotion.System }); }, [open, rotation]);
  const arrow = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));
  return <MotionPressable onPress={onPress} accessibilityRole="button"
    accessibilityLabel={label} accessibilityState={{ expanded: open }}
    style={[styles.row, { minHeight: 44, paddingVertical: 8,
      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.outlineVariant }]}>
    <Text style={{ ...typography.body, fontSize: 13, flex: 1 }}>{label}</Text>
    <Animated.View style={arrow}>
      <MaterialCommunityIcons name="chevron-down" size={20} color={theme.colors.onSurfaceVariant} />
    </Animated.View>
  </MotionPressable>;
}
export function BudgetProgress({ budget, spent, money }: {
  budget: number; spent: number; money: (value: number) => string;
}) {
  const theme = useTheme();
  const remaining = budget - spent;
  const color = remaining < 0 ? theme.colors.error : theme.colors.primary;
  return <View style={{ gap: 10 }}>
    <View style={[styles.row, { flexWrap: "wrap" }]}>
      <Text style={{ ...typography.body, fontSize: 14, color: theme.colors.onSurfaceVariant }}>
        {remaining < 0 ? "Over budget" : "Budget remaining"}
      </Text>
      <Text style={[styles.value, { color: remaining < 0 ? theme.colors.error : theme.colors.onSurface }]}>
        {money(Math.abs(remaining))}
      </Text>
    </View>
    <View accessible accessibilityRole="progressbar" accessibilityLabel="Budget used"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(Math.min(100, spent / budget * 100)),
        text: `${money(spent)} spent of ${money(budget)} budget` }}>
      <AnimatedBar fraction={spent / budget} color={color} trackColor={theme.colors.elevation.level3} />
    </View>
    <Text style={{ ...typography.body, fontSize: 13, color: theme.colors.onSurfaceVariant }}>Monthly budget {money(budget)}</Text>
  </View>;
}
export function Metric({ label, value, comparison }: { label: string; value: string; comparison?: string }) {
  return <View style={styles.metric}><Muted>{label}</Muted>
    <Text style={[styles.value, { fontSize: 22 }]}>{value}</Text>{comparison ? <Muted>{comparison}</Muted> : null}</View>;
}
