import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type TabBarEdgeButtonConfig = {
  onPress: () => void;
  icon: (props: { color: string; size: number }) => React.ReactNode;
  label?: string;
  accessibilityLabel?: string;
};

export type EdgeButtons = {
  left?: TabBarEdgeButtonConfig | null;
  right?: TabBarEdgeButtonConfig | null;
};

type TabBarContextValue = {
  // Bar plus its bottom gap; consumers add their safe-area inset separately.
  height: number;
  setHeight: (height: number) => void;
  edgeButtons: EdgeButtons | null;
  setEdgeButtons: (config: EdgeButtons | null) => void;
  hidden: boolean;
  setHidden: (hidden: boolean) => void;
};

const TabBarContext = createContext<TabBarContextValue | null>(null);

export function TabBarProvider({ children }: { children: React.ReactNode }) {
  const [height, setHeightState] = useState(0);
  const [edgeButtons, setEdgeButtonsState] = useState<EdgeButtons | null>(null);
  const [hidden, setHiddenState] = useState(false);

  const setHeight = useCallback((next: number) => {
    const normalized = Math.max(0, Math.round(next));
    setHeightState((prev) => (prev === normalized ? prev : normalized));
  }, []);

  const setEdgeButtons = useCallback((config: EdgeButtons | null) => {
    setEdgeButtonsState(config);
  }, []);

  const setHidden = useCallback((next: boolean) => {
    setHiddenState((prev) => (prev === next ? prev : next));
  }, []);

  const value = useMemo(
    () => ({ height, setHeight, edgeButtons, setEdgeButtons, hidden, setHidden }),
    [edgeButtons, height, hidden, setEdgeButtons, setHeight, setHidden],
  );

  return (
    <TabBarContext.Provider value={value}>{children}</TabBarContext.Provider>
  );
}

export function useTabBarHeight() {
  return useContext(TabBarContext)?.height ?? 0;
}

export function useSetTabBarHeight() {
  return useContext(TabBarContext)?.setHeight ?? (() => {});
}

export function useTabBarEdgeButton() {
  return useContext(TabBarContext)?.edgeButtons ?? null;
}

export function useSetTabBarEdgeButton() {
  return useContext(TabBarContext)?.setEdgeButtons ?? (() => {});
}

/** Returns true when the main tab bar has been hidden by a screen. */
export function useTabBarHidden() {
  return useContext(TabBarContext)?.hidden ?? false;
}

/**
 * Returns a setter to imperatively hide/show the tab bar.
 * Call setHidden(true) on mount and setHidden(false) (or use the cleanup)
 * on unmount — or just use the `useHideTabBar` convenience hook below.
 */
export function useSetTabBarHidden() {
  return useContext(TabBarContext)?.setHidden ?? (() => {});
}

/**
 * Convenience hook: hides the tab bar for the lifetime of the
 * calling component. Pass `active` to conditionally hide (default true).
 *
 * Usage:
 *   useHideTabBar();           // always hide while mounted
 *   useHideTabBar(screen !== "list");  // hide only on edit/delete
 */
export function useHideTabBar(active = true) {
  const setHidden = useSetTabBarHidden();
  React.useLayoutEffect(() => {
    if (active) {
      setHidden(true);
      return () => setHidden(false);
    }
  }, [active, setHidden]);
}
