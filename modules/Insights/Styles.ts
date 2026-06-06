import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
    gap: 14,
  },
  headerMenuButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  kicker: {
    fontSize: 13,
    letterSpacing: 1.6,
    fontWeight: "700",
  },
  heroAmount: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: "700",
  },
  heroSubline: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
  },
  heroInHand: {
    fontSize: 16,
    fontWeight: "700",
  },
  changeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  changeText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  heroBottomRow: {
    marginTop: 6,
    paddingTop: 14,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  donutWrap: {
    width: 180,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  heroLegend: {
    flex: 1,
    gap: 12,
    minWidth: 0,
  },
  heroLegendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  heroLegendLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  heroLegendValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  sectionCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    letterSpacing: 1.8,
    fontWeight: "700",
  },
  sectionMeta: {
    fontSize: 14,
    fontWeight: "600",
  },
  breakdownToggle: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  breakdownToggleButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  breakdownToggleText: {
    fontSize: 14,
    fontWeight: "700",
  },
  breakdownList: {
    gap: 14,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  breakdownLeft: {
    width: 126,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  categoryIconChip: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  breakdownLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  breakdownMiddle: {
    flex: 1,
  },
  progressTrack: {
    width: "100%",
    height: 7,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  breakdownRight: {
    width: 88,
    alignItems: "flex-end",
    gap: 4,
  },
  breakdownAmount: {
    fontSize: 15,
    fontWeight: "700",
  },
  breakdownPct: {
    fontSize: 14,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
  },
  paymentList: {
    gap: 14,
  },
  paymentRow: {
    gap: 8,
  },
  paymentTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  paymentLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  paymentIconChip: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  paymentLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  paymentValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: "700",
  },
  paymentPct: {
    fontSize: 13,
    fontWeight: "700",
  },
  moreButton: {
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  moreButtonText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  heatmapGridBlock: {
    gap: 12,
  },
  weekdayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  weekdayLabel: {
    width: 18,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
  },
  heatmapWeeks: {
    gap: 10,
  },
  heatmapWeekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heatmapDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  heatmapBottomRow: {
    gap: 14,
  },
  heatmapLegendRowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    rowGap: 10,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  heatmapInfoRow: {
    flexDirection: "row",
    gap: 12,
  },
  heatmapInfoCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  heatmapInfoLabel: {
    fontSize: 12,
    letterSpacing: 0.8,
    fontWeight: "700",
  },
  heatmapInfoValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  breakdownModal: {
    marginHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    maxHeight: "80%",
    padding: 18,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalScrollContent: {
    gap: 14,
    paddingBottom: 6,
  },
});
