import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { actionAccent, colorTreatment } from "@/theme/colorTreatment";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, type StyleProp, type ViewStyle, View } from "react-native";
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
  iconBackgroundColor?: string;
  iconColor?: string;
  labelColor?: string;
  descriptionColor?: string;
  style?: StyleProp<ViewStyle>;
  iconContainerSize?: number;
  iconRadius?: number;
  iconSize?: number;
  disabled?: boolean;
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
  iconBackgroundColor,
  iconColor,
  labelColor,
  descriptionColor,
  style,
  iconContainerSize = 36,
  iconRadius = 10,
  iconSize = 20,
  disabled = false,
}: ActionRowProps) {
  const { minimalIconsEnabled } = useAddonPrefs();
  const color =
    iconColor ?? (destructive ? theme.colors.error : actionAccent(icon, theme.colors.primary));

  const tint = colorTreatment(color, theme.dark, false, theme.colors.elevation.level1);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          paddingVertical: 13,
          paddingHorizontal: 16,
          opacity: disabled ? 0.8 : pressed ? 0.65 : 1,
        },
        style,
      ]}
    >
      <View
        style={{
          width: iconContainerSize,
          height: iconContainerSize,
          borderRadius: iconRadius,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: iconBackgroundColor,
        }}
      >
        <MaterialCommunityIcons name={icon as any} size={iconSize} color={minimalIconsEnabled ? theme.colors.primary : tint.foregroundColor} />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: labelColor ?? theme.colors.onSurface,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: descriptionColor ?? theme.colors.onSurfaceVariant,
          }}
        >
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
