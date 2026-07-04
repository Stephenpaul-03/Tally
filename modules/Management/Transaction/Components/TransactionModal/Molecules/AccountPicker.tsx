import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { useAccountManagement } from "@/hooks/use-account-manangement";
import { AccountManagementModal } from "@/modules/Management/Account/Index";
import { getAccountColor, getAccountIconName } from "@/utils/Helpers";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Keyboard, Pressable, View } from "react-native";
import { Text, useTheme, type MD3Theme } from "react-native-paper";
import { categoryPicker } from "../Styles";

interface AccountPickerProps {
  value: string;
  onChange: (v: string) => void;
  accountIcons: Record<string, string>;
  accountColors: Record<string, string>;
  isMobileLayout: boolean;
  maxWidth: number;
}

export function AccountPicker({
  value,
  onChange,
  accountIcons,
  accountColors,
  isMobileLayout,
  maxWidth,
}: AccountPickerProps) {
  const theme = useTheme<MD3Theme>();
  const { minimalIconsEnabled } = useAddonPrefs();
  const [open, setOpen] = useState(false);
  const accountManagement = useAccountManagement();

  const selectedIconName = value
    ? (getAccountIconName(value, accountIcons) as any)
    : undefined;
  const selectedColor = value
    ? minimalIconsEnabled
      ? theme.colors.primary
      : getAccountColor(value, accountColors)
    : undefined;

  return (
    <>
      <Pressable
        onPress={() => {
          Keyboard.dismiss();
          setOpen(true);
        }}
        style={categoryPicker.pressable}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            minWidth: 0,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: selectedColor
                ? `${selectedColor}22`
                : theme.colors.elevation.level3,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {selectedIconName ? (
              <MaterialCommunityIcons
                name={selectedIconName}
                size={16}
                color={
                  minimalIconsEnabled
                    ? theme.colors.primary
                    : (selectedColor ?? theme.colors.onSurfaceVariant)
                }
              />
            ) : (
              <MaterialCommunityIcons
                name="bank-outline"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
            )}
          </View>
          <Text
            variant="bodyMedium"
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
              flex: 1,
              minWidth: 0,
              color: value
                ? theme.colors.onSurface
                : theme.colors.onSurfaceVariant,
              opacity: value ? 1 : 0.5,
              fontWeight: value ? "600" : "400",
            }}
          >
            {value || "Select account"}
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={theme.colors.primary}
          />
        </View>
      </Pressable>

      <AccountManagementModal
        isOpen={open}
        onClose={() => setOpen(false)}
        management={accountManagement}
        selectedAccount={value}
        onSelectAccount={(account) => {
          onChange(account);
          setOpen(false);
        }}
      />
    </>
  );
}
