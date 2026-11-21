import React from "react";
import { View } from "react-native";
import { useTabletLayout } from "@/hooks/use-tablet-layout";
import { useTheme } from "react-native-paper";
import { SettingsDetailContext } from "../Layouts/SettingsDetailContext";

/** Sheet decoration belongs to modal presentation, never a detail page. */
export function SettingsSheetHandle() {
  const embedded = React.useContext(SettingsDetailContext);
  const theme = useTheme();
  const tablet = useTabletLayout();
  if (embedded || tablet) return null;
  return <View style={{ alignItems: "center", paddingTop: 10 }}>
    <View style={{ width: 42, height: 4, borderRadius: 999, backgroundColor: theme.colors.outlineVariant }} />
  </View>;
}
