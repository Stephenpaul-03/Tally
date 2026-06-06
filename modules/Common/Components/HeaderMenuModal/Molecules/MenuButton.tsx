import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable } from "react-native";
import { useTheme } from "react-native-paper";
import type { HeaderMenuButtonProps } from "../Types";

export function HeaderMenuButton({
  accessibilityLabel,
  onPress,
}: HeaderMenuButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
        opacity: pressed ? 0.65 : 1,
      })}
    >
      <MaterialCommunityIcons
        name="menu"
        size={22}
        color={theme.colors.onSurface}
      />
    </Pressable>
  );
}
