import { SettingsCardEntranceProvider } from "@/components/animations/SettingsCardEntrance";
import React from "react";
import { View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Resolve route padding before drawing instead of applying native insets mid-push. */
export function SettingsPage({ style, ...props }: ViewProps) {
  const insets = useSafeAreaInsets();
  return (
    <SettingsCardEntranceProvider><View
      {...props}
      style={[
        { flex: 1 },
        style,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    /></SettingsCardEntranceProvider>
  );
}
