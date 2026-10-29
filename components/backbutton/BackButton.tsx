import { tonalButtonSurface } from "@/theme/surfaceTreatment";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
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
          backgroundColor: backgroundColor ?? ((theme as ExtendedMD3Theme).expressive && !theme.dark ? tonalButtonSurface(theme) : theme.colors.background),
          borderColor: theme.colors.outlineVariant,
          ...((theme as ExtendedMD3Theme).expressive
            ? { borderWidth: 0, minWidth: 44, minHeight: 44 }
            : {}),
        },
      ]}
      accessibilityLabel="Go back"
    >
      <MaterialCommunityIcons
        name="arrow-left"
        size={(theme as ExtendedMD3Theme).expressive ? 21 : 18}
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
