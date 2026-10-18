import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import {
  NotificationChannelId,
  NotificationPermissionStatus,
  isAppNotificationPayload,
  type NativePermissionSnapshot,
  type NotificationReceivedEnvelope,
  type NotificationResponseEnvelope,
  type SchedulerNotificationContent,
  type SchedulerTriggerSpec,
} from "./notification.types";

let isForegroundHandlerConfigured = false;
type NativeExpoPermissionResponse = {
  canAskAgain: boolean;
  granted: boolean;
  status: Notifications.PermissionStatus;
};

function mapPermissionStatus(
  status: Notifications.PermissionStatus,
): NotificationPermissionStatus {
  switch (status) {
    case "granted":
      return NotificationPermissionStatus.Granted;
    case "denied":
      return NotificationPermissionStatus.Denied;
    default:
      return NotificationPermissionStatus.Undetermined;
  }
}

function toReceivedEnvelope(
  notification: Notifications.Notification,
): NotificationReceivedEnvelope {
  const payload = notification.request.content.data;

  return {
    notificationId: notification.request.identifier,
    payload: isAppNotificationPayload(payload) ? payload : null,
  };
}

function toResponseEnvelope(
  response: Notifications.NotificationResponse,
): NotificationResponseEnvelope {
  const envelope = toReceivedEnvelope(response.notification);

  return {
    ...envelope,
    actionIdentifier: response.actionIdentifier,
  };
}

function toExpoTrigger(trigger: SchedulerTriggerSpec): Notifications.NotificationTriggerInput {
  switch (trigger.kind) {
    case "immediate":
      return Platform.OS === "android" ? { channelId: trigger.channelId } : null;
    case "daily":
      return {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        channelId: trigger.channelId,
        hour: trigger.hour,
        minute: trigger.minute,
      };
    case "weekly":
      return {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        channelId: trigger.channelId,
        weekday: trigger.weekday,
        hour: trigger.hour,
        minute: trigger.minute,
      };
    case "date":
      return {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        channelId: trigger.channelId,
        date: new Date(trigger.date),
      };
    case "seconds":
      return {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        channelId: trigger.channelId,
        repeats: false,
        seconds: trigger.seconds,
      };
  }
}

export async function configureNotificationChannelsAsync() {
  if (Platform.OS !== "android") {
    return;
  }

  await Promise.all([
    Notifications.setNotificationChannelAsync(NotificationChannelId.Reminders, {
      name: "Daily reminders",
      description: "Gentle personal finance reminder nudges",
      enableVibrate: false,
      importance: Notifications.AndroidImportance.DEFAULT,
      showBadge: false,
    }),
    Notifications.setNotificationChannelAsync(NotificationChannelId.Insights, {
      name: "Monthly insights",
      description: "Monthly reflection prompts",
      enableVibrate: false,
      importance: Notifications.AndroidImportance.DEFAULT,
      showBadge: false,
    }),
  ]);
}

export async function configureNotificationCategoriesAsync() {
  return;
}

export function configureForegroundPresentation() {
  if (isForegroundHandlerConfigured) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  isForegroundHandlerConfigured = true;
}

export async function getAllScheduledNotificationIdsAsync() {
  if (Platform.OS === "web") {
    return [] as string[];
  }

  const requests = await Notifications.getAllScheduledNotificationsAsync();
  return requests.map((request) => request.identifier);
}

export async function getLastNotificationResponseEnvelopeAsync() {
  if (Platform.OS === "web") {
    return null;
  }

  const response = await Notifications.getLastNotificationResponseAsync();
  return response ? toResponseEnvelope(response) : null;
}

export async function getPermissionsSnapshotAsync(): Promise<NativePermissionSnapshot> {
  if (Platform.OS === "web") {
    return {
      canAskAgain: false,
      granted: false,
      status: "denied",
    };
  }

  const permission =
    (await Notifications.getPermissionsAsync()) as NativeExpoPermissionResponse;
  const status = mapPermissionStatus(permission.status);

  return {
    canAskAgain: permission.canAskAgain,
    granted: permission.granted,
    status,
  };
}

export async function requestPermissionsAsync(): Promise<NativePermissionSnapshot> {
  if (Platform.OS === "web") {
    return {
      canAskAgain: false,
      granted: false,
      status: "denied",
    };
  }

  const permission =
    (await Notifications.requestPermissionsAsync()) as NativeExpoPermissionResponse;
  const status = mapPermissionStatus(permission.status);

  return {
    canAskAgain: permission.canAskAgain,
    granted: permission.granted,
    status,
  };
}

export async function scheduleNotificationAsync(
  content: SchedulerNotificationContent,
  trigger: SchedulerTriggerSpec,
) {
  if (Platform.OS === "web") {
    return `web-${content.data.type}-${Date.now()}`;
  }

  configureForegroundPresentation();
  if (Platform.OS === "android" && Number(Platform.Version) >= 26) {
    const channel = await Notifications.getNotificationChannelAsync(content.channelId);
    if (!channel || channel.importance === Notifications.AndroidImportance.NONE) {
      throw new Error("The notification channel is blocked. Open Android settings → Notifications → Tally and enable Daily reminders.");
    }
  }
  return Notifications.scheduleNotificationAsync({
    content: {
      body: content.body,
      data: content.data as unknown as Record<string, unknown>,
      sound: false,
      title: content.title,
    },
    trigger: toExpoTrigger(trigger),
  });
}

export async function cancelScheduledNotificationIdsAsync(ids: string[]) {
  if (Platform.OS === "web" || ids.length === 0) {
    return;
  }

  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
  );
}

export function subscribeToNotificationReceipts(
  listener: (event: NotificationReceivedEnvelope) => void,
) {
  if (Platform.OS === "web") {
    return () => undefined;
  }

  const subscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      listener(toReceivedEnvelope(notification));
    },
  );

  return () => {
    subscription.remove();
  };
}

export function subscribeToNotificationResponses(
  listener: (event: NotificationResponseEnvelope) => void,
) {
  if (Platform.OS === "web") {
    return () => undefined;
  }

  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      listener(toResponseEnvelope(response));
    },
  );

  return () => {
    subscription.remove();
  };
}
