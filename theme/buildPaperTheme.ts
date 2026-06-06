/**
 * buildPaperTheme.ts
 *
 * Neutral-base + accent-only theming system for react-native-paper (MD3).
 *
 * Philosophy:
 *   - ALL surfaces, backgrounds, and text stay neutral across every theme.
 *   - ONLY accent slots (primary, secondary, tertiary + containers) change per theme.
 *   - Adding a new theme = add one entry to ACCENTS. Nothing else changes.
 *
 * Aesthetic target: Linear / Raycast / Arc — premium minimal, NOT colorful fintech.
 */

import color from "color";
import type { MD3Theme } from "react-native-paper";
import { MD3DarkTheme, MD3LightTheme } from "react-native-paper";
import { paperFonts } from "./typography";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type ThemeMode = "light" | "dark";

export type ThemeId = "sakura" | "emerald" | "inkBlue" | "gold" | "mono";

/** Only accent slots are required per theme. */
export type AccentPalette = {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
};

/** Semantic finance colors — placeholders now, used by charts/badges later. */
export type SemanticColors = {
  income: string;
  expense: string;
  pending: string;
  success: string;
  failed: string;
};

export type ExtendedMD3Theme = MD3Theme & {
  semantic: SemanticColors;
};

// ─────────────────────────────────────────────
// Neutral base surfaces  (CONSTANT across themes)
// ─────────────────────────────────────────────

/**
 * These never change regardless of which accent is applied.
 * High contrast, elderly-friendly readability, zero visual noise.
 */
const BASE_LIGHT = {
  // Page background — cool blue-gray tint, clearly distinct from white cards
  background: "#ffffff",
  onBackground: "#0A0A0B",
  // Cards/surfaces — pure white so they lift off the background
  surface: "#ffffff",
  onSurface: "#0A0A0B",
  // Slightly cooler variant for inner surfaces (icon bg, input bg)
  surfaceVariant: "#ffffff",
  onSurfaceVariant: "#4A4A52",
  // Borders — cool-toned, not warm
  outline: "#9A9AA8",
  outlineVariant: "#DDDDE8",
  // Error
  error: "#C0392B",
  onError: "#FFFFFF",
  errorContainer: "#FDECEA",
  onErrorContainer: "#7B1D1D",
  // Inverse
  inverseSurface: "#16161A",
  inverseOnSurface: "#F1F3F5",
  shadow: "#000000",
  scrim: "#000000",
  // Elevation overlay — cool blue-gray tint so lifted surfaces feel airy, not muddy
  elevationOverlay: "#6E7191",
} as const;

const BASE_DARK = {
  background: "#09090B",
  onBackground: "#FAFAFA",
  surface: "#18181B",
  onSurface: "#FAFAFA",
  surfaceVariant: "#27272A",
  onSurfaceVariant: "#A1A1AA",
  outline: "#52525B",
  outlineVariant: "#3F3F46",
  error: "#F87171",
  onError: "#7F1D1D",
  errorContainer: "#991B1B",
  onErrorContainer: "#FEE2E2",
  inverseSurface: "#F4F4F5",
  inverseOnSurface: "#27272A",
  shadow: "#000000",
  scrim: "#000000",
  // Dark mode elevation: white overlay into dark surface — natural luminous lift
  elevationOverlay: "#FAFAFA",
} as const;

// ─────────────────────────────────────────────
// Accent palettes  (ONLY these change per theme)
// ─────────────────────────────────────────────

/**
 * Each entry provides light + dark accent slots.
 * primary   → buttons, FAB, active tabs, focus rings
 * secondary → chips, secondary actions
 * tertiary  → graphs, highlights, badges (optional)
 *
 * Adding a new theme: add ACCENTS.myTheme = { light: {...}, dark: {...} }
 */
const ACCENTS: Record<ThemeId, { light: AccentPalette; dark: AccentPalette }> =
  {
    // ── Sakura ────────────────────────────────────
    // Muted rose — only buttons/tabs blush, surfaces stay white.
    // Light mode: dusty rose accent. Dark mode: desaturated mauve.
    sakura: {
      light: {
        primary: "#9D5F6A", // muted rose, not hot pink
        onPrimary: "#FFFFFF",
        primaryContainer: "#F5E0E3", // barely-there blush container
        onPrimaryContainer: "#5C2832",
        secondary: "#7D5259",
        onSecondary: "#FFFFFF",
        secondaryContainer: "#EDD8DA",
        onSecondaryContainer: "#3D1F24",
        tertiary: "#8C6A6D",
        onTertiary: "#FFFFFF",
        tertiaryContainer: "#EFE0E1",
        onTertiaryContainer: "#4A2D2F",
      },
      dark: {
        primary: "#DEADB3", // dusty blush on dark surface
        onPrimary: "#5C2832",
        primaryContainer: "#7A404A",
        onPrimaryContainer: "#FFD9DF",
        secondary: "#D4A8AE",
        onSecondary: "#3D1F24",
        secondaryContainer: "#5A3840",
        onSecondaryContainer: "#EDD8DA",
        tertiary: "#C8A8AA",
        onTertiary: "#4A2D2F",
        tertiaryContainer: "#624444",
        onTertiaryContainer: "#EFE0E1",
      },
    },

    // ── Emerald ───────────────────────────────────
    // Ledger green — trustworthy, muted, accounting-heritage.
    // Think old Bloomberg terminal meets modern Linear.
    emerald: {
      light: {
        primary: "#2D6A4F", // deep forest, not neon
        onPrimary: "#FFFFFF",
        primaryContainer: "#D8EDDF", // sage wash, barely there
        onPrimaryContainer: "#1A3D2D",
        secondary: "#52796F",
        onSecondary: "#FFFFFF",
        secondaryContainer: "#D8E8E4",
        onSecondaryContainer: "#1E3530",
        tertiary: "#6B8F71",
        onTertiary: "#FFFFFF",
        tertiaryContainer: "#DCF0DF",
        onTertiaryContainer: "#234027",
      },
      dark: {
        primary: "#88C9A5", // muted sage on dark
        onPrimary: "#1A3D2D",
        primaryContainer: "#2D6A4F",
        onPrimaryContainer: "#D8EDDF",
        secondary: "#90B4AE",
        onSecondary: "#1E3530",
        secondaryContainer: "#395952",
        onSecondaryContainer: "#D8E8E4",
        tertiary: "#9EC4A4",
        onTertiary: "#234027",
        tertiaryContainer: "#3D5F41",
        onTertiaryContainer: "#DCF0DF",
      },
    },

    // ── Ink Blue ──────────────────────────────────
    // Deep technical indigo. Modern, calm focus workspace.
    inkBlue: {
      light: {
        primary: "#3730A3", // deep indigo, not bright blue
        onPrimary: "#FFFFFF",
        primaryContainer: "#E0E7FF", // barely-blue tint on containers
        onPrimaryContainer: "#1E1A5E",
        secondary: "#4F46A3",
        onSecondary: "#FFFFFF",
        secondaryContainer: "#E8E7F8",
        onSecondaryContainer: "#26234E",
        tertiary: "#6366A8",
        onTertiary: "#FFFFFF",
        tertiaryContainer: "#ECEEF9",
        onTertiaryContainer: "#2E2F58",
      },
      dark: {
        primary: "#A5B4FC", // muted periwinkle on dark
        onPrimary: "#1E1A5E",
        primaryContainer: "#3730A3",
        onPrimaryContainer: "#E0E7FF",
        secondary: "#9FA3E8",
        onSecondary: "#26234E",
        secondaryContainer: "#38357A",
        onSecondaryContainer: "#E8E7F8",
        tertiary: "#A8AADF",
        onTertiary: "#2E2F58",
        tertiaryContainer: "#464888",
        onTertiaryContainer: "#ECEEF9",
      },
    },

    // ── Gold ──────────────────────────────────────
    // Antique gold — premium supporter badge, NOT yellow-washed.
    // Dark mode primary: warm gold. Light mode: deep bronze.
    gold: {
      light: {
        primary: "#E8C99A",
        onPrimary: "#FFFFFF",
        primaryContainer: "#F5E9C8", // warm parchment, barely there
        onPrimaryContainer: "#3E2A00",
        secondary: "#8A6C2A",
        onSecondary: "#FFFFFF",
        secondaryContainer: "#F0E2C2",
        onSecondaryContainer: "#3C2B00",
        tertiary: "#B8922A",
        onTertiary: "#FFFFFF",
        tertiaryContainer: "#F5E8C6",
        onTertiaryContainer: "#3F2D00",
      },
      dark: {
        primary: "#E8C99A", // exactly the gold from the active date chip
        onPrimary: "#1A0F00",
        primaryContainer: "#3D2E08", // deep gold-brown, not yellow-washed
        onPrimaryContainer: "#F5E9C8",
        secondary: "#B08A3E",
        onSecondary: "#1A0F00",
        secondaryContainer: "#2E2006",
        onSecondaryContainer: "#F0E2C2",
        tertiary: "#C4A045",
        onTertiary: "#1A0F00",
        tertiaryContainer: "#332408",
        onTertiaryContainer: "#F5E8C6",
      },
    },

    // ── Monochrome ────────────────────────────────
    // Pure black & white accent — no hue whatsoever.
    // Light mode: jet black primary on white. Dark mode: pure white primary on near-black.
    // The most minimal possible theme — every UI element reads as intentional ink.
    mono: {
      light: {
        primary: "#0A0A0B", // near-black — buttons, active tabs
        onPrimary: "#FFFFFF",
        primaryContainer: "#EBEBED", // very light gray container
        onPrimaryContainer: "#0A0A0B",
        secondary: "#3A3A3F", // dark gray secondary
        onSecondary: "#FFFFFF",
        secondaryContainer: "#E4E4E8",
        onSecondaryContainer: "#1A1A1F",
        tertiary: "#6B6B72", // mid gray for badges/graphs
        onTertiary: "#FFFFFF",
        tertiaryContainer: "#F0F0F2",
        onTertiaryContainer: "#2A2A2F",
      },
      dark: {
        primary: "#FAFAFA", // pure white — pops on near-black surface
        onPrimary: "#0A0A0B",
        primaryContainer: "#2A2A2D", // dark gray container
        onPrimaryContainer: "#FAFAFA",
        secondary: "#C4C4CC", // light gray secondary
        onSecondary: "#0A0A0B",
        secondaryContainer: "#232328",
        onSecondaryContainer: "#E4E4E8",
        tertiary: "#909098", // mid gray for badges/graphs
        onTertiary: "#0A0A0B",
        tertiaryContainer: "#1E1E22",
        onTertiaryContainer: "#D0D0D8",
      },
    },
  };

// ─────────────────────────────────────────────
// Semantic finance colors
// ─────────────────────────────────────────────

const SEMANTIC_LIGHT: SemanticColors = {
  income: "#16A34A", // green-600
  expense: "#DC2626", // red-600
  pending: "#D97706", // amber-600
  success: "#15803D", // green-700
  failed: "#B91C1C", // red-700
};

const SEMANTIC_DARK: SemanticColors = {
  income: "#4ADE80", // green-400 — legible on dark surface
  expense: "#F87171", // red-400
  pending: "#FCD34D", // amber-300
  success: "#86EFAC", // green-300
  failed: "#FCA5A5", // red-300
};

// ─────────────────────────────────────────────
// Elevation overlay builder
// ─────────────────────────────────────────────

/**
 * Dark mode: white overlay into dark surface → natural luminous lift.
 * Light mode: cool blue-gray tint overlay → airy depth, not muddy gray.
 *   (Black-on-white just grays out every level; tinted overlay mimics
 *    the same perceptual depth that white-on-dark produces naturally.)
 */
function buildElevationColors(
  surfaceHex: string,
  overlayHex: string,
): MD3Theme["colors"]["elevation"] {
  const surface = color(surfaceHex);
  const overlay = color(overlayHex);
  return {
    level0: "transparent",
    level1: surface.mix(overlay, 0.05).rgb().string(),
    level2: surface.mix(overlay, 0.08).rgb().string(),
    level3: surface.mix(overlay, 0.11).rgb().string(),
    level4: surface.mix(overlay, 0.12).rgb().string(),
    level5: surface.mix(overlay, 0.14).rgb().string(),
  };
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

export type BuildPaperThemeInput = {
  themeId: ThemeId | undefined | null;
  mode: ThemeMode | undefined | null;
};

export function buildPaperTheme(input: BuildPaperThemeInput): ExtendedMD3Theme {
  // Guard: fallback to safe defaults if context hasn't hydrated yet
  const mode: ThemeMode = input.mode === "dark" ? "dark" : "light";
  const themeId: ThemeId =
    input.themeId && input.themeId in ACCENTS ? input.themeId : "gold";
  const isDark = mode === "dark";

  const baseTheme: MD3Theme = isDark ? MD3DarkTheme : MD3LightTheme;
  const base = isDark ? BASE_DARK : BASE_LIGHT;
  const accent = ACCENTS[themeId][mode];
  const semantic = isDark ? SEMANTIC_DARK : SEMANTIC_LIGHT;

  // Elevation fix: dark uses white overlay (luminous lift), light uses cool
  // blue-gray tint (airy depth). Using onSurface (#0A0A0B) on light was
  // mixing black into white — producing muddy gray blobs at every level.
  const elevation = buildElevationColors(base.surface, base.elevationOverlay);

  const merged: MD3Theme["colors"] = {
    // Spread MD3 defaults first (catches any slots we don't explicitly override)
    ...baseTheme.colors,

    // ── Accent slots (change per theme) ──────────
    primary: accent.primary,
    onPrimary: accent.onPrimary,
    primaryContainer: accent.primaryContainer,
    onPrimaryContainer: accent.onPrimaryContainer,
    secondary: accent.secondary,
    onSecondary: accent.onSecondary,
    secondaryContainer: accent.secondaryContainer,
    onSecondaryContainer: accent.onSecondaryContainer,
    tertiary: accent.tertiary,
    onTertiary: accent.onTertiary,
    tertiaryContainer: accent.tertiaryContainer,
    onTertiaryContainer: accent.onTertiaryContainer,

    // inversePrimary — used by SnackBar action buttons, FAB on colored surfaces
    inversePrimary: isDark ? accent.primaryContainer : accent.primary,

    // ── Neutral surfaces (constant) ───────────────
    background: base.background,
    onBackground: base.onBackground,
    surface: base.surface,
    onSurface: base.onSurface,
    surfaceVariant: base.surfaceVariant,
    onSurfaceVariant: base.onSurfaceVariant,
    outline: base.outline,
    outlineVariant: base.outlineVariant,
    error: base.error,
    onError: base.onError,
    errorContainer: base.errorContainer,
    onErrorContainer: base.onErrorContainer,
    inverseSurface: base.inverseSurface,
    inverseOnSurface: base.inverseOnSurface,
    shadow: base.shadow,
    scrim: base.scrim,

    // ── Derived ───────────────────────────────────
    backdrop: color(base.shadow).alpha(0.4).rgb().string(),
    surfaceDisabled: color(base.onSurface).alpha(0.12).rgb().string(),
    onSurfaceDisabled: color(base.onSurface).alpha(0.38).rgb().string(),
    elevation,
  };

  return {
    ...baseTheme,
    roundness: 12,
    colors: merged,
    fonts: paperFonts,
    semantic,
  };
}

// ─────────────────────────────────────────────
// Convenience helpers
// ─────────────────────────────────────────────

/** All preset metadata (label, description) for a theme picker UI. */
export const THEME_PRESETS: Record<
  ThemeId,
  {
    label: string;
    description: string;
    primarySeed: string;
    secondarySeed?: string;
  }
> = {
  sakura: {
    label: "Sakura",
    description: "Muted rose accent, surfaces stay white",
    primarySeed: "#D17B88",
    secondarySeed: "#8E5A63",
  },
  emerald: {
    label: "Emerald",
    description: "Ledger green — trustworthy, accounting-heritage",
    primarySeed: "#6F8F72",
    secondarySeed: "#4E6551",
  },
  inkBlue: {
    label: "Ink Blue",
    description: "Deep indigo for a focused workspace",
    primarySeed: "#5C6BC0",
    secondarySeed: "#3949AB",
  },
  gold: {
    label: "Gold",
    description: "Antique bronze for premium accounts",
    primarySeed: "#C6A969",
    secondarySeed: "#8D7748",
  },
  mono: {
    label: "Mono",
    description: "Pure black & white — zero hue, maximum intent",
    primarySeed: "#8b8b8b",
    secondarySeed: "#3A3A3F",
  },
};

/** Build every theme variant at once (useful for theme preview screens). */
export function buildAllThemes(
  mode: ThemeMode,
): Record<ThemeId, ExtendedMD3Theme> {
  return (Object.keys(THEME_PRESETS) as ThemeId[]).reduce(
    (acc, id) => ({ ...acc, [id]: buildPaperTheme({ themeId: id, mode }) }),
    {} as Record<ThemeId, ExtendedMD3Theme>,
  );
}
