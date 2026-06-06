import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";
import { Text, type MD3Theme } from "react-native-paper";

export function ReassignRow({
  dest,
  destIcon,
  destColor,
  isSelected,
  isLast,
  onPress,
  theme,
}: {
  dest: string;
  destIcon: string;
  destColor: string;
  isSelected: boolean;
  isLast: boolean;
  onPress: () => void;
  theme: MD3Theme;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 13,
        paddingHorizontal: 16,
        backgroundColor: "transparent",
        borderBottomWidth: isLast ? 0 : 0.5,
        borderBottomColor: theme.colors.outlineVariant,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isSelected ? destColor : theme.colors.background,
        }}
      >
        <MaterialCommunityIcons
          name={destIcon as any}
          size={18}
          color={isSelected ? theme.colors.onPrimary : destColor}
        />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: isSelected ? "700" : "500",
            color: isSelected
              ? theme.colors.onPrimaryContainer
              : theme.colors.onSurface,
          }}
          numberOfLines={1}
        >
          {dest}
        </Text>
      </View>
      <MaterialCommunityIcons
        name={isSelected ? "check-circle" : "radiobox-blank"}
        size={20}
        color={
          isSelected ? theme.colors.primary : theme.colors.onSurfaceVariant
        }
        style={{ opacity: isSelected ? 1 : 0.4 }}
      />
    </Pressable>
  );
}
