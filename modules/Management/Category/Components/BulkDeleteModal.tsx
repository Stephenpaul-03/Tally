import { CategoryIconBadge } from "@/components/CategoryIconBadge";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { toast } from "@/components/toast/ToastProvider";
import { useAppDispatch } from "@/hooks/Redux";
import type { useCategoryManagement } from "@/hooks/use-category-manamgement";
import { getActiveWorkspaceId } from "@/modules/Core/Repository/Index";
import { SQLiteFinanceRepository } from "@/modules/Core/Repository/SQLiteRepo";
import { deleteCategoriesAsync } from "@/modules/Core/Slices/TransactionSlice";
import { SettingsHeader } from "@/modules/Settings/Components/SettingsHeader";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Button, Checkbox, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = { visible: boolean; onDismiss: () => void; management: ReturnType<typeof useCategoryManagement> };
export function CategoryBulkDeleteModal({ visible, onDismiss, management }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const [selected, setSelected] = React.useState<string[]>([]);
  const [usage, setUsage] = React.useState<{ name: string; count: number }[]>([]);
  const [workspaceId, setWorkspaceId] = React.useState("");
  const [review, setReview] = React.useState(false);
  const [destination, setDestination] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const fallback = management.selectedType === "income" ? "Other Income" : "Other Expense";
  React.useEffect(() => {
    if (!visible) return;
    let active = true;
    const id = getActiveWorkspaceId();
    setWorkspaceId(id); setUsage([]); setSelected([]); setReview(false); setDestination(""); setError(""); setLoading(true);
    new SQLiteFinanceRepository(id).getCategoryUsage(management.selectedType).then(rows => { if (active) setUsage(rows); })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : "Couldn't load categories"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [visible, management.selectedType]);
  const selectable = usage.filter(row => row.name !== fallback);
  const categoryLabel = selected.length === 1 ? "category" : "categories";
  const affected = usage.filter(row => selected.includes(row.name)).reduce((sum, row) => sum + row.count, 0);
  const remaining = usage.filter(row => !selected.includes(row.name));
  const toggle = (name: string) => { setSelected(previous => previous.includes(name) ? previous.filter(item => item !== name) : [...previous, name]); setDestination(""); };
  const dismiss = () => { if (!busy) onDismiss(); };
  const confirm = async () => {
    if (busy || !selected.length || (affected > 0 && !destination)) return;
    setBusy(true); setError("");
    try {
      await dispatch(deleteCategoriesAsync({ names: selected, type: management.selectedType, destination: affected ? destination : undefined, workspaceId })).unwrap();
      toast.success(`${selected.length} ${categoryLabel} deleted`); onDismiss();
    } catch (reason) {
      setError(typeof reason === "object" && reason && "message" in reason ? String(reason.message) : "Couldn't delete categories");
      try {
        const current = await new SQLiteFinanceRepository(workspaceId).getCategoryUsage(management.selectedType);
        setUsage(current); setSelected(previous => previous.filter(name => current.some(row => row.name === name)));
      } catch { /* The existing error tells the user to refresh or restart. */ }
    }
    finally { setBusy(false); }
  };
  const rowContent = (name: string, count?: number) => <>
    <CategoryIconBadge icon={management.getCategoryIcon(name) as React.ComponentProps<typeof CategoryIconBadge>["icon"]} color={management.getCategoryColor(name)} />
    <View style={{ flex: 1, gap: 3 }}><Text style={{ fontWeight: "600" }}>{name}</Text>{count !== undefined ? <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>{count} transaction{count === 1 ? "" : "s"}</Text> : null}</View>
  </>;
  return <AnimatedPaperModal visible={visible} onDismiss={dismiss} dismissable={!busy} presentation="sheet" includeBottomInset={false}
    contentContainerStyle={{ backgroundColor: theme.colors.background, maxHeight: "90%", borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: "hidden" }}>
    <SettingsHeader title={review ? "Confirm deletion" : "Select categories"} onBack={review && !busy ? () => setReview(false) : dismiss} modal />
    <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }} keyboardShouldPersistTaps="handled">
      <Text style={{ color: theme.colors.onSurfaceVariant }}>{review
        ? `${selected.length} ${categoryLabel} will be deleted. ${affected ? `${affected} transactions (including any in Trash) will be kept and moved.` : "They have no transactions, so nothing needs moving."}`
        : `Select the ${management.selectedType} categories to delete. ${fallback} is kept as your fallback.`}</Text>
      {error ? <Text accessibilityRole="alert" style={{ color: theme.colors.error }}>{error}</Text> : null}
      {loading ? <Text>Loading categories…</Text> : null}
      {!review ? <>
        <Button compact disabled={busy || loading} onPress={() => setSelected(selected.length === selectable.length ? [] : selectable.map(row => row.name))}>{selected.length === selectable.length ? "Clear selection" : "Select all"}</Button>
        {selectable.map(row => <Pressable key={row.name} accessibilityRole="checkbox" accessibilityState={{ checked: selected.includes(row.name) }} accessibilityLabel={row.name} onPress={() => toggle(row.name)} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12, backgroundColor: theme.colors.surface, borderRadius: 16 }}>
          {rowContent(row.name, row.count)}<View pointerEvents="none"><Checkbox.Android status={selected.includes(row.name) ? "checked" : "unchecked"} /></View>
        </Pressable>)}
      </> : <>
        {selected.map(name => <View key={name} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>{rowContent(name)}</View>)}
        {affected > 0 ? <>
          <Text style={{ fontWeight: "600", marginTop: 12 }}>Move transactions to</Text>
          {remaining.length ? remaining.map(row => <Pressable key={row.name} accessibilityRole="radio" accessibilityState={{ selected: destination === row.name }} onPress={() => setDestination(row.name)} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12, backgroundColor: theme.colors.surface, borderRadius: 16 }}>
            {rowContent(row.name)}<MaterialCommunityIcons name={destination === row.name ? "radiobox-marked" : "radiobox-blank"} size={22} color={theme.colors.primary} />
          </Pressable>) : <Text style={{ color: theme.colors.error }}>Go back and keep a category to receive these transactions.</Text>}
        </> : null}
      </>}
    </ScrollView>
    <View style={{ padding: 20, paddingBottom: Math.max(20, insets.bottom) }}>
      <Button mode="contained" buttonColor={review ? theme.colors.error : undefined} loading={busy} disabled={loading || busy || !selected.length || (review && affected > 0 && !destination)}
        onPress={review ? confirm : () => setReview(true)}>{review ? `Delete ${selected.length} ${categoryLabel}` : `Continue · ${selected.length} selected`}</Button>
    </View>
  </AnimatedPaperModal>;
}
