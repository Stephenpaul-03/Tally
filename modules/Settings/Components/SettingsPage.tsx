import { SettingsCardEntranceProvider } from "@/components/animations/SettingsCardEntrance";
import React from "react";
import { View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SettingsDetailContext } from "../Layouts/SettingsDetailContext";

/** Resolve route padding before drawing instead of applying native insets mid-push. */
export function SettingsPage({ style, ...props }: ViewProps) {
  const insets = useSafeAreaInsets();
  const embedded = React.useContext(SettingsDetailContext);
  return (
    <SettingsCardEntranceProvider><View
      {...props}
      style={[
        { flex: 1 },
        style,
        {
          paddingTop: embedded ? 0 : insets.top,
          paddingBottom: embedded ? 0 : insets.bottom,
          paddingLeft: embedded ? 0 : insets.left,
          paddingRight: embedded ? 0 : insets.right,
        },
      ]}
    /></SettingsCardEntranceProvider>
  );
}
