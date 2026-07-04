import React from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { Surface, Text, useTheme, type MD3Theme } from "react-native-paper";
import { mainContent } from "../Styles";

interface SelectionCardProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export function SelectionCard({
  label,
  error,
  children,
  style,
  onPress,
}: SelectionCardProps) {
  const theme = useTheme<MD3Theme>();

  const card = (
    <Surface
      elevation={0}
      style={[
        mainContent.twoColCard,
        {
          flexGrow: 1,
          flexShrink: 1,
          flexBasis: 0,
          minWidth: 0,
          borderColor: error ? theme.colors.error : theme.colors.outlineVariant,
          backgroundColor: theme.colors.elevation.level1,
        },
        style,
      ]}
    >
      <Text
        variant="labelSmall"
        style={[
          mainContent.stackedLabel,
          {
            color: error ? theme.colors.error : theme.colors.primary,
          },
        ]}
      >
        {label}
      </Text>
      <View>{children}</View>
      {error ? (
        <Text
          variant="labelSmall"
          style={{ color: theme.colors.error, marginTop: 2 }}
        >
          {error}
        </Text>
      ) : null}
    </Surface>
  );

  if (!onPress) return card;

  return (
    <Pressable onPress={onPress} style={{ flex: 1, minWidth: 0 }}>
      {card}
    </Pressable>
  );
}
