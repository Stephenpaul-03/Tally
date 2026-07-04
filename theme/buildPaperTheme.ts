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

export type ThemeId =
  | "slate"
  | "sakura"
  | "inkBlue"
  | "forest"
  | "mocha"
  | "mono"
  | "ocean"
  | "amethyst"
  | "gold";

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
  background: "#F4F4F6", // ← was "#ffffff" — soft gray page wash
  onBackground: "#0A0A0B",
  surface: "#FFFFFF", // ← cards stay pure white, now they lift off
  onSurface: "#0A0A0B",
  surfaceVariant: "#EDEDF0", // ← was "#ffffff" — chips/input fills get a tint
  onSurfaceVariant: "#4A4A52",
  outline: "#9A9AA8",
  outlineVariant: "#DDDDE8",
  error: "#C0392B",
  onError: "#FFFFFF",
  errorContainer: "#FDECEA",
  onErrorContainer: "#7B1D1D",
  inverseSurface: "#16161A",
  inverseOnSurface: "#F1F3F5",
  shadow: "#000000",
  scrim: "#000000",
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
    // ── Slate — Default ───────────────────────────
    // Cool blue-gray — nearly achromatic with a calming blue undertone.
    // The app's default: trustworthy, neutral, never competes with content.
    slate: {
      light: {
        primary: "#3F4C60",
        onPrimary: "#FFFFFF",
        primaryContainer: "#E2E7EF",
        onPrimaryContainer: "#1A2232",
        secondary: "#556070",
        onSecondary: "#FFFFFF",
        secondaryContainer: "#DDE2EA",
        onSecondaryContainer: "#202C38",
        tertiary: "#6A7A8A",
        onTertiary: "#FFFFFF",
        tertiaryContainer: "#E8EDF2",
        onTertiaryContainer: "#2A3640",
      },
      dark: {
        primary: "#9AAABB",
        onPrimary: "#1A2232",
        primaryContainer: "#2A3340",
        onPrimaryContainer: "#E2E7EF",
        secondary: "#8A9CAC",
        onSecondary: "#202C38",
        secondaryContainer: "#223040",
        onSecondaryContainer: "#DDE2EA",
        tertiary: "#7A8C9C",
        onTertiary: "#2A3640",
        tertiaryContainer: "#1E2C38",
        onTertiaryContainer: "#E8EDF2",
      },
    },

    // ── Sakura — Warm ─────────────────────────────
    // Muted rose — only buttons/tabs blush, surfaces stay white.
    // Light mode: dusty rose accent. Dark mode: desaturated mauve.
    sakura: {
      light: {
        primary: "#9D5F6A",
        onPrimary: "#FFFFFF",
        primaryContainer: "#F5E0E3",
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
        primary: "#DEADB3",
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

    // ── Ink Blue — Technical ──────────────────────
    // Deep technical indigo. Modern, calm focus workspace.
    inkBlue: {
      light: {
        primary: "#3730A3",
        onPrimary: "#FFFFFF",
        primaryContainer: "#E0E7FF",
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
        primary: "#A5B4FC",
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

    // ── Forest — Natural ──────────────────────────
    // Dark pine green — cooler and deeper than classic emerald.
    // Reads organic and grounded; the tertiary drifts mossy to add depth.
    forest: {
      light: {
        primary: "#1E4D3A",
        onPrimary: "#FFFFFF",
        primaryContainer: "#D0E8DF",
        onPrimaryContainer: "#082418",
        secondary: "#2E5C4A",
        onSecondary: "#FFFFFF",
        secondaryContainer: "#D4EADF",
        onSecondaryContainer: "#0C2E1E",
        tertiary: "#3A6A52",
        onTertiary: "#FFFFFF",
        tertiaryContainer: "#D8EEE4",
        onTertiaryContainer: "#103424",
      },
      dark: {
        primary: "#70B898",
        onPrimary: "#082418",
        primaryContainer: "#183A2C",
        onPrimaryContainer: "#D0E8DF",
        secondary: "#80A898",
        onSecondary: "#0C2E1E",
        secondaryContainer: "#1C3028",
        onSecondaryContainer: "#D4EADF",
        tertiary: "#88B8A0",
        onTertiary: "#103424",
        tertiaryContainer: "#1A3020",
        onTertiaryContainer: "#D8EEE4",
      },
    },

    // ── Mocha — Cozy ──────────────────────────────
    // Warm espresso brown — grounded, calm, tactile.
    // Light: deep roast primary, cream containers. Dark: latte on near-black.
    mocha: {
      light: {
        primary: "#6B3F2A",
        onPrimary: "#FFFFFF",
        primaryContainer: "#EFE0D8",
        onPrimaryContainer: "#341606",
        secondary: "#7A5444",
        onSecondary: "#FFFFFF",
        secondaryContainer: "#ECDDD6",
        onSecondaryContainer: "#2E1509",
        tertiary: "#8C6A52",
        onTertiary: "#FFFFFF",
        tertiaryContainer: "#F0E2D8",
        onTertiaryContainer: "#3A1F0D",
      },
      dark: {
        primary: "#D4A68A",
        onPrimary: "#341606",
        primaryContainer: "#4E2612",
        onPrimaryContainer: "#EFE0D8",
        secondary: "#C4957E",
        onSecondary: "#2E1509",
        secondaryContainer: "#3F2015",
        onSecondaryContainer: "#ECDDD6",
        tertiary: "#C8A48C",
        onTertiary: "#3A1F0D",
        tertiaryContainer: "#553524",
        onTertiaryContainer: "#F0E2D8",
      },
    },

    // ── Mono — Minimal ────────────────────────────
    // Pure black & white accent — no hue whatsoever.
    // Light: jet black primary on white. Dark: pure white primary on near-black.
    mono: {
      light: {
        primary: "#0A0A0B",
        onPrimary: "#FFFFFF",
        primaryContainer: "#EBEBED",
        onPrimaryContainer: "#0A0A0B",
        secondary: "#3A3A3F",
        onSecondary: "#FFFFFF",
        secondaryContainer: "#E4E4E8",
        onSecondaryContainer: "#1A1A1F",
        tertiary: "#6B6B72",
        onTertiary: "#FFFFFF",
        tertiaryContainer: "#F0F0F2",
        onTertiaryContainer: "#2A2A2F",
      },
      dark: {
        primary: "#FAFAFA",
        onPrimary: "#0A0A0B",
        primaryContainer: "#2A2A2D",
        onPrimaryContainer: "#FAFAFA",
        secondary: "#C4C4CC",
        onSecondary: "#0A0A0B",
        secondaryContainer: "#232328",
        onSecondaryContainer: "#E4E4E8",
        tertiary: "#909098",
        onTertiary: "#0A0A0B",
        tertiaryContainer: "#1E1E22",
        onTertiaryContainer: "#D0D0D8",
      },
    },

    // ── Ocean — Fresh ─────────────────────────────
    // Teal-blue — crisp, open, sits between Ink Blue and Forest in hue.
    // Light: deep sea primary. Dark: bright aqua on near-black.
    ocean: {
      light: {
        primary: "#0F5C78",
        onPrimary: "#FFFFFF",
        primaryContainer: "#CCE8F0",
        onPrimaryContainer: "#002E40",
        secondary: "#1A6880",
        onSecondary: "#FFFFFF",
        secondaryContainer: "#CCEAF0",
        onSecondaryContainer: "#003040",
        tertiary: "#207088",
        onTertiary: "#FFFFFF",
        tertiaryContainer: "#C8E8EE",
        onTertiaryContainer: "#003848",
      },
      dark: {
        primary: "#68C0D8",
        onPrimary: "#002E40",
        primaryContainer: "#083848",
        onPrimaryContainer: "#CCE8F0",
        secondary: "#58B0C8",
        onSecondary: "#003040",
        secondaryContainer: "#063040",
        onSecondaryContainer: "#CCEAF0",
        tertiary: "#60B8D0",
        onTertiary: "#003848",
        tertiaryContainer: "#053040",
        onTertiaryContainer: "#C8E8EE",
      },
    },

    // ── Amethyst — Creative ───────────────────────
    // Muted purple — the only true violet in the set.
    // Deeper and warmer than Lavender, distinct from the blue-leaning Ink Blue.
    // Light: rich plum. Dark: dusty violet on near-black.
    amethyst: {
      light: {
        primary: "#6B4E9B",
        onPrimary: "#FFFFFF",
        primaryContainer: "#EDE5F8",
        onPrimaryContainer: "#2E1558",
        secondary: "#7A5E9A",
        onSecondary: "#FFFFFF",
        secondaryContainer: "#EAE2F6",
        onSecondaryContainer: "#341A58",
        tertiary: "#8C70A8",
        onTertiary: "#FFFFFF",
        tertiaryContainer: "#F0EAF8",
        onTertiaryContainer: "#3C2460",
      },
      dark: {
        primary: "#B49AD8",
        onPrimary: "#2E1558",
        primaryContainer: "#3A2860",
        onPrimaryContainer: "#EDE5F8",
        secondary: "#A88EC8",
        onSecondary: "#341A58",
        secondaryContainer: "#2E2050",
        onSecondaryContainer: "#EAE2F6",
        tertiary: "#BEA8D8",
        onTertiary: "#3C2460",
        tertiaryContainer: "#261A44",
        onTertiaryContainer: "#F0EAF8",
      },
    },

    // ── Gold — Premium ────────────────────────────
    // Antique bronze — warm, prestigious, NOT yellow-washed.
    // Light: deep bronze with strong contrast. Dark: warm gold on near-black.
    gold: {
      light: {
        primary: "#A67C3A",
        onPrimary: "#FFFFFF",
        primaryContainer: "#F5E9C8",
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
        primary: "#E8C99A",
        onPrimary: "#1A0F00",
        primaryContainer: "#3D2E08",
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
  };

// ─────────────────────────────────────────────
// Semantic finance colors
// ─────────────────────────────────────────────

const SEMANTIC_LIGHT: SemanticColors = {
  income: "#16A34A",
  expense: "#DC2626",
  pending: "#D97706",
  success: "#15803D",
  failed: "#B91C1C",
};

const SEMANTIC_DARK: SemanticColors = {
  income: "#4ADE80",
  expense: "#F87171",
  pending: "#FCD34D",
  success: "#86EFAC",
  failed: "#FCA5A5",
};

// ─────────────────────────────────────────────
// Elevation overlay builder
// ─────────────────────────────────────────────

/**
 * Dark mode: white overlay into dark surface → natural luminous lift.
 * Light mode: cool blue-gray tint overlay → airy depth, not muddy gray.
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
  const mode: ThemeMode = input.mode === "dark" ? "dark" : "light";
  const themeId: ThemeId =
    input.themeId && input.themeId in ACCENTS ? input.themeId : "slate";
  const isDark = mode === "dark";

  const baseTheme: MD3Theme = isDark ? MD3DarkTheme : MD3LightTheme;
  const base = isDark ? BASE_DARK : BASE_LIGHT;
  const accent = ACCENTS[themeId][mode];
  const semantic = isDark ? SEMANTIC_DARK : SEMANTIC_LIGHT;

  const elevation = buildElevationColors(base.surface, base.elevationOverlay);

  const merged: MD3Theme["colors"] = {
    ...baseTheme.colors,

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
    mood: string;
    description: string;
    primarySeed: string;
    secondarySeed?: string;
  }
> = {
  slate: {
    label: "Slate",
    mood: "Default",
    description: "Cool blue-gray — calm, neutral, never competes with content",
    primarySeed: "#3F4C60",
    secondarySeed: "#556070",
  },
  sakura: {
    label: "Sakura",
    mood: "Warm",
    description: "Muted rose accent, surfaces stay white",
    primarySeed: "#9D5F6A",
    secondarySeed: "#7D5259",
  },
  inkBlue: {
    label: "Ink Blue",
    mood: "Technical",
    description: "Deep indigo for a focused workspace",
    primarySeed: "#3730A3",
    secondarySeed: "#4F46A3",
  },
  forest: {
    label: "Forest",
    mood: "Natural",
    description: "Dark pine green — organic, grounded, deep",
    primarySeed: "#1E4D3A",
    secondarySeed: "#2E5C4A",
  },
  mocha: {
    label: "Mocha",
    mood: "Cozy",
    description: "Warm espresso brown — grounded, calm, tactile",
    primarySeed: "#6B3F2A",
    secondarySeed: "#7A5444",
  },
  mono: {
    label: "Mono",
    mood: "Minimal",
    description: "Pure black & white — zero hue, maximum intent",
    primarySeed: "#0A0A0B",
    secondarySeed: "#3A3A3F",
  },
  ocean: {
    label: "Ocean",
    mood: "Fresh",
    description: "Teal-blue — crisp, open, bright",
    primarySeed: "#0F5C78",
    secondarySeed: "#1A6880",
  },
  amethyst: {
    label: "Amethyst",
    mood: "Creative",
    description: "Muted plum — the only true violet in the set",
    primarySeed: "#6B4E9B",
    secondarySeed: "#7A5E9A",
  },
  gold: {
    label: "Gold",
    mood: "Premium",
    description: "Antique bronze — warm, prestigious, timeless",
    primarySeed: "#A67C3A",
    secondarySeed: "#8A6C2A",
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
