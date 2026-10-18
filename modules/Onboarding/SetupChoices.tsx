import { sortCategories } from "@/utils/category-order";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Keyboard, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import { SETUP_COLORS, SETUP_ICONS, type SetupChoice } from "./presets";
import type { SetupItem } from "./storage";

type Icon = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
export function AppearanceChoices({ icon, color, onIcon, onColor, icons, disabled = false, showColors = true }: {
  icon: string; color: string; onIcon: (icon: string) => void; onColor: (color: string) => void; icons: string[]; disabled?: boolean; showColors?: boolean;
}) {
  const theme = useTheme();
  return <View style={{ gap: 16 }}>
    {icons.length ? <View style={s.icons}>
      {icons.map(value => <Pressable key={value} accessibilityRole="button" accessibilityLabel={`Icon: ${value.replace(/-/g, " ")}`}
        accessibilityState={{ selected: value === icon, disabled }} disabled={disabled} onPress={() => onIcon(value)}
        style={[s.icon, { backgroundColor: value === icon ? color : theme.colors.surface,
          borderColor: value === icon ? color : theme.colors.outlineVariant }]}>
        <MaterialCommunityIcons name={value as Icon} size={22} color={value === icon ? "#FFFFFF" : theme.colors.onSurfaceVariant} />
      </Pressable>)}
    </View> : null}
    {showColors ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: "center", gap: 8, paddingVertical: 4 }}>
      {SETUP_COLORS.map(value => <Pressable key={value} disabled={disabled} accessibilityRole="button"
        accessibilityLabel={`Color ${value}`} accessibilityState={{ selected: color === value, disabled }} onPress={() => onColor(value)}
        style={[s.color, { backgroundColor: value }]}>
        {color === value ? <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" /> : null}
      </Pressable>)}
    </ScrollView> : null}
  </View>;
}

export function SetupChoices({ choices, onToggle, onCreate, onEdit, disabled }: {
  choices: SetupChoice[]; onToggle: (name: string) => void; onCreate: () => void; onEdit: (item: SetupChoice) => void; disabled: boolean;
}) {
  const theme = useTheme();
  const selected = sortCategories(choices.filter(item => item.selected), item => item.name);
  const unselected = sortCategories(choices.filter(item => !item.selected), item => item.name);
  const pills = (items: SetupChoice[]) => <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>{items.map(item => <Pressable key={item.name} disabled={disabled} accessibilityRole="checkbox"
    accessibilityLabel={item.name} accessibilityState={{ checked: item.selected, disabled }} onPress={() => onToggle(item.name)}
    style={({ pressed }) => [s.choice, { backgroundColor: item.selected ? theme.colors.surfaceVariant : theme.colors.surface,
      borderColor: item.selected ? item.color : theme.colors.outlineVariant, opacity: pressed ? 0.7 : 1 }]}>
    <MaterialCommunityIcons name={item.icon as Icon} size={18} color={item.color} />
    <Text style={{ ...typography.bodyMedium, fontSize: 14, lineHeight: 20, color: theme.colors.onSurface, flexShrink: 1 }}>{item.name}</Text>
    {item.custom ? <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${item.name}`} disabled={disabled} hitSlop={8}
      onPress={event => { event.stopPropagation(); onEdit(item); }} style={{ padding: 4 }}>
      <MaterialCommunityIcons name="pencil-outline" size={18} color={theme.colors.onSurfaceVariant} />
    </Pressable> : null}
    <MaterialCommunityIcons name={item.selected ? "checkbox-marked-circle" : "plus"} size={16}
      color={item.selected ? item.color : theme.colors.onSurfaceVariant} />
  </Pressable>)}</View>;
  return <View style={{ gap: 24 }}>
    <View style={{ gap: 12 }}>
      <View style={s.choiceHeader}><Text style={[s.heading, { color: theme.colors.onSurface }]}>Selected · {selected.length}</Text>
        <Button mode="text" icon="plus" disabled={disabled} onPress={onCreate} labelStyle={s.buttonLabel}>Create new</Button></View>
      {selected.length ? pills(selected) : <Text style={{ ...typography.body, fontSize: 13, color: theme.colors.onSurfaceVariant }}>Tap a pill below to add your first one.</Text>}
    </View>
    {unselected.length ? <View style={{ gap: 12 }}>
      <Text style={[s.heading, { color: theme.colors.onSurfaceVariant }]}>Not selected · {unselected.length}</Text>
      {pills(unselected)}
    </View> : null}
  </View>;
}

export function SetupItemEditor({ visible, item, existingNames, noun, onSave, onRemove, onClose }: {
  visible: boolean;
  item: SetupItem | null; existingNames: string[]; noun: string; onSave: (item: SetupItem) => void; onRemove?: () => void; onClose: () => void;
}) {
  const theme = useTheme();
  const [name, setName] = React.useState(item?.name ?? "");
  const [icon, setIcon] = React.useState(item?.icon ?? "tag-outline");
  const [color, setColor] = React.useState(item?.color ?? SETUP_COLORS[0]);
  const [error, setError] = React.useState<string | null>(null);
  const close = () => { Keyboard.dismiss(); onClose(); };
  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) { setError("Enter a name to continue."); return; }
    if (existingNames.some(existing => existing.toLowerCase() === trimmed.toLowerCase() && existing !== item?.name)) {
      setError("That name is already on the list. Choose it there or use a different name."); return;
    }
    Keyboard.dismiss(); onSave({ name: trimmed, icon, color });
  };
  return <AnimatedPaperModal visible={visible} onDismiss={close} presentation="sheet" keyboardAware
    contentContainerStyle={{ backgroundColor: theme.colors.background, maxHeight: "92%", borderTopLeftRadius: 32, borderTopRightRadius: 32 }}>
    <View style={{ width: 42, height: 4, borderRadius: 2, backgroundColor: theme.colors.outlineVariant, alignSelf: "center", marginTop: 12 }} />
    <View style={s.editorHeader}>
      <Text accessibilityRole="header" style={[s.heading, { color: theme.colors.onSurface, flexShrink: 1 }]}>{item ? "Edit" : "New"} {noun}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Close editor" onPress={close} style={s.edit}>
        <MaterialCommunityIcons name="close" size={22} color={theme.colors.onSurfaceVariant} />
      </Pressable>
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, gap: 16 }}>
      <TextInput mode="outlined" label="Name" value={name} onChangeText={value => { setName(value); setError(null); }}
        maxLength={40} returnKeyType="done" onSubmitEditing={Keyboard.dismiss} error={Boolean(error)}
        style={{ backgroundColor: theme.colors.surface }} outlineStyle={{ borderRadius: 16 }} />
      {error ? <Text accessibilityRole="alert" style={{ ...typography.body, fontSize: 13, color: theme.colors.error }}>{error}</Text> : null}
      <Text style={[s.heading, { color: theme.colors.onSurface, textAlign: "center" }]}>Icon & color</Text>
      <AppearanceChoices icon={icon} color={color} onIcon={setIcon} onColor={setColor} icons={[]} />
      <ScrollView style={{ maxHeight: 208 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
        <AppearanceChoices icon={icon} color={color} onIcon={setIcon} onColor={setColor} icons={SETUP_ICONS} showColors={false} />
      </ScrollView>
      <Button mode="contained" onPress={save} disabled={!name.trim()} contentStyle={{ minHeight: 48 }} labelStyle={s.buttonLabel}>
        {item ? "Save changes" : "Create & select"}
      </Button>
      {onRemove ? <Button textColor={theme.colors.error} onPress={() => { Keyboard.dismiss(); onRemove(); }}>Remove from setup</Button> : null}
    </ScrollView>
  </AnimatedPaperModal>;
}

const s = StyleSheet.create({
  icons: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 },
  icon: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  color: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  choiceHeader: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 4 },
  choice: { flexDirection: "row", alignItems: "center", minHeight: 44, maxWidth: "100%", paddingVertical: 9, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, gap: 7 },
  edit: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  editorHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 12 },
  heading: { ...typography.editorial.sectionLabel, fontSize: 18, lineHeight: 24 },
  buttonLabel: { ...typography.editorial.sectionLabel, fontSize: 18, lineHeight: 24 },
});
