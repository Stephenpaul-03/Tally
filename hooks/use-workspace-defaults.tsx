import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";

export type WorkspaceDefaults = {
  defaultAccount: string | null;
  defaultIncomeCategory: string | null;
  defaultExpenseCategory: string | null;
  paydayDay: number | null;
  budgetSafeBelowPercent: number;
  budgetNearlyEmptyFromPercent: number;
};

type WorkspaceDefaultsContextValue = {
  defaultsByWorkspace: Record<string, WorkspaceDefaults>;
  getWorkspaceDefaults: (workspaceId: string) => WorkspaceDefaults;
  setWorkspaceDefaults: (
    workspaceId: string,
    defaults: Partial<WorkspaceDefaults>,
  ) => void;
  resetWorkspaceDefaults: (workspaceId: string) => void;
  clearWorkspaceDefaults: () => void;
};

const STORAGE_KEY = "tallyWorkspaceDefaults";

const EMPTY_DEFAULTS: WorkspaceDefaults = {
  defaultAccount: null,
  defaultIncomeCategory: null,
  defaultExpenseCategory: null,
  paydayDay: null,
  budgetSafeBelowPercent: 70,
  budgetNearlyEmptyFromPercent: 70,
};

const WorkspaceDefaultsContext =
  React.createContext<WorkspaceDefaultsContextValue | null>(null);

function normalizeDefaults(value: unknown): WorkspaceDefaults {
  if (!value || typeof value !== "object") return EMPTY_DEFAULTS;
  const maybe = value as Partial<WorkspaceDefaults>;
  const safeBelow =
    typeof maybe.budgetSafeBelowPercent === "number" &&
    Number.isFinite(maybe.budgetSafeBelowPercent)
      ? Math.max(0, Math.min(100, Math.round(maybe.budgetSafeBelowPercent)))
      : EMPTY_DEFAULTS.budgetSafeBelowPercent;
  const nearlyFrom =
    typeof maybe.budgetNearlyEmptyFromPercent === "number" &&
    Number.isFinite(maybe.budgetNearlyEmptyFromPercent)
      ? Math.max(
          0,
          Math.min(100, Math.round(maybe.budgetNearlyEmptyFromPercent)),
        )
      : safeBelow;

  return {
    defaultAccount:
      typeof maybe.defaultAccount === "string" ? maybe.defaultAccount : null,
    defaultIncomeCategory:
      typeof maybe.defaultIncomeCategory === "string"
        ? maybe.defaultIncomeCategory
        : null,
    defaultExpenseCategory:
      typeof maybe.defaultExpenseCategory === "string"
        ? maybe.defaultExpenseCategory
        : null,
    paydayDay:
      typeof maybe.paydayDay === "number" &&
      Number.isInteger(maybe.paydayDay) &&
      maybe.paydayDay >= 1 &&
      maybe.paydayDay <= 31
        ? maybe.paydayDay
        : null,
    budgetSafeBelowPercent: safeBelow,
    budgetNearlyEmptyFromPercent: nearlyFrom,
  };
}

function normalizeDefaultsByWorkspace(
  value: unknown,
): Record<string, WorkspaceDefaults> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, defaults]) => [
      key,
      normalizeDefaults(defaults),
    ]),
  );
}

export function WorkspaceDefaultsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [defaultsByWorkspace, setDefaultsByWorkspace] = React.useState<
    Record<string, WorkspaceDefaults>
  >({});
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!isMounted || !stored) return;
        setDefaultsByWorkspace(normalizeDefaultsByWorkspace(JSON.parse(stored)));
      } catch {
        if (isMounted) setDefaultsByWorkspace({});
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
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultsByWorkspace));
    }, 150);
    return () => clearTimeout(id);
  }, [defaultsByWorkspace, isHydrated]);

  const getWorkspaceDefaults = React.useCallback(
    (workspaceId: string) => defaultsByWorkspace[workspaceId] ?? EMPTY_DEFAULTS,
    [defaultsByWorkspace],
  );

  const setWorkspaceDefaults = React.useCallback(
    (workspaceId: string, defaults: Partial<WorkspaceDefaults>) => {
      setDefaultsByWorkspace((prev) => ({
        ...prev,
        [workspaceId]: {
          ...(prev[workspaceId] ?? EMPTY_DEFAULTS),
          ...defaults,
        },
      }));
    },
    [],
  );

  const resetWorkspaceDefaults = React.useCallback((workspaceId: string) => {
    setDefaultsByWorkspace((prev) => {
      const next = { ...prev };
      delete next[workspaceId];
      return next;
    });
  }, []);

  const clearWorkspaceDefaults = React.useCallback(() => {
    setDefaultsByWorkspace({});
  }, []);

  const value = React.useMemo(
    () => ({
      defaultsByWorkspace,
      getWorkspaceDefaults,
      setWorkspaceDefaults,
      resetWorkspaceDefaults,
      clearWorkspaceDefaults,
    }),
    [
      clearWorkspaceDefaults,
      defaultsByWorkspace,
      getWorkspaceDefaults,
      resetWorkspaceDefaults,
      setWorkspaceDefaults,
    ],
  );

  return (
    <WorkspaceDefaultsContext.Provider value={value}>
      {children}
    </WorkspaceDefaultsContext.Provider>
  );
}

export function useWorkspaceDefaults() {
  const context = React.useContext(WorkspaceDefaultsContext);
  if (!context) {
    throw new Error(
      "useWorkspaceDefaults must be used within WorkspaceDefaultsProvider",
    );
  }
  return context;
}
