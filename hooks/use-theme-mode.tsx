import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";

import { useColorScheme } from "@/hooks/use-color-scheme";

export type ThemeMode = "light" | "dark";
export type ThemePreference = ThemeMode | "system";

type ThemeModeContextValue = {
  /** Resolved theme mode (system or overridden). */
  mode: ThemeMode;
  /** True once AsyncStorage preferences have been loaded. */
  isHydrated: boolean;
  /** True when using the system theme (no user override). */
  isFollowingSystem: boolean;
  /** Override system theme with an explicit mode. */
  setMode: (mode: ThemeMode) => void;
  /** Toggle between light/dark and override system theme. */
  toggle: () => void;
  /** Clear override and follow the system theme again. */
  resetToSystem: () => void;
};

export const THEME_MODE_STORAGE_KEY = "themeModePreference";

const ThemeModeContext = React.createContext<ThemeModeContextValue | null>(null);

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const systemMode: ThemeMode = systemScheme === "dark" ? "dark" : "light";

  const [overrideMode, setOverrideMode] = React.useState<ThemeMode | null>(null);
  const [isHydrated, setIsHydrated] = React.useState(false);
  const mode = overrideMode ?? systemMode;

  React.useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_MODE_STORAGE_KEY);
        if (!isMounted) return;
        if (isThemePreference(stored)) {
          setOverrideMode(stored === "system" ? null : stored);
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
    const nextPreference: ThemePreference = overrideMode ?? "system";
    const id = setTimeout(() => {
      void AsyncStorage.setItem(THEME_MODE_STORAGE_KEY, nextPreference);
    }, 150);
    return () => clearTimeout(id);
  }, [isHydrated, overrideMode]);

  const setMode = React.useCallback((nextMode: ThemeMode) => {
    setOverrideMode(nextMode);
  }, []);

  const toggle = React.useCallback(() => {
    setOverrideMode((currentOverride) => {
      const currentMode = currentOverride ?? systemMode;
      return currentMode === "dark" ? "light" : "dark";
    });
  }, [systemMode]);

  const resetToSystem = React.useCallback(() => {
    setOverrideMode(null);
  }, []);

  const value = React.useMemo(
    () => ({
      mode,
      isHydrated,
      isFollowingSystem: overrideMode == null,
      setMode,
      toggle,
      resetToSystem,
    }),
    [isHydrated, mode, overrideMode, resetToSystem, setMode, toggle],
  );

  return (
    <ThemeModeContext.Provider value={value}>
      {children}
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const context = React.useContext(ThemeModeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within ThemeModeProvider");
  }
  return context;
}
