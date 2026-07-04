/**
 * Onboarding step — "Create your first workspace"
 *
 * Thin wrapper: owns no state, just passes onboarding props
 * down into WorkspaceEditScreen.
 */
import type { WorkspaceCurrency } from "@/components/CurrencyPickerField";
import { WorkspaceEditScreen } from "@/modules/Settings/Screens/WorkspaceEditScreen";
import React from "react";
import { View } from "react-native";
import { Text, type MD3Theme } from "react-native-paper";
import type { OnboardingStyles } from "../Styles";

type Props = {
  workspaceName: string;
  setWorkspaceName: (name: string) => void;
  workspaceIcon: string;
  setWorkspaceIcon: (icon: string) => void;
  workspaceColor: string;
  setWorkspaceColor: (color: string) => void;
  workspaceOwnerName: string;
  setWorkspaceOwnerName: (name: string) => void;
  workspaceCurrency: WorkspaceCurrency;
  setWorkspaceCurrency: (currency: WorkspaceCurrency) => void;
  workspaceIconOptions: string[];
  colorOptions: string[];
  setWorkspaceTouched: (touched: boolean) => void;
  isWorkspaceInvalid: boolean;
  styles: OnboardingStyles;
  theme: MD3Theme;
};

const ICON_GRID = {
  columns: 6,
  itemSize: 42,
  iconSize: 18,
  spacing: 8,
  edgeInset: 0,
};

export function WorkspaceScreen({
  workspaceName,
  setWorkspaceName,
  workspaceIcon,
  setWorkspaceIcon,
  workspaceColor,
  setWorkspaceColor,
  workspaceOwnerName,
  setWorkspaceOwnerName,
  workspaceCurrency,
  setWorkspaceCurrency,
  workspaceIconOptions,
  colorOptions,
  setWorkspaceTouched,
  isWorkspaceInvalid,
  styles,
  theme,
}: Props) {
  return (
    <View>
      <Text style={styles.compactTitle}>Create your first workspace</Text>
      <Text style={styles.compactDescription}>
        You can create and switch between multiple workspaces later from
        Settings → Workspaces.
      </Text>
      <WorkspaceEditScreen
        allColors={colorOptions}
        allIcons={workspaceIconOptions}
        background={theme.colors.background}
        canSubmit={!isWorkspaceInvalid && workspaceName.trim().length > 0}
        iconGrid={ICON_GRID}
        isEditing={false}
        onBack={() => {}}
        onChangeColor={setWorkspaceColor}
        onChangeCurrency={setWorkspaceCurrency}
        onChangeIcon={setWorkspaceIcon}
        onChangeName={(text) => {
          setWorkspaceName(text);
          if (text.trim()) setWorkspaceTouched(true);
        }}
        onChangeOwnerName={setWorkspaceOwnerName}
        onSubmit={() => {
          // Onboarding flow advances via its own Next button —
          // no submit action needed here; the parent handles progression.
        }}
        showHeader={false}
        // Hide the default footer save button; onboarding uses its own nav buttons
        footer={<View />}
        theme={theme}
        workspaceColor={workspaceColor}
        workspaceCurrency={workspaceCurrency}
        workspaceIcon={workspaceIcon}
        workspaceName={workspaceName}
        workspaceOwnerName={workspaceOwnerName}
      />
    </View>
  );
}
