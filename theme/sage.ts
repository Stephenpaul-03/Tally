import { expressiveSurfaces, mixHex } from "./expressivePalette";
import type { ExtendedMD3Theme } from "./buildPaperTheme";
export const sageType = {
  fontFamily: "Figtree-400",
  fontVariant: ["tabular-nums"] as "tabular-nums"[],
};
export function sageTheme(
  base: ExtendedMD3Theme,
  trueBlack = false,
): ExtendedMD3Theme {
  const colors = {
    ...expressiveSurfaces(base.colors.primary, base.dark, trueBlack),
    primary: base.colors.primary,
    onPrimary: base.colors.onPrimary,
    primaryContainer: base.colors.primaryContainer,
    onPrimaryContainer: base.colors.onPrimaryContainer,
    secondaryContainer: base.colors.secondaryContainer,
    onSecondaryContainer: base.colors.onSecondaryContainer,
    error: base.dark ? "#FFB4AB" : "#BA1A1A",
    errorContainer: base.dark ? "#93000A" : "#FFDAD6",
    onErrorContainer: base.dark ? "#FFDAD6" : "#410002",
  };
  const fonts = Object.fromEntries(
    Object.entries(base.fonts).map(([key, value]) => [
      key,
      {
        ...value,
        fontFamily: `Figtree-${key.startsWith("display") || key.startsWith("headline") ? 800 : key.startsWith("title") ? 700 : key.startsWith("label") ? 600 : 400}`,
        fontWeight: "normal",
      },
    ]),
  );
  return {
    ...base,
    expressive: true,
    roundness: 6,
    semantic: {
      ...base.semantic,
      income: base.dark ? "#C4EFB5" : "#226A2B",
      expense: colors.error,
    },
    fonts: fonts as typeof base.fonts,
    colors: {
      ...base.colors,
      ...colors,
      onBackground: colors.onSurface,
      elevation: {
        ...base.colors.elevation,
        level1: colors.surface,
        level0: "transparent",
        level2: colors.surfaceVariant,
        level3: mixHex(colors.surfaceVariant, colors.primary, 0.035),
        level4: mixHex(colors.surfaceVariant, colors.primary, 0.06),
        level5: mixHex(colors.surfaceVariant, colors.primary, 0.08),
      },
    },
  };
}
const tones: Record<string, [string, string, string, string]> = {
  Fruits: ["#FFDAD6", "#410002", "#73332E", "#FFDAD6"],
  "Domestic Help": ["#DDE1FF", "#001159", "#2E3A6B", "#DDE1FF"],
  "Meat & Fish": ["#FFE08A", "#241A00", "#574500", "#FFE08A"],
  Healthcare: ["#B3EEF4", "#002022", "#004F55", "#B3EEF4"],
  Snacks: ["#FFD8EC", "#3B0028", "#5E1145", "#FFD8EC"],
  Transportation: ["#A7F2D6", "#002117", "#005140", "#A7F2D6"],
  "Other Expense": ["#EEDBFF", "#290055", "#4A2D6E", "#EEDBFF"],
  Family: ["#FFD9E2", "#3E001D", "#6A1B3D", "#FFD9E2"],
  Offerings: ["#C1EDC9", "#00210E", "#1F4D30", "#C1EDC9"],
};
export function categoryTone(
  name: string,
  dark: boolean,
  customColor?: string,
): [string, string] {
  if (!tones[name] && customColor && /^#[0-9a-f]{6}$/i.test(customColor)) {
    return dark
      ? [mixHex("#161D1A", customColor, 0.26), "#DDE4DF"]
      : [mixHex("#FFFFFF", customColor, 0.22), "#161D1A"];
  }
  const tone = tones[name] ?? ["#E2EAE4", "#161D1A", "#252B28", "#DDE4DF"];
  return dark ? [tone[2], tone[3]] : [tone[0], tone[1]];
}

export function isExpressiveTheme(theme: { expressive?: boolean }): boolean {
  return theme.expressive === true;
}
