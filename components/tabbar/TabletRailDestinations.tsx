import React from "react";
import { Pressable, View } from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { DesignText as Text } from "@/components/DesignText";
import { typography } from "@/theme/typography";

type Props = {
  label: string;
  icon: React.ComponentProps<typeof Icon>["name"];
  selected?: boolean;
  onPress: () => void;
  settings?: boolean;
};

export function ExpressiveRailDestination({ label, icon, selected, onPress, settings }: Props) {
  const { colors: c } = useTheme();
  return <Pressable accessibilityRole={settings ? "button" : "tab"} accessibilityLabel={label}
    accessibilityState={{ selected }} onPress={onPress}
    style={({ pressed }) => ({ alignItems: "center", justifyContent: "center", gap: 7, minHeight: 88,
      borderRadius: 30, paddingVertical: 12, backgroundColor: selected ? c.primary : "transparent", opacity: pressed ? 0.65 : 1 })}>
    <Icon name={icon} size={26} color={selected ? c.onPrimary : c.onSurfaceVariant} />
    <Text style={{ fontSize: 11, fontWeight: selected ? "800" : "600", color: selected ? c.onPrimary : c.onSurfaceVariant }}>{label}</Text>
  </Pressable>;
}

export function ClassicRailDestination({ label, icon, selected, onPress, settings }: Props) {
  const { colors: c } = useTheme();
  return <Pressable accessibilityRole={settings ? "button" : "tab"} accessibilityLabel={label}
    accessibilityState={{ selected }} onPress={onPress}
    style={({ pressed }) => ({ minHeight: 88, alignItems: "center", justifyContent: "center", gap: 9,
      paddingVertical: 12, borderRadius: 12, borderWidth: 0.5, borderColor: selected ? c.primary : "transparent",
      backgroundColor: selected ? c.surface : "transparent", opacity: pressed ? 0.65 : 1 })}>
    {selected ? <View style={{ position: "absolute", left: 0, top: 24, bottom: 24, width: 3, backgroundColor: c.primary }} /> : null}
    <Icon name={icon} size={24} color={selected ? c.primary : c.onSurfaceVariant} />
    <Text style={{ ...typography.editorial.sectionLabel, fontSize: 13, letterSpacing: 0.3,
      color: selected ? c.primary : c.onSurfaceVariant }}>{label}</Text>
  </Pressable>;
}
