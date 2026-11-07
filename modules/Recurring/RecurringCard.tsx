import React from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { DesignText as Text } from "@/components/DesignText";
import { categoryTone } from "@/theme/sage";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { ledgerMoney } from "@/modules/Main/presentation";
import { frequencyLabel, localDate, type RecurringTemplate, type RecurringOccurrence } from "./model";

export function recurringDate(date: string) {
  if (date === localDate()) return "Today";
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** One compact schedule card shared by Home and management. */
export function RecurringCard({ template, occurrence, compact = false, busy = false, onPress, onAdd, onSkip }: {
  template: RecurringTemplate; occurrence?: RecurringOccurrence; compact?: boolean; busy?: boolean;
  onPress: () => void; onAdd?: () => void; onSkip?: () => void;
}) {
  const theme = useTheme<ExtendedMD3Theme>(), c = theme.colors;
  const [tone, ink] = categoryTone("", theme.dark, template.color);
  const foreground = theme.expressive ? ink : c.onSurface;
  const secondary = theme.expressive ? ink : c.onSurfaceVariant;
  const due = occurrence?.dueDate || template.nextDate;
  return <View style={{ padding: 16, gap: 12, borderRadius: theme.expressive ? 28 : 18,
    ...(theme.expressive ? { borderBottomLeftRadius: 12 } : {}), backgroundColor: theme.expressive ? tone : c.surface }}>
    <Pressable accessibilityRole="button" accessibilityLabel={`View ${template.form.title} recurring schedule`} onPress={onPress} style={({ pressed }) => ({ gap: 12, opacity: pressed ? 0.7 : 1 })}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Icon name={template.icon as React.ComponentProps<typeof Icon>["name"]} size={24} color={theme.expressive ? ink : template.color} />
        <View style={{ flex: 1, gap: 3 }}>
          <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: "800", color: foreground }}>{template.form.title}</Text>
          <Text numberOfLines={1} style={{ fontSize: 12, color: secondary, opacity: 0.8 }}>{template.form.category} · {frequencyLabel(template.frequency)}</Text>
        </View>
        {!compact && <Icon name="chevron-right" size={20} color={secondary} />}
      </View>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10 }}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={{ flex: 1, fontSize: compact ? 26 : 23, fontWeight: "800", color: foreground }}>{ledgerMoney(template.form.amount, template.form.currencyCode || "INR", template.form.currencySymbol)}</Text>
        <Text style={{ fontSize: 12, fontWeight: "600", color: secondary }}>{template.paused ? "Paused" : `${occurrence ? "Due" : "Next"} ${recurringDate(due)}`}</Text>
      </View>
    </Pressable>
    {onAdd && <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Quick add ${template.form.title}`} disabled={busy} onPress={onAdd}
        style={({ pressed }) => ({ flex: 1, minHeight: 44, borderRadius: 22, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
          backgroundColor: theme.expressive ? ink : c.primaryContainer, opacity: busy ? 0.4 : pressed ? 0.7 : 1 })}>
        <Icon name="plus" size={20} color={theme.expressive ? tone : c.onPrimaryContainer} />
        <Text style={{ fontSize: 13, fontWeight: "800", color: theme.expressive ? tone : c.onPrimaryContainer }}>Quick Add</Text>
      </Pressable>
      {onSkip && <Pressable accessibilityRole="button" accessibilityLabel={`Skip ${template.form.title} due ${due}`} disabled={busy} onPress={onSkip}
        style={({ pressed }) => ({ minHeight: 44, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", borderRadius: 22, opacity: busy ? 0.4 : pressed ? 0.7 : 1 })}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: foreground }}>Skip</Text>
      </Pressable>}
    </View>}
  </View>;
}
