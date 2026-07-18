import { toast } from "@/components/toast/ToastProvider";
import { useAppDispatch } from "@/hooks/Redux";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useThemeMode } from "@/hooks/use-theme-mode";
import {
    clearAllTransactionsAsync,
} from "@/modules/Core/Slices/TransactionSlice";
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

  return {
    notificationPermissionLabel,
    handleRefreshNotificationPermission,
    handleOpenNotificationSettings,
    handleTestDailyReminder,
    handleTestMonthlyInsight,
  };
}

export function useSettings() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NavigationProp<RootParamList>>();
  const notifications = useNotifications();
  const { reconcileSchedules } = notifications;

  const { themeId, setThemeId, trueBlack, setTrueBlack } = useAppTheme();
  const {
    guidedChatEnabled,
    betterAnalyticsEnabled,
    minimalIconsEnabled,
    labsNoticeDismissed,
    insightsCardOrder,
    setGuidedChatEnabled,
    setBetterAnalyticsEnabled,
    setMinimalIconsEnabled,
    setLabsNoticeDismissed,
    setInsightsCardOrder,
  } = useAddonPrefs();
  const { mode, isFollowingSystem, setMode, resetToSystem } = useThemeMode();
  const [notificationAccessPromptOpen, setNotificationAccessPromptOpen] =
    useState(false);

  const activeModeId: ModeOption = isFollowingSystem ? "system" : mode;
  const dailyReminderConfig = notifications.dailyFinanceReminder.config;
  const dailyReminderTimes = dailyReminderConfig.reminders.map((reminder) => {
    const date = new Date();
    date.setHours(reminder.hour, reminder.minute, 0, 0);

    return {
      formattedTime: date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
      selectedTime: date,
    };
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
  }, index = 0) => {
    try {
      await notifications.setDailyReminderTime(time, index);
      toast.success("Reminder time updated");
    } catch {
      toast.error("Couldn't update reminder time");
    }
  };

  const handleAddDailyReminderTime = async () => {
    try {
      await notifications.addDailyReminderTime();
      toast.success("Reminder added");
    } catch {
      toast.error("Couldn't add reminder");
    }
  };

  const handleRemoveDailyReminderTime = async (index: number) => {
    try {
      await notifications.removeDailyReminderTime(index);
      toast.success("Reminder removed");
    } catch {
      toast.error("Couldn't remove reminder");
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

  return {
    themeId,
    setThemeId,
    themeOptions,
    activeModeId,
    handleModeSelect,
    handleBack,
    handleClearAllTransactions,
    dailyReminderEnabled: dailyReminderConfig.enabled,
    dailyReminderTimes,
    handleDailyReminderToggle,
    handleDailyReminderTimeChange,
    handleAddDailyReminderTime,
    handleRemoveDailyReminderTime,
    notificationAccessPromptOpen,
    setNotificationAccessPromptOpen,
    handleRequestNotificationAccessAgain,
    guidedChatEnabled,
    handleGuidedChatToggle,
    betterAnalyticsEnabled,
    handleBetterAnalyticsToggle,
    minimalIconsEnabled,
    handleMinimalIconsToggle,
    trueBlack,
    setTrueBlack,
    labsNoticeDismissed,
    setLabsNoticeDismissed,
    insightsCardOrder,
    setInsightsCardOrder,
  };
}
