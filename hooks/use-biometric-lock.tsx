import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import React from "react";
import { AppState, type AppStateStatus } from "react-native";

const STORAGE_KEY = "biometricLockEnabled";
const TIMEOUT_STORAGE_KEY = "biometricLockTimeoutMs";
export const BIOMETRIC_LOCK_TIMEOUT_OPTIONS = [
  { label: "Immediately", value: 0 },
  { label: "After 30 seconds", value: 30_000 },
  { label: "After 1 minute", value: 60_000 },
  { label: "After 5 minutes", value: 300_000 },
] as const;
const DEFAULT_BACKGROUND_LOCK_THRESHOLD_MS = 30_000;

type BiometricAvailability = {
  checked: boolean;
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  unavailableReason: "unchecked" | "no-hardware" | "not-enrolled" | "error" | null;
};

type SetBiometricLockEnabledResult = {
  enabled: boolean;
  availability: BiometricAvailability;
};

type BiometricLockContextValue = {
  enabled: boolean;
  isHydrated: boolean;
  isLocked: boolean;
  isAuthenticating: boolean;
  availability: BiometricAvailability;
  lastError: LocalAuthentication.LocalAuthenticationError | null;
  lockTimeoutMs: number;
  setBiometricLockEnabled: (
    next: boolean,
  ) => Promise<SetBiometricLockEnabledResult>;
  setLockTimeoutMs: (next: number) => void;
  refreshAvailability: () => Promise<BiometricAvailability>;
  unlock: () => Promise<boolean>;
};

const DEFAULT_AVAILABILITY: BiometricAvailability = {
  checked: false,
  hasHardware: false,
  isEnrolled: false,
  supportedTypes: [],
  unavailableReason: "unchecked",
};

const BiometricLockContext =
  React.createContext<BiometricLockContextValue | null>(null);

function parseStoredBoolean(value: string | null): boolean | null {
  if (value == null) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  return null;
}

function parseStoredTimeout(value: string | null): number {
  const parsed = Number(value);
  const option = BIOMETRIC_LOCK_TIMEOUT_OPTIONS.find(
    (item) => item.value === parsed,
  );
  return option?.value ?? DEFAULT_BACKGROUND_LOCK_THRESHOLD_MS;
}

async function checkBiometricAvailability(): Promise<BiometricAvailability> {
  try {
    const [hasHardware, isEnrolled, supportedTypes] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);

    return {
      checked: true,
      hasHardware,
      isEnrolled,
      supportedTypes,
      unavailableReason: !hasHardware
        ? "no-hardware"
        : !isEnrolled
          ? "not-enrolled"
          : null,
    };
  } catch {
    return {
      checked: true,
      hasHardware: false,
      isEnrolled: false,
      supportedTypes: [],
      unavailableReason: "error",
    };
  }
}

export function BiometricLockProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [enabled, setEnabledState] = React.useState(false);
  const [isHydrated, setIsHydrated] = React.useState(false);
  const [isLocked, setIsLocked] = React.useState(false);
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);
  const [lockTimeoutMs, setLockTimeoutMsState] = React.useState(
    DEFAULT_BACKGROUND_LOCK_THRESHOLD_MS,
  );
  const [availability, setAvailability] =
    React.useState<BiometricAvailability>(DEFAULT_AVAILABILITY);
  const [lastError, setLastError] =
    React.useState<LocalAuthentication.LocalAuthenticationError | null>(null);

  const enabledRef = React.useRef(enabled);
  const lockTimeoutMsRef = React.useRef(lockTimeoutMs);
  const isHydratedRef = React.useRef(isHydrated);
  const availabilityRef = React.useRef(availability);
  const isAuthenticatingRef = React.useRef(false);
  const handledColdStartRef = React.useRef(false);
  const appStateRef = React.useRef<AppStateStatus>(AppState.currentState);
  const backgroundedAtRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  React.useEffect(() => {
    lockTimeoutMsRef.current = lockTimeoutMs;
  }, [lockTimeoutMs]);

  React.useEffect(() => {
    isHydratedRef.current = isHydrated;
  }, [isHydrated]);

  React.useEffect(() => {
    availabilityRef.current = availability;
  }, [availability]);

  const refreshAvailability = React.useCallback(async () => {
    const nextAvailability = await checkBiometricAvailability();
    availabilityRef.current = nextAvailability;
    setAvailability(nextAvailability);
    return nextAvailability;
  }, []);

  const authenticate = React.useCallback(async () => {
    if (isAuthenticatingRef.current) return false;

    const currentAvailability = await refreshAvailability();

    if (
      !currentAvailability.hasHardware ||
      !currentAvailability.isEnrolled
    ) {
      setIsLocked(false);
      setLastError(
        currentAvailability.unavailableReason === "not-enrolled"
          ? "not_enrolled"
          : "not_available",
      );
      return false;
    }

    isAuthenticatingRef.current = true;
    setIsAuthenticating(true);
    setIsLocked(true);

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock Tally",
        promptSubtitle: "Biometric Lock",
        promptDescription: "Authenticate to continue",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
        fallbackLabel: "Use Passcode",
        requireConfirmation: true,
        biometricsSecurityLevel: "strong",
      });

      if (result.success) {
        setIsLocked(false);
        setLastError(null);
        return true;
      }

      setIsLocked(true);
      setLastError(result.error);
      return false;
    } catch {
      setIsLocked(true);
      setLastError("unknown");
      return false;
    } finally {
      isAuthenticatingRef.current = false;
      setIsAuthenticating(false);
    }
  }, [refreshAvailability]);

  React.useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const [
          storedEnabled,
          storedTimeout,
          nextAvailability,
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(TIMEOUT_STORAGE_KEY),
          checkBiometricAvailability(),
        ]);
        const parsedEnabled = parseStoredBoolean(storedEnabled);
        const parsedTimeout = parseStoredTimeout(storedTimeout);

        if (!isMounted) return;

        availabilityRef.current = nextAvailability;
        setAvailability(nextAvailability);
        lockTimeoutMsRef.current = parsedTimeout;
        setLockTimeoutMsState(parsedTimeout);
        if (parsedEnabled != null) {
          setEnabledState(parsedEnabled);
          setIsLocked(
            parsedEnabled &&
              nextAvailability.hasHardware &&
              nextAvailability.isEnrolled,
          );
        }
      } finally {
        if (isMounted) setIsHydrated(true);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (!isHydrated) return;
    const id = setTimeout(() => {
      void AsyncStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
    }, 150);
    return () => clearTimeout(id);
  }, [enabled, isHydrated]);

  React.useEffect(() => {
    if (!isHydrated) return;
    const id = setTimeout(() => {
      void AsyncStorage.setItem(TIMEOUT_STORAGE_KEY, String(lockTimeoutMs));
    }, 150);
    return () => clearTimeout(id);
  }, [isHydrated, lockTimeoutMs]);

  React.useEffect(() => {
    if (!isHydrated || handledColdStartRef.current) return;
    handledColdStartRef.current = true;

    if (!enabled) {
      setIsLocked(false);
      return;
    }

    if (
      availabilityRef.current.hasHardware &&
      availabilityRef.current.isEnrolled
    ) {
      void authenticate();
      return;
    }

    setIsLocked(false);
  }, [authenticate, enabled, isHydrated]);

  React.useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const previousState = appStateRef.current;

      if (
        previousState === "active" &&
        (nextState === "inactive" || nextState === "background")
      ) {
        backgroundedAtRef.current = Date.now();
      }

      if (
        nextState === "active" &&
        (previousState === "inactive" || previousState === "background")
      ) {
        const backgroundedAt = backgroundedAtRef.current;
        const wasBackgroundedLongEnough =
          backgroundedAt != null &&
          Date.now() - backgroundedAt >= lockTimeoutMsRef.current;

        if (
          wasBackgroundedLongEnough &&
          isHydratedRef.current &&
          enabledRef.current
        ) {
          void authenticate();
        }
      }

      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [authenticate]);

  const setBiometricLockEnabled = React.useCallback(
    async (next: boolean): Promise<SetBiometricLockEnabledResult> => {
      if (!next) {
        setEnabledState(false);
        setIsLocked(false);
        setLastError(null);
        return { enabled: false, availability: availabilityRef.current };
      }

      const nextAvailability = await refreshAvailability();

      if (!nextAvailability.hasHardware || !nextAvailability.isEnrolled) {
        setEnabledState(false);
        setIsLocked(false);
        setLastError(
          nextAvailability.unavailableReason === "not-enrolled"
            ? "not_enrolled"
            : "not_available",
        );
        return { enabled: false, availability: nextAvailability };
      }

      setEnabledState(true);
      setLastError(null);
      return { enabled: true, availability: nextAvailability };
    },
    [refreshAvailability],
  );

  const setLockTimeoutMs = React.useCallback((next: number) => {
    const option = BIOMETRIC_LOCK_TIMEOUT_OPTIONS.find(
      (item) => item.value === next,
    );
    const value = option?.value ?? DEFAULT_BACKGROUND_LOCK_THRESHOLD_MS;
    lockTimeoutMsRef.current = value;
    setLockTimeoutMsState(value);
  }, []);

  const value = React.useMemo(
    () => ({
      enabled,
      isHydrated,
      isLocked,
      isAuthenticating,
      availability,
      lastError,
      lockTimeoutMs,
      setBiometricLockEnabled,
      setLockTimeoutMs,
      refreshAvailability,
      unlock: authenticate,
    }),
    [
      enabled,
      isHydrated,
      isLocked,
      isAuthenticating,
      availability,
      lastError,
      lockTimeoutMs,
      setBiometricLockEnabled,
      setLockTimeoutMs,
      refreshAvailability,
      authenticate,
    ],
  );

  return (
    <BiometricLockContext.Provider value={value}>
      {children}
    </BiometricLockContext.Provider>
  );
}

export function useBiomettricLock() {
  const context = React.useContext(BiometricLockContext);
  if (!context) {
    throw new Error(
      "useBiomettricLock must be used within BiometricLockProvider",
    );
  }
  return context;
}

export const useBiometricLock = useBiomettricLock;
