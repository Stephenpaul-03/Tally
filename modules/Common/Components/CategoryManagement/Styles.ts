import { StyleSheet } from "react-native";

export const CategoryManagementStyles = StyleSheet.create({
  dragHandleWrap: { alignItems: "center", paddingTop: 10, paddingBottom: 2 },
  dragHandle: { width: 34, height: 4, borderRadius: 2 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBtn: {
    width: 34,
    height: 34,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  headerBtnRound: { borderRadius: 17 },
  headerTitle: { fontSize: 17, fontWeight: "700", letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 12, marginTop: 1 },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 10,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
