import { useAppTheme } from "@/hooks/use-app-theme";
import type { ThemeId, ThemeMode } from "@/theme/buildPaperTheme";
import { useColorScheme } from "react-native";

/**
 * Asset keys that have a mono-dark / mono-light split.
 * Every other ThemeId maps 1:1 to a single asset.
 *
 * Mono resolves as:
 *   dark  mode → mono-white variant (light asset on dark surface)
 *   light mode → mono-black variant (dark asset on light surface)
 */
type MonoVariant = "monoWhite" | "monoBlack";
type AssetThemeKey = Exclude<ThemeId, "mono"> | MonoVariant;

function resolveMonoVariant(mode: ThemeMode | undefined | null): MonoVariant {
  return mode === "dark" ? "monoWhite" : "monoBlack";
}

function resolveKey(
  themeId: ThemeId | undefined | null,
  mode: ThemeMode | undefined | null,
): AssetThemeKey {
  if ((themeId ?? "gold") === "mono") return resolveMonoVariant(mode);
  return (themeId ?? "gold") as Exclude<ThemeId, "mono">;
}

/**
 * A map of every themed asset in the app.
 *
 * Structure:
 *   THEMED_ASSETS[assetKey][AssetThemeKey] = require(...)
 *
 * Adding a new asset:
 *   1. Drop the files e.g. logo-sakura.png … logo-monoWhite.png, logo-monoBlack.png
 *   2. Add a new key below with all 6 variants.
 *
 * Adding a new theme:
 *   1. Add the ThemeId to buildPaperTheme.ts.
 *   2. Add it to AssetThemeKey above and to every asset entry here.
 */
const THEMED_ASSETS = {
  // ── App logo ─────────────────────────────────────────────────────────────
  logo: {
    sakura: require("@/assets/images/icon-foreground-Sakura.png"),
    emerald: require("@/assets/images/icon-foreground-Emerald.png"),
    inkBlue: require("@/assets/images/icon-foreground-InkBlue.png"),
    gold: require("@/assets/images/icon-foreground-Gold.png"),
    monoWhite: require("@/assets/images/icon-foreground-Mono-White.png"),
    monoBlack: require("@/assets/images/icon-foreground-Mono-Black.png"),
  },
  // Add more assets here following the same pattern…
} satisfies Record<string, Record<AssetThemeKey, number>>;

export type ThemedAssetKey = keyof typeof THEMED_ASSETS;

/**
 * Returns the correct image source for the given asset key
 * based on the currently active theme AND system color scheme.
 *
 * Mono automatically picks monoWhite (dark) or monoBlack (light).
 *
 * Usage:
 *   const logoSource = useThemedAsset("logo");
 *   <Image source={logoSource} />
 */
export function useThemedAsset(key: ThemedAssetKey): number {
  const { themeId } = useAppTheme();
  const colorScheme = useColorScheme(); // "dark" | "light" | null
  return THEMED_ASSETS[key][resolveKey(themeId, colorScheme)];
}

/**
 * Returns ALL asset sources for a given key — useful for preloading
 * or rendering a theme picker preview.
 *
 * Usage:
 *   const allLogos = useAllThemedAssets("logo");
 *   allLogos["monoWhite"] // => require(...)
 */
export function useAllThemedAssets(
  key: ThemedAssetKey,
): Record<AssetThemeKey, number> {
  return THEMED_ASSETS[key];
}

/**
 * Pure resolver — no hook, no context. Use this outside of components,
 * e.g. inside useQuickShareInsights to get the logo for the PDF.
 *
 * Usage:
 *   const source = resolveThemedAsset("logo", themeId, mode);
 */
export function resolveThemedAsset(
  key: ThemedAssetKey,
  themeId: ThemeId | undefined | null,
  mode: ThemeMode | undefined | null,
): number {
  return THEMED_ASSETS[key][resolveKey(themeId, mode)];
}
