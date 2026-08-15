import { Linking } from "react-native";
import reminderCopyCatalog from "./daily-reminder-copy.json";

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
import { handleNotificationResponse } from "./notification.handlers";
import {
  DailyFinanceReminderFrequency,
  DailyFinanceReminderTone,
  DEFAULT_DAILY_FINANCE_REMINDER,
  MonthlyInsightTiming,
  NotificationChannelId,
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
  type QuietHoursConfig,
  type ReminderTime,
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
const DAILY_REMINDER_COPY = reminderCopyCatalog as Record<
  DailyFinanceReminderTone,
  readonly { title: string; body: string }[]
>;

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

function withUpdatedReminderTime(
  reminders: ReminderTime[],
  index: number,
  time: ReminderTime,
) {
  return reminders.map((reminder, reminderIndex) =>
    reminderIndex === index ? time : reminder,
  );
}

function withoutReminderTime(reminders: ReminderTime[], index: number) {
  if (reminders.length <= 1 || index < 0 || index >= reminders.length) {
    return reminders;
  }

  return reminders.filter((_, reminderIndex) => reminderIndex !== index);
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
  config: DailyFinanceReminderConfig,
): SchedulerNotificationContent {
  const messages =
    DAILY_REMINDER_COPY[config.tone] ??
    DAILY_REMINDER_COPY[DailyFinanceReminderTone.Gentle];
  const copy = messages[Math.floor(Math.random() * messages.length)];
  const payload: DailyFinanceReminderPayload = {
    createdAt: new Date().toISOString(),
    type: NotificationType.DailyFinanceReminder,
  };

  return {
    body: copy?.body ?? "A moment to log today's spending.",
    channelId: NotificationChannelId.Reminders,
    data: payload,
    title: copy?.title ?? "Tally reminder",
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

function toMinutes(hour: number, minute: number) {
  return hour * 60 + minute;
}

function isTimeInQuietHours(
  time: ReminderTime,
  quietHours: QuietHoursConfig,
) {
  if (!quietHours.enabled) return false;
  const current = toMinutes(time.hour, time.minute);
  const start = toMinutes(quietHours.startHour, quietHours.startMinute);
  const end = toMinutes(quietHours.endHour, quietHours.endMinute);

  if (start === end) return false;
  if (start < end) return current >= start && current < end;
  return current >= start || current < end;
}

function moveDateOutOfQuietHours(date: Date, quietHours: QuietHoursConfig) {
  if (
    !isTimeInQuietHours(
      { hour: date.getHours(), minute: date.getMinutes() },
      quietHours,
    )
  ) {
    return date;
  }

  const next = new Date(date);
  next.setHours(quietHours.endHour, quietHours.endMinute, 0, 0);

  if (next.getTime() <= date.getTime()) {
    next.setDate(next.getDate() + 1);
  }

  return next;
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
      buildDailyReminderContent(DEFAULT_DAILY_FINANCE_REMINDER),
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

  async scheduleDailyFinanceReminder(
    config: DailyFinanceReminderConfig,
    options?: {
      openSettingsOnDeny?: boolean;
      promptIfNeeded?: boolean;
    },
  ) {
    config.reminders.forEach(({ hour, minute }) => {
      assertValidTime(hour, minute);
    });
    const weekdays = Array.from(
      new Set(
        config.weekdays.filter((weekday) => {
          return Number.isInteger(weekday) && weekday >= 1 && weekday <= 7;
        }),
      ),
    ).sort((a, b) => a - b);

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

    const content = buildDailyReminderContent(config);
    const ids: string[] = [];

    for (const reminder of config.reminders.filter(
      (time) => !isTimeInQuietHours(time, config.quietHours),
    )) {
      if (weekdays.length === 7) {
        ids.push(
          await scheduleNotificationAsync(content, {
            channelId: NotificationChannelId.Reminders,
            hour: reminder.hour,
            kind: "daily",
            minute: reminder.minute,
          }),
        );
      } else {
        for (const weekday of weekdays) {
          ids.push(
            await scheduleNotificationAsync(content, {
              channelId: NotificationChannelId.Reminders,
              hour: reminder.hour,
              kind: "weekly",
              minute: reminder.minute,
              weekday,
            }),
          );
        }
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
    time: ReminderTime,
    options?: {
      openSettingsOnDeny?: boolean;
      promptIfNeeded?: boolean;
    },
  ) {
    return this.scheduleDailyFinanceReminder({
      ...DEFAULT_DAILY_FINANCE_REMINDER,
      enabled: true,
      frequency: DailyFinanceReminderFrequency.Daily,
      reminders: [time],
    }, options);
  }

  async setDailyReminderEnabled(enabled: boolean) {
    const current = notificationStorage.getDailyFinanceReminder();

    if (!enabled) {
      return this.cancelDailyFinanceReminder();
    }

    return this.scheduleDailyFinanceReminder(
      {
        ...current.config,
        enabled: true,
        reminders:
          current.config.reminders.length > 0
            ? current.config.reminders
            : DEFAULT_DAILY_FINANCE_REMINDER.reminders,
      },
      {
        openSettingsOnDeny: false,
        promptIfNeeded: true,
      },
    );
  }

  async setDailyReminderTime(time: ReminderTime, index = 0) {
    const current = notificationStorage.getDailyFinanceReminder();
    const reminders = withUpdatedReminderTime(
      current.config.reminders,
      index,
      time,
    );

    if (current.config.enabled) {
      return this.scheduleDailyFinanceReminder({
        ...current.config,
        reminders,
      });
    }

    const nextPreference: StoredNotificationPreference<DailyFinanceReminderConfig> =
      {
        config: {
          ...current.config,
          reminders,
        },
        schedule: null,
      };

    notificationStorage.setDailyFinanceReminder(nextPreference);
    this.refreshStateFromStorage();

    return nextPreference;
  }

  async addDailyReminderTime(time?: ReminderTime) {
    const current = notificationStorage.getDailyFinanceReminder();

    if (current.config.reminders.length >= 5) {
      return current;
    }

    const lastReminder =
      current.config.reminders[current.config.reminders.length - 1] ??
      DEFAULT_DAILY_FINANCE_REMINDER.reminders[0];
    const nextTime = time ?? {
      hour: (lastReminder.hour + 1) % 24,
      minute: lastReminder.minute,
    };
    const reminders = [...current.config.reminders, nextTime];

    if (current.config.enabled) {
      return this.scheduleDailyFinanceReminder({
        ...current.config,
        reminders,
      });
    }

    const nextPreference: StoredNotificationPreference<DailyFinanceReminderConfig> =
      {
        config: {
          ...current.config,
          reminders,
        },
        schedule: null,
      };

    notificationStorage.setDailyFinanceReminder(nextPreference);
    this.refreshStateFromStorage();

    return nextPreference;
  }

  async removeDailyReminderTime(index: number) {
    const current = notificationStorage.getDailyFinanceReminder();
    const reminders = withoutReminderTime(current.config.reminders, index);

    if (reminders === current.config.reminders) {
      return current;
    }

    if (current.config.enabled) {
      return this.scheduleDailyFinanceReminder({
        ...current.config,
        reminders,
      });
    }

    const nextPreference: StoredNotificationPreference<DailyFinanceReminderConfig> =
      {
        config: {
          ...current.config,
          reminders,
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

    const quietHours = this.state.dailyFinanceReminder.config.quietHours;
    const dates = buildUpcomingMonthlyDates(config).map((date) =>
      moveDateOutOfQuietHours(date, quietHours),
    );
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
