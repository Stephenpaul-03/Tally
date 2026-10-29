import React from "react";
import type { SharedValue } from "react-native-reanimated";
import { useManagementEntranceProgress } from "./ManagementEntranceItem";

export const SettingsCardEntranceContext = React.createContext<{
  progress: SharedValue<number>;
  indexFor: (key: string) => number;
} | null>(null);

/** One native timeline per route, shared by card shells and their rows. */
export function SettingsCardEntranceProvider({ children }: { children: React.ReactNode }) {
  const progress = useManagementEntranceProgress();
  const indices = React.useRef(new Map<string, number>());
  const indexFor = React.useCallback((key: string) => {
    const existing = indices.current.get(key);
    if (existing !== undefined) return existing;
    const index = indices.current.size;
    indices.current.set(key, index);
    return index;
  }, []);
  const value = React.useMemo(() => ({ progress, indexFor }), [progress, indexFor]);
  return <SettingsCardEntranceContext.Provider value={value}>{children}</SettingsCardEntranceContext.Provider>;
}
