import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";
import { Text, type MD3Theme } from "react-native-paper";

interface ActionRowProps {
  icon: string;
  label: string;
  description: string;
  onPress: () => void;
  theme: MD3Theme;
  destructive?: boolean;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
}

export function ActionRow({
  icon,
  label,
  description,
  onPress,
  theme,
  destructive,
  rightElement,
  showChevron = true,
}: ActionRowProps) {
  const color = destructive ? theme.colors.error : theme.colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 13,
        paddingHorizontal: 16,
        opacity: pressed ? 0.65 : 1,
      })}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <MaterialCommunityIcons name={icon as any} size={18} color={color} />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: theme.colors.onSurface,
          }}
        >
          {label}
        </Text>
        <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}>
          {description}
        </Text>
      </View>
      {rightElement ? rightElement : null}
      {showChevron ? (
        <MaterialCommunityIcons
          name="chevron-right"
          size={18}
          color={theme.colors.onSurfaceVariant}
          style={{ opacity: 0.5 }}
        />
      ) : null}
    </Pressable>
  );
}
