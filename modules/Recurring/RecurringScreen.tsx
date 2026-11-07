import Animated, { FadeIn, FadeOut, ReduceMotion } from "react-native-reanimated";
import { useMotionEnabled } from "@/components/animations/Motion";
import React from "react";
import { AppState, FlatList, View } from "react-native";
import { ActivityIndicator, Button, useTheme } from "react-native-paper";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { SettingsPage } from "@/modules/Settings/Components/SettingsPage";
import { SettingsHeader } from "@/modules/Settings/Components/SettingsHeader";
import { DesignText as Text } from "@/components/DesignText";
import { useAppSelector } from "@/hooks/Redux";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { ledgerMoney } from "@/modules/Main/presentation";
import { TransactionModal } from "@/modules/Management/Transaction/Components/TransactionModal/Index";
import { monthlyEstimate } from "./model";
import { useRecurring } from "./useRecurring";
import { RecurringActions, type RecurringSelection } from "./RecurringActions";
import { RecurringCard } from "./RecurringCard";
import { skipRecurring } from "./repository";
import { toast } from "@/components/toast/ToastProvider";

export function RecurringScreen() {
  const theme = useTheme<ExtendedMD3Theme>(), c = theme.colors, navigation = useNavigation();
  const focused = useIsFocused();
  const motion = useMotionEnabled();
  const [foreground, setForeground] = React.useState(AppState.currentState === "active");
  React.useEffect(() => {
    const listener = AppState.addEventListener("change", state => setForeground(state === "active"));
    return () => listener.remove();
  }, []);
  const workspace = useAppSelector(selectActiveWorkspace);
  const data = useRecurring(workspace?.id || "");
  const [selection, setSelection] = React.useState<RecurringSelection | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [skipping, setSkipping] = React.useState<string | null>(null);
  const [emptyIcon, setEmptyIcon] = React.useState(0);
  React.useEffect(() => {
    if (!focused || !foreground || creating || data.templates.length || data.loading || data.error) return;
    // Icon changes remain enabled even when entrance/transition animations are off.
    const timer = setInterval(() => setEmptyIcon(value => (value + 1) % 3), 2800);
    return () => clearInterval(timer);
  }, [focused, foreground, creating, data.templates.length, data.loading, data.error]);
  const templates = [...data.templates].sort((a, b) => Number(a.paused) - Number(b.paused) || a.nextDate.localeCompare(b.nextDate));
  const totals = monthlyEstimate(templates);
  return <SettingsPage style={{ backgroundColor: c.background }}>
    <SettingsHeader title="Recurring" onBack={() => navigation.goBack()} rightIcon="plus" rightAccessibilityLabel="Add recurring schedule" onRightPress={() => setCreating(true)} />
    <FlatList data={templates} keyExtractor={item => item.id} style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: !templates.length && !data.error ? "center" : undefined, padding: 16, gap: 12, paddingBottom: 28 }}
      ListHeaderComponent={data.error ? <View style={{ gap: 8 }}><Text style={{ color: c.error }}>{data.error}</Text><Button onPress={data.refresh}>Retry</Button></View> : Object.keys(totals).length ? <View style={{ padding: 16, borderRadius: theme.expressive ? 24 : 16, backgroundColor: c.surface, gap: 6 }}>
        <Text style={{ fontSize: 12, color: c.onSurfaceVariant }}>Estimated monthly expenses</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>{Object.entries(totals).map(([code, amount]) => <Text key={code} style={{ fontSize: 24, fontWeight: "800", color: c.onSurface }}>{ledgerMoney(amount, code, templates.find(item => item.form.currencyCode === code)?.form.currencySymbol)}</Text>)}</View>
      </View> : null}
      ListEmptyComponent={data.loading ? <View style={{ flex: 1, justifyContent: "center" }}><ActivityIndicator accessibilityLabel="Loading recurring schedules" /></View> : !data.error ? <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 }}>
        <View style={{ width: "100%", padding: 28, borderRadius: theme.expressive ? 36 : 20, alignItems: "center", gap: 16, backgroundColor: c.surface }}>
          <View style={{ width: 72, height: 72, borderRadius: theme.expressive ? 24 : 36, backgroundColor: c.secondaryContainer, alignItems: "center", justifyContent: "center" }}>
            <View style={{ width: 32, height: 32 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Animated.View key={emptyIcon} style={{ position: "absolute" }} entering={FadeIn.duration(motion ? 220 : 0).reduceMotion(ReduceMotion.System)} exiting={FadeOut.duration(motion ? 180 : 0).reduceMotion(ReduceMotion.System)}>
                <Icon name={(["calendar-refresh-outline", "repeat", "calendar-clock-outline"] as const)[emptyIcon]} size={32} color={c.onSecondaryContainer} />
              </Animated.View>
            </View>
          </View>
          <Text style={{ color: c.onSurface, fontSize: 23, fontWeight: "800", textAlign: "center" }}>Keep the regulars ready</Text>
          <Text style={{ color: c.onSurfaceVariant, textAlign: "center", lineHeight: 21 }}>Set a schedule. Record the payment when it happens.</Text>
          <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>Add recurring</Button>
        </View>
      </View> : null}
      renderItem={({ item, index }) => {
        const occurrence = data.actionable.filter(value => value.templateId === item.id).sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
        return <View style={{ gap: 10 }}>
          {item.paused && !templates[index - 1]?.paused && <Text style={{ color: c.onSurfaceVariant, fontWeight: "700", fontSize: 13, paddingTop: 8 }}>Paused</Text>}
          <RecurringCard template={item} occurrence={occurrence} busy={skipping === item.id} onPress={() => setSelection({ template: item, occurrence })}
            onAdd={occurrence ? () => setSelection({ template: item, occurrence, quick: true }) : undefined}
            onSkip={occurrence ? async () => {
              setSkipping(item.id);
              try { await skipRecurring(item.workspaceId, item.id, occurrence.dueDate); toast.success("Occurrence skipped"); }
              catch (error) { toast.error(error instanceof Error ? error.message : String(error)); }
              finally { setSkipping(null); }
            } : undefined} />
        </View>;
      }} />
    <TransactionModal isOpen={creating} onClose={() => setCreating(false)} createRecurring />
    <RecurringActions selection={selection} onClose={() => setSelection(null)} occurrences={data.occurrences} />
  </SettingsPage>;
}
