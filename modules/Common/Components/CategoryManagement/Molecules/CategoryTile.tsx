import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";
import { Text, type MD3Theme } from "react-native-paper";

export function CategoryTile({
  name,
  icon,
  color,
  iconColorOverride,
  transactionCount = 0,
  isSelected = false,
  pickerMode = false,
  onPress,
  theme,
}: {
  name: string;
  icon: string;
  color: string;
  iconColorOverride?: string;
  transactionCount?: number;
  isSelected?: boolean;
  pickerMode?: boolean;
  onPress: () => void;
  theme: MD3Theme;
}) {
  const c = theme.colors;
  const displayColor = iconColorOverride ?? color;
  const transactionLabel = `${transactionCount} transaction${
    transactionCount === 1 ? "" : "s"
  }`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: c.elevation.level1,
        gap: 6,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          justifyContent: "space-between",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            flex: 1,
          }}
        >
          <MaterialCommunityIcons
            name={icon as any}
            size={22}
            color={displayColor}
          />
          <View style={{ flex: 1, gap: 1 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: c.onSurface,
              }}
              numberOfLines={1}
            >
              {name}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: c.onSurfaceVariant,
                opacity: 0.78,
              }}
              numberOfLines={1}
            >
              {transactionLabel}
            </Text>
          </View>
        </View>
        {pickerMode ? (
          isSelected ? (
            <MaterialCommunityIcons
              name="check-circle"
              size={16}
              color={displayColor}
            />
          ) : (
            <MaterialCommunityIcons
              name="circle-outline"
              size={16}
              color={c.onSurfaceVariant}
              style={{ opacity: 0.3 }}
            />
          )
        ) : (
          <MaterialCommunityIcons
            name="chevron-right"
            size={15}
            color={c.onSurfaceVariant}
            style={{ opacity: 0.4 }}
          />
        )}
      </View>
    </Pressable>
  );
}
