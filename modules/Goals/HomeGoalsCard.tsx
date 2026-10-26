import { goalTone } from "./appearance";
import React from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { DesignText as Text } from "@/components/DesignText";
import { useAppSelector } from "@/hooks/Redux";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { ledgerMoney } from "@/modules/Main/presentation";
import { goalProgress } from "./model";
import { useGoals } from "./store";
export function HomeGoalsCard({ onPress }: { onPress: () => void }) {
  const theme = useTheme<ExtendedMD3Theme>();
  const workspace = useAppSelector(selectActiveWorkspace);
  const { goals } = useGoals(workspace?.id || "personal");
  const selected = goals.find((g) => !goalProgress(g).complete) ?? goals[0];
  const state = selected ? goalProgress(selected) : null;
  const tone = goalTone(selected?.color, theme);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        selected
          ? `Goals, ${selected.name}, ${Math.round(state!.fraction * 100)} percent saved. Open goals.`
          : "Set your first savings goal"
      }
      onPress={onPress}
      style={({ pressed }) => ({
        padding: 16,
        borderRadius: theme.expressive ? 28 : 20,
        borderWidth: theme.expressive ? 0 : 0.5,
        borderColor: tone.border,
        backgroundColor: tone.background,
        gap: 10,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text
        style={{
          color: tone.foreground,
          opacity: 0.65,
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 0.6,
        }}
      >
        GOALS{goals.length > 1 ? ` · ${goals.length}` : ""}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Icon
          name={
            (selected?.icon || "target") as React.ComponentProps<
              typeof Icon
            >["name"]
          }
          size={28}
          color={tone.iconForeground}
        />
        <View style={{ flex: 1, gap: 3 }}>
          <Text
            style={{ fontSize: 16, fontWeight: "800", color: tone.foreground }}
          >
            {selected?.name || "Something to save for?"}
          </Text>
          <Text style={{ fontSize: 12, color: tone.foreground }}>
            {selected
              ? `${ledgerMoney(selected.saved, selected.currencyCode, selected.currencySymbol)} of ${ledgerMoney(selected.target, selected.currencyCode, selected.currencySymbol)}${goals.length > 1 ? ` · ${goals.length} goals` : ""}`
              : "Create a goal and track your progress"}
          </Text>
        </View>
        <Icon name="chevron-right" size={22} color={tone.foreground} />
      </View>
      {state && (
        <View
          style={{
            height: 6,
            backgroundColor: tone.iconBackground,
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${state.fraction * 100}%`,
              height: "100%",
              backgroundColor: tone.iconForeground,
            }}
          />
        </View>
      )}
    </Pressable>
  );
}
