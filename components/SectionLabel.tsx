import React from "react";
import { Text, type MD3Theme } from "react-native-paper";

export type CardPadding = {
  horizontal?: number;
  top?: number;
  bottom?: number;
};

const DEFAULT_PADDING: Required<CardPadding> = {
  horizontal: 22,
  top: 22,
  bottom: 6,
};

export function SectionLabel({
  label,
  theme,
  padding = DEFAULT_PADDING,
}: {
  label: string;
  theme: MD3Theme;
  padding?: CardPadding;
}) {
  const resolvedPadding: Required<CardPadding> = {
    horizontal: padding?.horizontal ?? DEFAULT_PADDING.horizontal,
    top: padding?.top ?? DEFAULT_PADDING.top,
    bottom: padding?.bottom ?? DEFAULT_PADDING.bottom,
  };
  return (
    <Text
      style={{
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 1.5,
        textTransform: "uppercase",
        color: theme.colors.onSurfaceVariant,
        paddingHorizontal: resolvedPadding.horizontal,
        paddingTop: resolvedPadding.top,
        paddingBottom: resolvedPadding.bottom,
        opacity: 0.6,
      }}
    >
      {label}
    </Text>
  );
}
