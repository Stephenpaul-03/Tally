import { sortCategories } from "@/utils/category-order";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { CategoryIconBadge } from "@/components/CategoryIconBadge";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { CategoryTile } from "@/modules/Management/Category/Components/CategoryTile";
import { typography } from "@/theme/typography";
import { getAccountColor, getAccountIconName, getCategoryColor, getCategoryIconName } from "@/utils/Helpers";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { FlatList, Pressable, ScrollView, View } from "react-native";
import { Button, Switch, Text, TextInput, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SettingsHeader } from "../Components/SettingsHeader";
import { applyImportChoice, categoryNames, exactName, needsAccount, needsCategory, needsReview, type ImportCatalog, type ImportRow } from "@/modules/Core/import/validation";

type Props = { visible: boolean; onDismiss: () => void; rows: ImportRow[]; catalog: ImportCatalog; onChange: (rows: ImportRow[]) => void };
export function ImportReviewModal({ visible, onDismiss, rows, catalog, onChange }: Props) {
  const theme = useTheme();
  const { minimalIconsEnabled } = useAddonPrefs();
  const insets = useSafeAreaInsets();
  const [selection, setSelection] = useState<{ rowNumber: number; field: "category" | "account" } | null>(null);
  const [name, setName] = useState("");
  const [matching, setMatching] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const pending = rows.filter(row => needsReview(row, catalog));
  const selected = rows.find(row => row.rowNumber === selection?.rowNumber);
  const isCategory = selection?.field === "category";
  const existing = selected && isCategory ? categoryNames(selected.transaction.type, catalog) : catalog.accounts;
  const staged = rows.filter(row => isCategory
    ? row.createCategory && row.transaction.type === selected?.transaction.type
    : row.createAccount).map(row => isCategory ? row.transaction.category : row.transaction.account);
  const names = Array.from(new Set([...existing, ...staged]));
  const options = selection?.field === "category"
    ? sortCategories(names, name => name, (a, b) => a.localeCompare(b))
    : names.sort((a, b) => a.localeCompare(b));
  const iconFor = (value: string, category: boolean, row: ImportRow) => category
    ? getCategoryIconName(value, row.transaction.type, catalog.categoryIcons)
    : getAccountIconName(value, catalog.accountIcons);
  const colorFor = (value: string, category: boolean, row: ImportRow) => category
    ? getCategoryColor(value, row.transaction.type, catalog.categoryColors)
    : getAccountColor(value, catalog.accountColors);
  const apply = (value: string) => {
    if (!selected || !selection || !value.trim()) return;
    const normalized = exactName(value.trim(), existing) ?? exactName(value.trim(), options) ?? value.trim();
    onChange(applyImportChoice(rows, selected, selection.field, normalized, !exactName(normalized, existing), matching));
    setSelection(null);
  };
  const open = (row: ImportRow, field: "category" | "account") => {
    setName(field === "category" ? row.transaction.category : row.transaction.account);
    setMatching(false);
    setSelection({ rowNumber: row.rowNumber, field });
  };
  const dismiss = () => { setSelection(null); onDismiss(); };
  const fieldRow = (row: ImportRow, field: "category" | "account") => {
    const category = field === "category";
    const unresolved = category ? needsCategory(row, catalog) : needsAccount(row, catalog);
    const value = row.transaction[field];
    const original = category ? row.originalCategory : row.originalAccount;
    const isNew = category ? row.createCategory : row.createAccount;
    return <Pressable accessibilityRole="button" accessibilityLabel={`Row ${row.rowNumber}: choose ${category ? "category" : "payment account"}`}
      onPress={() => open(row, field)} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, opacity: pressed ? .65 : 1 })}>
      <CategoryIconBadge icon={(unresolved ? "alert-circle-outline" : iconFor(value, category, row)) as React.ComponentProps<typeof CategoryIconBadge>["icon"]} color={unresolved ? theme.colors.error : colorFor(value, category, row)} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ color: theme.colors.onSurface, fontWeight: "600" }}>{unresolved ? `Choose ${category ? "category" : "payment account"}` : value}</Text>
        <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>{unresolved ? original ? `From file: ${original}` : "Missing in file" : isNew ? "New · created when you import" : category ? "Category" : "Payment account"}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
    </Pressable>;
  };
  return <>
    <AnimatedPaperModal visible={visible} onDismiss={dismiss} presentation="sheet" contentWrapperStyle={{ flex: 1 }} contentContainerStyle={{ backgroundColor: theme.colors.background, height: "90%", borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: "hidden" }} includeBottomInset={false}>
      <SettingsHeader title="Review transactions" onBack={dismiss} modal />
      <View style={{ paddingHorizontal: 20, paddingBottom: 12, gap: 12 }}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>{rows.length - pending.length} of {rows.length} ready. Every transaction needs a category and a payment account.</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button compact mode={!showAll ? "contained-tonal" : "text"} onPress={() => setShowAll(false)}>To fix · {pending.length}</Button>
          <Button compact mode={showAll ? "contained-tonal" : "text"} onPress={() => setShowAll(true)}>All · {rows.length}</Button>
        </View>
      </View>
      <FlatList style={{ flex: 1 }} data={showAll ? rows : pending} keyExtractor={row => String(row.rowNumber)} keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingTop: 0, gap: 12, flexGrow: 1 }}
        ListEmptyComponent={<View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 16 }}>
          <MaterialCommunityIcons name="check-circle-outline" size={40} color={theme.colors.primary} />
          <Text style={{ ...typography.editorial.sectionLabel, fontSize: 22 }}>Everything has a home.</Text>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>Your transactions are ready to import.</Text>
        </View>}
        renderItem={({ item: row }) => <View style={{ backgroundColor: theme.colors.surface, borderRadius: 20, padding: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, paddingBottom: 10 }}>
            <CategoryIconBadge icon={row.transaction.type === "income" ? "arrow-bottom-left" : "arrow-top-right"} color={row.transaction.type === "income" ? "#00CF7D" : "#FF626B"} />
            <View style={{ flex: 1, gap: 4 }}><Text style={{ fontWeight: "600" }}>{row.transaction.title}</Text><Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>Row {row.rowNumber} · {row.transaction.date}</Text></View>
            <Text style={{ fontWeight: "600" }}>{row.transaction.currencySymbol ?? ""}{row.transaction.amount.toLocaleString()}</Text>
          </View>
          {fieldRow(row, "category")}{fieldRow(row, "account")}
        </View>} />
      <View style={{ padding: 20, paddingBottom: Math.max(20, insets.bottom), borderTopWidth: .5, borderColor: theme.colors.outlineVariant }}>
        <Button mode="contained" onPress={dismiss}>{pending.length ? "Save review and go back" : "Done"}</Button>
      </View>
    </AnimatedPaperModal>
    <AnimatedPaperModal visible={visible && !!selection} onDismiss={() => setSelection(null)} presentation="sheet" keyboardAware contentContainerStyle={{ backgroundColor: theme.colors.background, maxHeight: "85%", borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: "hidden" }}>
      <SettingsHeader title={isCategory ? "Choose category" : "Payment account"} onBack={() => setSelection(null)} modal />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 14 }}>
        <Text style={{ fontWeight: "600" }}>{selected?.transaction.title}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}><Text>Apply to matching transactions</Text><Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>Off applies this choice to this transaction only.</Text></View>
          <Switch value={matching} onValueChange={setMatching} accessibilityLabel="Apply this choice to matching transactions" />
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {selected ? options.map(option => <View key={option} style={{ width: "48%" }}><CategoryTile name={option} icon={iconFor(option, isCategory, selected)} color={colorFor(option, isCategory, selected)} iconColorOverride={minimalIconsEnabled ? theme.colors.primary : undefined} showTransactionLabel={false} pickerMode isSelected={selected.transaction[selection!.field] === option} theme={theme} onPress={() => apply(option)} /></View>) : null}
        </View>
        <Text style={{ ...typography.editorial.sectionLabel, fontSize: 18, marginTop: 8 }}>Or create a new one</Text>
        <TextInput mode="outlined" label={isCategory ? "Category name" : "Payment account name"} value={name} onChangeText={setName} maxLength={50} left={<TextInput.Icon icon={isCategory ? "tag-plus-outline" : "wallet-plus-outline"} />} />
        <Button mode="contained" icon="plus" disabled={!name.trim()} onPress={() => apply(name)}>Use {name.trim() || "new item"}</Button>
        <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>New items are created only when you confirm the import.</Text>
      </ScrollView>
    </AnimatedPaperModal>
  </>;
}
