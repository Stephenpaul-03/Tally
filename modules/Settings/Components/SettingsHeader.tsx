import { BackButton } from "@/components/backbutton/BackButton";
import { UniversalSearchBar } from "@/components/UniversalSearchBar";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";
import { Text, TouchableRipple, useTheme } from "react-native-paper";
import { SettingsStyles } from "../Styles";

type Props = {
  title?: string;
  onBack?: () => void;
  centerContent?: React.ReactNode;
  rightAccessory?: React.ReactNode;
  rightAccessoryBeforeSearch?: React.ReactNode;
  rightIcon?: string;
  onRightPress?: () => void;
  rightAccessibilityLabel?: string;
  searchOpen?: boolean;
  query?: string;
  onQueryChange?: (value: string) => void;
  onSearchOpenChange?: (value: boolean) => void;
  searchPlaceholder?: string;
  modal?: boolean;
};

export function SettingsHeader({
  onBack,
  title = "Settings",
  centerContent,
  rightAccessory,
  rightAccessoryBeforeSearch,
  rightIcon,
  onRightPress,
  rightAccessibilityLabel = "Header action",
  searchOpen = false,
  query = "",
  onQueryChange,
  onSearchOpenChange,
  searchPlaceholder,
  modal = false,
}: Props) {
  const theme = useTheme();
  const closeSearch = React.useCallback(() => {
    onQueryChange?.("");
    onSearchOpenChange?.(false);
  }, [onQueryChange, onSearchOpenChange]);
  const openSearch = React.useCallback(() => {
    onSearchOpenChange?.(true);
  }, [onSearchOpenChange]);
  const searchEnabled = Boolean(onQueryChange && onSearchOpenChange);
  const actionButtonStyle = [
    SettingsStyles.backButton,
    {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outlineVariant,
    },
  ];
  const searchAction = searchEnabled ? (
    <TouchableRipple
      onPress={openSearch}
      borderless
      style={actionButtonStyle}
      accessibilityLabel="Open search"
    >
      <MaterialCommunityIcons
        name="magnify"
        size={18}
        color={theme.colors.onSurface}
      />
    </TouchableRipple>
  ) : null;
  const rightAction =
    (searchEnabled ? (
      <View style={{ alignItems: "center", flexDirection: "row", gap: 8 }}>
        {rightAccessoryBeforeSearch ?? rightAccessory}
        {searchAction}
      </View>
    ) : null) ??
    rightAccessory ??
    (rightIcon && onRightPress ? (
      <TouchableRipple
        onPress={onRightPress}
        borderless
        style={actionButtonStyle}
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

  if (searchOpen && searchEnabled) {
    return (
      <View
        style={SettingsStyles.header}
      >
        <View style={SettingsStyles.headerCenter}>
          <UniversalSearchBar
            bg={theme.colors.background}
            value={query}
            onChangeText={onQueryChange!}
            placeholder={searchPlaceholder ?? `Search ${title.toLowerCase()}`}
            autoFocus
            containerStyle={{
              height: 32,
              borderRadius: 12,
              marginHorizontal: 0,
            }}
          />
        </View>
        <TouchableRipple
          onPress={closeSearch}
          borderless
          style={actionButtonStyle}
          accessibilityLabel="Close search"
        >
          <MaterialCommunityIcons
            name="close"
            size={18}
            color={theme.colors.onSurface}
          />
        </TouchableRipple>
      </View>
    );
  }

  return (
    <View
      style={SettingsStyles.header}
    >
      {onBack && !searchOpen ? (
        modal ? (
          <TouchableRipple
            onPress={onBack}
            borderless
            style={actionButtonStyle}
            accessibilityLabel="Close"
          >
            <MaterialCommunityIcons
              name="close"
              size={18}
              color={theme.colors.onSurface}
            />
          </TouchableRipple>
        ) : (
          <BackButton
            onPress={onBack}
            theme={theme}
            size={34}
            backgroundColor={theme.colors.surface}
          />
        )
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
    </View>
  );
}
