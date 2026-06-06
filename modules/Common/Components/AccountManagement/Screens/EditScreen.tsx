import { useAccountManagement } from "@/modules/Common/Hooks/UseAccountManagement";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { TouchableRipple, type MD3Theme } from "react-native-paper";
import { EntityEditLayout, type IconGrid } from "../../EntityEditLayout";
import { PROTECTED_ACCOUNTS } from "../Constants";
import { AccountModalHeader } from "../Molecules/ModalHeader";

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

  return (
    <EntityEditLayout
      allColors={allColors}
      allIcons={allIcons}
      background={background}
      canSubmit={canSubmitEdit}
      deleteAccessory={deleteAccessory}
      emptyPreviewLabel="Account name"
      footer={footer}
      iconGrid={iconGrid}
      iconPickerVariant="account"
      isEditing={isEditing}
      localColor={localColor}
      localIcon={localIcon}
      localName={localName}
      nameLabel="Account name"
      namePlaceholder="e.g. HDFC Credit Card"
      onChangeColor={onChangeColor}
      onChangeIcon={onChangeIcon}
      onChangeName={onChangeName}
      onSubmit={onSubmit}
      renderHeader={({ rightAccessory }) => (
        <AccountModalHeader
          hideCloseButton={hideCloseButton}
          onBack={onBack}
          onClose={onClose}
          rightAccessory={rightAccessory}
          showBack
          subtitle={management.editingAccount?.name}
          theme={theme}
          title={isEditing ? "Edit account" : "New account"}
        />
      )}
      submitLabelCreate="Add account"
      submitLabelEdit="Save changes"
      theme={theme}
    />
  );
}
