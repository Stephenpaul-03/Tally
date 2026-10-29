import { useTheme } from "react-native-paper";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { colorTreatment } from "@/theme/colorTreatment";
import { richerCategoryColor } from "@/theme/expressivePalette";
import { categoryTone } from "@/theme/sage";
import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
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
export function CategoryIconBadge({
  icon,
  color,
  style,
  categoryName,
  richerBackground = false,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
  style?: StyleProp<ViewStyle>;
  categoryName?: string;
  richerBackground?: boolean;
}) {
  const theme = useTheme<ExtendedMD3Theme>();
  const [backgroundColor, foregroundColor] = categoryTone(
    categoryName ?? "",
    theme.dark,
    color,
  );
  const { minimalIconsEnabled } = useAddonPrefs();
  const baseBackground = theme.expressive ? backgroundColor : darkenHex(color);
  return (
    <View
      collapsable={false}
      style={[
        styles.badge,
        {
          backgroundColor: minimalIconsEnabled
            ? "transparent"
            : richerBackground ? richerCategoryColor(baseBackground) : baseBackground,
          borderWidth: 0,
        },
        theme.expressive && { width: 44, height: 44, borderRadius: 16 },
        style,
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={20}
        color={
          theme.expressive
            ? minimalIconsEnabled
              ? colorTreatment(color, theme.dark, false, theme.colors.surface).foregroundColor
              : foregroundColor
            : minimalIconsEnabled
              ? color
              : "#FFFFFF"
        }
        style={styles.icon}
        accessible={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  icon: { flexShrink: 0, width: 22, textAlign: "center" },
});
