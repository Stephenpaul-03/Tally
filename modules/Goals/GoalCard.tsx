import React from "react";
import { Pressable, View } from "react-native";
import { Button, useTheme } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { DesignText as Text } from "@/components/DesignText";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { ledgerMoney } from "@/modules/Main/presentation";
import { goalProgress, type Goal } from "./model";
import { goalTone } from "./appearance";

export function GoalCard({ goal, compact = false, onEdit, onProgress }: {
  goal: Goal; compact?: boolean; onEdit?: () => void; onProgress?: () => void;
}) {
  const theme = useTheme<ExtendedMD3Theme>();
  const { tonalSettingsCardsEnabled, minimalIconsEnabled } = useAddonPrefs();
  const tone = goalTone(goal.color, theme, tonalSettingsCardsEnabled);
  const state = goalProgress(goal);
  const money = (amount: number) => ledgerMoney(amount, goal.currencyCode, goal.currencySymbol);
  return <View style={{ backgroundColor: tone.background, borderRadius: theme.expressive ? 30 : 18,
    ...(theme.expressive ? { borderBottomLeftRadius: 12 } : { borderWidth: 0.5, borderColor: tone.border }), padding: compact ? 16 : 20, gap: compact ? 12 : 18 }}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: minimalIconsEnabled ? "transparent" : tone.iconBackground, alignItems: "center", justifyContent: "center" }}>
        <Icon name={goal.icon as React.ComponentProps<typeof Icon>["name"]} size={24} color={tone.iconForeground} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text numberOfLines={1} style={{ color: tone.foreground, fontSize: compact ? 17 : 20, fontWeight: "800" }}>{goal.name}</Text>
        <Text style={{ color: tone.foreground, opacity: 0.75, fontSize: 12 }}>{state.complete ? "Reached" : goal.deadline ? `By ${new Date(`${goal.deadline}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}` : "At your own pace"}</Text>
      </View>
      {onEdit ? <Pressable accessibilityRole="button" accessibilityLabel={`${compact ? "View" : "Edit"} ${goal.name}`} onPress={onEdit} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
        <Icon name={compact ? "chevron-right" : "pencil-outline"} size={21} color={tone.foreground} />
      </Pressable> : null}
    </View>
    {!compact && !!goal.reason && <Text style={{ color: tone.foreground, opacity: 0.8, lineHeight: 20 }}>{goal.reason}</Text>}
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: tone.foreground, fontSize: 11, fontWeight: "700" }}>SAVED</Text>
        <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: tone.foreground, fontSize: compact ? 26 : 34, fontWeight: "800", letterSpacing: -0.8 }}>{money(goal.saved)}</Text>
      </View>
      <Text style={{ color: tone.foreground, fontSize: 13, paddingBottom: 4 }}>of {money(goal.target)}</Text>
    </View>
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(state.fraction * 100) }} style={{ height: compact ? 6 : 10, backgroundColor: tone.iconBackground, borderRadius: 8, overflow: "hidden" }}>
      <View style={{ height: "100%", width: `${state.fraction * 100}%`, backgroundColor: tone.iconForeground, borderRadius: 8 }} />
    </View>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Text style={{ flex: 1, color: tone.foreground, fontSize: 12 }}>{state.complete ? "You made it" : `${money(state.remaining)} to go`} · {Math.round(state.fraction * 100)}%</Text>
      {!compact && onProgress && !state.complete ? <Button mode="contained" buttonColor={tone.iconForeground} textColor={tone.iconBackground} icon="plus" onPress={onProgress}>Add progress</Button> : null}
    </View>
  </View>;
}

export function GoalsEmptyCard({ onCreate, compact = false }: { onCreate: () => void; compact?: boolean }) {
  const theme = useTheme<ExtendedMD3Theme>();
  const c = theme.colors;
  return <View style={{ padding: compact ? 18 : 28, gap: 16, borderRadius: theme.expressive ? 30 : 18, backgroundColor: c.surface, alignItems: compact ? "flex-start" : "center" }}>
    <View style={{ width: compact ? 44 : 76, height: compact ? 44 : 76, borderRadius: theme.expressive ? 26 : 16, backgroundColor: c.primaryContainer, alignItems: "center", justifyContent: "center" }}><Icon name="flag-checkered" size={compact ? 24 : 36} color={c.onPrimaryContainer} /></View>
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: compact ? 19 : 26, fontWeight: "800", color: c.onSurface, textAlign: compact ? "left" : "center" }}>Give your savings a purpose</Text>
      <Text style={{ color: c.onSurfaceVariant, textAlign: compact ? "left" : "center", lineHeight: 21 }}>A rainy-day fund or something to look forward to. Set a target and build it at your pace.</Text>
    </View>
    <Button mode={theme.expressive ? "contained" : "outlined"} icon="plus" onPress={onCreate}>Create a goal</Button>
  </View>;
}
