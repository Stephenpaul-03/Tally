import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";
import { Text, type MD3Theme } from "react-native-paper";

interface CollapseExpandPairProps {
  onCollapse: () => void;
  onExpand: () => void;
  theme: MD3Theme;
}

export function CollapseExpandPair({
  onCollapse,
  onExpand,
  theme,
}: CollapseExpandPairProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        paddingVertical: 12,
      }}
    >
      <Pressable
        accessibilityRole="button"
        onPress={onCollapse}
        style={({ pressed }) => ({
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
          opacity: pressed ? 0.65 : 1,
        })}
      >
        <MaterialCommunityIcons
          name="arrow-down"
          size={18}
          color={theme.colors.primary}
        />
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            color: theme.colors.primary,
          }}
        >
          Collapse all
        </Text>
      </Pressable>

      <View
        style={{ width: 0.5, backgroundColor: theme.colors.outlineVariant }}
      />

      <Pressable
        accessibilityRole="button"
        onPress={onExpand}
        style={({ pressed }) => ({
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
          opacity: pressed ? 0.65 : 1,
        })}
      >
        <MaterialCommunityIcons
          name="arrow-up"
          size={18}
          color={theme.colors.primary}
        />
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            color: theme.colors.primary,
          }}
        >
          Expand all
        </Text>
      </Pressable>
    </View>
  );
}
