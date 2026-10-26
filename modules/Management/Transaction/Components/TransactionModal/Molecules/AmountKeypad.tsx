import React from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { DesignText as Text } from "@/components/DesignText";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import type { createMainContentStyles } from "../Styles";
const ROWS = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  ["clear", "0", "backspace"],
];

export const AmountKeypad = React.memo(function AmountKeypad({
  styles,
  onKey,
  controls,
  calculating,
}: {
  styles: ReturnType<typeof createMainContentStyles>;
  onKey: (key: string) => void;
  controls: React.ReactNode;
  calculating: boolean;
}) {
  const theme = useTheme<ExtendedMD3Theme>();
  return (
    <View style={styles.iosKeypad}>
      {controls}
      {ROWS.map((row, index) => (
        <View key={index} style={styles.iosKeypadRow}>
          {row.map((original) => {
            const key = original === "clear" && calculating ? "." : original;
            const clear = key === "clear",
              backspace = key === "backspace";
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={
                  clear
                    ? "Clear amount"
                    : backspace
                      ? "backspace"
                      : `Enter ${key}`
                }
                onPress={() => onKey(key)}
                style={({ pressed }) => [
                  styles.iosKey,
                  clear && styles.iosClearKey,
                  theme.expressive &&
                    backspace && {
                      backgroundColor: theme.colors.secondaryContainer,
                    },
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                {clear ? (
                  <Text style={styles.iosClearKeyText}>C</Text>
                ) : backspace ? (
                  <MaterialCommunityIcons
                    name="backspace-outline"
                    size={22}
                    color={
                      theme.expressive
                        ? theme.colors.onSecondaryContainer
                        : theme.colors.onSurface
                    }
                  />
                ) : (
                  <Text style={styles.iosKeyText}>{key}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
});
