import React from "react";
import { View, useWindowDimensions } from "react-native";
import { useTheme } from "react-native-paper";
import { SettingsDetailContext } from "../Layouts/SettingsDetailContext";

/** Sheet decoration belongs to modal presentation, never a detail page. */
export function SettingsSheetHandle() {
  const embedded = React.useContext(SettingsDetailContext);
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  if (embedded || (Math.min(width, height) >= 600 && width >= 768)) return null;
  return <View style={{ alignItems: "center", paddingTop: 10 }}>
    <View style={{ width: 42, height: 4, borderRadius: 999, backgroundColor: theme.colors.outlineVariant }} />
  </View>;
}
