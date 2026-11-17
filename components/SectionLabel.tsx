import { typography } from "@/theme/typography";
import React from "react";
import { Text, useTheme } from "react-native-paper";
import { SettingsDetailContext } from "@/modules/Settings/Layouts/SettingsDetailContext";
import { SectionLabel as SettingsSectionLabel } from "@/modules/Settings/Components/SectionLabel";

type Props = {
  label: string;
};

export function SectionLabel({ label }: Props) {
  const theme = useTheme();
  const embedded = React.useContext(SettingsDetailContext);
  if (embedded) return <SettingsSectionLabel label={label} />;

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
