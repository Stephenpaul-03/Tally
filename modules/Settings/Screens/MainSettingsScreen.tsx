import { ActionRow } from "@/components/ActionRow";
import { SheetCard } from "@/components/SheetCard";
import { useAppSelector } from "@/hooks/Redux";
import { useAbstractSearch } from "@/hooks/use-abstract-search";
import type { Workspace } from "@/modules/Core/Repository/SQLiteRepo";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { ScrollView, View } from "react-native";
import { useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BetaContactModal,
  type BetaContactScenario,
} from "../Modals/BetaContactModal";
import { SectionLabel } from "../Components/SectionLabel";
import { SettingsSearchHeader } from "../Components/SettingsSearchHeader";
import { AppearanceModal } from "../Modals/AppearanceModal";
import { AboutModal } from "../Modals/AboutModal";
import { BackupExportModal } from "../Modals/ExportModal";
import { BackupImportModal } from "../Modals/ImportModal";
import { InterfaceModal } from "../Modals/InterfaceModal";
import { NotificationsModal } from "../Modals/NotificationsModal";
import { SecurityModal } from "../Modals/SecurityModal";
import { WorkspaceModal } from "../Modals/WorkspaceModal";
import type { SettingsStackParamList } from "../Navigation";
import { SettingsStyles } from "../Styles";

function formatLastBackupDescription(workspace: Workspace | null) {
  if (!workspace?.lastBackupAt) return "Last backup: No backup yet";

  const kindLabel =
    workspace.lastBackupKind === "month"
      ? "Month"
      : workspace.lastBackupKind === "range"
        ? "Range"
        : "Full";
  const dateLabel = new Date(workspace.lastBackupAt).toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );

  return `Last backup: ${dateLabel} • ${kindLabel}`;
}

type SettingsSearchItem = {
  id: string;
  icon: string;
  label: string;
  description: string;
  keywords: string[];
  onPress: () => void;
};

type SearchableSettingsScreen = Exclude<keyof SettingsStackParamList, never>;

export function MainSettingsScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const activeWorkspace = useAppSelector(selectActiveWorkspace);
  const [query, setQuery] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [aboutOpen, setAboutOpen] = React.useState(false);
  const [appearanceOpen, setAppearanceOpen] = React.useState(false);
  const [interfaceOpen, setInterfaceOpen] = React.useState(false);
  const [workspacesOpen, setWorkspacesOpen] = React.useState(false);
  const [backupExportOpen, setBackupExportOpen] = React.useState(false);
  const [backupImportOpen, setBackupImportOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [securityOpen, setSecurityOpen] = React.useState(false);
  const [betaContactScenario, setBetaContactScenario] =
    React.useState<BetaContactScenario | null>(null);
  const closeSearch = React.useCallback(() => {
    setQuery("");
    setSearchOpen(false);
  }, []);
  const navigateToScreen = React.useCallback(
    (screen: SearchableSettingsScreen) => {
      closeSearch();
      navigation.navigate(screen);
    },
    [closeSearch, navigation],
  );
  const openBetaContactModal = React.useCallback(
    (scenario: BetaContactScenario) => {
      closeSearch();
      setBetaContactScenario(scenario);
    },
    [closeSearch],
  );
  const closeBetaContactModal = React.useCallback(() => {
    setBetaContactScenario(null);
  }, []);
  const openAboutModal = React.useCallback(() => {
    closeSearch();
    setAboutOpen(true);
  }, [closeSearch]);
  const openAppearanceModal = React.useCallback(() => {
    closeSearch();
    setAppearanceOpen(true);
  }, [closeSearch]);
  const openInterfaceModal = React.useCallback(() => {
    closeSearch();
    setInterfaceOpen(true);
  }, [closeSearch]);
  const openWorkspacesModal = React.useCallback(() => {
    closeSearch();
    setWorkspacesOpen(true);
  }, [closeSearch]);
  const openNotificationsModal = React.useCallback(() => {
    closeSearch();
    setNotificationsOpen(true);
  }, [closeSearch]);
  const openSecurityModal = React.useCallback(() => {
    closeSearch();
    setSecurityOpen(true);
  }, [closeSearch]);
  const openBackupExportModal = React.useCallback(() => {
    closeSearch();
    setBackupExportOpen(true);
  }, [closeSearch]);
  const openBackupImportModal = React.useCallback(() => {
    closeSearch();
    setBackupImportOpen(true);
  }, [closeSearch]);
  const closeAboutModal = React.useCallback(() => {
    setAboutOpen(false);
  }, []);
  const settingsItems = React.useMemo<SettingsSearchItem[]>(
    () => [
      {
        id: "workspaces",
        icon: "briefcase-outline",
        label: "Workspaces",
        description: "Track personal, family, or project budgets",
        keywords: ["management", "workspace", "personal", "family", "project"],
        onPress: openWorkspacesModal,
      },
      {
        id: "add-workspace",
        icon: "plus-box-outline",
        label: "Add Workspace",
        description:
          "Create a separate finance context from the Workspaces screen",
        keywords: ["workspace", "new", "create", "add", "management"],
        onPress: openWorkspacesModal,
      },
      {
        id: "categories",
        icon: "tag-multiple-outline",
        label: "Categories",
        description: "Personalize your transaction categories",
        keywords: ["management", "expense", "income", "category"],
        onPress: () => navigateToScreen("Categories"),
      },
      {
        id: "accounts",
        icon: "wallet-outline",
        label: "Accounts",
        description: "Manage where your money lives",
        keywords: ["management", "wallet", "payment", "account"],
        onPress: () => navigateToScreen("Accounts"),
      },
      {
        id: "budget",
        icon: "wallet-plus-outline",
        label: "Budget",
        description: "Set monthly budget and category limits",
        keywords: ["management", "spending", "limits", "budget"],
        onPress: () => navigateToScreen("Budget"),
      },
      {
        id: "data",
        icon: "database-outline",
        label: "Data",
        description: "Create or restore transaction backups",
        keywords: ["management", "backup", "restore", "export", "import"],
        onPress: () => navigateToScreen("Data"),
      },
      {
        id: "defaults",
        icon: "tune-variant",
        label: "Defaults",
        description: "Set currency and transaction defaults by workspace",
        keywords: ["preferences", "currency", "default", "account", "category"],
        onPress: () => navigateToScreen("Defaults"),
      },
      {
        id: "notifications",
        icon: "bell-outline",
        label: "Notifications",
        description: "Manage reminders and monthly insight prompts",
        keywords: ["preferences", "reminders", "daily", "alerts"],
        onPress: openNotificationsModal,
      },
      {
        id: "security",
        icon: "shield-lock-outline",
        label: "Security",
        description: "Protect Tally with biometric lock",
        keywords: [
          "preferences",
          "biometric",
          "face id",
          "fingerprint",
          "lock",
        ],
        onPress: openSecurityModal,
      },
      {
        id: "backup-export",
        icon: "export-variant",
        label: "Backup Export",
        description: "Export your Tally data into a backup file",
        keywords: ["data", "backup", "share", "export"],
        onPress: openBackupExportModal,
      },
      {
        id: "backup-import",
        icon: "import",
        label: "Backup Import",
        description: "Restore transactions and settings from a backup",
        keywords: ["data", "backup", "restore", "import"],
        onPress: openBackupImportModal,
      },
      {
        id: "create-backup",
        icon: "file-export-outline",
        label: "Create Backup",
        description:
          "Export your transactions as a backup file from the Data screen",
        keywords: ["data", "backup", "export", "transactions", "file"],
        onPress: () => navigateToScreen("Data"),
      },
      {
        id: "restore-backup",
        icon: "file-import-outline",
        label: "Restore Backup",
        description: "Choose a backup file and review it before restoring",
        keywords: ["data", "backup", "restore", "import", "review"],
        onPress: () => navigateToScreen("Data"),
      },
      {
        id: "delete-transactions",
        icon: "delete-sweep-outline",
        label: "Delete All Transactions",
        description: "Permanently remove every transaction from this device",
        keywords: ["data", "danger", "clear", "delete", "transactions"],
        onPress: () => navigateToScreen("Data"),
      },
      {
        id: "appearances",
        icon: "palette-outline",
        label: "Appearance",
        description: "Personalize the look and feel of Tally",
        keywords: ["preferences", "theme", "appearance", "colors", "accent"],
        onPress: openAppearanceModal,
      },
      {
        id: "theme-mode",
        icon: "theme-light-dark",
        label: "Theme Mode",
        description: "Switch between system, light, and dark appearance modes",
        keywords: ["appearance", "theme", "mode", "light", "dark", "system"],
        onPress: openAppearanceModal,
      },
      {
        id: "amoled-mode",
        icon: "theme-light-dark",
        label: "AMOLED Mode",
        description: "Use true black surfaces in dark mode",
        keywords: ["appearance", "theme", "dark", "black", "amoled"],
        onPress: openAppearanceModal,
      },
      {
        id: "interface",
        icon: "view-dashboard-outline",
        label: "Interface",
        description: "Adjust navigation and visual interface options",
        keywords: ["preferences", "interface", "icons", "bottom", "bar"],
        onPress: openInterfaceModal,
      },
      {
        id: "minimal-icons",
        icon: "palette-outline",
        label: "Minimal Icons",
        description: "Use the primary color for category icons",
        keywords: ["appearance", "icons", "minimal", "interface"],
        onPress: openInterfaceModal,
      },
      {
        id: "bottom-bar",
        icon: "dock-bottom",
        label: "Bottom Bar",
        description: "Show or hide the bottom navigation bar",
        keywords: ["appearance", "interface", "bottom", "bar", "navigation"],
        onPress: openInterfaceModal,
      },
      {
        id: "date-picker",
        icon: "calendar-outline",
        label: "Date Picker",
        description: "Choose the calendar picker layout",
        keywords: ["appearance", "calendar", "date", "picker", "strip"],
        onPress: openInterfaceModal,
      },
      {
        id: "daily-reminders",
        icon: "bell-outline",
        label: "Daily Reminders",
        description: "Manage notification reminders and alert times",
        keywords: ["notifications", "reminders", "daily", "alerts", "bell"],
        onPress: openNotificationsModal,
      },
      {
        id: "biometric-lock",
        icon: "lock-outline",
        label: "Biometric Lock",
        description:
          "Protect Tally using Face ID or fingerprint authentication",
        keywords: ["security", "lock", "face id", "fingerprint", "privacy"],
        onPress: openSecurityModal,
      },
      {
        id: "about",
        icon: "information-outline",
        label: "About",
        description: "Version information, credits, and policies",
        keywords: ["others", "version", "credits", "policies"],
        onPress: openAboutModal,
      },
      {
        id: "about-app",
        icon: "cellphone-information",
        label: "About App",
        description: "More details about Tally",
        keywords: ["about", "app", "tally"],
        onPress: () => openBetaContactModal("about"),
      },
      {
        id: "about-dev",
        icon: "account-hard-hat-outline",
        label: "About Dev",
        description: "More details about the developer",
        keywords: ["about", "developer", "dev"],
        onPress: () => openBetaContactModal("about"),
      },
      {
        id: "support-development",
        icon: "heart-outline",
        label: "Support Development",
        description: "Help fund future updates",
        keywords: ["about", "support", "donate", "development"],
        onPress: () => openBetaContactModal("support"),
      },
      {
        id: "report-issue",
        icon: "message-alert-outline",
        label: "Report an Issue",
        description: "Open support to report bugs or broken behavior",
        keywords: ["about", "support", "issue", "bug", "report"],
        onPress: () => openBetaContactModal("report"),
      },
      {
        id: "suggest-feature",
        icon: "lightbulb-outline",
        label: "Suggest a Feature",
        description: "Share an idea for a future Tally improvement",
        keywords: ["about", "feature", "idea", "request", "feedback"],
        onPress: () => openBetaContactModal("about"),
      },
      {
        id: "privacy-policy",
        icon: "shield-check-outline",
        label: "Privacy Policy",
        description: "See how your data is handled",
        keywords: ["about", "legal", "privacy", "policy"],
        onPress: () => openBetaContactModal("about"),
      },
      {
        id: "open-source-licenses",
        icon: "file-document-outline",
        label: "Open Source Licenses",
        description: "Review third-party acknowledgements",
        keywords: ["about", "legal", "licenses", "open source"],
        onPress: () => openBetaContactModal("request"),
      },
      {
        id: "version",
        icon: "information-outline",
        label: "Version",
        description: "View the installed app build",
        keywords: ["about", "build", "version", "app"],
        onPress: openAboutModal,
      },
    ],
    [
      navigateToScreen,
      openBetaContactModal,
      openAboutModal,
      openAppearanceModal,
      openBackupExportModal,
      openBackupImportModal,
      openInterfaceModal,
      openNotificationsModal,
      openSecurityModal,
      openWorkspacesModal,
    ],
  );

  const settingsSearchOptions = React.useMemo(
    () => ({
      getSearchValues: (item: SettingsSearchItem) => [
        item.label,
        item.description,
        ...item.keywords,
      ],
    }),
    [],
  );

  const filteredSettingsItems = useAbstractSearch(
    settingsItems,
    query,
    settingsSearchOptions,
  );
  const isSearching = query.trim().length > 0;
  return (
    <SafeAreaView
      style={[
        SettingsStyles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <SettingsSearchHeader
        title="Settings"
        onBack={() => navigation.goBack()}
        query={query}
        onQueryChange={setQuery}
        searchOpen={searchOpen}
        onSearchOpenChange={setSearchOpen}
        placeholder="Search settings"
      />
      <ScrollView
        contentContainerStyle={SettingsStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isSearching ? (
          <>
            <SectionLabel label="Search Results" />
            {filteredSettingsItems.length > 0 ? (
              <SheetCard theme={theme}>
                {filteredSettingsItems.map((item) => (
                  <ActionRow
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    description={item.description}
                    onPress={item.onPress}
                    theme={theme}
                  />
                ))}
              </SheetCard>
            ) : (
              <View>
                <SheetCard theme={theme}>
                  <ActionRow
                    icon="magnify-close"
                    label="No settings found"
                    description="Try a broader term like budget, backup, or reminders."
                    onPress={() => setQuery("")}
                    theme={theme}
                    showChevron={false}
                  />
                </SheetCard>
              </View>
            )}
          </>
        ) : (
          <>
            <SectionLabel label="Current workspace" />
            <SheetCard theme={theme}>
              <ActionRow
                icon={activeWorkspace?.icon ?? "briefcase-outline"}
                label={activeWorkspace?.name ?? "Workspace"}
                description={formatLastBackupDescription(activeWorkspace)}
                onPress={openWorkspacesModal}
                theme={theme}
                iconColor={activeWorkspace?.color ?? theme.colors.primary}
              />
            </SheetCard>

            <SectionLabel label="Management" />
            <SheetCard theme={theme}>
              <ActionRow
                icon="tag-multiple-outline"
                label="Categories"
                description="Personalize your transaction categories"
                onPress={() => navigation.navigate("Categories")}
                theme={theme}
              />
              <ActionRow
                icon="wallet-outline"
                label="Accounts"
                description="Manage where your money lives"
                onPress={() => navigation.navigate("Accounts")}
                theme={theme}
              />
              <ActionRow
                icon="wallet-plus-outline"
                label="Budget"
                description="Set monthly budget and category limits"
                onPress={() => navigation.navigate("Budget")}
                theme={theme}
              />
              <ActionRow
                icon="tune-variant"
                label="Defaults"
                description="Currency, account, and category defaults"
                onPress={() => navigation.navigate("Defaults")}
                theme={theme}
              />
              <ActionRow
                icon="database-outline"
                label="Data"
                description="Create or restore transaction backups"
                onPress={() => navigation.navigate("Data")}
                theme={theme}
              />
            </SheetCard>

            <SectionLabel label="Preferences" />
            <SheetCard theme={theme}>
              <ActionRow
                icon="palette-outline"
                label="Appearance"
                description="Personalize the look and feel of Tally"
                onPress={openAppearanceModal}
                theme={theme}
              />
              <ActionRow
                icon="view-dashboard-outline"
                label="Interface"
                description="Navigation and visual interface options"
                onPress={openInterfaceModal}
                theme={theme}
              />
              <ActionRow
                icon="bell-outline"
                label="Notifications"
                description="Reminders and insight prompts"
                onPress={openNotificationsModal}
                theme={theme}
              />
              <ActionRow
                icon="shield-lock-outline"
                label="Security"
                description="Biometric lock options"
                onPress={openSecurityModal}
                theme={theme}
              />
            </SheetCard>

            <SectionLabel label="Support" />
            <SheetCard theme={theme}>
              <ActionRow
                icon="heart-outline"
                label="Support Development"
                description="Help fund future updates"
                onPress={() => openBetaContactModal("support")}
                theme={theme}
                showChevron
              />
              <ActionRow
                icon="message-alert-outline"
                label="Report an Issue"
                description="Help improve Tally"
                onPress={() => openBetaContactModal("report")}
                theme={theme}
                showChevron
              />
              <ActionRow
                icon="lightbulb-outline"
                label="Suggest a Feature"
                description="Share your ideas with us"
                onPress={() => openBetaContactModal("request")}
                theme={theme}
                showChevron
              />
            </SheetCard>

            <SectionLabel label="Others" />
            <SheetCard theme={theme}>
              <ActionRow
                icon="information-outline"
                label="About"
                description="Version information, credits, and policies"
                onPress={openAboutModal}
                theme={theme}
              />
            </SheetCard>
          </>
        )}
      </ScrollView>

      <WorkspaceModal
        visible={workspacesOpen}
        onDismiss={() => setWorkspacesOpen(false)}
      />

      <BackupExportModal
        visible={backupExportOpen}
        onDismiss={() => setBackupExportOpen(false)}
      />

      <BackupImportModal
        visible={backupImportOpen}
        onDismiss={() => setBackupImportOpen(false)}
      />

      <AppearanceModal
        visible={appearanceOpen}
        onDismiss={() => setAppearanceOpen(false)}
      />

      <InterfaceModal
        visible={interfaceOpen}
        onDismiss={() => setInterfaceOpen(false)}
      />

      <NotificationsModal
        visible={notificationsOpen}
        onDismiss={() => setNotificationsOpen(false)}
      />

      <SecurityModal
        visible={securityOpen}
        onDismiss={() => setSecurityOpen(false)}
      />

      <AboutModal visible={aboutOpen} onDismiss={closeAboutModal} />

      <BetaContactModal
        visible={betaContactScenario !== null}
        scenario={betaContactScenario ?? "support"}
        onDismiss={closeBetaContactModal}
      />
    </SafeAreaView>
  );
}
