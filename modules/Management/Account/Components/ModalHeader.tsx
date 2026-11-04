import { tonalButtonSurface } from "@/theme/surfaceTreatment";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { BackButton } from "@/components/backbutton/BackButton";
import { CategoryManagementStyles } from "@/modules/Management/Category/Styles";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";
import type { MD3Theme } from "react-native-paper";
import { Text, TouchableRipple } from "react-native-paper";
interface AccountModalHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  hideCloseButton?: boolean;
  accentColor?: string;
  iconName?: string;
  rightAccessory?: React.ReactNode;
  onBack: () => void;
  onClose: () => void;
  theme: MD3Theme;
  modal?: boolean;
}

export function AccountModalHeader({
  title,
  subtitle,
  showBack = false,
  hideCloseButton = false,
  accentColor,
  iconName,
  rightAccessory,
  onBack,
  onClose,
  theme,
  modal = false,
}: AccountModalHeaderProps) {
  const c = theme.colors;
  const expressive = (theme as ExtendedMD3Theme).expressive;
  const divider = c.outlineVariant;

  return (
    <View
      style={[CategoryManagementStyles.header, { borderBottomColor: divider }]}
    >
      {showBack ? (
        modal ? (
          <TouchableRipple
            onPress={onBack}
            borderless
            style={[
              CategoryManagementStyles.headerBtn,
              CategoryManagementStyles.headerBtnRound,
              { backgroundColor: expressive ? tonalButtonSurface(theme) : tonalButtonSurface(theme, c.elevation.level1), borderColor: divider, ...(expressive ? { width: 44, height: 44, borderWidth: 0 } : {}) },
            ]}
            accessibilityLabel="Close"
          >
            <MaterialCommunityIcons
              name="close"
              size={expressive ? 21 : 20}
              color={c.onSurfaceVariant}
            />
          </TouchableRipple>
        ) : (
          <BackButton onPress={onBack} theme={theme} size={expressive ? 44 : 34} />
        )
      ) : (
        <View
          style={[
            CategoryManagementStyles.headerIconBadge,
            {
              backgroundColor: tonalButtonSurface(theme, c.elevation.level1),
            },
          ]}
        >
          <MaterialCommunityIcons
            name={(iconName || "wallet-outline") as any}
            size={expressive ? 21 : 17}
            color={accentColor || c.primary}
          />
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text
          style={[
            CategoryManagementStyles.headerTitle,
            {
              ...typography.editorial.sectionLabel,
              fontSize: 18,
              color: c.onSurface,
            },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[
              CategoryManagementStyles.headerSubtitle,
              { color: c.onSurfaceVariant },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {rightAccessory ?? null}

      {!hideCloseButton && !modal ? (
        <TouchableRipple
          onPress={onClose}
          borderless
          style={[
            CategoryManagementStyles.headerBtn,
            CategoryManagementStyles.headerBtnRound,
            { backgroundColor: expressive ? tonalButtonSurface(theme) : tonalButtonSurface(theme, c.elevation.level1), borderColor: divider, ...(expressive ? { width: 44, height: 44, borderWidth: 0 } : {}) },
          ]}
        >
          <MaterialCommunityIcons
            name="close"
            size={expressive ? 21 : 17}
            color={c.onSurfaceVariant}
          />
        </TouchableRipple>
      ) : null}
    </View>
  );
}
