import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  modalContainer: {
    alignSelf: "center",
    maxWidth: "95%",
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  sheetOverlay: {
    justifyContent: "flex-end",
    margin: 0,
  },
  sheetContainer: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  dragHandleWrap: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
  },
  message: {
    lineHeight: 20,
  },
  actions: {
    gap: 10,
    paddingTop: 2,
  },
  actionsTopRow: {
    flexDirection: "row",
    gap: 10,
  },

  // ── Buttons ──────────────────────────────────────────────
  // Shared content height so all buttons are visually equal
  actionButtonContent: {
    minHeight: 48,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
  },
  // Tertiary gets a tinted border to distinguish it from plain cancel
  tertiaryButton: {
    borderWidth: 1.5,
  },
  confirmButton: {
    borderRadius: 12,
  },

  // ── Slide control ────────────────────────────────────────
  slideWrapper: {
    height: 56,
    borderRadius: 14,
    overflow: "hidden",
    justifyContent: "center",
  },
  slideWrapperDisabled: {
    opacity: 0.55,
  },
  // Full-track tint layer
  slideTrack: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
  },
  // Full-width overlay translated left; peeks in from behind the thumb as progress grows
  slideFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
  },
  // Centred label
  slideLabelWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  slideLabel: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  // Trailing chevrons on the right
  slideChevrons: {
    position: "absolute",
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: -4,
  },
  // Draggable thumb
  slideThumb: {
    position: "absolute",
    left: 4,
    top: 6,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
