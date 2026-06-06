import { AlertModal } from "@/components/alert/AlertModal";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { toast } from "@/components/toast/toast";
import { CustomColorPickerModal } from "@/modules/Common/Components/CategoryManagement/Molecules/ColorPickerModal";
import { ActionRow } from "@/modules/Common/Components/HeaderMenuModal/Molecules/ActionRow";
import { SheetCard } from "@/modules/Common/Components/SheetCard";
import { useAppDispatch, useAppSelector } from "@/modules/Common/Hooks/Redux";
import type { Workspace } from "@/modules/Common/Repository/SQLiteRepo";
import {
    createWorkspaceAndSwitch,
    deleteWorkspaceAndReload,
    selectActiveWorkspaceId,
    selectWorkspaces,
    switchWorkspaceAndReload,
    updateWorkspaceAsync,
} from "@/modules/Common/Slices/WorkspaceSlice";
import {
    getAccountIconOptions,
    getCategoryColorOptions,
} from "@/modules/Common/Utils/Helpers";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { SectionLabel } from "../Components/SectionLabel";
import { SettingsHeader } from "../Components/SettingsHeader";
import type { SettingsStackParamList } from "../Navigation";
import { SettingsStyles } from "../Styles";
import { WorkspaceEditScreen } from "./WorkspaceEditScreen";

const ICON_GRID = {
  columns: 6,
  itemSize: 42,
  iconSize: 18,
  spacing: 8,
  edgeInset: 0,
};

export function WorkspacesScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const dispatch = useAppDispatch();
  const workspaces = useAppSelector(selectWorkspaces);
  const activeWorkspaceId = useAppSelector(selectActiveWorkspaceId);

  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceIcon, setWorkspaceIcon] = useState("briefcase-outline");
  const [workspaceColor, setWorkspaceColor] = useState("#6366F1");
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(
    null,
  );
  const [showWorkspaceColorPicker, setShowWorkspaceColorPicker] =
    useState(false);
  const [workspaceDeleteTarget, setWorkspaceDeleteTarget] =
    useState<Workspace | null>(null);
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);

  const workspaceIconOptions = useMemo(
    () =>
      [
        ...new Set([
          "briefcase-outline",
          "home-outline",
          "account-outline",
          "account-group-outline",
          "heart-outline",
          "star-outline",
          "wallet-outline",
          "piggy-bank-outline",
          ...getAccountIconOptions(),
        ]),
      ].slice(0, 24),
    [],
  );
  const workspaceColorOptions = useMemo(() => getCategoryColorOptions(), []);

  const canSaveWorkspace = workspaceName.trim().length > 0;

  const resetWorkspaceForm = () => {
    setEditingWorkspace(null);
    setWorkspaceName("");
    setWorkspaceIcon("briefcase-outline");
    setWorkspaceColor("#6366F1");
  };

  const openWorkspaceModal = () => {
    resetWorkspaceForm();
    setWorkspaceModalOpen(true);
  };

  const openEditWorkspaceModal = (workspace: Workspace) => {
    setEditingWorkspace(workspace);
    setWorkspaceName(workspace.name);
    setWorkspaceIcon(workspace.icon);
    setWorkspaceColor(workspace.color);
    setWorkspaceModalOpen(true);
  };

  const closeWorkspaceModal = () => {
    setWorkspaceModalOpen(false);
  };

  const handleSaveWorkspace = async () => {
    if (!canSaveWorkspace) return;

    try {
      if (editingWorkspace) {
        await dispatch(
          updateWorkspaceAsync({
            id: editingWorkspace.id,
            data: {
              name: workspaceName,
              icon: workspaceIcon,
              color: workspaceColor,
            },
          }) as any,
        );
        toast.success(`${workspaceName.trim()} updated`);
      } else {
        const workspace = await dispatch(
          createWorkspaceAndSwitch({
            name: workspaceName,
            icon: workspaceIcon,
            color: workspaceColor,
          }) as any,
        );
        toast.success(`Switched to ${workspace.name}`);
      }
      closeWorkspaceModal();
      resetWorkspaceForm();
    } catch (error) {
      toast.error(
        editingWorkspace
          ? "Couldn't update workspace"
          : "Couldn't create workspace",
        error instanceof Error ? error.message : undefined,
      );
    }
  };

  const handleDeleteWorkspace = (workspace: Workspace) => {
    if (workspaces.length <= 1) {
      Alert.alert(
        "Can't delete workspace",
        "Tally needs at least one workspace.",
      );
      return;
    }
    setWorkspaceDeleteTarget(workspace);
  };

  const handleConfirmWorkspaceDelete = async () => {
    if (!workspaceDeleteTarget || isDeletingWorkspace) return false;

    try {
      setIsDeletingWorkspace(true);
      await dispatch(deleteWorkspaceAndReload(workspaceDeleteTarget.id) as any);
      toast.success(`${workspaceDeleteTarget.name} Workspace deleted`);
      setWorkspaceDeleteTarget(null);
      return true;
    } catch {
      toast.error("Couldn't delete workspace");
      return false;
    } finally {
      setIsDeletingWorkspace(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        SettingsStyles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <SettingsHeader title="Workspaces" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={SettingsStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel label="Workspaces" />
        <SheetCard theme={theme}>
          {workspaces.map((workspace, index) => {
            const active = activeWorkspaceId === workspace.id;
            const canDelete = workspaces.length > 1;
            return (
              <React.Fragment key={workspace.id}>
                <View style={[SettingsStyles.row]}>
                  <Pressable
                    onPress={() => {
                      if (active) return;
                      void dispatch(
                        switchWorkspaceAndReload(workspace.id) as any,
                      );
                    }}
                    style={({ pressed }) => [
                      SettingsStyles.rowLeft,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <View
                      style={[
                        SettingsStyles.rowIcon,
                        { backgroundColor: theme.colors.background },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={workspace.icon as any}
                        size={17}
                        color={workspace.color}
                      />
                    </View>
                    <View>
                      <Text
                        style={[
                          SettingsStyles.rowTitle,
                          {
                            color: theme.colors.onSurface,
                            fontWeight: active ? "600" : "500",
                          },
                        ]}
                      >
                        {workspace.name}
                      </Text>
                      <Text
                        style={[
                          SettingsStyles.rowSub,
                          { color: theme.colors.onSurfaceVariant },
                        ]}
                      >
                        {active
                          ? "Currently active workspace"
                          : "Tap to switch workspace"}
                      </Text>
                    </View>
                  </Pressable>
                  <View style={SettingsStyles.rowRight}>
                    {active ? (
                      <Text
                        style={[
                          SettingsStyles.badge,
                          {
                            color: theme.colors.primary,
                            backgroundColor: theme.colors.background,
                            borderColor: theme.colors.primary,
                          },
                        ]}
                      >
                        Active
                      </Text>
                    ) : null}
                    <Pressable
                      accessibilityLabel={`Edit ${workspace.name}`}
                      onPress={() => openEditWorkspaceModal(workspace)}
                      style={({ pressed }) => ({
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: theme.colors.surfaceVariant,
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <MaterialCommunityIcons
                        name="pencil-outline"
                        size={17}
                        color={theme.colors.onSurfaceVariant}
                      />
                    </Pressable>
                    {canDelete ? (
                      <Pressable
                        accessibilityLabel={`Delete ${workspace.name}`}
                        onPress={() => handleDeleteWorkspace(workspace)}
                        style={({ pressed }) => ({
                          width: 32,
                          height: 32,
                          borderRadius: 10,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: theme.colors.errorContainer,
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <MaterialCommunityIcons
                          name="delete-outline"
                          size={17}
                          color={theme.colors.error}
                        />
                      </Pressable>
                    ) : null}
                  </View>
                </View>
                {index < workspaces.length - 1 ? (
                  <View
                    style={[
                      SettingsStyles.rowDivider,
                      { backgroundColor: theme.colors.outlineVariant },
                    ]}
                  />
                ) : null}
              </React.Fragment>
            );
          })}
          <ActionRow
            description="Create a separate finance context"
            icon="plus"
            label="Add workspace"
            onPress={openWorkspaceModal}
            theme={theme}
          />
        </SheetCard>
      </ScrollView>

      <AnimatedPaperModal
        contentContainerStyle={{
          backgroundColor: theme.colors.elevation.level1,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          overflow: "hidden",
        }}
        onDismiss={closeWorkspaceModal}
        presentation="sheet"
        visible={workspaceModalOpen}
      >
        <View
          style={{ paddingTop: 12, paddingBottom: 4, alignItems: "center" }}
        >
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.colors.outlineVariant,
            }}
          />
        </View>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <WorkspaceEditScreen
            allColors={workspaceColorOptions}
            allIcons={workspaceIconOptions}
            background={theme.colors.elevation.level1}
            canSubmit={canSaveWorkspace}
            headerSubtitle={editingWorkspace?.name}
            iconGrid={ICON_GRID}
            isEditing={Boolean(editingWorkspace)}
            onChangeColor={setWorkspaceColor}
            onChangeIcon={setWorkspaceIcon}
            onChangeName={setWorkspaceName}
            onDelete={
              editingWorkspace
                ? () => handleDeleteWorkspace(editingWorkspace)
                : undefined
            }
            onSubmit={handleSaveWorkspace}
            renderHeader={({ title, subtitle }) => (
              <Text
                style={[
                  SettingsStyles.sectionLabel,
                  {
                    ...typography.editorial.sectionLabel,
                    color: theme.colors.onSurfaceVariant,
                    marginTop: 8,
                    marginBottom: 10,
                    fontSize: 22,
                    textAlign: "center",
                  },
                ]}
              >
                {title}
              </Text>
            )}
            theme={theme}
            workspaceColor={workspaceColor}
            workspaceIcon={workspaceIcon}
            workspaceName={workspaceName}
          />
        </ScrollView>
      </AnimatedPaperModal>

      {workspaceDeleteTarget ? (
        <AlertModal
          cancelLabel="Cancel"
          confirmDisabled={isDeletingWorkspace}
          confirmLabel="Slide to delete"
          confirmMode="slide"
          destructive
          icon="delete-alert-outline"
          isOpen={Boolean(workspaceDeleteTarget)}
          message="This will permanently delete the workspace."
          onCancel={() => setWorkspaceDeleteTarget(null)}
          onConfirm={handleConfirmWorkspaceDelete}
          onTertiary={() => {
            setWorkspaceDeleteTarget(null);
            navigation.navigate("Data");
          }}
          tertiaryLabel="Export"
          title={`Delete ${workspaceDeleteTarget.name}?`}
        />
      ) : null}

      <CustomColorPickerModal
        initialColor={workspaceColor}
        onDismiss={() => setShowWorkspaceColorPicker(false)}
        onSelect={setWorkspaceColor}
        theme={theme}
        visible={showWorkspaceColorPicker}
      />
    </SafeAreaView>
  );
}
