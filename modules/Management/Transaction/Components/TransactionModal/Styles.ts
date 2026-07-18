import { StyleSheet } from "react-native";

export const amountHero = StyleSheet.create({
  // No background card — open layout sitting directly on modal background
  container: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 2,
  },
  label: {
    letterSpacing: 0.8,
    marginBottom: 8,
    opacity: 1,
    fontWeight: "800",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },
  currencySymbol: {
    fontSize: 36,
    fontWeight: "400",
    lineHeight: 56,
    opacity: 0.55,
  },
  input: {
    flex: 1,
    fontSize: 52,
    fontWeight: "400",
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    paddingVertical: 0,
    minHeight: 56,
    letterSpacing: -1,
  },
  error: {
    fontSize: 12,
    marginBottom: 8,
  },
  // Quick-add pill row
  quickAddRow: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 0.5,
    overflow: "hidden",
  },
  quickAddButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickAddDivider: {
    width: 0.5,
    alignSelf: "stretch",
  },
  quickAddLabel: {
    fontWeight: "600",
  },
});

export const fieldRow = StyleSheet.create({
  inner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 2,
    borderBottomWidth: 0.5,
  },
  labelCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: 96,
    paddingRight: 12,
    marginRight: 12,
    borderRightWidth: 0.5,
    paddingVertical: 12,
  },
  label: {
    flex: 1,
  },
  children: {
    flex: 1,
    paddingVertical: 10,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "transparent",
  },
  errorText: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export const accountChips = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 0.5,
  },
  chipContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chipLabel: {
    fontWeight: "700",
  },
});

export const categoryPicker = StyleSheet.create({
  pressable: {
    flex: 1,
  },
  selectedText: {
    opacity: 1,
  },
  contentContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    maxHeight: 480,
  },
  pillGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  title: {
    fontWeight: "700",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  item: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemText: {
    fontWeight: "700",
  },
  checkIcon: {
    marginLeft: "auto",
  },
});

export const mainContent = StyleSheet.create({
  keyboardView: {
    flexShrink: 1,
  },
  // ── Header ───────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 8,
  },
  headerTitle: {
    fontWeight: "700",
    textAlign: "center",
  },
  headerSubtitle: {
    marginTop: 2,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  // ── Scroll ───────────────────────────────────────────────────────────────
  scrollView: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingTop: 14,
    paddingBottom: 20,
    gap: 10,
  },
  // ── Two-column row (Category + Account) ──────────────────────────────────
  twoColRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    gap: 10,
  },
  twoColCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 14,
    gap: 8,
  },
  stackedLabel: {
    letterSpacing: 0.8,
    fontWeight: "800",
    opacity: 1,
  },
  // ── Inline field card (Title, Notes, Date — each its own card) ────────────
  inlineFieldCard: {
    marginHorizontal: 20,
    borderRadius: 14,
    borderWidth: 0.5,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  inlineFieldIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  inlineFieldLabel: {
    fontWeight: "600",
    fontSize: 14,
  },
  inlineFieldLabelOptional: {
    fontWeight: "400",
    fontSize: 13,
    opacity: 0.5,
  },
  inlineFieldValue: {
    flex: 1,
    fontSize: 14,
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    paddingVertical: 0,
    minHeight: 20,
  },
  inlineFieldPlaceholder: {
    flex: 1,
    fontSize: 14,
    opacity: 0.4,
  },
  // ── Date card label row ───────────────────────────────────────────────────
  dateLabelSection: {
    marginHorizontal: 20,
    borderRadius: 14,
    borderWidth: 0.5,
    overflow: "hidden",
  },
  dateLabelRow: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },
  dateLabelText: {
    letterSpacing: 1.2,
    fontWeight: "800",
    fontSize: 11,
  },
  dateValueRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 10,
  },
  // ── Details card (legacy grouped — kept for edit mode) ──────────────────
  detailsCard: {
    marginHorizontal: 20,
    marginBottom: 2,
  },
  detailsLabel: {
    letterSpacing: 0.6,
    marginBottom: 6,
    marginLeft: 2,
  },
  surface: {
    borderRadius: 14,
    borderWidth: 0.5,
    overflow: "hidden",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 0.5,
  },
  titleInput: {
    flex: 1,
    backgroundColor: "transparent",
    fontSize: 14,
    height: 20,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  errorText: {
    fontSize: 12,
    paddingHorizontal: 14,
    paddingBottom: 4,
  },
  // ── Notes collapsed row ──────────────────────────────────────────────────
  notesCollapsed: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderTopWidth: 0.5,
    gap: 8,
  },
  // ── Footer ───────────────────────────────────────────────────────────────
  footer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
  },
  submitButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 16,
  },
  submitButtonText: {
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 1,
  },
  deleteButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 0.5,
    alignItems: "center",
    justifyContent: "center",
  },
  // ── Keep legacy stubs so nothing breaks ─────────────────────────────────
  notesCard: {
    marginHorizontal: 20,
    marginBottom: 2,
  },
  notesRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 0,
    gap: 12,
  },
  notesInput: {
    flex: 1,
    backgroundColor: "transparent",
    fontSize: 14,
    minHeight: 20,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
});

export const modal = StyleSheet.create({
  sheet: {
    justifyContent: "flex-end",
    margin: 0,
  },
  sheetContent: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderTopWidth: 0.5,
    overflow: "hidden",
  },
  sheetHandleZone: {
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetHandle: {
    width: 46,
    height: 5,
    borderRadius: 999,
    opacity: 0.45,
  },
  modalContent: {
    borderRadius: 20,
    borderWidth: 0.5,
    alignSelf: "center",
  },
  datePickerContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignSelf: "center",
    overflow: "hidden",
  },
  datePickerHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
  },
  datePickerSurface: {
    backgroundColor: "transparent",
  },
  datePickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  datePickerTitle: {
    fontWeight: "800",
    flex: 1,
  },
});

export const datePicker = StyleSheet.create({
  datePickerOverlay: {
    zIndex: 999,
    elevation: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 16,
  },
  datePickerPanel: {
    width: "100%",
  },
  datePickerHandle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    marginTop: 10,
    marginBottom: 10,
  },
});

export const toggle = StyleSheet.create({
  toggleButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  labelContainer: {
    flex: 1,
    minHeight: 40,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
});

// ── Moved from TransactionRowPreview.tsx ─────────────────────────────────────
export const previewStyles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 4,
    borderRadius: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingTop: 10,
    paddingBottom: 15,
  },
  left: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 15,
    flex: 1,
    minWidth: 0,
    paddingLeft: 14,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    position: "relative",
  },
  accountPill: {
    position: "absolute",
    right: -8,
    bottom: -8,
    width: 20,
    height: 20,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { flexShrink: 0, width: 22, textAlign: "center" },
  info: { flex: 1, minWidth: 0, gap: 4, paddingTop: 1 },
  name: { fontSize: 14, fontWeight: "600", letterSpacing: 0.1 },
  meta: { fontSize: 12, opacity: 0.84 },
  right: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 2,
    flexShrink: 0,
    minWidth: 50,
    paddingHorizontal: 14,
  },
  amountInfo: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 4,
    paddingTop: 1,
  },
  amount: { fontSize: 14, fontWeight: "600", letterSpacing: 0.2 },
  date: { fontSize: 12, opacity: 0.72 },
});
