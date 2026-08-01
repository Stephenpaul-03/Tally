import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";
import { Text, type MD3Theme } from "react-native-paper";

function darkenHex(hex: string, amount = 0.18) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;
  const num = parseInt(clean, 16);
  const r = Math.max(0, Math.round(((num >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((num >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((num & 0xff) * (1 - amount)));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export function formatActivityLabel(transactionCount: number) {
  if (transactionCount === 0) return "No activity yet";
  if (transactionCount === 1) return "Used once";
  return `Used ${transactionCount} times`;
}

export function CategoryTile({
  name,
  icon,
  color,
  iconColorOverride,
  transactionCount = 0,
  showTransactionLabel = transactionCount > 0,
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
  showTransactionLabel?: boolean;
  isSelected?: boolean;
  pickerMode?: boolean;
  onPress: () => void;
  theme: MD3Theme;
}) {
  const c = theme.colors;
  const displayColor = iconColorOverride ?? color;
  const useMinimalBadge = Boolean(iconColorOverride);
  const transactionLabel = formatActivityLabel(transactionCount);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: c.elevation.level1,
        gap: 6,
        minHeight: 58,
        justifyContent: "center",
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
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: useMinimalBadge ? c.background : darkenHex(color),
            }}
          >
            <MaterialCommunityIcons
              name={icon as any}
              size={20}
              color={useMinimalBadge ? displayColor : "#FFFFFF"}
            />
          </View>
          <View
            style={{
              flex: 1,
              gap: 1,
              justifyContent: showTransactionLabel ? "flex-start" : "center",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: c.onSurface,
              }}
              numberOfLines={1}
            >
              {name}
            </Text>
            {showTransactionLabel ? (
              <Text
                style={{
                  fontSize: 10,
                  color: c.onSurfaceVariant,
                  opacity: 0.78,
                }}
                numberOfLines={1}
              >
                {transactionLabel}
              </Text>
            ) : null}
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
