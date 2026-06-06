export enum NotificationType {
  DailyFinanceReminder = "daily_reminder",
  MonthlyInsightPrompt = "monthly-insight-prompt",
  PendingUpiTransactionRecovery = "pending-upi-transaction-recovery",
  FailedTransactionFollowUp = "failed-transaction-follow-up",
}

export enum NotificationChannelId {
  Reminders = "tally-reminders",
  Transactions = "tally-transactions",
  Insights = "tally-insights",
}

export enum NotificationCategoryId {
  PendingUpiRecovery = "pending-upi-recovery",
}

export enum NotificationActionId {
  Default = "default",
  ConfirmSuccess = "confirm-success",
  MarkFailed = "mark-failed",
  RemindLater = "remind-later",
}

export enum DailyFinanceReminderFrequency {
  Daily = "daily",
  Weekdays = "weekdays",
  Weekends = "weekends",
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

export type InsightsNavigationParams = {
  source?: "notification";
};

export type TransactionsNavigationParams = {
  transactionId?: string;
  source?: "notification";
};

export type NotificationNavigationTarget =
  | { screen: "Settings"; params?: SettingsNavigationParams }
  | { screen: "Insights"; params?: InsightsNavigationParams }
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

export interface PendingUpiTransactionRecoveryPayload
  extends BaseNotificationPayload {
  type: NotificationType.PendingUpiTransactionRecovery;
  transactionId: string;
}

export interface FailedTransactionFollowUpPayload extends BaseNotificationPayload {
  type: NotificationType.FailedTransactionFollowUp;
  transactionId: string;
}

export type AppNotificationPayload =
  | DailyFinanceReminderPayload
  | MonthlyInsightPromptPayload
  | PendingUpiTransactionRecoveryPayload
  | FailedTransactionFollowUpPayload;

export interface DailyFinanceReminderConfig {
  enabled: boolean;
  hour: number;
  minute: number;
  frequency: DailyFinanceReminderFrequency;
}

export interface MonthlyInsightPromptConfig {
  enabled: boolean;
  hour: number;
  minute: number;
  timing: MonthlyInsightTiming;
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
  categoryId?: NotificationCategoryId;
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

export interface PendingUpiRecoveryActionContext {
  payload: PendingUpiTransactionRecoveryPayload;
  actionIdentifier: NotificationActionId;
}

export interface PhaseTwoNotificationActionHandlers {
  onPendingUpiConfirmSuccess?: (
    context: PendingUpiRecoveryActionContext,
  ) => Promise<void> | void;
  onPendingUpiMarkFailed?: (
    context: PendingUpiRecoveryActionContext,
  ) => Promise<void> | void;
  onPendingUpiRemindLater?: (
    context: PendingUpiRecoveryActionContext,
  ) => Promise<void> | void;
}

export const DEFAULT_DAILY_FINANCE_REMINDER: DailyFinanceReminderConfig = {
  enabled: false,
  hour: 21,
  minute: 0,
  frequency: DailyFinanceReminderFrequency.Daily,
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
