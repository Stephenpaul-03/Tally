import { createContext, useContext } from "react";
import type { SharedValue } from "react-native-reanimated";

// The same UI-thread progress that moves the shell's expanding card.
export const InsightsExpansionContext = createContext<SharedValue<number> | null>(null);
export const useInsightsExpansion = () => useContext(InsightsExpansionContext);
