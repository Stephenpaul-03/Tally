import { ActionRow } from "@/components/ActionRow";
import { PermissionRequestModal } from "@/components/alert/PermissionRequestModal";
import { SheetCard } from "@/components/SheetCard";
import { UniversalSearchBar } from "@/components/UniversalSearchBar";
import { useAbstractSearch } from "@/hooks/use-abstract-search";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { ScrollView, View } from "react-native";
import { useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { BiometricSettingsRow } from "../Components/BiometricSettingsRow";
import { DailyReminderRows } from "../Components/DailyReminderCard";
import { SectionLabel } from "../Components/SectionLabel";
import { SettingsHeader } from "../Components/SettingsHeader";
import { useDeveloperToolsUnlockedForSession } from "../DeveloperToolsSession";
import { useSettings } from "../hooks";
import type { SettingsStackParamList } from "../Navigation";
import { SettingsStyles } from "../Styles";

type SettingsSearchItem = {
  id: string;
  icon: string;
  label: string;
  description: string;
  keywords: string[];
  onPress: () => void;
};

type SearchableSettingsScreen = Exclude<
  keyof SettingsStackParamList,
  "WorkspaceEdit"
>;

export function MainSettingsScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const scrollRef = React.useRef<ScrollView | null>(null);
  const [query, setQuery] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [securitySectionY, setSecuritySectionY] = React.useState(0);
  const [notificationsSectionY, setNotificationsSectionY] = React.useState(0);
  const {
    dailyReminderEnabled,
    dailyReminderTimes,
    handleAddDailyReminderTime,
    handleRemoveDailyReminderTime,
    handleDailyReminderToggle,
    handleDailyReminderTimeChange,
    notificationAccessPromptOpen,
    setNotificationAccessPromptOpen,
    handleRequestNotificationAccessAgain,
  } = useSettings();
  const developerToolsUnlocked = useDeveloperToolsUnlockedForSession();
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

  const settingsItems = React.useMemo<SettingsSearchItem[]>(
    () => [
      {
        id: "workspaces",
        icon: "briefcase-outline",
        label: "Workspaces",
        description: "Track personal, family, or project budgets",
        keywords: ["management", "workspace", "personal", "family", "project"],
        onPress: () => navigateToScreen("Workspaces"),
      },
      {
        id: "add-workspace",
        icon: "plus-box-outline",
        label: "Add Workspace",
        description:
          "Create a separate finance context from the Workspaces screen",
        keywords: ["workspace", "new", "create", "add", "management"],
        onPress: () => navigateToScreen("Workspaces"),
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
        id: "backup-export",
        icon: "export-variant",
        label: "Backup Export",
        description: "Export your Tally data into a backup file",
        keywords: ["data", "backup", "share", "export"],
        onPress: () => navigateToScreen("BackupExport"),
      },
      {
        id: "backup-import",
        icon: "import",
        label: "Backup Import",
        description: "Restore transactions and settings from a backup",
        keywords: ["data", "backup", "restore", "import"],
        onPress: () => navigateToScreen("BackupImport"),
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
        label: "Appearances",
        description: "Personalize the look and feel of Tally",
        keywords: ["preferences", "theme", "appearance", "colors"],
        onPress: () => navigateToScreen("Appearances"),
      },
      {
        id: "theme-mode",
        icon: "theme-light-dark",
        label: "Theme Mode",
        description: "Switch between system, light, and dark appearance modes",
        keywords: ["appearance", "theme", "mode", "light", "dark", "system"],
        onPress: () => navigateToScreen("Appearances"),
      },
      {
        id: "minimal-icons",
        icon: "palette-outline",
        label: "Minimal Icons",
        description: "Use the primary color for category icons",
        keywords: ["appearance", "icons", "minimal", "interface"],
        onPress: () => navigateToScreen("Appearances"),
      },
      {
        id: "bottom-bar",
        icon: "dock-bottom",
        label: "Bottom Bar",
        description: "Show or hide the bottom navigation bar",
        keywords: ["appearance", "interface", "bottom", "bar", "navigation"],
        onPress: () => navigateToScreen("Appearances"),
      },
      {
        id: "date-picker",
        icon: "calendar-outline",
        label: "Date Picker",
        description: "Choose the calendar picker layout",
        keywords: ["appearance", "calendar", "date", "picker", "strip"],
        onPress: () => navigateToScreen("Appearances"),
      },
      {
        id: "daily-reminders",
        icon: "bell-outline",
        label: "Daily Reminders",
        description: "Manage notification reminders and alert times",
        keywords: ["notifications", "reminders", "daily", "alerts", "bell"],
        onPress: () => {
          closeSearch();
          requestAnimationFrame(() => {
            scrollRef.current?.scrollTo({
              y: Math.max(notificationsSectionY - 12, 0),
              animated: true,
            });
          });
        },
      },
      {
        id: "biometric-lock",
        icon: "lock-outline",
        label: "Biometric Lock",
        description:
          "Protect Tally using Face ID or fingerprint authentication",
        keywords: ["security", "lock", "face id", "fingerprint", "privacy"],
        onPress: () => {
          closeSearch();
          requestAnimationFrame(() => {
            scrollRef.current?.scrollTo({
              y: Math.max(securitySectionY - 12, 0),
              animated: true,
            });
          });
        },
      },
      {
        id: "labs",
        icon: "flask-outline",
        label: "Labs",
        description: "Try upcoming features and experiments",
        keywords: ["others", "experiments", "beta", "features"],
        onPress: () => navigateToScreen("Labs"),
      },
      {
        id: "ask-tally",
        icon: "message-text-outline",
        label: "Ask Tally",
        description: "Adds a guided assistant to the Transactions screen",
        keywords: ["labs", "guided", "assistant", "chat", "transactions"],
        onPress: () => navigateToScreen("Labs"),
      },
      {
        id: "better-analytics",
        icon: "chart-line",
        label: "Better Analytics",
        description:
          "Expands Insights with richer analytics cards and layout controls",
        keywords: ["labs", "insights", "analytics", "charts", "layout"],
        onPress: () => navigateToScreen("Labs"),
      },
      {
        id: "analytics-card-order",
        icon: "view-carousel-outline",
        label: "Analytics Card Order",
        description: "Reorder the analytics cards shown on the Insights screen",
        keywords: ["labs", "insights", "reorder", "drag", "accordion"],
        onPress: () => navigateToScreen("Labs"),
      },
      {
        id: "about",
        icon: "information-outline",
        label: "About",
        description: "Version information, credits, and policies",
        keywords: ["others", "version", "credits", "policies"],
        onPress: () => navigateToScreen("About"),
      },
      {
        id: "support-development",
        icon: "heart-outline",
        label: "Support Development",
        description: "Help fund future updates from the About screen",
        keywords: ["about", "support", "donate", "development"],
        onPress: () => navigateToScreen("About"),
      },
      {
        id: "report-issue",
        icon: "message-alert-outline",
        label: "Report an Issue",
        description: "Open support to report bugs or broken behavior",
        keywords: ["about", "support", "issue", "bug", "report"],
        onPress: () => navigateToScreen("About"),
      },
      {
        id: "suggest-feature",
        icon: "lightbulb-outline",
        label: "Suggest a Feature",
        description: "Share an idea for a future Tally improvement",
        keywords: ["about", "feature", "idea", "request", "feedback"],
        onPress: () => navigateToScreen("About"),
      },
      {
        id: "privacy-policy",
        icon: "shield-check-outline",
        label: "Privacy Policy",
        description: "See how your data is handled",
        keywords: ["about", "legal", "privacy", "policy"],
        onPress: () => navigateToScreen("About"),
      },
      {
        id: "open-source-licenses",
        icon: "file-document-outline",
        label: "Open Source Licenses",
        description: "Review third-party acknowledgements",
        keywords: ["about", "legal", "licenses", "open source"],
        onPress: () => navigateToScreen("About"),
      },
      {
        id: "version",
        icon: "information-outline",
        label: "Version",
        description: "View the installed app build",
        keywords: ["about", "build", "version", "app"],
        onPress: () => navigateToScreen("About"),
      },
      ...(developerToolsUnlocked
        ? [
            {
              id: "developer-tools",
              icon: "hammer-wrench",
              label: "Developer Tools",
              description: "Unlocked for this app session until the app closes",
              keywords: [
                "developer",
                "dev",
                "debug",
                "notifications",
                "seed",
                "data",
              ],
              onPress: () => navigateToScreen("DeveloperTools"),
            } satisfies SettingsSearchItem,
            {
              id: "notification-status",
              icon: "bell-check-outline",
              label: "Notification Status",
              description: "Check notification permission from Developer Tools",
              keywords: ["developer", "notifications", "permission", "status"],
              onPress: () => navigateToScreen("DeveloperTools"),
            } satisfies SettingsSearchItem,
            {
              id: "open-notification-settings",
              icon: "cog-outline",
              label: "Open Notification Settings",
              description: "Jump to system settings if notifications are off",
              keywords: ["developer", "notifications", "settings", "system"],
              onPress: () => navigateToScreen("DeveloperTools"),
            } satisfies SettingsSearchItem,
            {
              id: "test-daily-reminder",
              icon: "calendar-clock-outline",
              label: "Test Daily Reminder",
              description: "Check reminder copy, channel, and tap routing",
              keywords: ["developer", "notifications", "test", "reminder"],
              onPress: () => navigateToScreen("DeveloperTools"),
            } satisfies SettingsSearchItem,
            {
              id: "test-monthly-insight",
              icon: "chart-line",
              label: "Test Monthly Insight",
              description: "Check insights prompt copy and navigation",
              keywords: ["developer", "notifications", "test", "insight"],
              onPress: () => navigateToScreen("DeveloperTools"),
            } satisfies SettingsSearchItem,
            {
              id: "seed-data",
              icon: "database-plus-outline",
              label: "Seed Data",
              description: "Populate the app with sample transactions",
              keywords: ["developer", "seed", "sample", "data"],
              onPress: () => navigateToScreen("DeveloperTools"),
            } satisfies SettingsSearchItem,
          ]
        : []),
    ],
    [
      closeSearch,
      developerToolsUnlocked,
      navigateToScreen,
      notificationsSectionY,
      securitySectionY,
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
  const handleToggleSearch = React.useCallback(() => {
    if (searchOpen) {
      closeSearch();
      return;
    }
    setSearchOpen(true);
  }, [closeSearch, searchOpen]);

  return (
    <SafeAreaView
      style={[
        SettingsStyles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <SettingsHeader
        onBack={() => navigation.goBack()}
        centerContent={
          searchOpen ? (
            <UniversalSearchBar
              bg={theme.colors.elevation.level1}
              value={query}
              onChangeText={setQuery}
              placeholder="Search settings"
              autoFocus
              containerStyle={{ marginHorizontal: 0 }}
            />
          ) : undefined
        }
        rightIcon={searchOpen ? "close" : "magnify"}
        onRightPress={handleToggleSearch}
        rightAccessibilityLabel={
          searchOpen ? "Close settings search" : "Open settings search"
        }
      />
      <ScrollView
        ref={scrollRef}
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
            <SectionLabel label="Management" />
            <SheetCard theme={theme}>
              <ActionRow
                icon="briefcase-outline"
                label="Workspaces"
                description="Track personal, family, or project budgets"
                onPress={() => navigation.navigate("Workspaces")}
                theme={theme}
              />
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
                label="Appearances"
                description="Personalize the look and feel of Tally"
                onPress={() => navigation.navigate("Appearances")}
                theme={theme}
              />
            </SheetCard>

            <View
              onLayout={(event) =>
                setSecuritySectionY(event.nativeEvent.layout.y)
              }
            >
              <SectionLabel label="Security" />
            </View>
            <SheetCard theme={theme}>
              <BiometricSettingsRow />
            </SheetCard>

            <View
              onLayout={(event) =>
                setNotificationsSectionY(event.nativeEvent.layout.y)
              }
            >
              <SectionLabel label="Notifications" />
            </View>
            <SheetCard theme={theme}>
              <DailyReminderRows
                enabled={dailyReminderEnabled}
                reminders={dailyReminderTimes}
                onAddReminder={handleAddDailyReminderTime}
                onRemoveReminder={handleRemoveDailyReminderTime}
                onToggle={handleDailyReminderToggle}
                onTimeChange={handleDailyReminderTimeChange}
              />
            </SheetCard>

            <SectionLabel label="Others" />
            <SheetCard theme={theme}>
              {developerToolsUnlocked ? (
                <ActionRow
                  icon="hammer-wrench"
                  label="Developer Tools"
                  description="Unlocked for this app session until the app closes"
                  onPress={() => navigation.navigate("DeveloperTools")}
                  theme={theme}
                />
              ) : null}
              <ActionRow
                icon="flask-outline"
                label="Labs"
                description="Try upcoming features and experiments"
                onPress={() => navigation.navigate("Labs")}
                theme={theme}
              />
              <ActionRow
                icon="information-outline"
                label="About"
                description="Version information, credits, and policies"
                onPress={() => navigation.navigate("About")}
                theme={theme}
              />
            </SheetCard>
          </>
        )}
      </ScrollView>

      <PermissionRequestModal
        isOpen={notificationAccessPromptOpen}
        title="Notification access needed"
        message="Notification access is needed to get daily notifications."
        primaryLabel="Allow again"
        secondaryLabel="Not now"
        onPrimary={handleRequestNotificationAccessAgain}
        onSecondary={() => setNotificationAccessPromptOpen(false)}
      />
    </SafeAreaView>
  );
}
