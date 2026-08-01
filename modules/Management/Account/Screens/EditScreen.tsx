import { EntityEditLayout, type IconGrid } from "@/components/EntityEditLayout";
import { useAccountManagement } from "@/hooks/use-account-manangement";
import { formatActivityLabel } from "@/modules/Management/Category/Components/CategoryTile";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";
import { TouchableRipple, type MD3Theme } from "react-native-paper";
import { PROTECTED_ACCOUNTS } from "../Constants";

type Props = {
  management: ReturnType<typeof useAccountManagement>;
  localName: string;
  localIcon: string;
  localColor: string;
  allColors: string[];
  allIcons: string[];
  iconGrid: IconGrid;
  canSubmitEdit: boolean;
  onChangeName: (name: string) => void;
  onChangeIcon: (icon: string) => void;
  onChangeColor: (color: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  onClose: () => void;
  hideCloseButton?: boolean;
  footer?: React.ReactNode;
  theme: MD3Theme;
  background: string;
};

export function AccountEditScreen({
  management,
  localName,
  localIcon,
  localColor,
  allColors,
  allIcons,
  iconGrid,
  canSubmitEdit,
  onChangeName,
  onChangeIcon,
  onChangeColor,
  onSubmit,
  onBack,
  onClose,
  hideCloseButton = false,
  footer,
  theme,
  background,
}: Props) {
  const c = theme.colors;
  const isEditing = Boolean(management.editingAccount);
  const isProtected =
    isEditing && PROTECTED_ACCOUNTS.has(management.editingAccount!.name);
  const activityCount = isEditing
    ? (management.accountStats[management.editingAccount!.name]?.count ?? 0)
    : 0;

  const deleteAccessory =
    isEditing && !isProtected ? (
      <TouchableRipple
        borderless
        onPress={() =>
          management.handleRequestDeleteAccount(management.editingAccount!.name)
        }
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: c.errorContainer,
          borderWidth: 0.5,
          borderColor: `${c.error}55`,
        }}
      >
        <MaterialCommunityIcons
          name="delete-outline"
          size={18}
          color={c.error}
        />
      </TouchableRipple>
    ) : null;

  const closeAccessory = !hideCloseButton ? (
    <TouchableRipple
      borderless
      onPress={onClose}
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: c.surfaceVariant,
      }}
    >
      <MaterialCommunityIcons name="close" size={18} color={c.onSurface} />
    </TouchableRipple>
  ) : null;

  const headerAccessory =
    deleteAccessory || closeAccessory ? (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {deleteAccessory}
        {closeAccessory}
      </View>
    ) : undefined;

  return (
    <EntityEditLayout
      allColors={allColors}
      allIcons={allIcons}
      background={background}
      canSubmit={canSubmitEdit}
      deleteAccessory={headerAccessory}
      emptyPreviewLabel="Account name"
      footer={footer}
      headerSubtitle={formatActivityLabel(activityCount)}
      iconGrid={iconGrid}
      iconPickerVariant="account"
      isEditing={isEditing}
      localColor={localColor}
      localIcon={localIcon}
      localName={localName}
      namePlaceholder="e.g. HDFC Credit Card"
      onBack={onBack}
      onChangeColor={onChangeColor}
      onChangeIcon={onChangeIcon}
      onChangeName={onChangeName}
      onSubmit={onSubmit}
      submitLabelCreate="Add account"
      submitLabelEdit="Save changes"
      theme={theme}
    />
  );
}
