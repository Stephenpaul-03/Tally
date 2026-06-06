import { useEffect, useSyncExternalStore } from "react";

import { notificationService } from "./notification.service";

const notificationsApi = {
  attachListeners: notificationService.attachListeners.bind(notificationService),
  cancelDailyFinanceReminder:
    notificationService.cancelDailyFinanceReminder.bind(notificationService),
  cancelMonthlyInsightPrompt:
    notificationService.cancelMonthlyInsightPrompt.bind(notificationService),
  ensurePermissions:
    notificationService.ensurePermissionsAsync.bind(notificationService),
  initialize: notificationService.initializeAsync.bind(notificationService),
  openSystemSettings:
    notificationService.openSystemSettingsAsync.bind(notificationService),
  reconcileSchedules:
    notificationService.reconcileScheduledNotificationsAsync.bind(notificationService),
  refreshPermissionStatus:
    notificationService.refreshPermissionStatusAsync.bind(notificationService),
  registerPhaseTwoHandlers:
    notificationService.registerPhaseTwoHandlers.bind(notificationService),
  scheduleDailyFinanceReminder:
    notificationService.scheduleDailyFinanceReminder.bind(notificationService),
  scheduleDailyReminder:
    notificationService.scheduleDailyReminder.bind(notificationService),
  scheduleMonthlyInsightPrompt:
    notificationService.scheduleMonthlyInsightPrompt.bind(notificationService),
  sendTestDailyFinanceReminder:
    notificationService.sendTestDailyFinanceReminderAsync.bind(notificationService),
  sendTestFailedTransactionFollowUp:
    notificationService.sendTestFailedTransactionFollowUpAsync.bind(notificationService),
  sendTestMonthlyInsightPrompt:
    notificationService.sendTestMonthlyInsightPromptAsync.bind(notificationService),
  sendTestPendingUpiRecovery:
    notificationService.sendTestPendingUpiRecoveryAsync.bind(notificationService),
  setDailyReminderEnabled:
    notificationService.setDailyReminderEnabled.bind(notificationService),
  setDailyReminderTime:
    notificationService.setDailyReminderTime.bind(notificationService),
  updateDailyFinanceReminder:
    notificationService.updateDailyFinanceReminder.bind(notificationService),
  updateMonthlyInsightPrompt:
    notificationService.updateMonthlyInsightPrompt.bind(notificationService),
};

export function useNotifications() {
  const snapshot = useSyncExternalStore(
    notificationService.subscribe,
    notificationService.getSnapshot,
    notificationService.getSnapshot,
  );

  useEffect(() => {
    void notificationService.refreshPermissionStatusAsync();
  }, []);

  return {
    ...snapshot,
    ...notificationsApi,
  };
}
