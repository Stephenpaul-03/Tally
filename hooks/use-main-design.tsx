import { normalizeMainDesign } from "./main-design-preference";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";

type Choice = "sage" | "classic";
type Design = { layout: Choice; style: Choice };
const Context = React.createContext<{
  design: Design;
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
