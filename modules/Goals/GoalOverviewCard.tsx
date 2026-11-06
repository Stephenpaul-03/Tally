import React from "react";
import { Pressable, View } from "react-native";
import { Button, useTheme } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { DesignText as Text } from "@/components/DesignText";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { goalProgress, type Goal } from "@/modules/Goals/model";
import { goalTone } from "@/modules/Goals/appearance";
import { mixHex } from "@/theme/expressivePalette";
import { ledgerMoney } from "@/modules/Main/presentation";

/** Shared goal overview for Home, management and progress sheets. */
export function GoalOverviewCard({ goal, onPress, onProgress, editing = false, showReason = false }: {
  goal?: Goal; onPress?: () => void; onProgress?: () => void; editing?: boolean; showReason?: boolean;
}) {
  const theme = useTheme<ExtendedMD3Theme>();
  const { tonalSettingsCardsEnabled, minimalIconsEnabled } = useAddonPrefs();
  const tone = goalTone(goal?.color, theme, tonalSettingsCardsEnabled);
  const state = goal ? goalProgress(goal) : null;
  const money = (amount: number) => goal ? ledgerMoney(amount, goal.currencyCode, goal.currencySymbol) : "";
  const progressColor = theme.expressive && tonalSettingsCardsEnabled ? tone.foreground : tone.iconForeground;
  const inactiveColor = mixHex(tone.background, progressColor, 0.12);
  return <View style={{ padding: 18, gap: 16, borderRadius: theme.expressive ? 30 : 18,
    ...(theme.expressive ? { borderTopRightRadius: 12 } : { borderWidth: 0.5, borderColor: tone.border }),
    backgroundColor: tone.background }}>
    <Pressable onPress={onPress} disabled={!onPress} accessible={Boolean(onPress)} accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={onPress ? goal ? `${editing ? "Edit" : "View"} ${goal.name}, ${money(goal.saved)} saved of ${money(goal.target)}` : "Create your first goal" : undefined}
      style={({ pressed }) => ({ gap: 16, opacity: pressed ? 0.72 : 1 })}>
    <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
      <View style={{ width: 76, height: 76, alignItems: "center", justifyContent: "center" }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {state ? Array.from({ length: 16 }, (_, index) => <View key={index} style={{ position: "absolute", left: 36, top: 34, width: 4, height: 8, borderRadius: 2,
          backgroundColor: state.fraction * 16 >= index + 1 ? progressColor : inactiveColor,
          transform: [{ rotate: `${index * 22.5}deg` }, { translateY: -32 }] }} />) : null}
        <View style={{ width: state ? 46 : 64, height: state ? 46 : 64, borderRadius: theme.expressive ? 20 : 14, backgroundColor: minimalIconsEnabled ? "transparent" : tone.iconBackground, alignItems: "center", justifyContent: "center" }}>
          <Icon name={goal ? goal.icon as React.ComponentProps<typeof Icon>["name"] : "flag-outline"} size={26} color={tone.iconForeground} />
        </View>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text numberOfLines={1} style={{ color: tone.foreground, fontSize: 16, fontWeight: "700", flex: 1 }}>{goal?.name || "Something to save for?"}</Text>
          {onPress ? <Icon name={editing ? "pencil-outline" : "arrow-top-right"} size={19} color={tone.foreground} /> : null}
        </View>
        {goal ? <>
          <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 30, lineHeight: 36, fontWeight: "800", letterSpacing: -0.8, color: tone.foreground }}>{money(goal.saved)}</Text>
          <Text numberOfLines={1} style={{ color: tone.foreground, opacity: 0.75, fontSize: 12 }}>saved of {money(goal.target)}</Text>
        </> : <Text style={{ color: tone.foreground, opacity: 0.8, fontSize: 13, lineHeight: 20 }}>Pick a target. Make it happen, a little at a time.</Text>}
      </View>
    </View>
    {showReason && !!goal?.reason ? <Text style={{ color: tone.foreground, opacity: 0.8, fontSize: 13, lineHeight: 20 }}>{goal.reason}</Text> : null}
    {goal && state ? <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: mixHex(tone.background, tone.foreground, 0.18) }}>
      <Text style={{ color: tone.foreground, fontSize: 12, fontWeight: "700", flexGrow: 1 }}>{state.complete ? "Goal reached" : `${Math.round(state.fraction * 100)}% saved · ${money(state.remaining)} to go`}</Text>
      {goal.deadline ? <Text style={{ color: tone.foreground, opacity: 0.75, fontSize: 12 }}>By {new Date(`${goal.deadline}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</Text> : null}
    </View> : <View style={{ alignSelf: "flex-end", flexDirection: "row", alignItems: "center", gap: 6 }}><Icon name="plus" size={16} color={tone.foreground} /><Text style={{ fontSize: 13, fontWeight: "700", color: tone.foreground }}>Create a goal</Text></View>}
    </Pressable>
    {onProgress ? <Button mode="contained" icon="plus-minus" onPress={onProgress} buttonColor={tone.iconForeground} textColor={tone.iconBackground} contentStyle={{ minHeight: 44 }}>Update progress</Button> : null}
  </View>;
}
