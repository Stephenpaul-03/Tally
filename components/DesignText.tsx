import React from "react";
import { StyleSheet } from "react-native";
import { Text, useTheme, type TextProps } from "react-native-paper";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
/** Keep explicit legacy typography in Classic; use matching local Figtree faces in Expressive. */
export function DesignText({ style, ...props }: TextProps<string>) {
  const theme = useTheme<ExtendedMD3Theme>();
  if (!theme.expressive) return <Text {...props} style={style} />;
  const flat = StyleSheet.flatten(style);
  const family =
    flat?.fontFamily ??
    theme.fonts[props.variant as keyof typeof theme.fonts]?.fontFamily ??
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
  return (
    <Text
      {...props}
      style={[
        style,
        {
          fontFamily: `Figtree-${face}`,
          fontWeight: "normal",
          fontVariant: ["tabular-nums"],
        },
      ]}
    />
  );
}
