import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { validGoal, type Goal } from "./model";
export const GOALS_KEY = "tally.goals.v1";
let snapshot: Goal[] = [];
let loaded: Promise<void> | undefined;
let writing = Promise.resolve();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
export function loadGoals() {
  return (loaded ??= AsyncStorage.getItem(GOALS_KEY)
    .then((raw) => {
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed) || !parsed.every(validGoal))
          throw Error("Saved goals could not be read");
        snapshot = parsed;
      }
      emit();
    })
    .catch((error) => {
      loaded = undefined;
      throw error;
    }));
}
export async function updateGoals(change: (goals: Goal[]) => Goal[]) {
  const task = writing
    .catch(() => {})
    .then(async () => {
      await loadGoals();
      const next = change(snapshot);
      if (!next.every(validGoal))
        throw Error("Check the goal amount and details");
      await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(next));
      snapshot = next;
      emit();
    });
  writing = task;
  return task;
}
export async function refreshGoals() {
  loaded = undefined;
  await loadGoals();
}
export function useGoals(workspaceId: string) {
  const all = React.useSyncExternalStore(
    React.useCallback((listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }, []),
    () => snapshot,
  );
  const [error, setError] = React.useState("");
  React.useEffect(() => {
    void loadGoals().catch((e) => setError(e.message));
  }, []);
  return {
    goals: React.useMemo(
      () => all.filter((g) => g.workspaceId === workspaceId),
      [all, workspaceId],
    ),
    error,
  };
}
