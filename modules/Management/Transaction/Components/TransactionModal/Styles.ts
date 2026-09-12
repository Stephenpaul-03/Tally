import { StyleSheet } from "react-native";
import type { MD3Theme } from "react-native-paper";

export const withAlpha = (color: string, alpha: number) => {
  if (!color.startsWith("#")) return color;
  return `${color}${Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0")}`;
};

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
    marginBottom: 18,
  },
  currencyButton: {
    minWidth: 48,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
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
  amountDivider: {
    height: 1,
    marginBottom: 18,
  },
});

export const fieldRow = StyleSheet.create({
  inner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 2,
    borderBottomWidth: 0,
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
    borderBottomWidth: 0,
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
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
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
    width: 42,
    height: 4,
    borderRadius: 999,
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

export const createMainContentStyles = (colors: MD3Theme["colors"]) =>
  StyleSheet.create({
    keyboardView: {
      flexShrink: 1,
    },
    iosShell: {
      backgroundColor: "transparent",
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 18,
      position: "relative",
      overflow: "hidden",
    },
    iosBackdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    iosTopBar: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 16,
    },
    iosTopSpacer: {
      height: 54,
      width: 54,
    },
    iosCircleButton: {
      alignItems: "center",
      backgroundColor: colors.elevation.level1,
      borderColor: colors.outlineVariant,
      borderRadius: 26,
      borderWidth: 0,
      height: 54,
      justifyContent: "center",
      width: 54,
    },
    iosSegmentedControl: {
      alignItems: "center",
      backgroundColor: colors.surfaceVariant,
      borderColor: colors.outlineVariant,
      borderRadius: 26,
      borderWidth: 12,
      flexDirection: "row",
      gap: 6,
      justifyContent: "center",
      minHeight: 54,
      padding: 6,
    },
    iosSegmentButton: {
      alignItems: "center",
      borderRadius: 26,
      flexDirection: "row",
      gap: 8,
      justifyContent: "center",
      minHeight: 42,
      minWidth: 42,
      paddingHorizontal: 14,
    },
    iosSegmentSelected: {
      backgroundColor: colors.primaryContainer,
    },
    iosSegmentText: {
      color: colors.onSurface,
      fontSize: 15,
      fontWeight: "800",
      lineHeight: 19,
    },
    iosSegmentIcon: {
      alignItems: "center",
      backgroundColor: colors.secondaryContainer,
      borderRadius: 18,
      height: 36,
      justifyContent: "center",
      width: 36,
    },
    iosCard: {
      backgroundColor: colors.surface,
      borderRadius: 26,
      gap: 10,
      padding: 20,
      elevation: 4,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 12,
    },
    iosAccountRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
    iosAccountPill: {
      alignItems: "center",
      backgroundColor: colors.elevation.level1,
      borderColor: colors.outlineVariant,
      borderRadius: 26,
      flexDirection: "row",
      gap: 10,
      minHeight: 54,
      minWidth: 40,
      paddingLeft: 8,
      paddingRight: 14,
    },
    iosAccountIcon: {
      alignItems: "center",
      borderRadius: 18,
      height: 38,
      justifyContent: "center",
      width: 38,
    },
    iosAccountText: {
      minWidth: 0,
    },
    iosAccountName: {
      color: colors.onSurface,
      fontSize: 14,
      fontWeight: "800",
      lineHeight: 18,
    },
    iosCategoryPill: {
      alignItems: "center",
      backgroundColor: colors.elevation.level1,
      borderColor: colors.outlineVariant,
      borderRadius: 26,
      flexDirection: "row",
      gap: 8,
      maxWidth: "60%",
      minHeight: 54,
      paddingLeft: 8,
      paddingRight: 14,
    },
    iosCategoryIcon: {
      alignItems: "center",
      borderRadius: 17,
      height: 34,
      justifyContent: "center",
      width: 34,
    },
    iosCategoryText: {
      color: colors.onSurface,
      flexShrink: 1,
      fontSize: 14,
      fontWeight: "800",
      lineHeight: 18,
    },
    iosAmountWrap: {
      alignItems: "center",
      gap: 2,
      paddingTop: 15,
      paddingBottom: 15,
    },
    iosAmount: {
      color: colors.onSurface,
      fontSize: 64,
      fontWeight: "800",
      letterSpacing: 0,
      lineHeight: 74,
      textAlign: "center",
    },
    iosConvertedPill: {
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: colors.surfaceVariant,
      flexDirection: "row",
      gap: 6,
      overflow: "hidden",
      paddingHorizontal: 12,
    },
    iosNotePillInput: {
      backgroundColor: "transparent",
      flex: 1,
      fontSize: 13,
      fontWeight: "200",
      height: 24,
      lineHeight: 16,
      minWidth: 0,
      paddingHorizontal: 2,
    },
    iosUtilityRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 10,
    },
    iosDatePill: {
      alignItems: "center",
      backgroundColor: colors.surfaceVariant,
      borderColor: colors.outlineVariant,
      borderRadius: 26,
      borderWidth: 0,
      flexDirection: "row",
      gap: 8,
      height: 54,
      paddingHorizontal: 14,
    },
    iosDateText: {
      color: colors.onSurface,
      fontSize: 16,
      fontWeight: "800",
      lineHeight: 20,
      paddingVertical: 10,
    },
    iosUtilityButton: {
      alignItems: "center",
      backgroundColor: colors.surfaceVariant,
      borderColor: colors.outlineVariant,
      borderRadius: 26,
      borderWidth: 1,
      height: 48,
      justifyContent: "center",
      width: 48,
    },
    iosUtilityButtonRight: {
      marginLeft: "auto",
    },
    iosTitleInput: {
      backgroundColor: colors.elevation.level1,
      borderRadius: 14,
      color: colors.onSurface,
      flex: 1,
      fontSize: 13,
      fontWeight: "400",
      height: 48,
    },
    iosTitleOutline: {
      borderRadius: 14,
      borderWidth: 0,
    },
    iosNotesInput: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 26,
      color: colors.onSurface,
      fontSize: 14,
      minHeight: 44,
      paddingHorizontal: 14,
    },
    iosKeypad: {
      gap: 7,
      marginHorizontal: 0,
      paddingHorizontal: 0,
    },
    iosKeypadRow: {
      flexDirection: "row",
      gap: 7,
    },
    iosKey: {
      alignItems: "center",
      backgroundColor: colors.elevation.level1,
      borderRadius: 14,
      flex: 1,
      height: 57,
      justifyContent: "center",
      minWidth: 0,
    },
    iosKeyBlank: {
      backgroundColor: "transparent",
    },
    iosClearKey: {
      backgroundColor: withAlpha(colors.errorContainer, 0.72),
      borderColor: colors.error,
      borderWidth: 0,
    },
    iosClearKeyText: {
      color: colors.error,
      fontSize: 24,
      fontWeight: "900",
      lineHeight: 29,
    },
    iosKeyText: {
      color: colors.onSurface,
      fontSize: 26,
      fontWeight: "500",
      lineHeight: 31,
    },
    iosBottomRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
      minHeight: 54,
    },
    iosSaveButton: {
      alignItems: "center",
      backgroundColor: colors.primary,
      borderRadius: 26,
      height: 54,
      minWidth: 88,
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    iosSaveButtonText: {
      color: colors.onPrimary,
      fontSize: 17,
      fontWeight: "800",
      lineHeight: 21,
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
      // borderWidth: 0.5,
      padding: 14,
      gap: 8,
    },
    fullWidthSelectionRow: {
      marginHorizontal: 20,
      borderRadius: 0,
      borderWidth: 0,
      borderBottomWidth: 0,
      paddingHorizontal: 0,
      paddingTop: 10,
      paddingBottom: 14,
      gap: 14,
    },
    stackedLabel: {
      letterSpacing: 0.8,
      fontWeight: "800",
      opacity: 1,
    },
    // ── Inline field card (Title, Notes, Date — each its own card) ────────────
    inlineFieldCard: {
      marginHorizontal: 20,
      borderRadius: 0,
      borderWidth: 0,
      borderBottomWidth: 0,
      paddingHorizontal: 14,
      paddingVertical: 0,
      gap: 10,
    },
    inlineFieldBody: {
      paddingBottom: 14,
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
      letterSpacing: 0.8,
      fontWeight: "800",
      opacity: 1,
    },
    inlineFieldLabelOptional: {
      fontWeight: "400",
      fontSize: 13,
      opacity: 0.5,
    },
    inlineFieldValue: {
      fontSize: 18,
      backgroundColor: "transparent",
      paddingHorizontal: 0,
      paddingVertical: 0,
      minHeight: 32,
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
      borderBottomWidth: 0,
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
    borderTopWidth: 0,
    overflow: "hidden",
  },
  sheetHandleZone: {
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 999,
    opacity: 0.45,
  },
  modalContent: {
    borderRadius: 20,
    borderWidth: 0,
    alignSelf: "center",
  },
  datePickerContent: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignSelf: "center",
    overflow: "hidden",
  },
  datePickerHandle: {
    width: 42,
    height: 4,
    borderRadius: 999,
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
    borderRadius: 16,
  },
  datePickerPanel: {
    width: "100%",
  },
  datePickerHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
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
