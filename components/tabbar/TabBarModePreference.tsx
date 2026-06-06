// context/TabBarModePreference.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";

export type TabBarMode = "basic" | "floating";
const STORAGE_KEY = "appTabBarMode";
const DEFAULT_MODE: TabBarMode = "basic";

function isTabBarMode(value: string): value is TabBarMode {
  return value === "basic" || value === "floating";
}

type TabBarModePreferenceContextValue = {
  tabBarMode: TabBarMode;
  isHydrated: boolean;
  setTabBarMode: (mode: TabBarMode) => void;
};

const TabBarModePreferenceContext =
  React.createContext<TabBarModePreferenceContextValue | null>(null);

export function TabBarModePreferenceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [tabBarMode, setTabBarModeState] =
    React.useState<TabBarMode>(DEFAULT_MODE);
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!isMounted) return;
        if (stored && isTabBarMode(stored)) setTabBarModeState(stored);
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
      void AsyncStorage.setItem(STORAGE_KEY, tabBarMode);
    }, 250);
    return () => clearTimeout(id);
  }, [tabBarMode, isHydrated]);

  const setTabBarMode = React.useCallback((mode: TabBarMode) => {
    setTabBarModeState(mode);
  }, []);

  const value = React.useMemo(
    () => ({ tabBarMode, isHydrated, setTabBarMode }),
    [tabBarMode, isHydrated, setTabBarMode],
  );

  return (
    <TabBarModePreferenceContext.Provider value={value}>
      {children}
    </TabBarModePreferenceContext.Provider>
  );
}

export function useTabBarModePreference() {
  const context = React.useContext(TabBarModePreferenceContext);
  if (!context) {
    throw new Error(
      "useTabBarModePreference must be used within TabBarModePreferenceProvider",
    );
  }
  return context;
}
