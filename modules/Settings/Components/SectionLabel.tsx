import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { typography } from "@/theme/typography";
import React from "react";
import { useTheme } from "react-native-paper";
import { DesignText as Text } from "@/components/DesignText";

type Props = {
  label: string;
};

export function SectionLabel({ label }: Props) {
  const theme = useTheme<ExtendedMD3Theme>();

  return (
    <Text
      style={[
        {
          paddingHorizontal: 40,
          ...typography.editorial.sectionLabel,
          fontSize: 14,
          color: theme.expressive
            ? theme.colors.primary
            : theme.colors.onSurfaceVariant,
          ...(theme.expressive
            ? {
                paddingHorizontal: 24,
                paddingTop: 8,
                paddingBottom: 10,
                fontWeight: "700",
              }
            : {}),
        },
      ]}
    >
      {label}
    </Text>
  );
}
