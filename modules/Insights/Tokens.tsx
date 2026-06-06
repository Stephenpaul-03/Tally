import type { MD3Theme } from "react-native-paper";

export type InsightsTokens = {
  bg: string;
  baseCard: string;
  elevatedCard: string;
  outline: string;
  muted: string;
  textColor: string;
  primaryColor: string;
  paymentAccent: string;
  paymentTrack: string;
};

export function buildInsightsTokens(theme: MD3Theme): InsightsTokens {
  return {
    bg: theme.colors.background,
    baseCard: theme.colors.elevation.level1,
    elevatedCard: theme.colors.surface,
    outline: theme.colors.outlineVariant,
    muted: theme.colors.onSurfaceVariant,
    textColor: theme.colors.onSurface,
    primaryColor: theme.colors.primary,
    paymentAccent: theme.colors.primary,
    paymentTrack: theme.colors.surfaceVariant,
  };
}
