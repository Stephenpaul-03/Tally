import { EntityEditLayout, type IconGrid } from "@/components/EntityEditLayout";
import { useCategoryManagement } from "@/hooks/use-category-manamgement";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { TouchableRipple, type MD3Theme } from "react-native-paper";

type Props = {
  management: ReturnType<typeof useCategoryManagement>;
  localName: string;
  setLocalName: (v: string) => void;
  localIcon: string;
  setLocalIcon: (v: string) => void;
  localColor: string;
  setLocalColor: (v: string) => void;
  allColors: string[];
  allIcons: string[];
  iconGrid: IconGrid;
  canSubmitEdit: boolean;
  bg: string;
  theme: MD3Theme;
  onSubmit: () => void;
  footer?: React.ReactNode;
  renderHeader: (opts: {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    accentColor?: string;
    iconName?: string;
    rightAccessory?: React.ReactNode;
  }) => React.ReactNode;
};

export function CategoryEditScreen({
  management,
  localName,
  setLocalName,
  localIcon,
  setLocalIcon,
  localColor,
  setLocalColor,
  allColors,
  allIcons,
  iconGrid,
  canSubmitEdit,
  bg,
  theme,
  onSubmit,
  footer,
  renderHeader,
}: Props) {
  const c = theme.colors;
  const isEditing = !!management.editingCategory;
  const editType = management.editingCategory?.type ?? management.selectedType;
  const editFallbackName =
    editType === "income" ? "Other Income" : "Other Expense";
  const canDelete =
    isEditing && management.editingCategory!.name !== editFallbackName;

  const deleteAccessory = canDelete ? (
    <TouchableRipple
      borderless
      onPress={() =>
        management.handleRequestDeleteCategory(management.editingCategory!.name)
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
      <MaterialCommunityIcons name="delete-outline" size={18} color={c.error} />
    </TouchableRipple>
  ) : null;

  return (
    <EntityEditLayout
      allColors={allColors}
      allIcons={allIcons}
      background={bg}
      canSubmit={canSubmitEdit}
      deleteAccessory={deleteAccessory}
      emptyPreviewLabel="Category name"
      footer={footer}
      iconGrid={iconGrid}
      iconPickerVariant="category"
      isEditing={isEditing}
      localColor={localColor}
      localIcon={localIcon}
      localName={localName}
      nameLabel="Category name"
      namePlaceholder="e.g. Groceries"
      onChangeColor={setLocalColor}
      onChangeIcon={setLocalIcon}
      onChangeName={setLocalName}
      onSubmit={onSubmit}
      renderHeader={(opts) =>
        renderHeader({
          ...opts,
          title: isEditing ? "Edit category" : `New ${editType} category`,
          subtitle: isEditing ? management.editingCategory!.name : undefined,
        })
      }
      submitLabelCreate="Add category"
      submitLabelEdit="Save changes"
      theme={theme}
    />
  );
}
