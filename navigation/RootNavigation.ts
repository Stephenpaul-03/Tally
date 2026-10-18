import { isSpotlightTourActive } from "@/modules/Onboarding/tourNavigation";
import {
  createNavigationContainerRef,
} from "@react-navigation/native";

import type { NotificationNavigationTarget } from "@/src/services/notifications/notification.types";
import type { RootParamList } from "./types";

export const navigationRef = createNavigationContainerRef<RootParamList>();

function isSetupOpen() {
  const state = navigationRef.getRootState();
  const route = state?.routes[state.index ?? 0];
  return route?.name === "OnboardingGate" || route?.name === "Onboarding";
}

const pendingTargets: NotificationNavigationTarget[] = [];

function performNavigation(target: NotificationNavigationTarget) {
  navigationRef.navigate(
    target.screen,
    target.params as RootParamList[typeof target.screen],
  );
}

export function navigateToNotificationTarget(
  target: NotificationNavigationTarget,
) {
  if (!navigationRef.isReady() || isSetupOpen() || isSpotlightTourActive()) {
    pendingTargets.push(target);
    return;
  }

  performNavigation(target);
}

export function flushPendingNavigationTargets() {
  if (!navigationRef.isReady() || isSetupOpen() || isSpotlightTourActive()) {
    return;
  }

  while (pendingTargets.length) {
    const target = pendingTargets.shift();

    if (target) {
      performNavigation(target);
    }
  }
}
