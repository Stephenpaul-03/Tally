import { tonalButtonSurface } from "@/theme/surfaceTreatment";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { BackButton } from "@/components/backbutton/BackButton";
import { UniversalSearchBar } from "@/components/UniversalSearchBar";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { TouchableRipple, useTheme } from "react-native-paper";
import { DesignText as Text } from "@/components/DesignText";
import { SettingsStyles } from "../Styles";
import { SettingsDetailContext } from "../Layouts/SettingsDetailContext";

type Props = {
  containerStyle?: StyleProp<ViewStyle>;
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
  containerStyle,
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
  const theme = useTheme<ExtendedMD3Theme>();
  const embedded = React.useContext(SettingsDetailContext);
  const paneHeaderStyle = embedded ? { paddingTop: 4, paddingBottom: 12 } : undefined;
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
      ...(theme.expressive ? { width: 44, height: 44, borderWidth: 0 } : {}),
      backgroundColor: theme.expressive
        ? tonalButtonSurface(theme)
        : theme.colors.surface,
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
        size={theme.expressive ? 21 : 18}
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
          size={theme.expressive ? 21 : 18}
          color={theme.colors.onSurface}
        />
      </TouchableRipple>
    ) : (
      <View
        style={[
          SettingsStyles.headerActionPlaceholder,
          theme.expressive && { width: 44, height: 44 },
        ]}
      />
    ));

  if (searchOpen && searchEnabled) {
    return (
      <View style={[SettingsStyles.header, paneHeaderStyle, containerStyle]}>
        <View style={SettingsStyles.headerCenter}>
          <UniversalSearchBar
            bg={theme.colors.background}
            value={query}
            onChangeText={onQueryChange!}
            placeholder={searchPlaceholder ?? `Search ${title.toLowerCase()}`}
            autoFocus
            containerStyle={{
              height: theme.expressive ? 48 : 32,
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
            size={theme.expressive ? 21 : 18}
            color={theme.colors.onSurface}
          />
        </TouchableRipple>
      </View>
    );
  }

  return (
    <View style={[SettingsStyles.header, paneHeaderStyle, containerStyle]}>
      {embedded ? null : onBack && !searchOpen ? (
        modal ? (
          <TouchableRipple
            onPress={onBack}
            borderless
            style={actionButtonStyle}
            accessibilityLabel="Close"
          >
            <MaterialCommunityIcons
              name="close"
              size={theme.expressive ? 21 : 18}
              color={theme.colors.onSurface}
            />
          </TouchableRipple>
        ) : (
          <BackButton
            onPress={onBack}
            theme={theme}
            size={theme.expressive ? 44 : 34}
            backgroundColor={
              theme.expressive
                ? tonalButtonSurface(theme)
                : theme.colors.surface
            }
          />
        )
      ) : (
        <View
          style={[
            SettingsStyles.backButton,
            SettingsStyles.headerActionPlaceholder,
            { borderColor: "transparent", opacity: 0 },
            theme.expressive && { width: 44, height: 44 },
          ]}
        />
      )}
      <View style={SettingsStyles.headerCenter}>
        {centerContent ? (
          centerContent
        ) : (
          <Text
            numberOfLines={theme.expressive ? 1 : undefined}
            adjustsFontSizeToFit={Boolean(theme.expressive)}
            minimumFontScale={0.65}
            style={[
              SettingsStyles.headerTitle,
              {
                ...typography.editorial.sectionLabel,
                color: theme.colors.onSurface,
                ...(theme.expressive
                  ? {
                      fontFamily: "Figtree-800",
                      fontSize: modal ? 24 : 36,
                      lineHeight: modal ? 32 : 44,
                      letterSpacing: -1,
                    }
                  : {}),
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
