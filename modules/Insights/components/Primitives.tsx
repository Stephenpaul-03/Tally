import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { typography } from "@/theme/typography";

export const styles = StyleSheet.create({
  section: { paddingVertical: 16, gap: 18 },
  title: { ...typography.bodyStrong, fontSize: 20 },
  muted: { ...typography.body, fontSize: 14, lineHeight: 21 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  value: { ...typography.bodyStrong, fontSize: 18 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  metric: { width: "46%", gap: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.section}>
    <Text style={styles.title}>{title}</Text>{children}
  </View>;
}
export function Muted({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return <Text style={[styles.muted, { color: theme.colors.onSurfaceVariant }]}>{children}</Text>;
}
export function Chip({ label, selected = false, onPress, disabled = false }: {
  label: string; selected?: boolean; onPress: () => void; disabled?: boolean;
}) {
  const theme = useTheme();
  return <Pressable accessibilityRole="button" accessibilityState={{ selected, disabled }}
    accessibilityLabel={label} disabled={disabled} onPress={onPress}
    style={{ paddingHorizontal: 16, paddingVertical: 10, minHeight: 48, justifyContent: "center", borderRadius: 24,
      opacity: disabled ? 0.35 : 1,
      backgroundColor: selected ? theme.colors.secondaryContainer : theme.colors.elevation.level2 }}>
    <Text style={{ color: selected ? theme.colors.onSecondaryContainer : theme.colors.onSurface, fontSize: 15 }}>{label}</Text>
  </Pressable>;
}
export function Metric({ label, value, comparison }: { label: string; value: string; comparison?: string }) {
  return <View style={styles.metric}><Muted>{label}</Muted>
    <Text style={styles.value}>{value}</Text>{comparison ? <Muted>{comparison}</Muted> : null}</View>;
}
