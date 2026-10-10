import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";

function darkenHex(hex: string, amount = 0.18) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;
  const num = parseInt(clean, 16);
  const r = Math.max(0, Math.round(((num >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((num >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((num & 0xff) * (1 - amount)));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

// Shared by transaction rows and Insights, including the minimal-icons preference.
export function CategoryIconBadge({ icon, color, style }: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const { minimalIconsEnabled } = useAddonPrefs();
  return <View style={[styles.badge, {
    backgroundColor: minimalIconsEnabled ? theme.colors.background : darkenHex(color),
    borderColor: minimalIconsEnabled ? theme.colors.elevation.level1 : undefined,
    borderWidth: minimalIconsEnabled ? 1 : 0,
  }, style]}>
    <MaterialCommunityIcons name={icon} size={20}
      color={minimalIconsEnabled ? color : "#FFFFFF"} style={styles.icon} accessible={false} />
  </View>;
}

const styles = StyleSheet.create({
  badge: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  icon: { flexShrink: 0, width: 22, textAlign: "center" },
});
