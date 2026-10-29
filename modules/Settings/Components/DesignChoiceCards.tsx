import React from "react";
import { ManagementEntranceItem, useManagementEntranceProgress } from "@/components/animations/ManagementEntranceItem";
import { Pressable, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { DesignText as Text } from "@/components/DesignText";

type Choice = "sage" | "classic";
export function DesignChoiceCards({
  value,
  onChange,
  classicDisabled = false,
  purpose,
}: {
  value: Choice;
  onChange: (choice: Choice) => void;
  classicDisabled?: boolean;
  purpose: "layout" | "style";
}) {
  const { colors: c } = useTheme();
  const progress = useManagementEntranceProgress();
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 12,
        marginHorizontal: 20,
        marginBottom: 20,
      }}
    >
      {(["classic", "sage"] as const).map((choice, index) => {
        const selected = value === choice;
        const disabled = choice === "classic" && classicDisabled;
        return (
          <ManagementEntranceItem key={choice} progress={progress} index={index} style={{ flex: 1, aspectRatio: 1 }}>
          <Pressable
            accessibilityRole="radio"
            accessibilityLabel={`${choice === "sage" ? "Expressive" : "Classic"} ${purpose}${disabled ? ", requires Classic layout" : ""}`}
            accessibilityState={{ checked: selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(choice)}
            style={({ pressed }) => ({
              flex: 1,
              aspectRatio: 1,
              borderRadius: choice === "sage" ? 28 : 20,
              backgroundColor: selected
                ? c.primaryContainer
                : c.elevation.level1,
              borderWidth: selected ? 2 : 1,
              borderColor: selected ? c.primary : c.outlineVariant,
              padding: 14,
              justifyContent: "space-between",
              opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
            })}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <MaterialCommunityIcons
                name={
                  choice === "sage"
                    ? "view-dashboard-outline"
                    : "view-stream-outline"
                }
                color={selected ? c.onPrimaryContainer : c.onSurfaceVariant}
                size={28}
              />
              <MaterialCommunityIcons
                name={
                  selected
                    ? "check-circle"
                    : disabled
                      ? "lock-outline"
                      : "circle-outline"
                }
                size={20}
                color={c.primary}
              />
            </View>
            <View style={{ gap: 5 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "800",
                  color: selected ? c.onPrimaryContainer : c.onSurface,
                }}
              >
                {choice === "sage" ? "Expressive" : "Classic"}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: selected ? c.onPrimaryContainer : c.onSurfaceVariant,
                }}
              >
                {disabled
                  ? "Requires Classic layout"
                  : choice === "sage"
                    ? "Bold, rounded, tonal"
                    : "Original Tally"}
              </Text>
            </View>
          </Pressable>
          </ManagementEntranceItem>
        );
      })}
    </View>
  );
}
