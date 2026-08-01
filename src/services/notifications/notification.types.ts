export enum NotificationType {
  DailyFinanceReminder = "daily_reminder",
  MonthlyInsightPrompt = "monthly-insight-prompt",
}

export enum NotificationChannelId {
  Reminders = "tally-reminders",
  Insights = "tally-insights",
}

export enum DailyFinanceReminderFrequency {
  Daily = "daily",
  Weekdays = "weekdays",
  Weekends = "weekends",
}

export enum DailyFinanceReminderTone {
  Gentle = "gentle",
  Direct = "direct",
  Minimal = "minimal",
  Fun = "fun",
}

export enum MonthlyInsightTiming {
  StartOfMonth = "start-of-month",
  EndOfMonth = "end-of-month",
}

export enum NotificationPermissionStatus {
  Undetermined = "undetermined",
  Granted = "granted",
  Denied = "denied",
}

export type SettingsNavigationParams = {
  section?: "notification-reminders";
  source?: "notification";
};

export type TransactionsNavigationParams = {
  transactionId?: string;
  source?: "notification";
  shellTab?: "calendar" | "transactions" | "insights";
};

export type NotificationNavigationTarget =
  | { screen: "Settings"; params?: SettingsNavigationParams }
  | { screen: "Transactions"; params?: TransactionsNavigationParams };

export interface BaseNotificationPayload {
  type: NotificationType;
  createdAt: string;
}

export interface DailyFinanceReminderPayload extends BaseNotificationPayload {
  type: NotificationType.DailyFinanceReminder;
}

export interface MonthlyInsightPromptPayload extends BaseNotificationPayload {
  type: NotificationType.MonthlyInsightPrompt;
  timing: MonthlyInsightTiming;
  month: number;
  year: number;
}

export type AppNotificationPayload =
  | DailyFinanceReminderPayload
  | MonthlyInsightPromptPayload;

export interface DailyFinanceReminderConfig {
  enabled: boolean;
  reminders: ReminderTime[];
  weekdays: number[];
  frequency: DailyFinanceReminderFrequency;
  tone: DailyFinanceReminderTone;
  quietHours: QuietHoursConfig;
}

export type ReminderTime = {
  hour: number;
  minute: number;
};

export interface MonthlyInsightPromptConfig {
  enabled: boolean;
  hour: number;
  minute: number;
  timing: MonthlyInsightTiming;
}

export interface QuietHoursConfig {
  enabled: boolean;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export interface NotificationScheduleRecord {
  ids: string[];
  scheduledAt: string;
  windowEndAt?: string;
}

export interface StoredNotificationPreference<TConfig> {
  config: TConfig;
  schedule: NotificationScheduleRecord | null;
}

export interface NotificationPermissionSnapshot {
  status: NotificationPermissionStatus;
  canAskAgain: boolean;
  hasRequestedBefore: boolean;
}

export interface NotificationsStateSnapshot {
  permission: NotificationPermissionSnapshot;
  dailyFinanceReminder: StoredNotificationPreference<DailyFinanceReminderConfig>;
  monthlyInsightPrompt: StoredNotificationPreference<MonthlyInsightPromptConfig>;
}

export interface NotificationReceivedEnvelope {
  notificationId: string;
  payload: AppNotificationPayload | null;
}

export interface NotificationResponseEnvelope
  extends NotificationReceivedEnvelope {
  actionIdentifier: string;
}

export interface SchedulerNotificationContent {
  title: string;
  body: string;
  data: AppNotificationPayload;
  channelId: NotificationChannelId;
}

export type SchedulerTriggerSpec =
  | {
      kind: "daily";
      channelId: NotificationChannelId;
      hour: number;
      minute: number;
    }
  | {
      kind: "weekly";
      channelId: NotificationChannelId;
      weekday: number;
      hour: number;
      minute: number;
    }
  | {
      kind: "date";
      channelId: NotificationChannelId;
      date: string;
    }
  | {
      kind: "seconds";
      channelId: NotificationChannelId;
      seconds: number;
    };

export interface NotificationPermissionResult {
  status: NotificationPermissionStatus;
  canAskAgain: boolean;
}

export interface NativePermissionSnapshot {
  status: "granted" | "denied" | "undetermined";
  canAskAgain: boolean;
  granted: boolean;
}

export const DEFAULT_DAILY_FINANCE_REMINDER: DailyFinanceReminderConfig = {
  enabled: false,
  reminders: [{ hour: 21, minute: 0 }],
  weekdays: [1, 2, 3, 4, 5, 6, 7],
  frequency: DailyFinanceReminderFrequency.Daily,
  tone: DailyFinanceReminderTone.Gentle,
  quietHours: {
    enabled: false,
    startHour: 22,
    startMinute: 0,
    endHour: 8,
    endMinute: 0,
  },
};

export const DEFAULT_MONTHLY_INSIGHT_PROMPT: MonthlyInsightPromptConfig = {
  enabled: false,
  hour: 10,
  minute: 0,
  timing: MonthlyInsightTiming.EndOfMonth,
};

export function isAppNotificationPayload(
  value: unknown,
): value is AppNotificationPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const maybePayload = value as Partial<AppNotificationPayload>;
  return (
    typeof maybePayload.type === "string" &&
    typeof maybePayload.createdAt === "string"
  );
}
