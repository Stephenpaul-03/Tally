import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";

import { THEME_PRESETS, type ThemeId } from "@/theme/presets";

type AppThemeContextValue = {
  themeId: ThemeId;
  isHydrated: boolean;
  setThemeId: (id: ThemeId) => void;
};

const STORAGE_KEY = "appThemeId";

const DEFAULT_THEME: ThemeId = "gold";

function isThemeId(value: string): value is ThemeId {
  return value in THEME_PRESETS;
}

const AppThemeContext = React.createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = React.useState<ThemeId>(DEFAULT_THEME);
  const [isHydrated, setIsHydrated] = React.useState(false);

  // Hydrate from storage on mount
  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!isMounted) return;
        if (stored && isThemeId(stored)) {
          setThemeIdState(stored);
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

  const setThemeId = React.useCallback((id: ThemeId) => {
    setThemeIdState(id);
  }, []);

  const value = React.useMemo(
    () => ({ themeId, isHydrated, setThemeId }),
    [themeId, isHydrated, setThemeId],
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
