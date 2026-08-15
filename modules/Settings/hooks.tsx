import { toast } from "@/components/toast/ToastProvider";
import { useAppDispatch } from "@/hooks/Redux";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useThemeMode } from "@/hooks/use-theme-mode";
import {
    clearAllTransactionsAsync,
} from "@/modules/Core/Slices/TransactionSlice";
import {
    DailyFinanceReminderFrequency,
    DailyFinanceReminderTone,
    MonthlyInsightTiming,
    NotificationPermissionStatus,
    useNotifications,
} from "@/src/services/notifications";
import { THEME_PRESETS, type ThemeId } from "@/theme/presets";
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
          "Notifications are off. Tally can open system settings if you'd like to enable them.",
        );
        return;
      }
      toast.success(`${label}. A test notification should appear in a moment.`);
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
      toast.info(`Notification permission is ${statusLabel}`);
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
  const notifications = useNotifications();
  const { reconcileSchedules } = notifications;

  const { themeId, setThemeId, trueBlack, setTrueBlack } = useAppTheme();
  const {
    guidedChatEnabled,
    betterAnalyticsEnabled,
    minimalIconsEnabled,
    interactionHintsEnabled,
    labsNoticeDismissed,
    insightsCardOrder,
    setGuidedChatEnabled,
    setBetterAnalyticsEnabled,
    setMinimalIconsEnabled,
    setInteractionHintsEnabled,
    setLabsNoticeDismissed,
    setInsightsCardOrder,
  } = useAddonPrefs();
  const { mode, isFollowingSystem, setMode, resetToSystem } = useThemeMode();
  const [notificationAccessPromptOpen, setNotificationAccessPromptOpen] =
    useState(false);

  const activeModeId: ModeOption = isFollowingSystem ? "system" : mode;
  const dailyReminderConfig = notifications.dailyFinanceReminder.config;
  const monthlyInsightConfig = notifications.monthlyInsightPrompt.config;
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
  const monthlyInsightTime = (() => {
    const date = new Date();
    date.setHours(monthlyInsightConfig.hour, monthlyInsightConfig.minute, 0, 0);
    return {
      formattedTime: date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
      selectedTime: date,
    };
  })();

  useEffect(() => {
    void reconcileSchedules();
  }, [reconcileSchedules]);

  const handleModeSelect = (id: ModeOption) => {
    if (id === "system") resetToSystem();
    else setMode(id);
  };

  const handleBack = () => {
    // Screens using this hook own their navigation. Keep this legacy return
    // value inert so modal portals can use settings state safely.
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

  const handleMonthlyInsightToggle = async (enabled: boolean) => {
    try {
      const result = await notifications.updateMonthlyInsightPrompt({
        ...monthlyInsightConfig,
        enabled,
      });
      if (enabled && !result.config.enabled) {
        toast.info("Notifications are off");
        return result.config.enabled;
      }
      toast.success(
        enabled ? "Monthly insights turned on" : "Monthly insights turned off",
      );
      return result.config.enabled;
    } catch {
      toast.error("Couldn't update monthly insights");
      return monthlyInsightConfig.enabled;
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

  const getFrequencyForWeekdays = (weekdays: number[]) => {
    const normalized = [...weekdays].sort((a, b) => a - b).join(",");

    if (normalized === "1,2,3,4,5,6,7") {
      return DailyFinanceReminderFrequency.Daily;
    }

    if (normalized === "2,3,4,5,6") {
      return DailyFinanceReminderFrequency.Weekdays;
    }

    if (normalized === "1,7") {
      return DailyFinanceReminderFrequency.Weekends;
    }

    return dailyReminderConfig.frequency;
  };

  const handleDailyReminderWeekdaysChange = async (weekdays: number[]) => {
    try {
      await notifications.updateDailyFinanceReminder({
        ...dailyReminderConfig,
        weekdays,
        frequency: getFrequencyForWeekdays(weekdays),
      });
      toast.success("Reminder days updated");
    } catch {
      toast.error("Couldn't update reminder days");
    }
  };

  const handleDailyReminderToneChange = async (
    tone: DailyFinanceReminderTone,
  ) => {
    try {
      await notifications.updateDailyFinanceReminder({
        ...dailyReminderConfig,
        tone,
      });
      toast.success("Reminder tone updated");
    } catch {
      toast.error("Couldn't update reminder tone");
    }
  };

  const handleQuietHoursChange = async (
    quietHours: typeof dailyReminderConfig.quietHours,
  ) => {
    try {
      await notifications.updateDailyFinanceReminder({
        ...dailyReminderConfig,
        quietHours,
      });
      toast.success("Quiet hours updated");
    } catch {
      toast.error("Couldn't update quiet hours");
    }
  };

  const handleMonthlyInsightTimeChange = async (time: {
    hour: number;
    minute: number;
  }) => {
    try {
      const result = await notifications.updateMonthlyInsightPrompt({
        ...monthlyInsightConfig,
        hour: time.hour,
        minute: time.minute,
      });
      if (monthlyInsightConfig.enabled && !result.config.enabled) {
        toast.info("Notifications are off");
        return;
      }
      toast.success("Monthly insight time updated");
    } catch {
      toast.error("Couldn't update monthly insight time");
    }
  };

  const handleMonthlyInsightTimingChange = async (
    timing: MonthlyInsightTiming,
  ) => {
    try {
      const result = await notifications.updateMonthlyInsightPrompt({
        ...monthlyInsightConfig,
        timing,
      });
      if (monthlyInsightConfig.enabled && !result.config.enabled) {
        toast.info("Notifications are off");
        return;
      }
      toast.success("Monthly insight timing updated");
    } catch {
      toast.error("Couldn't update monthly insight timing");
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

  const handleTestDailyReminder = async () => {
    try {
      const notificationId = await notifications.sendTestDailyFinanceReminder();
      if (!notificationId) {
        setNotificationAccessPromptOpen(true);
        return;
      }
      toast.success("Test notification sent");
    } catch {
      toast.error("Couldn't send test notification");
    }
  };

  const handleNotificationPermissionPress = async () => {
    try {
      if (notifications.permission.status === NotificationPermissionStatus.Granted) {
        await notifications.refreshPermissionStatus();
        toast.info("Notifications are allowed");
        return;
      }

      const permission = await notifications.ensurePermissions({
        openSettingsOnDeny:
          notifications.permission.status === NotificationPermissionStatus.Denied,
        promptIfNeeded: true,
      });

      if (permission.status === NotificationPermissionStatus.Granted) {
        toast.success("Notifications allowed");
      } else if (permission.status === NotificationPermissionStatus.Denied) {
        toast.info("Enable notifications from system settings");
      }
    } catch {
      toast.error("Couldn't update notification permission");
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
          "Permission not granted. You can enable notifications from system settings.",
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

  const handleInteractionHintsToggle = (enabled: boolean) => {
    setInteractionHintsEnabled(enabled);
    toast.success(
      enabled ? "Interaction hints turned on" : "Interaction hints turned off",
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
    dailyReminderWeekdays: dailyReminderConfig.weekdays,
    dailyReminderTone: dailyReminderConfig.tone,
    dailyReminderQuietHours: dailyReminderConfig.quietHours,
    monthlyInsightEnabled: monthlyInsightConfig.enabled,
    monthlyInsightTiming: monthlyInsightConfig.timing,
    monthlyInsightTime,
    handleDailyReminderToggle,
    handleMonthlyInsightToggle,
    handleDailyReminderTimeChange,
    handleDailyReminderWeekdaysChange,
    handleDailyReminderToneChange,
    handleQuietHoursChange,
    handleTestDailyReminder,
    handleNotificationPermissionPress,
    handleMonthlyInsightTimeChange,
    handleMonthlyInsightTimingChange,
    handleAddDailyReminderTime,
    handleRemoveDailyReminderTime,
    notificationAccessPromptOpen,
    notificationPermission: notifications.permission,
    setNotificationAccessPromptOpen,
    handleRequestNotificationAccessAgain,
    guidedChatEnabled,
    handleGuidedChatToggle,
    betterAnalyticsEnabled,
    handleBetterAnalyticsToggle,
    minimalIconsEnabled,
    handleMinimalIconsToggle,
    interactionHintsEnabled,
    handleInteractionHintsToggle,
    trueBlack,
    setTrueBlack,
    labsNoticeDismissed,
    setLabsNoticeDismissed,
    insightsCardOrder,
    setInsightsCardOrder,
  };
}
