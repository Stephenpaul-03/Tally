import { useIsFocused } from "@react-navigation/native";
import React from "react";
import { AppState, StyleSheet, View } from "react-native";
import { Button, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut, ReduceMotion, useReducedMotion } from "react-native-reanimated";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { DesignText as Text } from "@/components/DesignText";
import { fontFamilies } from "@/theme/typography";

/** Cycle only the decorative icon while this page is visible. */
export function MonthEmptyState({ insights = false, filtered = false, active = true, onAdd, onChooseMonth }: {
  insights?: boolean;
  active?: boolean;
  filtered?: boolean;
  onAdd?: () => void;
  onChooseMonth?: () => void;
}) {
  const theme = useTheme<ExtendedMD3Theme>();
  const c = theme.colors;
  const expressive = Boolean(theme.expressive);
  const focused = useIsFocused();
  const reducedMotion = useReducedMotion();
  const [foreground, setForeground] = React.useState(AppState.currentState === "active");
  const [iconIndex, setIconIndex] = React.useState(0);
  React.useEffect(() => {
    const listener = AppState.addEventListener("change", state => setForeground(state === "active"));
    return () => listener.remove();
  }, []);
  React.useEffect(() => {
    if (!active || !focused || !foreground || reducedMotion) return;
    const timer = setInterval(() => setIconIndex(index => (index + 1) % 3), 2800);
    return () => clearInterval(timer);
  }, [active, focused, foreground, reducedMotion]);
  const icons = filtered ? ["magnify", "filter-outline", "text-search"] as const
    : insights ? ["chart-bar", "chart-donut", "chart-timeline-variant"] as const
    : ["receipt-text-outline", "wallet-outline", "cash-multiple"] as const;
  const icon = icons[iconIndex];
  return <View style={[s.container, expressive ? s.expressive : s.classic]}>
    <Animated.View style={s.illustration} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {expressive ? <>
        <View style={[s.backdrop, { backgroundColor: c.secondaryContainer }]} />
        <View style={[s.expressiveSheet, { backgroundColor: c.primaryContainer }]}>
          <View style={{ width: 42, height: 42 }}><Animated.View key={icon} style={StyleSheet.absoluteFill} entering={FadeIn.duration(240).reduceMotion(ReduceMotion.System)} exiting={FadeOut.duration(180).reduceMotion(ReduceMotion.System)}><MaterialCommunityIcons name={icon} size={42} color={c.onPrimaryContainer} /></Animated.View></View>
          <View style={[s.rule, { backgroundColor: c.onPrimaryContainer, opacity: 0.2 }]} />
          <View style={[s.shortRule, { backgroundColor: c.onPrimaryContainer, opacity: 0.12 }]} />
        </View>
        <View style={[s.mark, { backgroundColor: c.primary }]}>
          <MaterialCommunityIcons name={filtered ? "magnify" : "plus"} size={22} color={c.onPrimary} />
        </View>
      </> : <View style={[s.classicSheet, { borderColor: c.outlineVariant, backgroundColor: c.surface }]}>
        <View style={{ width: 30, height: 30 }}><Animated.View key={icon} style={StyleSheet.absoluteFill} entering={FadeIn.duration(240).reduceMotion(ReduceMotion.System)} exiting={FadeOut.duration(180).reduceMotion(ReduceMotion.System)}><MaterialCommunityIcons name={icon} size={30} color={c.primary} /></Animated.View></View>
        <View style={[s.rule, { backgroundColor: c.outlineVariant }]} />
        <View style={[s.shortRule, { backgroundColor: c.outlineVariant }]} />
      </View>}
    </Animated.View>
    <Animated.View style={s.copy}>
      <Text accessibilityRole="header" style={[
        expressive ? s.expressiveTitle : s.classicTitle, { color: c.onSurface },
      ]}>
        {filtered ? "No matching entries" : insights ? "Nothing to chart. Yet." : "A fresh start."}
      </Text>
      <Text style={[s.description, { color: c.onSurfaceVariant }]}>
        {filtered ? "Try another search or adjust your filters." : insights
          ? "Add an entry to see this month’s picture take shape."
          : "Your first income or expense starts this month’s story."}
      </Text>
    </Animated.View>
    {!filtered && (onAdd || onChooseMonth) ? <Animated.View style={s.actions}>
      {onAdd ? <Button mode={expressive ? "contained" : "outlined"} icon="plus" onPress={onAdd}
        style={{ borderRadius: expressive ? 24 : 12, borderColor: c.outlineVariant }}
        labelStyle={expressive ? s.expressiveAction : s.classicAction}
        contentStyle={{ minHeight: 48, paddingHorizontal: 8 }}>Add transaction</Button> : null}
      {onChooseMonth ? <Button mode="text" onPress={onChooseMonth}
        labelStyle={expressive ? s.expressiveAction : s.classicAction}
        contentStyle={{ minHeight: 44 }}>Choose another month</Button> : null}
    </Animated.View> : null}
  </View>;
}
const s = StyleSheet.create({
  container: { alignSelf: "center", width: "100%", maxWidth: 360, paddingHorizontal: 20, paddingVertical: 24, alignItems: "center" },
  expressive: { gap: 24 },
  classic: { gap: 20 },
  illustration: { width: 148, height: 132, alignItems: "center", justifyContent: "center" },
  backdrop: { position: "absolute", width: 112, height: 104, borderRadius: 40, transform: [{ rotate: "-12deg" }], left: 9, top: 12 },
  expressiveSheet: { width: 104, height: 116, borderTopLeftRadius: 32, borderTopRightRadius: 32, borderBottomRightRadius: 32, borderBottomLeftRadius: 10, alignItems: "center", justifyContent: "center", gap: 9 },
  mark: { position: "absolute", right: 4, bottom: 0, width: 40, height: 40, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  classicSheet: { width: 82, height: 100, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, alignItems: "center", justifyContent: "center", gap: 12 },
  rule: { width: 42, height: 3, borderRadius: 2 },
  shortRule: { width: 26, height: 3, borderRadius: 2 },
  copy: { alignItems: "center", gap: 10 },
  expressiveTitle: { fontSize: 29, lineHeight: 34, letterSpacing: -0.8, fontWeight: "800", textAlign: "center" },
  classicTitle: { fontFamily: fontFamilies.sansBold, fontSize: 21, lineHeight: 28, textAlign: "center" },
  description: { fontFamily: fontFamilies.sansRegular, fontSize: 14, lineHeight: 22, textAlign: "center", maxWidth: 270 },
  actions: { alignItems: "center", gap: 4 },
  expressiveAction: { fontFamily: "Figtree-700", fontWeight: "normal", fontSize: 14 },
  classicAction: { fontFamily: fontFamilies.sansSemibold, fontWeight: "normal", fontSize: 14 },
});
