import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

export type ShellTab = "calendar" | "transactions" | "insights";

function tabToProgress(tab: ShellTab) {
  if (tab === "calendar") return 0;
  if (tab === "insights") return 2;
  return 1;
}

type ShellApi = {
  activeTab: ShellTab;
  activeTabProgress: number;
  requestTab: (tab: ShellTab) => void;
  requestTabProgress: (progress: number) => void;
  registerDriver: (fn: (tab: ShellTab) => void) => void;
  registerProgressDriver: (fn: (progress: number) => void) => void;
  reportTab: (tab: ShellTab) => void;
  reportTabProgress: (progress: number) => void;
};

const AppShellContext = createContext<ShellApi | null>(null);

export function AppShellProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<ShellTab>("transactions");
  const [activeTabProgress, setActiveTabProgress] = useState(1);
  const driverRef = useRef<((tab: ShellTab) => void) | null>(null);
  const progressDriverRef = useRef<((progress: number) => void) | null>(null);

  const reportTab = useCallback((tab: ShellTab) => {
    setActiveTab(tab);
    setActiveTabProgress(tabToProgress(tab));
  }, []);

  const reportTabProgress = useCallback((progress: number) => {
    setActiveTabProgress(Math.min(2, Math.max(0, progress)));
  }, []);

  const requestTab = useCallback((tab: ShellTab) => {
    setActiveTab(tab);
    setActiveTabProgress(tabToProgress(tab));
    driverRef.current?.(tab);
  }, []);

  const requestTabProgress = useCallback((progress: number) => {
    const clampedProgress = Math.min(2, Math.max(0, progress));
    setActiveTabProgress(clampedProgress);
    progressDriverRef.current?.(clampedProgress);
  }, []);

  const registerDriver = useCallback((fn: (tab: ShellTab) => void) => {
    driverRef.current = fn;
  }, []);

  const registerProgressDriver = useCallback((fn: (progress: number) => void) => {
    progressDriverRef.current = fn;
  }, []);

  const value = useMemo(
    () => ({
      activeTab,
      activeTabProgress,
      requestTab,
      requestTabProgress,
      registerDriver,
      registerProgressDriver,
      reportTab,
      reportTabProgress,
    }),
    [
      activeTab,
      activeTabProgress,
      registerDriver,
      registerProgressDriver,
      reportTab,
      reportTabProgress,
      requestTab,
      requestTabProgress,
    ],
  );

  return (
    <AppShellContext.Provider value={value}>
      {children}
    </AppShellContext.Provider>
  );
}

export function useAppShell() {
  const context = useContext(AppShellContext);

  if (context) {
    return context;
  }

  return {
    activeTab: "transactions" as ShellTab,
    activeTabProgress: 1,
    requestTab: () => {},
    requestTabProgress: () => {},
    registerDriver: () => {},
    registerProgressDriver: () => {},
    reportTab: () => {},
    reportTabProgress: () => {},
  };
}
