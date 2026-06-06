import { Linking } from "react-native";

import {
  cancelScheduledNotificationIdsAsync,
  configureNotificationCategoriesAsync,
  configureForegroundPresentation,
  configureNotificationChannelsAsync,
  getAllScheduledNotificationIdsAsync,
  getLastNotificationResponseEnvelopeAsync,
  getPermissionsSnapshotAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  subscribeToNotificationReceipts,
  subscribeToNotificationResponses,
} from "./notification.scheduler";
import { notificationStorage } from "./notification.storage";
import {
  handleNotificationResponse,
  registerPhaseTwoNotificationHandlers,
} from "./notification.handlers";
import {
  DailyFinanceReminderFrequency,
  MonthlyInsightTiming,
  NotificationChannelId,
  NotificationCategoryId,
  NotificationPermissionStatus,
  NotificationType,
  type DailyFinanceReminderConfig,
  type DailyFinanceReminderPayload,
  type MonthlyInsightPromptConfig,
  type MonthlyInsightPromptPayload,
  type NativePermissionSnapshot,
  type NotificationPermissionResult,
  type NotificationResponseEnvelope,
  type NotificationsStateSnapshot,
  type NotificationScheduleRecord,
  type PhaseTwoNotificationActionHandlers,
  type SchedulerNotificationContent,
  type StoredNotificationPreference,
} from "./notification.types";

const MONTHLY_PROMPT_WINDOW = 12;
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
const DAILY_REMINDER_MESSAGES = [
  "Your ledger's waiting 🧾",
  "Quick check before the day ends?",
  "A moment to log today's expenses",
] as const;

function createSnapshot(): NotificationsStateSnapshot {
  return {
    dailyFinanceReminder: notificationStorage.getDailyFinanceReminder(),
    monthlyInsightPrompt: notificationStorage.getMonthlyInsightPrompt(),
    permission: notificationStorage.getPermissionSnapshot(),
  };
}

function assertValidTime(hour: number, minute: number) {
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error("Notification time must use a valid 24-hour clock value.");
  }
}

function mapNativePermissionToResult(
  permission: NativePermissionSnapshot,
): NotificationPermissionResult {
  switch (permission.status) {
    case "granted":
      return {
        canAskAgain: permission.canAskAgain,
        status: NotificationPermissionStatus.Granted,
      };
    case "denied":
      return {
        canAskAgain: permission.canAskAgain,
        status: NotificationPermissionStatus.Denied,
      };
    default:
      return {
        canAskAgain: permission.canAskAgain,
        status: NotificationPermissionStatus.Undetermined,
      };
  }
}

function buildDailyReminderContent(
): SchedulerNotificationContent {
  const message =
    DAILY_REMINDER_MESSAGES[
      Math.floor(Math.random() * DAILY_REMINDER_MESSAGES.length)
    ];
  const payload: DailyFinanceReminderPayload = {
    createdAt: new Date().toISOString(),
    type: NotificationType.DailyFinanceReminder,
  };

  return {
    body: message,
    channelId: NotificationChannelId.Reminders,
    data: payload,
    title: "Daily Reminder",
  };
}

function buildMonthlyInsightContent(
  date: Date,
  timing: MonthlyInsightTiming,
): SchedulerNotificationContent {
  const payload: MonthlyInsightPromptPayload = {
    createdAt: new Date().toISOString(),
    month: date.getMonth(),
    timing,
    type: NotificationType.MonthlyInsightPrompt,
    year: date.getFullYear(),
  };

  return {
    body: "A calm look at your spending story is ready when you are.",
    channelId: NotificationChannelId.Insights,
    data: payload,
    title: `Ready to review ${MONTH_NAMES[date.getMonth()]}?`,
  };
}

function buildPendingUpiRecoveryContent(
  transactionId: string,
): SchedulerNotificationContent {
  return {
    body: "Open Tally to confirm how it turned out.",
    categoryId: NotificationCategoryId.PendingUpiRecovery,
    channelId: NotificationChannelId.Transactions,
    data: {
      createdAt: new Date().toISOString(),
      transactionId,
      type: NotificationType.PendingUpiTransactionRecovery,
    },
    title: "Still waiting on this payment?",
  };
}

function buildFailedTransactionFollowUpContent(
  transactionId: string,
): SchedulerNotificationContent {
  return {
    body: "You can revisit the transaction whenever it feels right.",
    channelId: NotificationChannelId.Transactions,
    data: {
      createdAt: new Date().toISOString(),
      transactionId,
      type: NotificationType.FailedTransactionFollowUp,
    },
    title: "Want to review that payment?",
  };
}

function getWeekdaysForFrequency(frequency: DailyFinanceReminderFrequency) {
  switch (frequency) {
    case DailyFinanceReminderFrequency.Weekdays:
      return [2, 3, 4, 5, 6];
    case DailyFinanceReminderFrequency.Weekends:
      return [1, 7];
    default:
      return [];
  }
}

function buildScheduleRecord(
  ids: string[],
  windowEndAt?: string,
): NotificationScheduleRecord {
  return {
    ids,
    scheduledAt: new Date().toISOString(),
    windowEndAt,
  };
}

function buildUpcomingMonthlyDates(
  config: MonthlyInsightPromptConfig,
  monthsAhead = MONTHLY_PROMPT_WINDOW,
) {
  const now = new Date();
  const dates: Date[] = [];
  let cursor = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

  while (dates.length < monthsAhead) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const target =
      config.timing === MonthlyInsightTiming.StartOfMonth
        ? new Date(year, month, 1, config.hour, config.minute, 0, 0)
        : new Date(year, month + 1, 0, config.hour, config.minute, 0, 0);

    if (target.getTime() > now.getTime()) {
      dates.push(target);
    }

    cursor = new Date(year, month + 1, 1, 0, 0, 0, 0);
  }

  return dates;
}

class NotificationService {
  private handledResponseKeys = new Set<string>();
  private initialized = false;
  private readonly listeners = new Set<() => void>();
  private state = createSnapshot();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.state;

  private emit() {
    this.listeners.forEach((listener) => listener());
  }

  private refreshStateFromStorage() {
    this.state = createSnapshot();
    this.emit();
  }

  private async cancelExistingSchedule(
    preference: StoredNotificationPreference<unknown>,
  ) {
    if (!preference.schedule?.ids.length) {
      return;
    }

    await cancelScheduledNotificationIdsAsync(preference.schedule.ids);
  }

  private shouldRefreshMonthlyWindow() {
    const record = this.state.monthlyInsightPrompt.schedule;

    if (!record?.windowEndAt) {
      return true;
    }

    const windowEndAt = new Date(record.windowEndAt).getTime();
    const thirtyDaysFromNow = Date.now() + 1000 * 60 * 60 * 24 * 30;

    return windowEndAt <= thirtyDaysFromNow;
  }

  private async syncPermissionSnapshot(nativePermission?: NativePermissionSnapshot) {
    const permission =
      nativePermission ?? (await getPermissionsSnapshotAsync());
    const result = mapNativePermissionToResult(permission);

    notificationStorage.setPermissionSnapshot({
      canAskAgain: result.canAskAgain,
      hasRequestedBefore:
        this.state.permission.hasRequestedBefore ||
        result.status !== NotificationPermissionStatus.Undetermined,
      status: result.status,
    });
    this.refreshStateFromStorage();

    return result;
  }

  private async handleInitialNotificationResponse() {
    const response = await getLastNotificationResponseEnvelopeAsync();

    if (response) {
      await this.handleNotificationResponse(response);
    }
  }

  private async handleNotificationResponse(response: NotificationResponseEnvelope) {
    const dedupeKey = `${response.notificationId}:${response.actionIdentifier}`;

    if (this.handledResponseKeys.has(dedupeKey)) {
      return;
    }

    this.handledResponseKeys.add(dedupeKey);
    await handleNotificationResponse(response);
  }

  async ensurePermissionsAsync(options?: {
    openSettingsOnDeny?: boolean;
    promptIfNeeded?: boolean;
  }) {
    await configureNotificationChannelsAsync();
    await configureNotificationCategoriesAsync();

    const current = await getPermissionsSnapshotAsync();
    const shouldPrompt =
      options?.promptIfNeeded !== false &&
      (current.status === "undetermined" ||
        (current.status === NotificationPermissionStatus.Denied &&
          current.canAskAgain));

    if (shouldPrompt) {
      notificationStorage.setHasRequestedPermission(true);
      const requested = await requestPermissionsAsync();
      const result = await this.syncPermissionSnapshot(requested);

      if (
        result.status === NotificationPermissionStatus.Denied &&
        options?.openSettingsOnDeny
      ) {
        await Linking.openSettings();
      }

      return result;
    }

    const result = await this.syncPermissionSnapshot(current);

    if (
      result.status === NotificationPermissionStatus.Denied &&
      options?.openSettingsOnDeny
    ) {
      await Linking.openSettings();
    }

    return result;
  }

  async initializeAsync() {
    configureForegroundPresentation();
    await configureNotificationChannelsAsync();
    await configureNotificationCategoriesAsync();

    if (!this.initialized) {
      this.initialized = true;
    }

    await this.syncPermissionSnapshot();
    await this.reconcileScheduledNotificationsAsync();
  }

  async openSystemSettingsAsync() {
    await Linking.openSettings();
  }

  async reconcileScheduledNotificationsAsync() {
    const scheduledIds = new Set(await getAllScheduledNotificationIdsAsync());

    const daily = notificationStorage.getDailyFinanceReminder();
    const monthly = notificationStorage.getMonthlyInsightPrompt();

    if (
      daily.config.enabled &&
      (!daily.schedule ||
        daily.schedule.ids.some((id) => !scheduledIds.has(id)))
    ) {
      await this.scheduleDailyFinanceReminder(daily.config);
    }

    if (
      monthly.config.enabled &&
      (!monthly.schedule ||
        monthly.schedule.ids.some((id) => !scheduledIds.has(id)) ||
        this.shouldRefreshMonthlyWindow())
    ) {
      await this.scheduleMonthlyInsightPrompt(monthly.config);
    }

    if (!daily.config.enabled && daily.schedule?.ids.length) {
      await this.cancelDailyFinanceReminder();
    }

    if (!monthly.config.enabled && monthly.schedule?.ids.length) {
      await this.cancelMonthlyInsightPrompt();
    }
  }

  registerPhaseTwoHandlers(handlers: PhaseTwoNotificationActionHandlers) {
    registerPhaseTwoNotificationHandlers(handlers);
  }

  async refreshPermissionStatusAsync() {
    return this.syncPermissionSnapshot();
  }

  async sendTestDailyFinanceReminderAsync() {
    const permission = await this.ensurePermissionsAsync({
      openSettingsOnDeny: true,
      promptIfNeeded: true,
    });

    if (permission.status !== NotificationPermissionStatus.Granted) {
      return null;
    }

    return scheduleNotificationAsync(
      buildDailyReminderContent(),
      {
        channelId: NotificationChannelId.Reminders,
        kind: "seconds",
        seconds: 2,
      },
    );
  }

  async sendTestMonthlyInsightPromptAsync() {
    const permission = await this.ensurePermissionsAsync({
      openSettingsOnDeny: true,
      promptIfNeeded: true,
    });

    if (permission.status !== NotificationPermissionStatus.Granted) {
      return null;
    }

    return scheduleNotificationAsync(
      buildMonthlyInsightContent(new Date(), MonthlyInsightTiming.EndOfMonth),
      {
        channelId: NotificationChannelId.Insights,
        kind: "seconds",
        seconds: 2,
      },
    );
  }

  async sendTestPendingUpiRecoveryAsync(transactionId?: string) {
    const permission = await this.ensurePermissionsAsync({
      openSettingsOnDeny: true,
      promptIfNeeded: true,
    });

    if (permission.status !== NotificationPermissionStatus.Granted) {
      return null;
    }

    return scheduleNotificationAsync(
      buildPendingUpiRecoveryContent(
        transactionId ?? `debug-upi-${Date.now()}`,
      ),
      {
        channelId: NotificationChannelId.Transactions,
        kind: "seconds",
        seconds: 2,
      },
    );
  }

  async sendTestFailedTransactionFollowUpAsync(transactionId?: string) {
    const permission = await this.ensurePermissionsAsync({
      openSettingsOnDeny: true,
      promptIfNeeded: true,
    });

    if (permission.status !== NotificationPermissionStatus.Granted) {
      return null;
    }

    return scheduleNotificationAsync(
      buildFailedTransactionFollowUpContent(
        transactionId ?? `debug-failed-${Date.now()}`,
      ),
      {
        channelId: NotificationChannelId.Transactions,
        kind: "seconds",
        seconds: 2,
      },
    );
  }

  async scheduleDailyFinanceReminder(
    config: DailyFinanceReminderConfig,
    options?: {
      openSettingsOnDeny?: boolean;
      promptIfNeeded?: boolean;
    },
  ) {
    assertValidTime(config.hour, config.minute);

    const permission = await this.ensurePermissionsAsync({
      openSettingsOnDeny: options?.openSettingsOnDeny ?? true,
      promptIfNeeded: options?.promptIfNeeded ?? true,
    });

    if (permission.status !== NotificationPermissionStatus.Granted) {
      return this.state.dailyFinanceReminder;
    }

    const nextPreference: StoredNotificationPreference<DailyFinanceReminderConfig> =
      {
        config: {
          ...config,
          enabled: true,
        },
        schedule: null,
      };

    await this.cancelExistingSchedule(this.state.dailyFinanceReminder);

    const content = buildDailyReminderContent();
    const ids: string[] = [];

    if (config.frequency === DailyFinanceReminderFrequency.Daily) {
      ids.push(
        await scheduleNotificationAsync(content, {
          channelId: NotificationChannelId.Reminders,
          hour: config.hour,
          kind: "daily",
          minute: config.minute,
        }),
      );
    } else {
      const weekdays = getWeekdaysForFrequency(config.frequency);

      for (const weekday of weekdays) {
        ids.push(
          await scheduleNotificationAsync(content, {
            channelId: NotificationChannelId.Reminders,
            hour: config.hour,
            kind: "weekly",
            minute: config.minute,
            weekday,
          }),
        );
      }
    }

    nextPreference.schedule = buildScheduleRecord(ids);
    notificationStorage.setDailyFinanceReminder(nextPreference);
    this.refreshStateFromStorage();

    return nextPreference;
  }

  async updateDailyFinanceReminder(config: DailyFinanceReminderConfig) {
    if (!config.enabled) {
      await this.cancelDailyFinanceReminder();
      return this.state.dailyFinanceReminder;
    }

    return this.scheduleDailyFinanceReminder(config);
  }

  async scheduleDailyReminder(
    time: { hour: number; minute: number },
    options?: {
      openSettingsOnDeny?: boolean;
      promptIfNeeded?: boolean;
    },
  ) {
    return this.scheduleDailyFinanceReminder({
      enabled: true,
      frequency: DailyFinanceReminderFrequency.Daily,
      hour: time.hour,
      minute: time.minute,
    }, options);
  }

  async setDailyReminderEnabled(enabled: boolean) {
    const current = notificationStorage.getDailyFinanceReminder();

    if (!enabled) {
      return this.cancelDailyFinanceReminder();
    }

    return this.scheduleDailyReminder(
      {
        hour: current.config.hour,
        minute: current.config.minute,
      },
      {
        openSettingsOnDeny: false,
        promptIfNeeded: true,
      },
    );
  }

  async setDailyReminderTime(time: { hour: number; minute: number }) {
    const current = notificationStorage.getDailyFinanceReminder();

    if (current.config.enabled) {
      return this.scheduleDailyReminder(time);
    }

    const nextPreference: StoredNotificationPreference<DailyFinanceReminderConfig> =
      {
        config: {
          ...current.config,
          hour: time.hour,
          minute: time.minute,
        },
        schedule: null,
      };

    notificationStorage.setDailyFinanceReminder(nextPreference);
    this.refreshStateFromStorage();

    return nextPreference;
  }

  async cancelDailyFinanceReminder() {
    const current = notificationStorage.getDailyFinanceReminder();
    await this.cancelExistingSchedule(current);

    const nextPreference: StoredNotificationPreference<DailyFinanceReminderConfig> =
      {
        config: {
          ...current.config,
          enabled: false,
        },
        schedule: null,
      };

    notificationStorage.setDailyFinanceReminder(nextPreference);
    this.refreshStateFromStorage();

    return nextPreference;
  }

  async scheduleMonthlyInsightPrompt(config: MonthlyInsightPromptConfig) {
    assertValidTime(config.hour, config.minute);

    const permission = await this.ensurePermissionsAsync({
      openSettingsOnDeny: true,
      promptIfNeeded: true,
    });

    if (permission.status !== NotificationPermissionStatus.Granted) {
      return this.state.monthlyInsightPrompt;
    }

    const dates = buildUpcomingMonthlyDates(config);
    const ids: string[] = [];

    await this.cancelExistingSchedule(this.state.monthlyInsightPrompt);

    for (const date of dates) {
      ids.push(
        await scheduleNotificationAsync(buildMonthlyInsightContent(date, config.timing), {
          channelId: NotificationChannelId.Insights,
          date: date.toISOString(),
          kind: "date",
        }),
      );
    }

    const nextPreference: StoredNotificationPreference<MonthlyInsightPromptConfig> =
      {
        config: {
          ...config,
          enabled: true,
        },
        schedule: buildScheduleRecord(
          ids,
          dates[dates.length - 1]?.toISOString(),
        ),
      };

    notificationStorage.setMonthlyInsightPrompt(nextPreference);
    this.refreshStateFromStorage();

    return nextPreference;
  }

  async updateMonthlyInsightPrompt(config: MonthlyInsightPromptConfig) {
    if (!config.enabled) {
      await this.cancelMonthlyInsightPrompt();
      return this.state.monthlyInsightPrompt;
    }

    return this.scheduleMonthlyInsightPrompt(config);
  }

  async cancelMonthlyInsightPrompt() {
    const current = notificationStorage.getMonthlyInsightPrompt();
    await this.cancelExistingSchedule(current);

    const nextPreference: StoredNotificationPreference<MonthlyInsightPromptConfig> =
      {
        config: {
          ...current.config,
          enabled: false,
        },
        schedule: null,
      };

    notificationStorage.setMonthlyInsightPrompt(nextPreference);
    this.refreshStateFromStorage();

    return nextPreference;
  }

  attachListeners() {
    let isDisposed = false;

    void this.handleInitialNotificationResponse();

    const removeReceiptListener = subscribeToNotificationReceipts(() => {
      if (!isDisposed) {
        this.refreshStateFromStorage();
      }
    });

    const removeResponseListener = subscribeToNotificationResponses(
      (response) => {
        if (!isDisposed) {
          void this.handleNotificationResponse(response);
        }
      },
    );

    return () => {
      isDisposed = true;
      removeReceiptListener();
      removeResponseListener();
    };
  }
}

export const notificationService = new NotificationService();
