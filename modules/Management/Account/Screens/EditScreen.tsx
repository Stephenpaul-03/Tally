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
  usedColors?: string[];
  usedIcons?: string[];
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
  presentation?: "screen" | "modal";
  visible?: boolean;
};

function AccountEditContent({
  management,
  localName,
  localIcon,
  localColor,
  allColors,
  allIcons,
  usedColors,
  usedIcons,
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
  presentation = "screen",
  visible = true,
}: Props) {
  const c = theme.colors;
  const wasEditingRef = React.useRef(false);
  const lastActivityCountRef = React.useRef(0);
  const wasProtectedRef = React.useRef(false);
  if (management.editingAccount) {
    wasEditingRef.current = true;
    lastActivityCountRef.current =
      management.accountStats[management.editingAccount.name]?.count ?? 0;
    wasProtectedRef.current = PROTECTED_ACCOUNTS.has(
      management.editingAccount.name,
    );
  }
  const isEditing =
    Boolean(management.editingAccount) || (!visible && wasEditingRef.current);
  const isProtected =
    management.editingAccount
      ? PROTECTED_ACCOUNTS.has(management.editingAccount.name)
      : !visible && wasProtectedRef.current;
  const activityCount = isEditing
    ? management.editingAccount
      ? (management.accountStats[management.editingAccount.name]?.count ?? 0)
      : lastActivityCountRef.current
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

  const closeAccessory = !hideCloseButton && presentation !== "modal" ? (
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
      usedColors={usedColors}
      usedIcons={usedIcons}
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
      presentation={presentation}
      submitLabelCreate="Add account"
      submitLabelEdit="Save changes"
      theme={theme}
      visible={visible}
    />
  );
}

type AccountEditScreenProps = Omit<
  Props,
  "hideCloseButton" | "presentation" | "visible"
>;

type AccountEditModalProps = Omit<Props, "presentation">;

export function AccountEditScreen(props: AccountEditScreenProps) {
  return (
    <AccountEditContent
      {...props}
      hideCloseButton
      presentation="screen"
      visible
    />
  );
}

export function AccountEditModal({
  visible = true,
  embedded = false,
  ...props
}: AccountEditModalProps & { embedded?: boolean }) {
  return (
    <AccountEditContent
      {...props}
      presentation={embedded ? "screen" : "modal"}
      visible={visible}
    />
  );
}
