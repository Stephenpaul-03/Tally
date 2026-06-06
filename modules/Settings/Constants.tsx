import type { TabBarMode } from "@/components/tabbar/TabBarModePreference";

export type ModeOption = "light" | "dark" | "system";

export const MODE_OPTIONS: { id: ModeOption; label: string; icon: string }[] = [
  { id: "light", label: "Light", icon: "weather-sunny" },
  { id: "dark", label: "Dark", icon: "weather-night" },
  { id: "system", label: "System", icon: "cellphone-cog" },
];

export const TAB_BAR_MODE_OPTIONS: {
  id: TabBarMode;
  label: string;
  icon: string;
}[] = [
  { id: "basic", label: "Basic", icon: "view-grid-outline" },
  { id: "floating", label: "Floating", icon: "dock-bottom" },
];
