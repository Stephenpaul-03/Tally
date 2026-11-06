import { GoalOverviewCard } from "./GoalOverviewCard";
import { useIsFocused } from "@react-navigation/native";
import Animated, { FadeIn, FadeOut, ReduceMotion, useReducedMotion } from "react-native-reanimated";
import React from "react";
import { AppState, StyleSheet, View } from "react-native";
import { Button, useTheme } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { DesignText as Text } from "@/components/DesignText";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { type Goal } from "./model";

export function GoalCard({ goal, compact = false, onEdit, onProgress }: {
  goal: Goal; compact?: boolean; onEdit?: () => void; onProgress?: () => void;
}) {
  return <GoalOverviewCard goal={goal} onPress={onEdit} editing={!compact} showReason={!compact} onProgress={compact ? undefined : onProgress} />;
}

export function GoalsEmptyCard({ onCreate, compact = false, active = true }: { onCreate: () => void; compact?: boolean; active?: boolean }) {
  const theme = useTheme<ExtendedMD3Theme>();
  const c = theme.colors;
  const focused = useIsFocused();
  const reducedMotion = useReducedMotion();
  const [foreground, setForeground] = React.useState(AppState.currentState === "active");
  const [index, setIndex] = React.useState(0);
  React.useEffect(() => {
    const listener = AppState.addEventListener("change", state => setForeground(state === "active"));
    return () => listener.remove();
  }, []);
  React.useEffect(() => {
    if (compact || !active || !focused || !foreground || reducedMotion) return;
    const timer = setInterval(() => setIndex(value => (value + 1) % 3), 2800);
    return () => clearInterval(timer);
  }, [compact, active, focused, foreground, reducedMotion]);
  const icon = (["flag-checkered", "target", "piggy-bank-outline"] as const)[index];
  return <View style={{ alignSelf: "center", width: "100%", maxWidth: compact ? undefined : 360, padding: compact ? 18 : 28, gap: 16, borderRadius: theme.expressive ? 30 : 18, backgroundColor: c.surface, alignItems: compact ? "flex-start" : "center" }}>
    <View style={{ width: compact ? 44 : 76, height: compact ? 44 : 76, borderRadius: theme.expressive ? 26 : 16, backgroundColor: c.primaryContainer, alignItems: "center", justifyContent: "center" }}><View style={{ width: compact ? 24 : 36, height: compact ? 24 : 36 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View key={icon} style={StyleSheet.absoluteFill} entering={FadeIn.duration(240).reduceMotion(ReduceMotion.System)} exiting={FadeOut.duration(180).reduceMotion(ReduceMotion.System)}><Icon name={icon} size={compact ? 24 : 36} color={c.onPrimaryContainer} /></Animated.View>
    </View></View>
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: compact ? 19 : 26, fontWeight: "800", color: c.onSurface, textAlign: compact ? "left" : "center" }}>Give your savings a purpose</Text>
      <Text style={{ color: c.onSurfaceVariant, textAlign: compact ? "left" : "center", lineHeight: 21 }}>A rainy-day fund or something to look forward to. Set a target and build it at your pace.</Text>
    </View>
    <Button mode={theme.expressive ? "contained" : "outlined"} icon="plus" onPress={onCreate}>Create a goal</Button>
  </View>;
}
