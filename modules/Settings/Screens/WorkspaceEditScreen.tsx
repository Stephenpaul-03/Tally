import {
    EntityEditLayout,
    type IconGrid,
} from "@/modules/Common/Components/EntityEditLayout";
import { MANAGEMENT_NAME_LIMIT } from "@/modules/Common/Components/ManagementOptions";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { TouchableRipple, type MD3Theme } from "react-native-paper";

/**
 * Shared form for both the onboarding workspace step and the
 * Settings → Workspaces create/edit modal.
 *
 * Callers own the state and pass it down; this component is
 * purely presentational (no Redux, no hooks beyond EntityEditLayout).
 */
type Props = {
  // Field values + setters
  workspaceName: string;
  workspaceIcon: string;
  workspaceColor: string;
  onChangeName: (v: string) => void;
  onChangeIcon: (v: string) => void;
  onChangeColor: (v: string) => void;

  // Options
  allColors: string[];
  allIcons: string[];
  iconGrid: IconGrid;

  // Mode
  isEditing: boolean;
  canSubmit: boolean;
  onSubmit: () => void;

  // Optional delete button — caller decides guard logic
  onDelete?: () => void;

  // Header title/subtitle — caller decides copy
  headerTitle?: string;
  headerSubtitle?: string;
  renderHeader: (opts: {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    rightAccessory?: React.ReactNode;
  }) => React.ReactNode;

  footer?: React.ReactNode;

  theme: MD3Theme;
  background: string;
};

const WORKSPACE_NAME_LIMIT = MANAGEMENT_NAME_LIMIT;

export function WorkspaceEditScreen({
  workspaceName,
  workspaceIcon,
  workspaceColor,
  onChangeName,
  onChangeIcon,
  onChangeColor,
  allColors,
  allIcons,
  iconGrid,
  isEditing,
  canSubmit,
  onSubmit,
  onDelete,
  headerTitle,
  headerSubtitle,
  renderHeader,
  footer,
  theme,
  background,
}: Props) {
  const c = theme.colors;

  const deleteAccessory = onDelete ? (
    <TouchableRipple
      borderless
      onPress={onDelete}
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
  ) : undefined;

  return (
    <EntityEditLayout
      allColors={allColors}
      allIcons={allIcons}
      background={background}
      canSubmit={canSubmit}
      deleteAccessory={deleteAccessory}
      emptyPreviewLabel="Workspace name"
      footer={footer}
      iconGrid={iconGrid}
      iconPickerVariant="account"
      isEditing={isEditing}
      localColor={workspaceColor}
      localIcon={workspaceIcon}
      localName={workspaceName}
      nameLabel="Workspace name"
      namePlaceholder="e.g. Business"
      nameLimit={WORKSPACE_NAME_LIMIT}
      onChangeColor={onChangeColor}
      onChangeIcon={onChangeIcon}
      onChangeName={onChangeName}
      onSubmit={onSubmit}
      renderHeader={(opts) =>
        renderHeader({
          ...opts,
          title:
            headerTitle ?? (isEditing ? "Edit workspace" : "New workspace"),
          subtitle: headerSubtitle,
        })
      }
      submitLabelCreate="Create workspace"
      submitLabelEdit="Save changes"
      theme={theme}
    />
  );
}
