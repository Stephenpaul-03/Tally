import React from "react";
import { Text, type MD3Theme } from "react-native-paper";

export function SectionLabel({ label, theme }: { label: string; theme: MD3Theme }) {
  return (
    <Text
      style={{
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1.1,
        textTransform: "uppercase",
        color: theme.colors.onSurfaceVariant,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 6,
        opacity: 0.6,
      }}
    >
      {label}
    </Text>
  );
}