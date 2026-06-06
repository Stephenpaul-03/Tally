import { typography } from "@/theme/typography";
import React from "react";
import { Text, type MD3Theme } from "react-native-paper";

interface SheetSectionLabelProps {
  label: string;
  theme: MD3Theme;
}

export function SheetSectionLabel({ label, theme }: SheetSectionLabelProps) {
  return (
    <Text
      style={{
        textTransform: "uppercase",
        color: theme.colors.onSurfaceVariant,
        paddingHorizontal: 16,
        paddingTop: 16,
        opacity: 0.6,
        ...typography.editorial.sectionLabel,
        fontSize: 14,
      }}
    >
      {label}
    </Text>
  );
}
