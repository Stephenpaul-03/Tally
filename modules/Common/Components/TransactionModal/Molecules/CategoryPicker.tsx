import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { CategoryManagementModal } from "@/modules/Common/Components/CategoryManagement/Index";
import { useCategoryManagement } from "@/modules/Common/Hooks/UseCategoryManagement";
import {
    getCategoryColor,
    getCategoryIconName,
} from "@/modules/Common/Utils/Helpers";
import { TransactionType } from "@/modules/Common/Utils/Types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Keyboard, Pressable, View } from "react-native";
import { Text, useTheme, type MD3Theme } from "react-native-paper";
import { categoryPicker } from "../Styles";

interface CategoryPickerProps {
  value: string;
  onChange: (v: string) => void;
  transactionType: TransactionType;
  categoryIcons: Record<string, string>;
  categoryColors: Record<string, string>;
  isMobileLayout: boolean;
  maxWidth: number;
}

export function CategoryPicker({
  value,
  onChange,
  transactionType,
  categoryIcons,
  categoryColors,
  isMobileLayout,
  maxWidth,
}: CategoryPickerProps) {
  const theme = useTheme<MD3Theme>();
  const { minimalIconsEnabled } = useAddonPrefs();
  const [open, setOpen] = useState(false);
  const categoryManagement = useCategoryManagement(transactionType);

  // Keep the management hook's selected type in sync with the transaction type
  React.useEffect(() => {
    categoryManagement.handleSelectType(transactionType);
  }, [transactionType, categoryManagement]);

  const selectedIconName = value
    ? (getCategoryIconName(value, transactionType, categoryIcons) as any)
    : undefined;
  const selectedColor = value
    ? minimalIconsEnabled
      ? theme.colors.primary
      : getCategoryColor(value, transactionType, categoryColors)
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
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
          ) : null}
          <Text
            variant="bodyMedium"
            style={{
              flex: 1,
              color: value
                ? theme.colors.onSurface
                : theme.colors.onSurfaceVariant,
              opacity: value ? 1 : 0.5,
            }}
          >
            {value || "Select category"}
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={theme.colors.primary}
          />
        </View>
      </Pressable>

      <CategoryManagementModal
        isOpen={open}
        onClose={() => setOpen(false)}
        management={categoryManagement}
        pickerMode
        selectedValue={value}
        onSelectCategory={(cat) => {
          onChange(cat);
          setOpen(false);
        }}
      />
    </>
  );
}
