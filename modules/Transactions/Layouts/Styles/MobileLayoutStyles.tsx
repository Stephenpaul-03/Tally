import { StyleSheet } from "react-native";

export const mobileLayoutStyles = StyleSheet.create({
  // ── Root ──────────────────────────────────────────────────────────────────
  mobileStack: {
    flex: 1,
    padding: 0,
    margin: 0,
    justifyContent: "flex-end",
  },

  // ── Day Summary ───────────────────────────────────────────────────────────
  daySummaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 4,
    paddingHorizontal: 20,
  },
  daySummaryItem: {
    alignItems: "center",
    gap: 2,
  },

  // ── Transaction card ──────────────────────────────────────────────────────
  // Sits below the date picker with horizontal margin so it floats above the
  // background like the nav bar does. Border radius matches the nav bar pill
  // language (20px). Border and elevation give it the same "lifted surface"
  // feel as the nav bar.
  mobileTransactionCard: {
    flex: 1,
    minHeight: 0,
    borderBottomWidth: 0,
    overflow: "hidden",
  },

  // ── Card header ───────────────────────────────────────────────────────────
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  mainRangeRowMobile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rangeIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  rangeLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  filterBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
  mobileTransactionsScroll: {
    flex: 1,
    minHeight: 0,
  },
  mobileTransactionsScrollFill: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyCenterWrap: {
    flex: 1,
    flexGrow: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Sections ──────────────────────────────────────────────────────────────
  sectionStack: {
    gap: 14,
  },
  monthSectionStack: {},
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  monthSectionSurface: { gap: 10 },
  monthSectionLabelRow: {
    borderBottomWidth: 0,
  },
  sectionFooterRow: {
    paddingVertical: 12,
  },
  sectionLabelLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  sectionLabelRight: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  monthSectionMetrics: {
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 8,
  },
  summaryMetricDivider: {
    width: 1,
    height: 12,
    opacity: 0.65,
  },
  sectionLabelIcon: {
    opacity: 0.7,
  },
  sectionAccordionIcon: {
    opacity: 0.6,
  },
  monthAccordionControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 2,
  },
  monthAccordionButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  monthAccordionButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sectionLabel: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 1,
    textTransform: "uppercase",
    opacity: 0.45,
  },
  sectionLabelMetric: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  bottomActionWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
  },
  bottomActionSecondaryButton: {
    minHeight: 56,
    borderRadius: 20,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  bottomActionSecondaryPlaceholder: {
    minHeight: 56,
    minWidth: 88,
  },
  bottomActionSecondaryContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bottomActionSecondaryLabel: {
    fontSize: 16,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  bottomActionButton: {
    borderRadius: 20,
    minWidth: 96,
  },
});
