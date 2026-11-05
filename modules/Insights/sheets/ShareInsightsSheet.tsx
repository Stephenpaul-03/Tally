import { LazyModalContent } from "@/components/modal/LazyModalContent";
import { ReportDetailPicker } from "./ReportDetailPicker";
import { toast } from "@/components/toast/ToastProvider";
import React, { useState } from "react";
import { View } from "react-native";
import { Checkbox, useTheme } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { DesignText as Text } from "@/components/DesignText";
import { useMainDesign } from "@/hooks/use-main-design";
import { ActivityTypeToggle } from "../components/ActivityTypeToggle";
import { MotionPressable } from "../components/Motion";
import { ControlsSheet } from "./ControlsSheet";
import { availableReportSelection, hasReportSections, REPORT_SECTIONS, toggleReportSection, type ReportSelection, type ReportSectionKey } from "../reportSelection";

export type ExpandableReportGroup = { key: string; label: string; section: ReportSectionKey; count: number; icon?: string; color?: string };
export function ShareInsightsSheet({ visible, onClose, onShare, sharing, canCompareBudget, previousSections, previousMonth, groups, externalCatalog = false }: {
  externalCatalog?: boolean;
  visible: boolean; onClose: () => void; onShare: (selection: ReportSelection) => void;
  previousSections: Record<ReportSectionKey, boolean>;
  sharing: boolean; canCompareBudget: boolean; previousMonth: string; groups: ExpandableReportGroup[];
}) {
  const { colors: c } = useTheme();
  const { design, insightsStyle } = useMainDesign();
  const [preferences, setSelection] = useState<ReportSelection>(() => ({ includeIncome: true, includeExpenses: true,
    includeAccounts: true, compareBudget: canCompareBudget, compareMonth: true,
    layout: insightsStyle ?? design.layout, expanded: [] }));
  const sections = {
    includeIncome: groups.some(group => group.section === "includeIncome"),
    includeExpenses: groups.some(group => group.section === "includeExpenses"),
    includeAccounts: groups.some(group => group.section === "includeAccounts"),
  };
  const selection = availableReportSelection(preferences, sections, previousSections, canCompareBudget);
  const monthAvailable = REPORT_SECTIONS.some(key => selection[key] && previousSections[key]);
  const budgetAvailable = selection.includeExpenses && canCompareBudget;
  const [picker, setPicker] = useState<ReportSectionKey | null>(null);
  const available = groups.filter(group => selection[group.section]);
  const checkRow = (label: string, checked: boolean, onPress: () => void, description?: string, disabled = false, tone?: "include" | "comparison") => (
    <MotionPressable key={label} accessibilityRole="checkbox" accessibilityLabel={label}
      accessibilityState={{ checked, disabled }} disabled={disabled || sharing} onPress={onPress}
      style={{ flexDirection: "row", alignItems: "center", gap: 8, minHeight: 52, padding: 10,
        borderRadius: 16, backgroundColor: tone ? "transparent" : c.surface, opacity: disabled ? 0.5 : 1 }}>
      <View pointerEvents="none"><Checkbox.Android status={checked ? "checked" : "unchecked"} color={c.primary} uncheckedColor={c.onSurfaceVariant} /></View>
      <View style={{ flex: 1, gap: 2 }}><Text style={{ fontSize: 14, fontWeight: "700", color: c.onSurface }}>{label}</Text>
        {description ? <Text style={{ fontSize: 12, color: c.onSurfaceVariant }}>{description}</Text> : null}</View>
    </MotionPressable>
  );
  const heading = (label: string) => <Text style={{ fontSize: 14, fontWeight: "800", marginTop: 10, marginBottom: 2 }}>{label}</Text>;
  return <>
    <ControlsSheet visible={visible} suspended={picker !== null} title="Share PDF" onClose={sharing ? () => {} : onClose} displayTitle
      headerAccessory={<ActivityTypeToggle stylePicker value={selection.layout === "sage" ? "expense" : "income"}
        onChange={type => { if (!sharing) setSelection(old => ({ ...old, layout: type === "expense" ? "sage" : "classic" })); }} />}>
      <View style={{ flexDirection: "row", gap: 10, alignItems: "stretch" }}>
        <View style={{ flex: 1, padding: 8, borderRadius: 24, backgroundColor: c.surface }}>
          <Text style={{ fontSize: 14, fontWeight: "800", color: c.onSurface, padding: 8 }}>Include</Text>
          {([['includeIncome', 'Income'], ['includeExpenses', 'Expenses'], ['includeAccounts', 'Accounts']] as const).map(([key, label]) =>
            checkRow(label, selection[key], () => {
              const next = toggleReportSection(selection, key);
              if (next === selection) { toast.info("Keep at least one section selected."); return; }
              setSelection({ ...next, expanded: next.expanded.filter(id => groups.some(group => group.key === id && next[group.section])) });
            }, undefined, !sections[key], "include"))}
        </View>
        <View style={{ flex: 1, padding: 8, borderRadius: 24, backgroundColor: c.surface }}>
          <Text style={{ fontSize: 14, fontWeight: "800", color: c.onSurface, padding: 8 }}>Comparisons</Text>
          {checkRow("Past month", selection.compareMonth, () => setSelection(old => ({ ...old, compareMonth: !selection.compareMonth })), previousMonth, !monthAvailable, "comparison")}
          {checkRow("Budget", selection.compareBudget && selection.includeExpenses && canCompareBudget,
            () => setSelection(old => ({ ...old, compareBudget: !selection.compareBudget })), undefined, !budgetAvailable, "comparison")}
        </View>
      </View>
      {heading("Expanded details")}
      <Text style={{ fontSize: 12, color: c.onSurfaceVariant, marginBottom: 4 }}>Choose items to include their transactions.</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
      {(['includeExpenses', 'includeIncome', 'includeAccounts'] as const).filter(section => selection[section]).map(section => {
        const rows = available.filter(group => group.section === section);
        const count = rows.filter(group => selection.expanded.includes(group.key)).length;
        const label = section === "includeExpenses" ? "Expenses" : section === "includeIncome" ? "Income" : "Accounts";
        return <MotionPressable key={section} accessibilityRole="button" accessibilityLabel={`Expand ${label.toLowerCase()}`}
          disabled={sharing || !rows.length} onPress={() => setPicker(section)}
          style={{ flexDirection: "row", alignItems: "center", gap: 8, width: "48%", minHeight: 90, padding: 12, borderRadius: 18, backgroundColor: c.surface }}>
          <Icon name={section === "includeAccounts" ? "wallet-outline" : "format-list-checks"} size={22} color={c.primary} />
          <View style={{ flex: 1, gap: 2 }}><Text style={{ fontWeight: "700" }}>{label}</Text>
            <Text style={{ fontSize: 12, color: c.onSurfaceVariant }}>{!rows.length ? "No entries this month" : count ? `${count} expanded` : "Summaries only"}</Text>
          </View><Icon name="chevron-right" size={20} color={c.onSurfaceVariant} />
        </MotionPressable>;
      })}
      </View>
      <MotionPressable accessibilityRole="button" accessibilityLabel="Export Insights PDF" disabled={sharing || !hasReportSections(selection)} onPress={() => onShare({ ...selection, compareBudget: canCompareBudget && selection.compareBudget, expanded: selection.expanded.filter(key => available.some(group => group.key === key)) })}
        style={{ minHeight: 52, marginTop: 12, borderRadius: 26, backgroundColor: c.primary, alignItems: "center", justifyContent: "center", opacity: sharing || !hasReportSections(selection) ? 0.6 : 1 }}>
        <Text style={{ color: c.onPrimary, fontWeight: "800" }}>{sharing ? "Creating PDF…" : "Create and share PDF"}</Text>
      </MotionPressable>
    </ControlsSheet>
    <LazyModalContent visible={visible && picker !== null}><ReportDetailPicker externalCatalog={externalCatalog} visible={visible} section={picker} groups={available} selected={selection.expanded}
      onClose={() => setPicker(null)} onToggle={key => setSelection(old => ({ ...old,
        expanded: old.expanded.includes(key) ? old.expanded.filter(id => id !== key) : [...old.expanded, key] }))} /></LazyModalContent>
  </>;
}
