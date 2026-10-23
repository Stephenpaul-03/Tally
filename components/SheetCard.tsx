import { settingsShape } from "@/theme/settingsShape";
import { MotionItem } from "@/components/animations/Motion";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import React from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { type MD3Theme } from "react-native-paper";

interface SheetCardProps {
  children: React.ReactNode;
  theme: MD3Theme;
  style?: StyleProp<ViewStyle>;
}

export function SheetCard({ children, theme, style }: SheetCardProps) {
  const expressive = (theme as ExtendedMD3Theme).expressive;
  const childItems = React.Children.toArray(children);

  return (
    <View
      style={[
        {
          marginHorizontal: 20,
          borderRadius: 20,
          overflow: "hidden",
          marginBottom: 20,
          backgroundColor: theme.colors.elevation.level1,
          borderWidth: 0.5,
          borderColor: theme.colors.outlineVariant,
        },
        expressive && {
          marginHorizontal: 16,
          borderRadius: 28,
          borderWidth: 0,
          padding: 4,
          marginBottom: 14,
        },
        style,
        settingsShape(theme as ExtendedMD3Theme, "group"),
      ]}
    >
      {childItems.map((child, index) => (
        <MotionItem
          key={(child as React.ReactElement).key ?? index}
          index={index}
        >
          {child}
        </MotionItem>
      ))}
    </View>
  );
}
