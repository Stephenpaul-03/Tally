import { matchesIconSearch } from "@/utils/icon-search";
import { CurrencyPickerField, type WorkspaceCurrency } from "@/components/CurrencyPickerField";
import { MANAGEMENT_NAME_LIMIT } from "@/components/ManagementOptions";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Keyboard, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { SETUP_COLORS, SETUP_ICONS } from "./presets";

type Icon = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
export function WorkspaceSetup({ name, icon, color, currency, onName, onIcon, onColor, onCurrency, disabled }: {
  name: string; icon: string; color: string; currency: WorkspaceCurrency;
  onName: (v: string) => void; onIcon: (v: string) => void; onColor: (v: string) => void;
  onCurrency: (v: WorkspaceCurrency) => void; disabled: boolean;
}) {
  const theme = useTheme();
  const c = theme.colors;
  const [query, setQuery] = React.useState("");
  return <View style={{ gap: 16, flex: 1 }}>
    <View style={[s.nameRow, { backgroundColor: c.surfaceVariant }]}>
      <View style={[s.preview, { backgroundColor: color }]}><MaterialCommunityIcons name={icon as Icon} size={26} color="#FFF" /></View>
      <View style={{ flex: 1, gap: 5 }}><Text style={[s.label, { color: c.onSurfaceVariant }]}>Workspace name</Text>
        <TextInput accessibilityLabel="Workspace name" value={name} onChangeText={onName} editable={!disabled} maxLength={MANAGEMENT_NAME_LIMIT}
          placeholder="Your workspace" placeholderTextColor={c.onSurfaceVariant} style={{ color: c.onSurface, fontSize: 16, padding: 0 }} returnKeyType="done" /></View>
    </View>
    <CurrencyPickerField currency={currency} onChange={onCurrency} theme={theme} disabled={disabled} variant="editorial" />
    <View style={s.columns}>
      <View style={[s.column, { backgroundColor: c.surfaceVariant }]}>
        <Text style={[s.label, { color: c.onSurface, textAlign: "center" }]}>Icons</Text>
        <View style={[s.search, { backgroundColor: c.background }]}><MaterialCommunityIcons name="magnify" size={16} color={c.onSurfaceVariant} />
          <TextInput accessibilityLabel="Search workspace icons" placeholder="Find icon" placeholderTextColor={c.onSurfaceVariant} value={query} onChangeText={setQuery} editable={!disabled} returnKeyType="done" onSubmitEditing={Keyboard.dismiss}
            style={{ flex: 1, padding: 0, fontSize: 12, color: c.onSurface }} /></View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={s.grid}>
          {SETUP_ICONS.filter(value => matchesIconSearch(value, query)).map(value => <Pressable key={value} disabled={disabled}
            accessibilityRole="button" accessibilityLabel={`Icon: ${value.replace(/-/g, " ")}`} accessibilityState={{ selected: value === icon, disabled }} onPress={() => onIcon(value)}
            style={[s.icon, { backgroundColor: c.background, borderColor: value === icon ? color : "transparent" }]}>
            <MaterialCommunityIcons name={value as Icon} size={21} color={value === icon ? color : c.onSurfaceVariant} /></Pressable>)}
        </ScrollView>
      </View>
      <View style={[s.column, { backgroundColor: c.surfaceVariant }]}>
        <Text style={[s.label, { color: c.onSurface, textAlign: "center" }]}>Colors</Text>
        <Text style={{ fontSize: 12, color: c.onSurfaceVariant, minHeight: 32, textAlign: "center" }}>A little personality.</Text>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.grid}>
          {SETUP_COLORS.map(value => <Pressable key={value} disabled={disabled} accessibilityRole="button" accessibilityLabel={`Color ${value}`}
            accessibilityState={{ selected: value === color, disabled }} onPress={() => onColor(value)} style={[s.icon, { backgroundColor: value, borderWidth: 0 }]}>
            {value === color ? <MaterialCommunityIcons name="check" size={22} color="#FFF" /> : null}</Pressable>)}
        </ScrollView>
      </View>
    </View>
  </View>;
}
const s = StyleSheet.create({
  nameRow: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 18, padding: 14 },
  preview: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  label: { ...typography.editorial.sectionLabel, fontSize: 14, lineHeight: 20 },
  columns: { flexDirection: "row", gap: 12, flex: 1, minHeight: 160, maxHeight: 260 },
  column: { flex: 1, padding: 12, borderRadius: 18, gap: 10, overflow: "hidden" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 7, paddingBottom: 6 },
  icon: { width: 38, height: 38, borderRadius: 12, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  search: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 9, paddingHorizontal: 7, minHeight: 32 },
});
