import { navigateToNotificationTarget } from "@/navigation/RootNavigation";

import {
  NotificationType,
  type NotificationNavigationTarget,
  type NotificationResponseEnvelope,
} from "./notification.types";

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
    default:
      return null;
  }
}

export async function handleNotificationResponse(
  response: NotificationResponseEnvelope,
) {
  const target = getNavigationTarget(response);

  if (target) {
    navigateToNotificationTarget(target);
  }
}
