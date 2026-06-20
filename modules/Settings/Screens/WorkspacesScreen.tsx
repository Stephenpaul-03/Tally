import { ActionRow } from "@/components/ActionRow";
import { AlertModal } from "@/components/alert/AlertModal";
import { SheetCard } from "@/components/SheetCard";
import { toast } from "@/components/toast/ToastProvider";
import { useAppDispatch, useAppSelector } from "@/hooks/Redux";
import type { Workspace } from "@/modules/Data/Repository/SQLiteRepo";
import {
  deleteWorkspaceAndReload,
  selectActiveWorkspaceId,
  selectWorkspaces,
  switchWorkspaceAndReload,
} from "@/modules/Data/Slices/WorkspaceSlice";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { SectionLabel } from "../Components/SectionLabel";
import { SettingsHeader } from "../Components/SettingsHeader";
import type { SettingsStackParamList } from "../Navigation";
import { SettingsStyles } from "../Styles";

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

  const [workspaceDeleteTarget, setWorkspaceDeleteTarget] =
    useState<Workspace | null>(null);
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);

  const openWorkspaceModal = () => {
    navigation.navigate("WorkspaceEdit");
  };

  const openEditWorkspaceModal = (workspace: Workspace) => {
    navigation.navigate("WorkspaceEdit", { workspace });
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
    </SafeAreaView>
  );
}
