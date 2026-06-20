import { palette } from "@/theme/color_palette";
import type { MD3Theme } from "react-native-paper";

export type TransactionColors = {
  background: {
    primary: string;
    card: string;
  };
  border: {
    primary: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
};

export type TransactionTone = {
  bg: string;
  border: string;
  text: string;
  icon: string;
};

export type TransactionTokens = {
  colors: TransactionColors;
  expenseTone: TransactionTone;
  incomeTone: TransactionTone;
  navigationBarBackground: string;
  navigationBarButtonStyle: "light" | "dark";
};

export function buildTransactionTokens(theme: MD3Theme): TransactionTokens {
  return {
    colors: {
      background: {
        primary: theme.colors.background,
        card: theme.colors.elevation.level4,
      },
      border: {
        primary: theme.colors.outlineVariant,
      },
      text: {
        primary: theme.colors.onSurface,
        secondary: theme.colors.onSurfaceVariant,
        muted: theme.colors.onSurfaceVariant,
      },
    },
    expenseTone: {
      bg: palette.status.danger,
      border: palette.status.dangerMuted,
      text: palette.status.danger,
      icon: palette.status.danger,
    },
    incomeTone: {
      bg: palette.status.success,
      border: palette.status.successMuted,
      text: palette.status.success,
      icon: palette.status.success,
    },
    navigationBarBackground: theme.colors.elevation.level4,
    navigationBarButtonStyle: theme.dark ? "light" : "dark",
  };
}
