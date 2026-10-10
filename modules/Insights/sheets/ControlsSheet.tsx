import React, { useRef } from "react";
import { ScrollView, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useReducedMotion } from "react-native-reanimated";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { typography } from "@/theme/typography";
import { MotionPressable } from "../components/Motion";

export function ControlsSheet({ visible, title, onClose, children }: {
  visible: boolean; title: string; onClose: () => void; children: React.ReactNode;
}) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const retained = useRef({ title, children });
  if (visible) retained.current = { title, children };
  return <AnimatedPaperModal visible={visible} onDismiss={onClose} presentation="sheet"
    animationDuration={280} dismissDuration={200} reduceMotion={reduceMotion}
    contentContainerStyle={{ backgroundColor: theme.colors.background, maxHeight: "80%", paddingTop: 12 }}>
    <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: theme.colors.outlineVariant, alignSelf: "center", marginBottom: 8 }} />
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20 }}>
      <Text accessibilityRole="header" style={{ ...typography.bodyMedium, fontSize: 18, flex: 1 }}>{retained.current.title}</Text>
      <MotionPressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close options"
        style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}>
        <MaterialCommunityIcons name="close" size={20} color={theme.colors.onSurfaceVariant} />
      </MotionPressable>
    </View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, gap: 8 }}>
      {retained.current.children}
    </ScrollView>
  </AnimatedPaperModal>;
}

export function ControlOption({ label, icon, selected, onPress }: {
  label: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"]; selected: boolean; onPress: () => void;
}) {
  const theme = useTheme();
  return <MotionPressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: selected }}
    style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 52, paddingHorizontal: 14, borderRadius: 16,
      backgroundColor: selected ? theme.colors.primary + "18" : theme.colors.elevation.level1 }}>
    <MaterialCommunityIcons name={icon} size={20} color={selected ? theme.colors.primary : theme.colors.onSurfaceVariant} />
    <Text style={{ ...typography.body, fontSize: 14, flex: 1 }}>{label}</Text>
    {selected ? <MaterialCommunityIcons name="check" size={18} color={theme.colors.primary} /> : null}
  </MotionPressable>;
}
