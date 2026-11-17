// context/TabBarModePreference.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";

export type TabBarMode = "basic";
const STORAGE_KEY = "appTabBarMode";
const ENABLED_STORAGE_KEY = "appTabBarEnabled";
const HIDE_LABELS_STORAGE_KEY = "appHideControlLabels";
const TABLET_NAVIGATION_SIDE_KEY = "tabletNavigationSide";
const DEFAULT_MODE: TabBarMode = "basic";
const DEFAULT_ENABLED = true;

function isTabBarMode(value: string): value is TabBarMode {
  return value === "basic";
}

type TabBarModePreferenceContextValue = {
  tabBarMode: TabBarMode;
  tabBarEnabled: boolean;
  hideLabels: boolean;
  tabletNavigationSide: "left" | "right";
  setTabletNavigationSide: (side: "left" | "right") => void;
  isHydrated: boolean;
  setTabBarMode: (mode: TabBarMode) => void;
  setTabBarEnabled: (enabled: boolean) => void;
  setHideLabels: (hidden: boolean) => void;
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
  const [tabBarEnabled, setTabBarEnabledState] =
    React.useState(DEFAULT_ENABLED);
  const [hideLabels, setHideLabels] = React.useState(false);
  const [tabletNavigationSide, setTabletNavigationSide] = React.useState<"left" | "right">("left");
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [storedMode, storedEnabled, storedHideLabels, storedTabletSide] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(ENABLED_STORAGE_KEY),
          AsyncStorage.getItem(HIDE_LABELS_STORAGE_KEY),
          AsyncStorage.getItem(TABLET_NAVIGATION_SIDE_KEY),
        ]);
        if (!isMounted) return;
        if (storedMode && isTabBarMode(storedMode))
          setTabBarModeState(storedMode);
        else setTabBarModeState(DEFAULT_MODE);
        setHideLabels(storedHideLabels === "true");
        setTabletNavigationSide(storedTabletSide === "right" ? "right" : "left");
        setTabBarEnabledState(
          storedEnabled == null ? DEFAULT_ENABLED : storedEnabled === "true",
        );
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
      void Promise.all([
        AsyncStorage.setItem(STORAGE_KEY, tabBarMode),
        AsyncStorage.setItem(ENABLED_STORAGE_KEY, String(tabBarEnabled)),
        AsyncStorage.setItem(HIDE_LABELS_STORAGE_KEY, String(hideLabels)),
        AsyncStorage.setItem(TABLET_NAVIGATION_SIDE_KEY, tabletNavigationSide),
      ]);
    }, 250);
    return () => clearTimeout(id);
  }, [tabBarEnabled, tabBarMode, hideLabels, tabletNavigationSide, isHydrated]);

  const setTabBarMode = React.useCallback((mode: TabBarMode) => {
    setTabBarModeState(mode);
  }, []);

  const setTabBarEnabled = React.useCallback((enabled: boolean) => {
    setTabBarEnabledState(enabled);
  }, []);

  const value = React.useMemo(
    () => ({
      tabBarMode,
      tabBarEnabled,
      hideLabels,
      tabletNavigationSide,
      setTabletNavigationSide,
      setHideLabels,
      isHydrated,
      setTabBarMode,
      setTabBarEnabled,
    }),
    [
      tabBarMode,
      tabBarEnabled,
      hideLabels,
      tabletNavigationSide,
      setHideLabels,
      isHydrated,
      setTabBarMode,
      setTabBarEnabled,
    ],
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
