import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";

type TransactionUiPrefsContextValue = {
  /** When true, the Transactions date picker uses the inline Calendar mode. */
  datePickerCalendarMode: boolean;
  /** True once AsyncStorage preferences have been loaded. */
  isHydrated: boolean;
  setDatePickerCalendarMode: (next: boolean) => void;
  toggleDatePickerCalendarMode: () => void;
};

const STORAGE_KEYS = {
  datePickerCalendarMode: "transactionsDatePickerCalendarMode",
} as const;

const TransactionUiPrefsContext =
  React.createContext<TransactionUiPrefsContextValue | null>(null);

function parseStoredBoolean(value: string | null): boolean | null {
  if (value == null) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  return null;
}

export function TransactionUiPrefsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [datePickerCalendarMode, setDatePickerCalendarModeState] =
    React.useState(false);
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const storedDate = await AsyncStorage.getItem(
          STORAGE_KEYS.datePickerCalendarMode,
        );
        const parsedDate = parseStoredBoolean(storedDate);
        if (!isMounted) return;
        if (parsedDate != null) setDatePickerCalendarModeState(parsedDate);
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
      void AsyncStorage.setItem(
        STORAGE_KEYS.datePickerCalendarMode,
        datePickerCalendarMode ? "true" : "false",
      );
    }, 150);
    return () => clearTimeout(id);
  }, [datePickerCalendarMode, isHydrated]);

  const setDatePickerCalendarMode = React.useCallback((next: boolean) => {
    setDatePickerCalendarModeState(next);
  }, []);

  const toggleDatePickerCalendarMode = React.useCallback(() => {
    setDatePickerCalendarModeState((prev) => !prev);
  }, []);

  const value = React.useMemo(
    () => ({
      datePickerCalendarMode,
      isHydrated,
      setDatePickerCalendarMode,
      toggleDatePickerCalendarMode,
    }),
    [
      datePickerCalendarMode,
      isHydrated,
      setDatePickerCalendarMode,
      toggleDatePickerCalendarMode,
    ],
  );

  return (
    <TransactionUiPrefsContext.Provider value={value}>
      {children}
    </TransactionUiPrefsContext.Provider>
  );
}

export function useTransactionUiPrefs() {
  const context = React.useContext(TransactionUiPrefsContext);
  if (!context) {
    throw new Error(
      "useTransactionUiPrefs must be used within TransactionUiPrefsProvider",
    );
  }
  return context;
}
