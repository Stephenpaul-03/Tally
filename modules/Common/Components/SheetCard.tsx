import React from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { type MD3Theme } from "react-native-paper";

interface SheetCardProps {
  children: React.ReactNode;
  theme: MD3Theme;
  style?: StyleProp<ViewStyle>;
}

export function SheetCard({ children, theme, style }: SheetCardProps) {
  const childItems = React.Children.toArray(children);

  return (
    <View
      style={[
        {
          marginHorizontal: 16,
          borderRadius: 16,
          overflow: "hidden",
          marginBottom: 16,
          backgroundColor: theme.colors.elevation.level1,
          borderWidth: 0.5,
          borderColor: theme.colors.outlineVariant,
        },
        style,
      ]}
    >
      {childItems}
    </View>
  );
}
