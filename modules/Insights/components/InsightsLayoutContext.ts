import { createContext } from "react";

/** Geometry only; palette and typography continue to use the app theme. */
export const InsightsLayoutContext = createContext<boolean | null>(null);
