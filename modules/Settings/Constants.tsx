export type ModeOption = "light" | "dark" | "system";

export const MODE_OPTIONS: { id: ModeOption; label: string; icon: string }[] = [
  { id: "light", label: "Light", icon: "weather-sunny" },
  { id: "dark", label: "Dark", icon: "weather-night" },
  { id: "system", label: "System", icon: "cellphone-cog" },
];
