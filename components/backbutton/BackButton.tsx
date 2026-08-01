// @/components/buttons/BackButton.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet } from "react-native";
import type { MD3Theme } from "react-native-paper";
import { TouchableRipple } from "react-native-paper";

interface BackButtonProps {
  onPress: () => void;
  theme: MD3Theme;
  size?: number;
  backgroundColor?: string;
}

export function BackButton({
  onPress,
  theme,
  size = 34,
  backgroundColor,
}: BackButtonProps) {
  return (
    <TouchableRipple
      onPress={onPress}
      borderless
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: backgroundColor ?? theme.colors.background,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
      accessibilityLabel="Go back"
    >
      <MaterialCommunityIcons
        name="arrow-left"
        size={18}
        color={theme.colors.onSurface}
      />
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
});
