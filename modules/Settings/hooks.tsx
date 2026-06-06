import { useTabBarModePreference } from "@/components/tabbar/TabBarModePreference";
import { toast } from "@/components/toast/toast";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useThemeMode } from "@/hooks/use-theme-mode";
import { useAppDispatch } from "@/modules/Common/Hooks/Redux";
import {
  clearAllTransactionsAsync,
  fetchTransactions,
} from "@/modules/Common/Slices/TransactionSlice";
import { seedTestData } from "@/modules/Common/Utils/SeedData";
import type { RootParamList } from "@/navigation/types";
import {
  NotificationPermissionStatus,
  useNotifications,
} from "@/src/services/notifications";
import { THEME_PRESETS, type ThemeId } from "@/theme/presets";
import type { NavigationProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import type { ModeOption } from "./Constants";

export function useDevTools() {
  const notifications = useNotifications();

  const triggerTestNotification = async (
    label: string,
    action: () => Promise<string | null>,
  ) => {
    try {
      const notificationId = await action();
      if (!notificationId) {
        toast.info(
          "Notifications are off",
          "Tally can open system settings if you'd like to enable them.",
        );
        return;
      }
      toast.success(label, "A test notification should appear in a moment.");
    } catch {
      toast.error("Couldn't send test notification");
    }
  };

  const notificationPermissionLabel =
    notifications.permission.status === NotificationPermissionStatus.Granted
      ? "Allowed"
      : notifications.permission.status === NotificationPermissionStatus.Denied
        ? "Denied"
        : "Not asked yet";

  const handleRefreshNotificationPermission = async () => {
    try {
      const permission = await notifications.refreshPermissionStatus();
      const statusLabel =
        permission.status === NotificationPermissionStatus.Granted
          ? "allowed"
          : permission.status === NotificationPermissionStatus.Denied
            ? "denied"
            : "not asked yet";
      toast.info("Notification permission", statusLabel);
    } catch {
      toast.error("Couldn't refresh notification permission");
    }
  };

  const handleOpenNotificationSettings = async () => {
    try {
      await notifications.openSystemSettings();
    } catch {
      toast.error("Couldn't open system settings");
    }
  };

  const handleTestDailyReminder = async () => {
    await triggerTestNotification("Testing daily reminder", () =>
      notifications.sendTestDailyFinanceReminder(),
    );
  };

  const handleTestMonthlyInsight = async () => {
    await triggerTestNotification("Testing monthly insight", () =>
      notifications.sendTestMonthlyInsightPrompt(),
    );
  };

  const handleTestPendingUpiRecovery = async () => {
    await triggerTestNotification("Testing pending UPI recovery", () =>
      notifications.sendTestPendingUpiRecovery(),
    );
  };

  const handleTestFailedTransactionFollowUp = async () => {
    await triggerTestNotification("Testing failed transaction follow-up", () =>
      notifications.sendTestFailedTransactionFollowUp(),
    );
  };

  return {
    notificationPermissionLabel,
    handleRefreshNotificationPermission,
    handleOpenNotificationSettings,
    handleTestDailyReminder,
    handleTestMonthlyInsight,
    handleTestPendingUpiRecovery,
    handleTestFailedTransactionFollowUp,
  };
}

export function useSettings() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NavigationProp<RootParamList>>();
  const notifications = useNotifications();
  const { reconcileSchedules } = notifications;

  const { themeId, setThemeId } = useAppTheme();
  const {
    guidedChatEnabled,
    betterAnalyticsEnabled,
    minimalIconsEnabled,
    animationsEnabled,
    insightsCardOrder,
    setGuidedChatEnabled,
    setBetterAnalyticsEnabled,
    setMinimalIconsEnabled,
    setAnimationsEnabled,
    setInsightsCardOrder,
  } = useAddonPrefs();
  const { mode, isFollowingSystem, setMode, resetToSystem } = useThemeMode();
  const { tabBarMode, setTabBarMode } = useTabBarModePreference();
  const [notificationAccessPromptOpen, setNotificationAccessPromptOpen] =
    useState(false);

  const activeModeId: ModeOption = isFollowingSystem ? "system" : mode;
  const dailyReminderConfig = notifications.dailyFinanceReminder.config;
  const dailyReminderTime = new Date();
  dailyReminderTime.setHours(
    dailyReminderConfig.hour,
    dailyReminderConfig.minute,
    0,
    0,
  );

  const formattedDailyReminderTime = dailyReminderTime.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  useEffect(() => {
    void reconcileSchedules();
  }, [reconcileSchedules]);

  const handleModeSelect = (id: ModeOption) => {
    if (id === "system") resetToSystem();
    else setMode(id);
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate("Transactions");
  };

  const handleClearAllTransactions = () => {
    Alert.alert(
      "Clear All Transactions",
      "Are you sure you want to delete all transactions? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            dispatch(clearAllTransactionsAsync());
            toast.success("All transactions cleared");
          },
        },
      ],
    );
  };

  const handleSeedData = () => {
    Alert.alert(
      "Seed Test Data",
      "Generate 60+ realistic INR transactions for March & April 2024? This will add to existing data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Seed",
          style: "default",
          onPress: async () => {
            try {
              await seedTestData(dispatch);
              toast.success("Test data seeded successfully");
              dispatch(fetchTransactions() as any);
            } catch {
              toast.error("Failed to seed data");
            }
          },
        },
      ],
    );
  };

  const themeOptions = Object.entries(THEME_PRESETS) as [
    ThemeId,
    (typeof THEME_PRESETS)[ThemeId],
  ][];

  const handleDailyReminderToggle = async (enabled: boolean) => {
    try {
      const result = await notifications.setDailyReminderEnabled(enabled);
      if (enabled && !result.config.enabled) {
        setNotificationAccessPromptOpen(true);
        return;
      }
      toast.success(
        enabled ? "Daily reminder turned on" : "Daily reminder turned off",
      );
    } catch {
      toast.error("Couldn't update daily reminder");
    }
  };

  const handleDailyReminderTimeChange = async (time: {
    hour: number;
    minute: number;
  }) => {
    try {
      await notifications.setDailyReminderTime(time);
      toast.success("Reminder time updated");
    } catch {
      toast.error("Couldn't update reminder time");
    }
  };

  const handleRequestNotificationAccessAgain = async () => {
    try {
      const permission = await notifications.ensurePermissions({
        openSettingsOnDeny: true, // open system settings if denied
        promptIfNeeded: true,
      });

      if (permission.status !== NotificationPermissionStatus.Granted) {
        setNotificationAccessPromptOpen(false); // close modal even on deny
        toast.info(
          "Permission not granted",
          "You can enable notifications from system settings.",
        );
        return;
      }

      setNotificationAccessPromptOpen(false);
      await notifications.setDailyReminderEnabled(true);
      toast.success("Daily reminder turned on");
    } catch {
      setNotificationAccessPromptOpen(false);
      toast.error("Couldn't request notification access");
    }
  };

  const handleGuidedChatToggle = (enabled: boolean) => {
    setGuidedChatEnabled(enabled);
    toast.success(enabled ? "Ask Tally turned on" : "Ask Tally turned off");
  };

  const handleBetterAnalyticsToggle = (enabled: boolean) => {
    setBetterAnalyticsEnabled(enabled);
    toast.success(
      enabled ? "Better Analytics turned on" : "Better Analytics turned off",
    );
  };

  const handleMinimalIconsToggle = (enabled: boolean) => {
    setMinimalIconsEnabled(enabled);
    toast.success(
      enabled ? "Minimal Icons turned on" : "Minimal Icons turned off",
    );
  };

  const handleAnimationsToggle = (enabled: boolean) => {
    setAnimationsEnabled(enabled);
    toast.success(enabled ? "Animations turned on" : "Animations turned off");
  };

  return {
    themeId,
    setThemeId,
    themeOptions,
    activeModeId,
    handleModeSelect,
    handleBack,
    handleClearAllTransactions,
    handleSeedData,
    tabBarMode,
    setTabBarMode,
    dailyReminderEnabled: dailyReminderConfig.enabled,
    dailyReminderFormattedTime: formattedDailyReminderTime,
    dailyReminderSelectedTime: dailyReminderTime,
    handleDailyReminderToggle,
    handleDailyReminderTimeChange,
    notificationAccessPromptOpen,
    setNotificationAccessPromptOpen,
    handleRequestNotificationAccessAgain,
    guidedChatEnabled,
    handleGuidedChatToggle,
    betterAnalyticsEnabled,
    handleBetterAnalyticsToggle,
    minimalIconsEnabled,
    handleMinimalIconsToggle,
    animationsEnabled,
    handleAnimationsToggle,
    insightsCardOrder,
    setInsightsCardOrder,
  };
}
