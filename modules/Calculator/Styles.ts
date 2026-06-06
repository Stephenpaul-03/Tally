import { StyleSheet } from "react-native";

export const CalculatorStyles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
  },
  addBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  addBannerCopy: {
    flex: 1,
    minWidth: 0,
  },
  addBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  addBannerSubtitle: {
    marginTop: 2,
    fontSize: 12,
  },
  addBannerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  addBannerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addBannerButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  display: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: "flex-end",
    gap: 6,
  },
  expression: {
    fontSize: 18,
    letterSpacing: 0.3,
    opacity: 0.75,
  },
  result: {
    fontSize: 72,
    fontWeight: "200",
    letterSpacing: -2,
  },
  resultPressable: {
    alignSelf: "stretch",
    alignItems: "flex-end",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  buttons: {
    paddingHorizontal: 16,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    height: 76,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonWide: {
    flex: 2,
  },
  buttonWideTriple: {
    flex: 3,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: "400",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: 420,
    overflow: "hidden",
  },
  sheetHandleWrap: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 999,
  },
  sheetHeader: {
    paddingHorizontal: 18,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  historyList: {
    flexGrow: 0,
  },
  historyListContent: {
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  historyRow: {
    paddingVertical: 14,
    gap: 6,
  },
  historyEmpty: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    paddingTop: 8,
  },
});
