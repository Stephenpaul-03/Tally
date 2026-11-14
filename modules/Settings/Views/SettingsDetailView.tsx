import React from "react";
import { View } from "react-native";

const contentWidths = { preferences: 680, form: 760, list: 840, grid: 1000 };

/** Bound reading and form widths independently of the tablet's screen width. */
export function SettingsDetailView({ kind, children }: {
  kind: keyof typeof contentWidths; children: React.ReactNode;
}) {
  return <View style={{ flex: 1, minHeight: 0, width: "100%", maxWidth: contentWidths[kind], alignSelf: "center" }}>
    {children}
  </View>;
}
