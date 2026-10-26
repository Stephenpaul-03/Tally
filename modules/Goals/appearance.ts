import { categoryTone } from "@/theme/sage";
import { mixHex } from "@/theme/expressivePalette";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
export function goalTone(color: string | undefined, theme: ExtendedMD3Theme) {
  const accent = color || theme.colors.primary;
  const [tonal, foreground] = categoryTone("", theme.dark, accent);
  return {
    background: theme.expressive
      ? tonal
      : mixHex(theme.colors.surface, accent, 0.08),
    foreground: theme.expressive ? foreground : theme.colors.onSurface,
    accent,
    border: mixHex(theme.colors.outlineVariant, accent, 0.25),
    iconBackground: tonal,
    iconForeground: foreground,
  };
}
