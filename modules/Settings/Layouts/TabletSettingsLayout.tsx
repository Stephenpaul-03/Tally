import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useNavigation, type ParamListBase } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "react-native-paper";
import { ActionRow } from "@/components/ActionRow";
import { SheetCard } from "@/components/SheetCard";
import { SettingsPage } from "../Components/SettingsPage";
import { DesignText as Text } from "@/components/DesignText";
import { SectionLabel } from "../Components/SectionLabel";
import { SettingsSearchHeader } from "../Components/SettingsSearchHeader";
import { AccountsScreen } from "../Screens/AccountsScreen";
import { CategoriesScreen } from "../Screens/CategoriesScreen";
import { DefaultsScreen } from "../Screens/DefaultsScreen";
import { DataScreen } from "../Screens/DataScreen";
import { BudgetScreen } from "@/modules/Management/Budget/Index";
import { GoalsScreen } from "@/modules/Goals/GoalsScreen";
import { RecurringScreen } from "@/modules/Recurring/RecurringScreen";
import { WorkspaceModal } from "../Modals/WorkspaceModal";
import { AppearanceModal } from "../Modals/AppearanceModal";
import { InterfaceModal } from "../Modals/InterfaceModal";
import { NotificationsModal } from "../Modals/NotificationsModal";
import { SecurityModal } from "../Modals/SecurityModal";
import { AboutModal } from "../Modals/AboutModal";
import { BetaContactModal } from "../Modals/BetaContactModal";
import { InlineSettingsModalContext, SettingsDetailContext } from "./SettingsDetailContext";
import { SettingsDetailView } from "../Views/SettingsDetailView";

const pages = { Categories: CategoriesScreen, Accounts: AccountsScreen, Budget: BudgetScreen,
  Goals: GoalsScreen, Recurring: RecurringScreen, Defaults: DefaultsScreen, Data: DataScreen };
const modals = { Workspaces: WorkspaceModal, Appearance: AppearanceModal, Interface: InterfaceModal,
  Notifications: NotificationsModal, Security: SecurityModal, About: AboutModal };
type Destination = keyof typeof pages | keyof typeof modals | "Support" | "Report" | "Suggest";
const descriptions: Record<Destination, string> = {
  Workspaces: "Track personal, family, or project budgets",
  Categories: "Personalize your transaction categories",
  Recurring: "Payment reminders and recurring schedules",
  Accounts: "Manage where your money lives",
  Budget: "Set monthly budget and category limits",
  Goals: "Savings targets and progress",
  Defaults: "Currency, account, and category defaults",
  Data: "Back up or restore your Tally data",
  Appearance: "Personalize the look and feel of Tally",
  Interface: "Navigation and visual interface options",
  Notifications: "Reminders and insight prompts",
  Security: "Biometric lock options",
  Support: "Help fund future updates",
  Report: "Help improve Tally",
  Suggest: "Share your ideas with us",
  About: "Version information, credits, and policies",
};
const groups: { title: string; items: [Destination, string, string][] }[] = [
  { title: "Current workspace", items: [["Workspaces", "Workspaces", "briefcase-outline"]] },
  { title: "Management", items: [["Categories", "Categories", "tag-multiple-outline"],
    ["Recurring", "Recurring", "calendar-refresh-outline"], ["Accounts", "Accounts", "wallet-outline"],
    ["Budget", "Budget", "wallet-plus-outline"], ["Goals", "Goals", "target"],
    ["Defaults", "Defaults", "tune-variant"], ["Data", "Data", "database-outline"]] },
  { title: "Preferences", items: [["Appearance", "Appearance", "palette-outline"],
    ["Interface", "Interface", "view-dashboard-outline"], ["Notifications", "Notifications", "bell-outline"],
    ["Security", "Security", "shield-lock-outline"]] },
  { title: "Support", items: [["Support", "Support Development", "heart-outline"],
    ["Report", "Report an Issue", "message-alert-outline"], ["Suggest", "Suggest a Feature", "lightbulb-outline"],
    ["About", "About", "information-outline"]] },
];
const DetailStack = createNativeStackNavigator();

function ModalDetail({ destination, onDismiss }: { destination: Destination; onDismiss: () => void }) {
  const dismiss = onDismiss;
  const Modal = modals[destination as keyof typeof modals];
  return <InlineSettingsModalContext.Provider value={Boolean(Modal)}>
    {Modal ? <Modal visible onDismiss={dismiss} /> : <BetaContactModal visible
      scenario={destination === "Report" ? "report" : destination === "Suggest" ? "request" : "support"}
      onDismiss={dismiss} />}
  </InlineSettingsModalContext.Provider>;
}

/** Drive the mounted navigator explicitly; initialRouteName only initializes it. */
function DetailRoute({ selected, destination, onSelect }: {
  selected: Destination; destination: Destination; onSelect: (page: Destination) => void;
}) {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  React.useEffect(() => {
    if (destination !== selected) navigation.replace(selected);
  }, [selected, destination, navigation]);
  const Page = pages[destination as keyof typeof pages];
  const kind = destination in modals ? "preferences" : destination === "Defaults" || destination === "Data" ? "form"
    : destination === "Goals" || destination === "Recurring" ? "list" : "grid";
  return <SettingsDetailView kind={kind}>
    {Page ? <Page /> : <ModalDetail destination={destination} onDismiss={() => onSelect("Workspaces")} />}
  </SettingsDetailView>;
}

export function TabletSettingsLayout({ initialPage = "Workspaces" }: { initialPage?: string }) {
  const theme = useTheme();
  const navigation = useNavigation();
  const [query, setQuery] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [betaScenario, setBetaScenario] = React.useState<"support" | "report" | "request" | null>(null);
  const [selected, setSelected] = React.useState<Destination>(
    initialPage in pages ? initialPage as Destination : "Workspaces");
  const filteredGroups = groups.map(group => ({ ...group, items: group.items.filter(([id, label]) =>
    `${label} ${descriptions[id]}`.toLowerCase().includes(query.trim().toLowerCase())) }))
    .filter(group => group.items.length > 0);
  return <SettingsPage style={{ backgroundColor: theme.colors.background }}>
    <View style={styles.body}>
      <View style={[styles.menu, { borderRightColor: theme.colors.outlineVariant }]}>
        <SettingsSearchHeader title="Settings" onBack={() => navigation.goBack()}
          query={query} onQueryChange={setQuery} searchOpen={searchOpen} onSearchOpenChange={setSearchOpen} />
      <ScrollView style={styles.menuScroll}
        contentContainerStyle={{ paddingBottom: 24 }}>
        {filteredGroups.length === 0 ? <Text accessibilityRole="alert"
          style={{ padding: 20, color: theme.colors.onSurfaceVariant }}>No settings found. Try budget, backup, or reminders.</Text> : null}
        {filteredGroups.map(group => <View key={group.title}>
          <SectionLabel label={group.title} />
          <SheetCard theme={theme} style={{ marginHorizontal: 12 }}>
            {group.items.map(([id, label, icon]) => <View key={id}
              style={selected === id ? { backgroundColor: theme.colors.secondaryContainer, borderRadius: 20 } : undefined}>
              <ActionRow label={label} description={descriptions[id]} icon={icon} theme={theme} onPress={() => {
                if (id === "Support" || id === "Report" || id === "Suggest") {
                  setBetaScenario(id === "Support" ? "support" : id === "Report" ? "report" : "request");
                } else setSelected(id);
              }}
                style={{ minHeight: 72 }} />
            </View>)}
          </SheetCard>
        </View>)}
      </ScrollView>
      </View>
      <View style={styles.detail}>
        <SettingsDetailContext.Provider value={true}>
          <DetailStack.Navigator initialRouteName={selected}
            screenOptions={{ headerShown: false, animation: "none", contentStyle: { backgroundColor: theme.colors.background } }}>
            {([...Object.keys(pages), ...Object.keys(modals), "Support", "Report", "Suggest"] as Destination[]).map(name =>
              <DetailStack.Screen key={name} name={name}>{() =>
                <DetailRoute selected={selected} destination={name} onSelect={setSelected} />
              }</DetailStack.Screen>)}
          </DetailStack.Navigator>
        </SettingsDetailContext.Provider>
      </View>
    </View>
    <BetaContactModal visible={betaScenario !== null} scenario={betaScenario ?? "support"}
      onDismiss={() => setBetaScenario(null)} />
  </SettingsPage>;
}

const styles = StyleSheet.create({
  body: { flex: 1, flexDirection: "row", minHeight: 0 },
  menu: { width: 350, flexShrink: 0, borderRightWidth: StyleSheet.hairlineWidth },
  menuScroll: { flex: 1 },
  detail: { flex: 1, minWidth: 0, overflow: "hidden" },
});
