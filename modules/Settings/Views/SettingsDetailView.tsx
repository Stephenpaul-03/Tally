import React from "react";
import { SettingsLayoutView } from "../Components/SettingsLayoutView";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SettingsDetailWidthContext } from "../Layouts/SettingsDetailContext";

const contentWidths = { preferences: 760, form: 760, list: 840, grid: 1000 };

/** Bound reading and form widths independently of the tablet's screen width. */
export function SettingsDetailView({ kind, children }: {
  kind: keyof typeof contentWidths; children: React.ReactNode;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const detailRatio = width > height ? 0.7 : 0.6;
  const detailWidth = Math.min(contentWidths[kind], (width - insets.left - insets.right) * detailRatio);
  return <SettingsDetailWidthContext.Provider value={detailWidth}>
  <SettingsLayoutView style={{ flex: 1, minHeight: 0, width: "100%", maxWidth: contentWidths[kind], alignSelf: "center" }}>
    {children}
  </SettingsLayoutView>
  </SettingsDetailWidthContext.Provider>;
}
