import { Platform } from "react-native";

import {
  DEFAULT_DAILY_FINANCE_REMINDER,
  DEFAULT_MONTHLY_INSIGHT_PROMPT,
  NotificationPermissionStatus,
  type DailyFinanceReminderConfig,
  type MonthlyInsightPromptConfig,
  type NotificationPermissionSnapshot,
  type NotificationScheduleRecord,
  type ReminderTime,
  type StoredNotificationPreference,
} from "./notification.types";

type StorageAdapter = {
  delete: (key: string) => void;
  getBoolean?: (key: string) => boolean | undefined;
  getString: (key: string) => string | undefined;
  set: (key: string, value: boolean | string) => void;
};

type MmkvModule = typeof import("react-native-mmkv");
type MmkvInstance = ReturnType<MmkvModule["createMMKV"]>;

const memoryStore = new Map<string, string | boolean>();

const fallbackStorage: StorageAdapter = {
  delete: (key) => {
    memoryStore.delete(key);
  },
  getBoolean: (key) => {
    const value = memoryStore.get(key);
    return typeof value === "boolean" ? value : undefined;
  },
  getString: (key) => {
    const value = memoryStore.get(key);
    return typeof value === "string" ? value : undefined;
  },
  set: (key, value) => {
    memoryStore.set(key, value);
  },
};

function createStorage(): StorageAdapter {
  if (Platform.OS === "web") {
    return fallbackStorage;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- MMKV is loaded only on native platforms.
    const { createMMKV } = require("react-native-mmkv") as MmkvModule;
    const mmkv = createMMKV({ id: "tally.notifications" }) as MmkvInstance;

    return {
      delete: (key) => {
        mmkv.remove(key);
      },
      getBoolean: (key) => mmkv.getBoolean(key) ?? undefined,
      getString: (key) => mmkv.getString(key) ?? undefined,
      set: (key, value) => {
        mmkv.set(key, value);
      },
    };
  } catch {
    return fallbackStorage;
  }
}

const storage = createStorage();

const STORAGE_KEYS = {
  dailyReminderEnabled: "tally.reminder.enabled",
  dailyReminderNotificationId: "tally.reminder.notificationId",
  dailyReminderTime: "tally.reminder.time",
  monthlyConfig: "notifications.monthly.config",
  monthlySchedule: "notifications.monthly.schedule",
  permissionStatus: "notifications.permission.status",
  permissionCanAskAgain: "notifications.permission.canAskAgain",
  hasRequestedPermission: "notifications.permission.hasRequested",
} as const;

function parseTimeValue(
  value: string | undefined,
  defaults: ReminderTime,
): ReminderTime {
  if (!value) {
    return {
      hour: defaults.hour,
      minute: defaults.minute,
    };
  }

  const [hourValue, minuteValue] = value.split(":");
  const hour = Number(hourValue);
  const minute = Number(minuteValue);

  if (
    Number.isInteger(hour) &&
    Number.isInteger(minute) &&
    hour >= 0 &&
    hour <= 23 &&
    minute >= 0 &&
    minute <= 59
  ) {
    return { hour, minute };
  }

  return {
    hour: defaults.hour,
    minute: defaults.minute,
  };
}

function parseReminderTimes(value: string | undefined): ReminderTime[] {
  const fallback = DEFAULT_DAILY_FINANCE_REMINDER.reminders;

  if (!value) {
    return fallback;
  }

  const parsedJson = readJson<ReminderTime[]>(STORAGE_KEYS.dailyReminderTime);

  if (Array.isArray(parsedJson)) {
    const validTimes = parsedJson.filter((time) => {
      return (
        Number.isInteger(time.hour) &&
        Number.isInteger(time.minute) &&
        time.hour >= 0 &&
        time.hour <= 23 &&
        time.minute >= 0 &&
        time.minute <= 59
      );
    });

    return validTimes.length > 0 ? validTimes.slice(0, 3) : fallback;
  }

  return [parseTimeValue(value, fallback[0])];
}

function parseScheduleIds(value: string | undefined) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((id): id is string => typeof id === "string");
    }
  } catch {
    return [value];
  }

  return [value];
}

function readJson<T>(key: string): T | null {
  const rawValue = storage.getString(key);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  storage.set(key, JSON.stringify(value));
}

function getStoredPreference<TConfig>(
  configKey: string,
  scheduleKey: string,
  defaults: TConfig,
): StoredNotificationPreference<TConfig> {
  return {
    config: readJson<TConfig>(configKey) ?? defaults,
    schedule: readJson<NotificationScheduleRecord>(scheduleKey),
  };
}

export const notificationStorage = {
  clearDailyFinanceReminder() {
    storage.delete(STORAGE_KEYS.dailyReminderNotificationId);
  },

  clearMonthlyInsightPrompt() {
    storage.delete(STORAGE_KEYS.monthlySchedule);
  },

  getDailyFinanceReminder(): StoredNotificationPreference<DailyFinanceReminderConfig> {
    const reminders = parseReminderTimes(
      storage.getString(STORAGE_KEYS.dailyReminderTime),
    );
    const notificationIds = parseScheduleIds(
      storage.getString(STORAGE_KEYS.dailyReminderNotificationId),
    );

    return {
      config: {
        enabled:
          storage.getBoolean?.(STORAGE_KEYS.dailyReminderEnabled) ??
          DEFAULT_DAILY_FINANCE_REMINDER.enabled,
        frequency: DEFAULT_DAILY_FINANCE_REMINDER.frequency,
        reminders,
      },
      schedule: notificationIds.length > 0
        ? {
            ids: notificationIds,
            scheduledAt: "",
          }
        : null,
    };
  },

  getHasRequestedPermission(): boolean {
    return storage.getBoolean?.(STORAGE_KEYS.hasRequestedPermission) ?? false;
  },

  getMonthlyInsightPrompt(): StoredNotificationPreference<MonthlyInsightPromptConfig> {
    return getStoredPreference(
      STORAGE_KEYS.monthlyConfig,
      STORAGE_KEYS.monthlySchedule,
      DEFAULT_MONTHLY_INSIGHT_PROMPT,
    );
  },

  getPermissionSnapshot(): NotificationPermissionSnapshot {
    const rawStatus = storage.getString(STORAGE_KEYS.permissionStatus);
    const status =
      rawStatus === NotificationPermissionStatus.Granted ||
      rawStatus === NotificationPermissionStatus.Denied
        ? rawStatus
        : NotificationPermissionStatus.Undetermined;

    return {
      status,
      canAskAgain:
        storage.getBoolean?.(STORAGE_KEYS.permissionCanAskAgain) ?? true,
      hasRequestedBefore: storage.getBoolean?.(STORAGE_KEYS.hasRequestedPermission) ?? false,
    };
  },

  setDailyFinanceReminder(
    value: StoredNotificationPreference<DailyFinanceReminderConfig>,
  ) {
    storage.set(STORAGE_KEYS.dailyReminderEnabled, value.config.enabled);
    storage.set(
      STORAGE_KEYS.dailyReminderTime,
      JSON.stringify(value.config.reminders.map(({ hour, minute }) => ({ hour, minute }))),
    );

    const notificationIds = value.schedule?.ids;

    if (notificationIds?.length) {
      storage.set(
        STORAGE_KEYS.dailyReminderNotificationId,
        JSON.stringify(notificationIds),
      );
    } else {
      storage.delete(STORAGE_KEYS.dailyReminderNotificationId);
    }
  },

  setHasRequestedPermission(value: boolean) {
    storage.set(STORAGE_KEYS.hasRequestedPermission, value);
  },

  setMonthlyInsightPrompt(
    value: StoredNotificationPreference<MonthlyInsightPromptConfig>,
  ) {
    writeJson(STORAGE_KEYS.monthlyConfig, value.config);
    if (value.schedule) {
      writeJson(STORAGE_KEYS.monthlySchedule, value.schedule);
      return;
    }
    storage.delete(STORAGE_KEYS.monthlySchedule);
  },

  setPermissionSnapshot(value: NotificationPermissionSnapshot) {
    storage.set(STORAGE_KEYS.permissionStatus, value.status);
    storage.set(STORAGE_KEYS.permissionCanAskAgain, value.canAskAgain);
    storage.set(STORAGE_KEYS.hasRequestedPermission, value.hasRequestedBefore);
  },
};
