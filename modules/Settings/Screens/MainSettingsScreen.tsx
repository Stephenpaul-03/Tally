import { ActionRow } from "@/components/ActionRow";
import { PermissionRequestModal } from "@/components/alert/PermissionRequestModal";
import { SheetCard } from "@/components/SheetCard";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { ScrollView } from "react-native";
import { useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { DailyReminderRows } from "../Components/DailyReminderCard";
import { SectionLabel } from "../Components/SectionLabel";
import { SettingsHeader } from "../Components/SettingsHeader";
import { useSettings } from "../hooks";
import type { SettingsStackParamList } from "../Navigation";
import { SettingsStyles } from "../Styles";

export function MainSettingsScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const {
    dailyReminderEnabled,
    dailyReminderFormattedTime,
    dailyReminderSelectedTime,
    handleDailyReminderToggle,
    handleDailyReminderTimeChange,
    notificationAccessPromptOpen,
    setNotificationAccessPromptOpen,
    handleRequestNotificationAccessAgain,
  } = useSettings();

  return (
    <SafeAreaView
      style={[
        SettingsStyles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <SettingsHeader onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={SettingsStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Management */}
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
            icon="database-outline"
            label="Data"
            description="Create or restore transaction backups"
            onPress={() => navigation.navigate("Data")}
            theme={theme}
          />
        </SheetCard>

        {/* Preferences */}
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

        {/* Notifications */}
        <SectionLabel label="Notifications" />
        <SheetCard theme={theme}>
          <DailyReminderRows
            enabled={dailyReminderEnabled}
            formattedTime={dailyReminderFormattedTime}
            onToggle={handleDailyReminderToggle}
            onTimeChange={handleDailyReminderTimeChange}
            selectedTime={dailyReminderSelectedTime}
          />
        </SheetCard>

        {/* Others */}
        <SectionLabel label="Others" />
        <SheetCard theme={theme}>
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
