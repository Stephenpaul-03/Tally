import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";

type OnboardingStateContextValue = {
  hasCompletedOnboarding: boolean;
  isHydrated: boolean;
  markOnboardingCompleted: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
};

const ONBOARDING_COMPLETED_STORAGE_KEY = "tallyOnboardingCompleted";

const OnboardingStateContext =
  React.createContext<OnboardingStateContextValue | null>(null);

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] =
    React.useState(false);
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const stored = await AsyncStorage.getItem(
          ONBOARDING_COMPLETED_STORAGE_KEY,
        );
        if (!isMounted) return;
        setHasCompletedOnboarding(stored === "true");
      } finally {
        if (isMounted) setIsHydrated(true);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const markOnboardingCompleted = React.useCallback(async () => {
    setHasCompletedOnboarding(true);
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_STORAGE_KEY, "true");
  }, []);

  const resetOnboarding = React.useCallback(async () => {
    setHasCompletedOnboarding(false);
    await AsyncStorage.removeItem(ONBOARDING_COMPLETED_STORAGE_KEY);
  }, []);

  const value = React.useMemo(
    () => ({
      hasCompletedOnboarding,
      isHydrated,
      markOnboardingCompleted,
      resetOnboarding,
    }),
    [
      hasCompletedOnboarding,
      isHydrated,
      markOnboardingCompleted,
      resetOnboarding,
    ],
  );

  return (
    <OnboardingStateContext.Provider value={value}>
      {children}
    </OnboardingStateContext.Provider>
  );
}

export function useOnboardingState() {
  const context = React.useContext(OnboardingStateContext);
  if (!context) {
    throw new Error(
      "useOnboardingState must be used within OnboardingProvider",
    );
  }
  return context;
}
