import { typography } from "@/theme/typography";
import React from "react";
import { Text, useTheme } from "react-native-paper";

type Props = {
  label: string;
};

export function SectionLabel({ label }: Props) {
  const theme = useTheme();

  return (
    <Text
      style={[
        {
          paddingHorizontal: 40,
          ...typography.editorial.sectionLabel,
          fontSize: 14,
          color: theme.colors.onSurfaceVariant,
        },
      ]}
    >
      {label}
    </Text>
  );
}
