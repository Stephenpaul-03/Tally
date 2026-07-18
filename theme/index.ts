import { buildPaperTheme, type ThemeMode } from "@/theme/buildPaperTheme";
import { type ThemeId } from "@/theme/presets";
import {
  DarkTheme,
  DefaultTheme,
  type Theme as NavigationTheme,
} from "@react-navigation/native";

export function getPaperTheme({
  mode,
  themeId,
  trueBlack = false,
}: {
  mode: ThemeMode;
  themeId: ThemeId;
  trueBlack?: boolean;
}) {
  // Pass themeId directly — no more primarySeedHex/secondarySeedHex
  return buildPaperTheme({ mode, themeId, trueBlack });
}

export function getNavigationTheme(
  paperTheme: ReturnType<typeof getPaperTheme>,
): NavigationTheme {
  const { colors } = paperTheme;
  const base = paperTheme.dark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.elevation.level2,
      text: colors.onSurface,
      border: colors.outlineVariant,
      notification: colors.error,
    },
  };
}
