import React, { useRef, useState } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useReducedMotion } from "react-native-reanimated";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { typography } from "@/theme/typography";
import { MotionPressable } from "../components/Motion";

export function ControlsSheet({ visible, title, onClose, children, displayTitle = false }: {
  visible: boolean; title: string; onClose: () => void; children: React.ReactNode; displayTitle?: boolean;
}) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const retained = useRef({ title, children, displayTitle });
  if (visible) retained.current = { title, children, displayTitle };
  return <AnimatedPaperModal visible={visible} onDismiss={onClose} presentation="sheet"
    animationDuration={280} dismissDuration={200} reduceMotion={reduceMotion}
    contentContainerStyle={{ backgroundColor: theme.colors.background, maxHeight: "80%", paddingTop: 12 }}>
    <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: theme.colors.outlineVariant, alignSelf: "center", marginBottom: 8 }} />
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20 }}>
      <Text accessibilityRole="header" style={{ ...(retained.current.displayTitle ? typography.editorial.sectionLabel : typography.bodyMedium), fontSize: 18, flex: 1 }}>{retained.current.title}</Text>
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


export function ComparisonMonths({ months, selectedMonth, onSelect }: {
  months: string[]; selectedMonth: string | null; onSelect: (month: string) => void;
}) {
  const theme = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const [gridWidth, setGridWidth] = useState(0);
  const columns = fontScale > 1.3 || width < 340 ? 2 : 3;
  const tileWidth = ((gridWidth || width - 40) - (columns - 1) * 8) / columns;
  return <View onLayout={event => setGridWidth(event.nativeEvent.layout.width)}
    style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
    {months.map(month => {
      const selected = month === selectedMonth;
      const date = new Date(`${month}-01T00:00:00`);
      return <MotionPressable key={month} onPress={() => onSelect(month)} accessibilityRole="radio"
        accessibilityState={{ checked: selected }} accessibilityLabel={date.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        style={{ width: tileWidth, minHeight: 64, borderRadius: 16, padding: 10,
          alignItems: "center", justifyContent: "center", gap: 5, borderWidth: 1,
          borderColor: selected ? theme.colors.primary : theme.colors.outlineVariant,
          backgroundColor: selected ? theme.colors.primaryContainer : theme.colors.surface }}>
        {selected ? <MaterialCommunityIcons name="check" size={16} color={theme.colors.onPrimaryContainer}
          style={{ position: "absolute", top: 8, right: 8 }} /> : null}
        <Text style={{ ...typography.bodyMedium, fontSize: 16, color: selected ? theme.colors.onPrimaryContainer : theme.colors.onSurface }}>
          {date.toLocaleDateString(undefined, { month: "short" })}
        </Text>
        <Text style={{ ...typography.body, fontSize: 12, color: selected ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }}>{month.slice(0, 4)}</Text>
      </MotionPressable>;
    })}
  </View>;
}
