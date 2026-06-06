import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";
import { Text, type MD3Theme } from "react-native-paper";

interface ToggleTileProps {
  icon: string;
  label: string;
  description: string;
  active: boolean;
  onPress: () => void;
  theme: MD3Theme;
  disabled?: boolean;
}

export function ToggleTile({
  icon,
  label,
  description,
  active,
  onPress,
  theme,
  disabled,
}: ToggleTileProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        flex: 1,
        borderRadius: 16,
        padding: 12,
        backgroundColor: theme.colors.elevation.level1,
        borderWidth: active ? 1.5 : 0.5,
        borderColor: active
          ? theme.colors.primary
          : theme.colors.outlineVariant,
        opacity: pressed ? 0.75 : disabled ? 0.45 : 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      })}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          backgroundColor: active
            ? theme.colors.primary
            : theme.colors.surfaceVariant,
        }}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={18}
          color={
            active ? theme.colors.onPrimary : theme.colors.onSurfaceVariant
          }
        />
      </View>

      <View style={{ flex: 1, gap: 1 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            color: theme.colors.onSurface,
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: active
              ? theme.colors.onPrimaryContainer
              : theme.colors.onSurfaceVariant,
            lineHeight: 14,
          }}
          numberOfLines={2}
        >
          {description}
        </Text>
      </View>
    </Pressable>
  );
}
