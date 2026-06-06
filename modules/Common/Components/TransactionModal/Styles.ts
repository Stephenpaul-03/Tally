import { StyleSheet } from "react-native";

export const amountHero = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 2,
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 16,
  },
  label: {
    letterSpacing: 0.8,
    marginBottom: 6,
    opacity: 1,
    fontWeight: "800",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  symbol: {
    fontSize: 32,
    fontWeight: "500",
  },
  input: {
    flex: 1,
    fontSize: 48,
    fontWeight: "500",
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    paddingVertical: 0,
    minHeight: 48,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
    borderBottomWidth: 0.5,
  },
  headerTitle: {
    fontWeight: "800",
  },
  headerSubtitle: {
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingTop: 6,
    paddingBottom: 20,
    gap: 16,
  },
  detailsCard: {
    marginHorizontal: 16,
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
  notesCard: {
    marginHorizontal: 16,
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
  footer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
  },
  submitButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
  },
  submitButtonText: {
    fontWeight: "700",
    fontSize: 15,
  },
  deleteButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 0.5,
    alignItems: "center",
    justifyContent: "center",
  },
});

export const modal = StyleSheet.create({
  sheet: {
    justifyContent: "flex-end",
    margin: 0,
  },
  sheetContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 0.5,
    overflow: "hidden",
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginVertical: 12,
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
    marginHorizontal: 18,
    marginTop: 12,
    marginBottom: 2,
    borderRadius: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
    minWidth: 0,
    paddingLeft: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  info: { flex: 1, minWidth: 0, gap: 4 },
  name: { fontSize: 16, fontWeight: "600", letterSpacing: 0.1 },
  meta: { fontSize: 13, opacity: 0.84 },
  right: {
    alignItems: "flex-end",
    gap: 6,
    flexShrink: 0,
    paddingHorizontal: 14,
  },
  amount: { fontSize: 15, fontWeight: "600", letterSpacing: 0.2 },
  date: { fontSize: 12, opacity: 0.72 },
});
