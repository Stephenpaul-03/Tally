import { useAppShell } from "@/components/AppShellContext";
import React from "react";
import { View } from "react-native";
import { MonthEmptyState } from "@/components/MonthEmptyState";
export function InsightsEmptyState({ expanded, hasOtherMonths, onAdd, onChooseMonth }: {
  expanded: boolean; hasOtherMonths: boolean; onAdd: () => void; onChooseMonth: () => void;
}) {
  const { activeTab } = useAppShell();
  if (!expanded) return null;
  return <View style={{ flexGrow: 1, justifyContent: "center", paddingVertical: 24 }}><MonthEmptyState active={activeTab === "insights"} insights onAdd={onAdd} onChooseMonth={hasOtherMonths ? onChooseMonth : undefined} /></View>;
}
