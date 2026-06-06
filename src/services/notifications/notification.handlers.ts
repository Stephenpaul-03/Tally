import { navigateToNotificationTarget } from "@/navigation/RootNavigation";

import {
  NotificationActionId,
  NotificationType,
  type NotificationNavigationTarget,
  type NotificationResponseEnvelope,
  type PhaseTwoNotificationActionHandlers,
  type PendingUpiRecoveryActionContext,
} from "./notification.types";

let phaseTwoActionHandlers: PhaseTwoNotificationActionHandlers = {};

function normalizeActionIdentifier(actionIdentifier: string) {
  switch (actionIdentifier) {
    case NotificationActionId.ConfirmSuccess:
      return NotificationActionId.ConfirmSuccess;
    case NotificationActionId.MarkFailed:
      return NotificationActionId.MarkFailed;
    case NotificationActionId.RemindLater:
      return NotificationActionId.RemindLater;
    default:
      return NotificationActionId.Default;
  }
}

function getNavigationTarget(
  response: NotificationResponseEnvelope,
): NotificationNavigationTarget | null {
  const payload = response.payload;

  if (!payload) {
    return null;
  }

  switch (payload.type) {
    case NotificationType.DailyFinanceReminder:
      return {
        screen: "Transactions",
        params: {
          source: "notification",
        },
      };
    case NotificationType.MonthlyInsightPrompt:
      return {
        screen: "Insights",
        params: {
          source: "notification",
        },
      };
    case NotificationType.PendingUpiTransactionRecovery:
    case NotificationType.FailedTransactionFollowUp:
      return {
        screen: "Transactions",
        params: {
          source: "notification",
          transactionId: payload.transactionId,
        },
      };
    default:
      return null;
  }
}

async function handlePendingRecoveryAction(
  context: PendingUpiRecoveryActionContext,
) {
  switch (context.actionIdentifier) {
    case NotificationActionId.ConfirmSuccess:
      await phaseTwoActionHandlers.onPendingUpiConfirmSuccess?.(context);
      return true;
    case NotificationActionId.MarkFailed:
      await phaseTwoActionHandlers.onPendingUpiMarkFailed?.(context);
      return true;
    case NotificationActionId.RemindLater:
      await phaseTwoActionHandlers.onPendingUpiRemindLater?.(context);
      return true;
    default:
      return false;
  }
}

export async function handleNotificationResponse(
  response: NotificationResponseEnvelope,
) {
  const payload = response.payload;
  const actionIdentifier = normalizeActionIdentifier(response.actionIdentifier);

  if (payload?.type === NotificationType.PendingUpiTransactionRecovery) {
    const wasHandled = await handlePendingRecoveryAction({
      actionIdentifier,
      payload,
    });

    if (wasHandled) {
      return;
    }
  }

  const target = getNavigationTarget(response);

  if (target) {
    navigateToNotificationTarget(target);
  }
}

export function registerPhaseTwoNotificationHandlers(
  handlers: PhaseTwoNotificationActionHandlers,
) {
  phaseTwoActionHandlers = handlers;
}
