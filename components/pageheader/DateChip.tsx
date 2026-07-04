import { palette } from "@/theme/color_palette";
import { typography } from "@/theme/typography";
import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { AnimatedChevron } from "./AnimatedChevron";

export function DateChip({
  label,
  expanded,
  onPress,
  onLongPress,
  backgroundColor,
}: {
  label: string;
  expanded: boolean;
  onPress: () => void;
  onLongPress: () => void;
  backgroundColor: string;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={420}
      accessibilityRole="button"
      hitSlop={8}
      style={({ pressed }) => [
        styles.dateChip,
        {
          backgroundColor: expanded
            ? theme.colors.primary
            : theme.colors.surface,
          borderColor: expanded ? theme.colors.primary : theme.colors.surface,
        },
        pressed && { opacity: 0.75 },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[
          styles.dateChipText,
          {
            ...typography.editorial.sectionLabel,
            fontSize: 12,
            color: expanded ? palette.white : theme.colors.onSurface,
          },
        ]}
      >
        {label}
      </Text>
      <AnimatedChevron
        expanded={expanded}
        color={expanded ? palette.white : theme.colors.onSurface}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  dateChipText: {
    letterSpacing: 1,
  },
});
