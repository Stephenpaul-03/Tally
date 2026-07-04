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
    alignItems: "stretch",
    justifyContent: "flex-start",
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
    alignSelf: "stretch",
    width: "100%",
  },
  bottomActionWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
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
    borderRadius: 40,
    minWidth: 78,
  },

  summaryCardSpacing: {
    marginHorizontal: 20,
  },
  searchBarWrap: {
    marginTop: 20,
  },
  emptyStateWrap: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});
