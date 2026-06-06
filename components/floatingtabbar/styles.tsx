import { typography } from "@/theme/typography";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  floatingWrap: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  surface: {
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 3,
  },
  tabRowClip: {
    borderRadius: 999,
    overflow: "hidden",
  },
  edgeButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 3,
  },
  edgeButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  edgeButtonContentReverse: {
    flexDirection: "row-reverse",
  },
  edgeButtonLabel: {
    ...typography.editorial.sectionLabel,
    fontSize: 16,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
});
