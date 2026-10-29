import { normalizeMainDesign } from "./main-design-preference";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";

type Choice = "sage" | "classic";
type Design = { layout: Choice; style: Choice };
const Context = React.createContext<{
  design: Design;
  insightsStyle: Choice | null;
  setInsightsStyle: (style: Choice) => void;
  setDesign: (value: Partial<Design>) => void;
} | null>(null);
const KEY = "tally.mainDesign.v1";
export function MainDesignProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [design, update] = React.useState<Design>({
    layout: "sage",
    style: "sage",
  });
  const [insightsStyle, updateInsightsStyle] = React.useState<Choice | null>(null);
  React.useEffect(() => {
    void AsyncStorage.getItem("tally.insightsStyle.v1").then((saved) => {
      if (saved === "classic" || saved === "sage") updateInsightsStyle(saved);
    }).catch(() => {});
  }, []);
  const setInsightsStyle = (style: Choice) => {
    updateInsightsStyle(style);
    void AsyncStorage.setItem("tally.insightsStyle.v1", style).catch(() => {});
  };
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    let mounted = true;
    void AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!mounted || !raw) return;
        try {
          const saved = JSON.parse(raw);
          update(normalizeMainDesign(saved));
        } catch {
          /* Retain defaults for malformed preferences. */
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);
  React.useEffect(() => {
    if (ready)
      void AsyncStorage.setItem(KEY, JSON.stringify(design)).catch(() => {});
  }, [design, ready]);
  return (
    <Context.Provider
      value={{
        design,
        insightsStyle,
        setInsightsStyle,
        setDesign: (value) =>
          update((previous) =>
            normalizeMainDesign({
              ...previous,
              ...value,
              ...(value.layout && value.layout !== previous.layout
                ? { style: value.layout }
                : {}),
            }),
          ),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useMainDesign() {
  const value = React.useContext(Context);
  if (!value) throw new Error("MainDesignProvider is required");
  return value;
}
