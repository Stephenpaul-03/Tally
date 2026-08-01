import { StyleSheet } from "react-native";

export const SettingsStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headerCenter: {
    flex: 1,
  },
  headerActionPlaceholder: {
    width: 34,
    height: 34,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "500",
    lineHeight: 24,
  },

  // ── Section label ────────────────────────────────────────────────────────────
  sectionLabel: {
    paddingHorizontal: 40,
  },

  // ── Section gap ──────────────────────────────────────────────────────────────
  sectionGap: {
    height: 28,
  },

  // ── Card (outer) ─────────────────────────────────────────────────────────────
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    marginHorizontal: 20,
  },

  // ── Row inside a card ────────────────────────────────────────────────────────
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rowTitle: {
    fontSize: 13,
    lineHeight: 15,
  },
  rowSub: {
    fontSize: 11,
    lineHeight: 13,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 62, // indent past icon
  },

  // ── Badge (time display etc) ──────────────────────────────────────────────────
  badge: {
    fontSize: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 99,
    borderWidth: 1,
    overflow: "hidden",
  },

  // ── Mode segments (System / Dark / Light) ────────────────────────────────────
  segRow: {
    flexDirection: "row",
    gap: 8,
  },
  seg: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  segLabel: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },

  // ── Palette scroll row ───────────────────────────────────────────────────────
  paletteRow: {
    flexDirection: "row",
    gap: 10,
  },
  swatchTile: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    width: 80,
  },
  swatchDot: {
    width: 24,
    height: 24,
    borderRadius: 99,
  },
  swatchName: {
    fontSize: 11,
    lineHeight: 14,
  },

  // ── Addons card ───────────────────────────────────────────────────────────────
  addonsCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    marginHorizontal: 20,
  },
  addonsHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  addonsTitle: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  addonsSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  addonsBody: {
    padding: 12,
    gap: 10,
  },

  // ── Subcard (inside addons) ───────────────────────────────────────────────────
  subcard: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  subcardLabel: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  subSegRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  subSeg: {
    flex: 1,
    alignItems: "center",
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  subSegLabel: {
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 14,
  },

  // ── Footer ───────────────────────────────────────────────────────────────────
  footer: {
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 99,
  },

  // ── Scroll container ─────────────────────────────────────────────────────────
  scrollContent: {
    paddingBottom: 48,
  },
});
