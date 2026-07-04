import { useSyncExternalStore } from "react";

export const DEV_TOOLS_PASSCODE = "1126";

let developerToolsUnlockedForSession = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function unlockDeveloperToolsForSession() {
  developerToolsUnlockedForSession = true;
  emit();
}

export function isDeveloperToolsUnlockedForSession() {
  return developerToolsUnlockedForSession;
}

export function subscribeToDeveloperToolsSession(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useDeveloperToolsUnlockedForSession() {
  return useSyncExternalStore(
    subscribeToDeveloperToolsSession,
    isDeveloperToolsUnlockedForSession,
    isDeveloperToolsUnlockedForSession,
  );
}
