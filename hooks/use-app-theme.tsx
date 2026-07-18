import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";

import { THEME_PRESETS, type ThemeId } from "@/theme/presets";

type AppThemeContextValue = {
  themeId: ThemeId;
  isHydrated: boolean;
  setThemeId: (id: ThemeId) => void;
  trueBlack: boolean;
  setTrueBlack: (enabled: boolean) => void;
};

const STORAGE_KEY = "appThemeId";
const TRUE_BLACK_STORAGE_KEY = "appThemeTrueBlack";

const DEFAULT_THEME: ThemeId = "gold";

function isThemeId(value: string): value is ThemeId {
  return value in THEME_PRESETS;
}

const AppThemeContext = React.createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = React.useState<ThemeId>(DEFAULT_THEME);
  const [trueBlack, setTrueBlackState] = React.useState(false);
  const [isHydrated, setIsHydrated] = React.useState(false);

  // Hydrate from storage on mount
  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const storedTrueBlack = await AsyncStorage.getItem(
          TRUE_BLACK_STORAGE_KEY,
        );
        if (!isMounted) return;
        if (stored && isThemeId(stored)) {
          setThemeIdState(stored);
        }
        if (storedTrueBlack != null) {
          setTrueBlackState(storedTrueBlack === "true");
        }
      } finally {
        if (isMounted) setIsHydrated(true);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Persist on change
  React.useEffect(() => {
    if (!isHydrated) return;
    const id = setTimeout(() => {
      void AsyncStorage.setItem(STORAGE_KEY, themeId);
    }, 250);
    return () => clearTimeout(id);
  }, [themeId, isHydrated]);

  React.useEffect(() => {
    if (!isHydrated) return;
    const id = setTimeout(() => {
      void AsyncStorage.setItem(
        TRUE_BLACK_STORAGE_KEY,
        trueBlack ? "true" : "false",
      );
    }, 250);
    return () => clearTimeout(id);
  }, [trueBlack, isHydrated]);

  const setThemeId = React.useCallback((id: ThemeId) => {
    setThemeIdState(id);
  }, []);

  const setTrueBlack = React.useCallback((enabled: boolean) => {
    setTrueBlackState(enabled);
  }, []);

  const value = React.useMemo(
    () => ({ themeId, isHydrated, setThemeId, trueBlack, setTrueBlack }),
    [themeId, isHydrated, setThemeId, trueBlack, setTrueBlack],
  );

  return (
    <AppThemeContext.Provider value={value}>
      {children}
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = React.useContext(AppThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }
  return context;
}
