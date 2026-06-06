import { BackButton } from "@/components/backbutton/BackButton";
import { typography } from "@/theme/typography";
import React from "react";
import { View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { SettingsStyles } from "../Styles";

type Props = {
  title?: string;
  onBack?: () => void;
};

export function SettingsHeader({ onBack, title = "Settings" }: Props) {
  const theme = useTheme();

  return (
    <View style={SettingsStyles.header}>
      {onBack ? (
        <BackButton onPress={onBack} theme={theme} size={34} />
      ) : (
        <View
          style={[
            SettingsStyles.backButton,
            { borderColor: "transparent", opacity: 0 },
          ]}
        />
      )}
      <Text
        style={[
          SettingsStyles.headerTitle,
          {
            ...typography.editorial.sectionLabel,
            color: theme.colors.onSurface,
          },
        ]}
      >
        {title}
      </Text>
    </View>
  );
}
