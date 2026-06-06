import { Platform } from "react-native";

import {
  DEFAULT_DAILY_FINANCE_REMINDER,
  DEFAULT_MONTHLY_INSIGHT_PROMPT,
  NotificationPermissionStatus,
  type DailyFinanceReminderConfig,
  type MonthlyInsightPromptConfig,
  type NotificationPermissionSnapshot,
  type NotificationScheduleRecord,
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

function formatTimeValue(hour: number, minute: number) {
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
}

function parseTimeValue(
  value: string | undefined,
  defaults: DailyFinanceReminderConfig,
) {
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
    const { hour, minute } = parseTimeValue(
      storage.getString(STORAGE_KEYS.dailyReminderTime),
      DEFAULT_DAILY_FINANCE_REMINDER,
    );
    const notificationId = storage.getString(
      STORAGE_KEYS.dailyReminderNotificationId,
    );

    return {
      config: {
        enabled:
          storage.getBoolean?.(STORAGE_KEYS.dailyReminderEnabled) ??
          DEFAULT_DAILY_FINANCE_REMINDER.enabled,
        frequency: DEFAULT_DAILY_FINANCE_REMINDER.frequency,
        hour,
        minute,
      },
      schedule: notificationId
        ? {
            ids: [notificationId],
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
      formatTimeValue(value.config.hour, value.config.minute),
    );

    const notificationId = value.schedule?.ids[0];

    if (notificationId) {
      storage.set(STORAGE_KEYS.dailyReminderNotificationId, notificationId);
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
