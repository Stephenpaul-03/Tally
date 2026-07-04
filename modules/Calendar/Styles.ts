import { typography } from "@/theme/typography";
import { StyleSheet } from "react-native";
import type { CalendarTokens } from "./Tokens";

export function buildCalendarStyles(tokens: CalendarTokens) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: tokens.colors.background,
    },
    screenContent: {
      paddingHorizontal: tokens.spacing.lg,
      paddingTop: 0,
      paddingBottom: 120,
      gap: tokens.spacing.lg,
    },
    monthBody: {
      alignItems: "center",
    },
    gridCard: {
      paddingHorizontal: 0,
      paddingVertical: 0,
      gap: tokens.spacing.md,
      alignSelf: "center",
    },
    weekdayRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: tokens.spacing.xs,
    },
    weekdayLabel: {
      flex: 1,
      textAlign: "center",
      fontFamily: tokens.typography.fontFamilyMedium,
      fontSize: tokens.typography.sizeSm,
      fontWeight: tokens.typography.weightBold,
      color: tokens.colors.textMuted,
    },
    weeksWrap: {
      gap: tokens.spacing.sm,
    },
    weekRow: {
      flexDirection: "row",
      alignItems: "stretch",
      justifyContent: "space-between",
      gap: tokens.spacing.sm,
    },
    dayCellBase: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: tokens.colors.border,
      backgroundColor: tokens.colors.surface,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: tokens.spacing.sm,
    },
    dayCellSelected: {
      backgroundColor: tokens.colors.selectedDayBackground,
      borderColor: tokens.colors.selectedDayBackground,
    },
    dayCellToday: {
      borderColor: tokens.colors.todayBorder,
    },
    dayNumber: {
      fontFamily: tokens.typography.fontFamilyMedium,
      fontSize: tokens.typography.sizeMd,
      fontWeight: tokens.typography.weightSemiBold,
      color: tokens.colors.textPrimary,
    },
    dayNumberSelected: {
      color: tokens.colors.selectedDayText,
    },
    dayNumberMuted: {
      color: tokens.colors.textMuted,
    },
    dotRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: tokens.spacing.xs,
      minHeight: 10,
      marginTop: tokens.spacing.xs,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 999,
    },
    dotSelected: {
      borderWidth: 1,
      borderColor: tokens.colors.selectedDotBorder,
    },
    dotIncome: {
      backgroundColor: tokens.colors.incomeGreen,
    },
    dotExpense: {
      backgroundColor: tokens.colors.expenseRed,
    },
    emptyDayCell: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: tokens.colors.border,
      opacity: 0.35,
    },
    activeCountWrap: {
      alignItems: "center",
      paddingBottom: 10,
    },
    activeCountText: {
      fontFamily: tokens.typography.fontFamily,
      fontSize: tokens.typography.sizeSm,
      fontWeight: tokens.typography.weightMedium,
      color: tokens.colors.textMuted,
      textAlign: "center",
    },
    summaryCardWrap: {
      width: "100%",
    },
    summaryPillWrap: {
      position: "relative",
    },
    summaryHeroCardBody: {
      gap: 14,
    },
    summaryHeaderAction: {
      position: "absolute",
      top: -12,
      right: 16,
      backgroundColor: tokens.colors.surface,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderWidth: 0.5,
      borderColor: tokens.colors.summaryBorder,
      borderRadius: 20,
    },
    summaryHeroHeader: {
      gap: 4,
      alignItems: "flex-start",
    },
    summaryHeroTitle: {
      ...typography.editorial.sectionLabel,
      fontSize: 18,
      lineHeight: 26,
      color: tokens.colors.summaryPrimary,
      textAlign: "left",
    },
    summaryHeroSubtitle: {
      fontFamily: tokens.typography.fontFamily,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: tokens.typography.weightMedium,
      color: tokens.colors.summaryMuted,
      textAlign: "left",
    },
    summaryHeroMetricsRow: {
      flexDirection: "row",
      alignItems: "stretch",
    },
    summaryHeroMetricColumn: {
      flex: 1,
      alignItems: "center",
    },
    summaryHeroMetricDivider: {
      width: 0.5,
      backgroundColor: tokens.colors.summaryBorder,
      marginHorizontal: 8,
    },
    summaryHeroMetricLabel: {
      fontFamily: tokens.typography.fontFamily,
      fontSize: 10,
      lineHeight: 18,
      fontWeight: tokens.typography.weightRegular,
      letterSpacing: 0.5,
      color: tokens.colors.summaryMuted,
      textAlign: "center",
      textTransform: "uppercase",
    },
    summaryHeroMetricValue: {
      ...typography.editorial.sectionLabel,
      fontSize: 20,
      lineHeight: 32,
      letterSpacing: 0.5,
      textAlign: "center",
      color: tokens.colors.summaryPrimary,
    },
    summaryHeroMetricCaption: {
      fontFamily: tokens.typography.fontFamily,
      fontSize: 10,
      lineHeight: 20,
      color: tokens.colors.summaryMuted,
      textAlign: "center",
    },
    summaryActionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    summaryActionText: {
      fontFamily: tokens.typography.fontFamilyMedium,
      fontSize: 14,
      fontWeight: tokens.typography.weightSemiBold,
      color: tokens.colors.summaryPrimary,
    },
    bottomSpacer: {
      height: 0,
    },
  });
}
