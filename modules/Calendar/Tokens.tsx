import type { MD3Theme } from "react-native-paper";

export type CalendarTokens = {
  colors: {
    background: string;
    surface: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    incomeGreen: string;
    expenseRed: string;
    netPositive: string;
    netNegative: string;
    selectedDayBackground: string;
    selectedDayText: string;
    todayBorder: string;
    selectedDotBorder: string;
    todayUnderline: string;
    border: string;
    summarySurface: string;
    summarySurfaceAlt: string;
    summaryBorder: string;
    summaryPrimary: string;
    summaryMuted: string;
    summaryAccentSurface: string;
    summaryAccentText: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    fontFamily: string;
    fontFamilyMedium: string;
    fontFamilyBold: string;
    sizeXs: number;
    sizeSm: number;
    sizeMd: number;
    sizeLg: number;
    sizeXl: number;
    sizeDisplay: number;
    weightRegular: "400";
    weightMedium: "500";
    weightSemiBold: "600";
    weightBold: "700";
  };
};

export function buildCalendarTokens(theme: MD3Theme): CalendarTokens {
  return {
    colors: {
      background: theme.colors.background,
      surface: theme.colors.surface,
      textPrimary: theme.colors.onSurface,
      textSecondary: theme.colors.onSurfaceVariant,
      textMuted: theme.colors.onSurfaceVariant,
      incomeGreen: "#2E9B5F",
      expenseRed: "#D95C5C",
      netPositive: "#2E9B5F",
      netNegative: "#D95C5C",
      selectedDayBackground: theme.colors.primary,
      selectedDayText: theme.colors.onPrimary,
      todayBorder: theme.colors.primary,
      selectedDotBorder: "#FFFFFF",
      todayUnderline: theme.colors.primary,
      border: theme.colors.outlineVariant,
      summarySurface: theme.colors.elevation.level1,
      summarySurfaceAlt: theme.colors.elevation.level2,
      summaryBorder: theme.colors.outlineVariant,
      summaryPrimary: theme.colors.onSurface,
      summaryMuted: theme.colors.onSurfaceVariant,
      summaryAccentSurface: theme.colors.primaryContainer,
      summaryAccentText: theme.colors.onPrimaryContainer,
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
    },
    typography: {
      fontFamily: theme.fonts.bodyMedium.fontFamily,
      fontFamilyMedium: theme.fonts.titleMedium.fontFamily,
      fontFamilyBold: theme.fonts.headlineSmall.fontFamily,
      sizeXs: 12,
      sizeSm: 13,
      sizeMd: 15,
      sizeLg: 18,
      sizeXl: 24,
      sizeDisplay: 30,
      weightRegular: "400",
      weightMedium: "500",
      weightSemiBold: "600",
      weightBold: "700",
    },
  };
}
