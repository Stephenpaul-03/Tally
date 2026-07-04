import { BackButton } from "@/components/backbutton/BackButton";
import { headerInsetCollapseAnimValue } from "@/components/toast/ToastProvider";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Animated, View } from "react-native";
import { Text, TouchableRipple, useTheme } from "react-native-paper";
import { SettingsStyles } from "../Styles";

type Props = {
  title?: string;
  onBack?: () => void;
  centerContent?: React.ReactNode;
  rightAccessory?: React.ReactNode;
  rightIcon?: string;
  onRightPress?: () => void;
  rightAccessibilityLabel?: string;
};

export function SettingsHeader({
  onBack,
  title = "Settings",
  centerContent,
  rightAccessory,
  rightIcon,
  onRightPress,
  rightAccessibilityLabel = "Header action",
}: Props) {
  const theme = useTheme();
  const rightAction =
    rightAccessory ??
    (rightIcon && onRightPress ? (
      <TouchableRipple
        onPress={onRightPress}
        borderless
        style={[
          SettingsStyles.backButton,
          {
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
        accessibilityLabel={rightAccessibilityLabel}
      >
        <MaterialCommunityIcons
          name={rightIcon as any}
          size={18}
          color={theme.colors.onSurface}
        />
      </TouchableRipple>
    ) : (
      <View style={SettingsStyles.headerActionPlaceholder} />
    ));

  return (
    <Animated.View
      style={[
        SettingsStyles.header,
        {
          paddingTop: headerInsetCollapseAnimValue.interpolate({
            inputRange: [0, 1],
            outputRange: [16, 0],
          }),
        },
      ]}
    >
      {onBack ? (
        <BackButton onPress={onBack} theme={theme} size={34} />
      ) : (
        <View
          style={[
            SettingsStyles.backButton,
            SettingsStyles.headerActionPlaceholder,
            { borderColor: "transparent", opacity: 0 },
          ]}
        />
      )}
      <View style={SettingsStyles.headerCenter}>
        {centerContent ? (
          centerContent
        ) : (
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
        )}
      </View>
      {rightAction}
    </Animated.View>
  );
}
