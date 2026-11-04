import type { MD3Theme } from "react-native-paper";
import { mixHex } from "./expressivePalette";

type SurfaceTheme = Pick<MD3Theme, "dark" | "colors"> & { expressive?: boolean };

/** Light Expressive buttons sit on the same bright surface as cards. */
export function tonalButtonSurface(theme: SurfaceTheme, fallback = theme.colors.surfaceVariant): string {
  return theme.expressive && !theme.dark ? theme.colors.surface : fallback;
}

/** A quiet inset layer inside a day card, rather than a cutout to the page. */
export function transactionRowSurface(theme: SurfaceTheme): string {
  if (!theme.expressive) return theme.colors.surface;
  return theme.dark ? theme.colors.surfaceVariant : mixHex(theme.colors.surface, theme.colors.background, 0.35);
}
