import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";

type TransactionUiPrefsContextValue = {
  /** When true, the Transactions date picker uses the inline Calendar mode. */
  datePickerCalendarMode: boolean;
  /** True once AsyncStorage preferences have been loaded. */
  isHydrated: boolean;
  setDatePickerCalendarMode: (next: boolean) => void;
  toggleDatePickerCalendarMode: () => void;
  /** When true, the Transactions view shows Month mode instead of Day. */
  monthMode: boolean;
  setMonthMode: (next: boolean) => void;
  toggleMonthMode: () => void;
};

const STORAGE_KEYS = {
  datePickerCalendarMode: "transactionsDatePickerCalendarMode",
  monthMode: "transactionsMonthMode",
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
  const [monthMode, setMonthModeState] = React.useState(false);
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [storedDate, storedMonth] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.datePickerCalendarMode),
          AsyncStorage.getItem(STORAGE_KEYS.monthMode),
        ]);
        const parsedDate = parseStoredBoolean(storedDate);
        const parsedMonth = parseStoredBoolean(storedMonth);
        if (!isMounted) return;
        if (parsedDate != null) setDatePickerCalendarModeState(parsedDate);
        if (parsedMonth != null) setMonthModeState(parsedMonth);
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

  React.useEffect(() => {
    if (!isHydrated) return;
    const id = setTimeout(() => {
      void AsyncStorage.setItem(
        STORAGE_KEYS.monthMode,
        monthMode ? "true" : "false",
      );
    }, 150);
    return () => clearTimeout(id);
  }, [monthMode, isHydrated]);

  const setDatePickerCalendarMode = React.useCallback((next: boolean) => {
    setDatePickerCalendarModeState(next);
  }, []);

  const toggleDatePickerCalendarMode = React.useCallback(() => {
    setDatePickerCalendarModeState((prev) => !prev);
  }, []);

  const setMonthMode = React.useCallback((next: boolean) => {
    setMonthModeState(next);
  }, []);

  const toggleMonthMode = React.useCallback(() => {
    setMonthModeState((prev) => !prev);
  }, []);

  const value = React.useMemo(
    () => ({
      datePickerCalendarMode,
      isHydrated,
      setDatePickerCalendarMode,
      toggleDatePickerCalendarMode,
      monthMode,
      setMonthMode,
      toggleMonthMode,
    }),
    [
      datePickerCalendarMode,
      isHydrated,
      setDatePickerCalendarMode,
      toggleDatePickerCalendarMode,
      monthMode,
      setMonthMode,
      toggleMonthMode,
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
