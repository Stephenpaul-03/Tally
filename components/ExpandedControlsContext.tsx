import { createContext, useContext } from "react";
import type { ComponentProps, Dispatch, SetStateAction } from "react";
import type { MaterialCommunityIcons } from "@expo/vector-icons";

export type ExpandedControl = {
  label: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
  accessibilityLabel?: string;
  badgeIcon?: ComponentProps<typeof MaterialCommunityIcons>["name"];
  onPress: () => void;
};

// The expanded screen supplies actions; the shell owns their shared dock.
export const ExpandedControlsContext = createContext<Dispatch<SetStateAction<ExpandedControl[]>> | null>(null);
export const useExpandedControls = () => useContext(ExpandedControlsContext);

export type InsightsHeadingControl = { label: string; onPress: () => void };
export const InsightsHeadingContext = createContext<Dispatch<SetStateAction<InsightsHeadingControl | null>> | null>(null);
export const useInsightsHeading = () => useContext(InsightsHeadingContext);
