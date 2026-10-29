import React from "react";
import { StyleSheet, type StyleProp, type TextStyle } from "react-native";
import { Text, useTheme, type TextProps } from "react-native-paper";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
/** Keep explicit legacy typography in Classic; use matching local Figtree faces in Expressive. */
export function resolveDesignTextStyle(
  theme: ExtendedMD3Theme,
  style?: StyleProp<TextStyle>,
  variant?: TextProps<string>["variant"],
): StyleProp<TextStyle> {
  if (!theme.expressive) return style;
  const flat = StyleSheet.flatten(style);
  const family =
    flat?.fontFamily ??
    theme.fonts[variant as keyof typeof theme.fonts]?.fontFamily ??
    "";
  const implied = /Bebas|800/.test(family)
    ? 800
    : /Bold|700/.test(family)
      ? 700
      : /[Ss]emibold|Medium|600/.test(family)
        ? 600
        : 400;
  const weight = Math.max(
    Number(flat?.fontWeight) || (flat?.fontWeight === "bold" ? 700 : 400),
    implied,
  );
  const face =
    weight >= 800 ? 800 : weight >= 700 ? 700 : weight >= 600 ? 600 : 400;
  return [
    style,
    {
      fontFamily: `Figtree-${face}`,
      fontWeight: "normal",
      fontVariant: ["tabular-nums"],
    },
  ];
}

export function DesignText({ style, ...props }: TextProps<string>) {
  const theme = useTheme<ExtendedMD3Theme>();
  return <Text {...props} style={resolveDesignTextStyle(theme, style, props.variant)} />;
}
