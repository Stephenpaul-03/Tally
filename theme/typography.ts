import { useFonts } from "expo-font";
import type { TextStyle } from "react-native";
import { configureFonts } from "react-native-paper";

export const fontFamilies = {
  display: "BebasNeue-Regular",
  sansBold: "Switzer-Bold",
  sansMedium: "Switzer-Medium",
  sansRegular: "Switzer-Regular",
  sansSemibold: "Switzer-Semibold",
} as const;

export const appFontAssets = {
  [fontFamilies.sansRegular]: require("../assets/fonts/Switzer-Regular.ttf"),
  [fontFamilies.sansMedium]: require("../assets/fonts/Switzer-Medium.ttf"),
  [fontFamilies.sansSemibold]: require("../assets/fonts/Switzer-Semibold.ttf"),
  [fontFamilies.sansBold]: require("../assets/fonts/Switzer-Bold.ttf"),
  [fontFamilies.display]: require("../assets/fonts/BebasNeue-Regular.ttf"),
} as const;

type AppFontFamily = (typeof fontFamilies)[keyof typeof fontFamilies];
type PaperFontWeight =
  | "normal"
  | "bold"
  | "100"
  | "200"
  | "300"
  | "400"
  | "500"
  | "600"
  | "700"
  | "800"
  | "900";
type PaperTypeVariant = {
  fontFamily: string;
  fontWeight: PaperFontWeight;
  letterSpacing: number;
  lineHeight: number;
  fontSize: number;
  fontStyle?: TextStyle["fontStyle"];
};
type PaperDefaultFont = {
  fontFamily: string;
  fontWeight: PaperFontWeight;
  letterSpacing: number;
};

function fontFace(fontFamily: AppFontFamily): PaperDefaultFont {
  return {
    fontFamily,
    // Keep weight normal so Android always honors the explicit font file.
    fontWeight: "normal",
    letterSpacing: 0,
  };
}

function typeVariant(
  fontFamily: AppFontFamily,
  overrides: Omit<PaperTypeVariant, "fontFamily" | "fontWeight">,
): PaperTypeVariant {
  return {
    ...fontFace(fontFamily),
    ...overrides,
  };
}

const configuredPaperFonts = configureFonts({
  isV3: true,
  config: {
    displayLarge: typeVariant(fontFamilies.sansBold, {
      fontSize: 57,
      letterSpacing: -0.25,
      lineHeight: 64,
    }),
    displayMedium: typeVariant(fontFamilies.sansBold, {
      fontSize: 45,
      letterSpacing: 0,
      lineHeight: 52,
    }),
    displaySmall: typeVariant(fontFamilies.sansSemibold, {
      fontSize: 36,
      letterSpacing: 0,
      lineHeight: 44,
    }),
    headlineLarge: typeVariant(fontFamilies.sansBold, {
      fontSize: 32,
      letterSpacing: 0,
      lineHeight: 40,
    }),
    headlineMedium: typeVariant(fontFamilies.sansSemibold, {
      fontSize: 28,
      letterSpacing: 0,
      lineHeight: 36,
    }),
    headlineSmall: typeVariant(fontFamilies.sansSemibold, {
      fontSize: 24,
      letterSpacing: 0,
      lineHeight: 32,
    }),
    titleLarge: typeVariant(fontFamilies.sansSemibold, {
      fontSize: 22,
      letterSpacing: 0,
      lineHeight: 28,
    }),
    titleMedium: typeVariant(fontFamilies.sansSemibold, {
      fontSize: 16,
      letterSpacing: 0.15,
      lineHeight: 24,
    }),
    titleSmall: typeVariant(fontFamilies.sansMedium, {
      fontSize: 14,
      letterSpacing: 0.1,
      lineHeight: 20,
    }),
    labelLarge: typeVariant(fontFamilies.sansMedium, {
      fontSize: 14,
      letterSpacing: 0.1,
      lineHeight: 20,
    }),
    labelMedium: typeVariant(fontFamilies.sansMedium, {
      fontSize: 12,
      letterSpacing: 0.5,
      lineHeight: 16,
    }),
    labelSmall: typeVariant(fontFamilies.sansMedium, {
      fontSize: 11,
      letterSpacing: 0.5,
      lineHeight: 16,
    }),
    bodyLarge: typeVariant(fontFamilies.sansRegular, {
      fontSize: 16,
      letterSpacing: 0.15,
      lineHeight: 24,
    }),
    bodyMedium: typeVariant(fontFamilies.sansRegular, {
      fontSize: 14,
      letterSpacing: 0.25,
      lineHeight: 20,
    }),
    bodySmall: typeVariant(fontFamilies.sansRegular, {
      fontSize: 12,
      letterSpacing: 0.4,
      lineHeight: 16,
    }),
  },
});

export const paperFonts = {
  ...configuredPaperFonts,
  default: fontFace(fontFamilies.sansRegular),
};

export const typography = {
  body: fontFace(fontFamilies.sansRegular),
  bodyMedium: fontFace(fontFamilies.sansMedium),
  bodyStrong: fontFace(fontFamilies.sansSemibold),
  bodyBold: fontFace(fontFamilies.sansBold),
  display: fontFace(fontFamilies.display),
  editorial: {
    hero: {
      ...fontFace(fontFamilies.display),
      fontSize: 32,
      letterSpacing: 0.6,
      lineHeight: 36,
    } satisfies TextStyle,
    sectionLabel: {
      ...fontFace(fontFamilies.display),
      fontSize: 18,
      letterSpacing: 0.8,
      lineHeight: 22,
    } satisfies TextStyle,
  },
  ui: {
    button: {
      ...fontFace(fontFamilies.sansMedium),
      fontSize: 14,
      lineHeight: 20,
    } satisfies TextStyle,
    cardTitle: {
      ...fontFace(fontFamilies.sansSemibold),
      fontSize: 16,
      lineHeight: 22,
    } satisfies TextStyle,
    input: {
      ...fontFace(fontFamilies.sansRegular),
      fontSize: 16,
      lineHeight: 22,
    } satisfies TextStyle,
  },
} as const;

export function useAppFonts() {
  return useFonts(appFontAssets);
}
