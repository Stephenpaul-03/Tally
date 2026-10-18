import { useInsightsExpansion } from "@/components/InsightsExpansionContext";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated";

export function InsightsEmptyState({
  expanded,
  hasOtherMonths,
  onAdd,
  onChooseMonth,
}: {
  expanded: boolean;
  hasOtherMonths: boolean;
  onAdd: () => void;
  onChooseMonth: () => void;
}) {
  const theme = useTheme<ExtendedMD3Theme>();
  const expansion = useInsightsExpansion();
  const reveal = useAnimatedStyle(() => {
    const progress = expansion ? expansion.value : expanded ? 1 : 0;
    return {
      opacity: interpolate(progress, [0.2, 0.85], [0, 1], "clamp"),
      transform: [{ translateY: interpolate(progress, [0, 1], [16, 0], "clamp") }],
    };
  });

  return (
    <View>
      <Animated.View
        pointerEvents={expanded ? "auto" : "none"}
        accessibilityElementsHidden={!expanded}
        importantForAccessibility={expanded ? "auto" : "no-hide-descendants"}
        style={[s.content, reveal]}
      >
        <View style={s.illustration} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <MaterialCommunityIcons name="chart-timeline-variant" size={64} color={theme.colors.primary} />
          <View style={[s.illustrationMark, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons name={hasOtherMonths ? "calendar-blank-outline" : "plus"}
              size={20} color={theme.colors.onPrimaryContainer} />
          </View>
        </View>
        <Text accessibilityRole="header" style={[s.title, { color: theme.colors.onSurface }]}>
          {hasOtherMonths ? "A quiet month so far" : "Make your first tally"}
        </Text>
        <Text style={[s.description, { color: theme.colors.onSurfaceVariant }]}>
          {hasOtherMonths
            ? "Your other months are ready to explore. Add an entry whenever this month gets going."
            : "Add income or an expense. Your categories, accounts and daily activity will take shape here."}
        </Text>
        <View style={s.actions}>
          <Button labelStyle={s.buttonLabel} mode="contained" icon={hasOtherMonths ? "calendar-search" : "plus"}
            onPress={hasOtherMonths ? onChooseMonth : onAdd} contentStyle={{ minHeight: 44 }}>
            {hasOtherMonths ? "Explore other months" : "Add transaction"}
          </Button>
          {hasOtherMonths ? <Button labelStyle={s.buttonLabel} mode="text" icon="plus" onPress={onAdd}>Add transaction</Button> : null}
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  content: { alignItems: "center", paddingTop: 44, paddingBottom: 28, gap: 12 },
  illustration: { width: 88, height: 80, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  illustrationMark: { position: "absolute", right: 0, bottom: 0, width: 32, height: 32, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  title: { ...typography.editorial.sectionLabel, fontSize: 18, lineHeight: 24, textAlign: "center" },
  description: { ...typography.body, fontSize: 14, lineHeight: 22, textAlign: "center", maxWidth: 280 },
  buttonLabel: { ...typography.editorial.sectionLabel, fontSize: 18, lineHeight: 22 },
  actions: { alignItems: "center", gap: 4, marginTop: 10 },
});
