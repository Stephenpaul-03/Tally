import { AlertModal } from "@/components/alert/AlertModal";
import { EntityEditLayout, type IconGrid } from "@/components/EntityEditLayout";
import { MANAGEMENT_NAME_LIMIT } from "@/components/ManagementOptions";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { toast } from "@/components/toast/ToastProvider";
import options from "@/data/management-options.json";
import { useAppDispatch, useAppSelector } from "@/hooks/Redux";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import type { Workspace } from "@/modules/Core/Repository/SQLiteRepo";
import {
  createWorkspaceAsync,
  deleteWorkspaceAndReload,
  fetchWorkspaces,
  selectActiveWorkspaceId,
  selectWorkspaces,
  switchWorkspaceAndReload,
  updateWorkspaceAsync,
} from "@/modules/Core/Slices/WorkspaceSlice";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import {
  ActivityIndicator,
  Text,
  TouchableRipple,
  useTheme,
  type MD3Theme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SettingsHeader } from "../Components/SettingsHeader";
import { SettingsStyles } from "../Styles";

type WorkspaceModalProps = {
  visible: boolean;
  onDismiss: () => void;
};

type WorkspaceEditorProps = {
  visible: boolean;
  workspace?: Workspace;
  onBack: () => void;
  theme: MD3Theme;
};

const WORKSPACE_NAME_LIMIT = MANAGEMENT_NAME_LIMIT;

const DEFAULT_ICON_GRID: IconGrid = {
  columns: 6,
  itemSize: 42,
  iconSize: 18,
  spacing: 8,
  edgeInset: 0,
};

let workspaceInteractionHintShown = false;

function WorkspaceEditor({
  visible,
  workspace,
  onBack,
  theme,
}: WorkspaceEditorProps) {
  const dispatch = useAppDispatch();
  const workspaces = useAppSelector(selectWorkspaces);
  const [localName, setLocalName] = useState(workspace?.name ?? "");
  const [localIcon, setLocalIcon] = useState(
    workspace?.icon ?? "briefcase-outline",
  );
  const [localColor, setLocalColor] = useState(workspace?.color ?? "#6366F1");
  const [deleteTarget, setDeleteTarget] = useState<Workspace | null>(null);
  const [showDeleteBlockedAlert, setShowDeleteBlockedAlert] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  React.useEffect(() => {
    setLocalName(workspace?.name ?? "");
    setLocalIcon(
      workspace?.icon ??
        [
          "briefcase-outline",
          ...options.accountIcons,
          ...options.categoryIcons,
        ].find(
          (icon) => !workspaces.some((item) => item.icon === icon),
        ) ??
        "briefcase-outline",
    );
    setLocalColor(
      workspace?.color ??
        options.colors.find(
          (color) => !workspaces.some((item) => item.color === color),
        ) ??
        "#6366F1",
    );
  }, [workspace, workspaces]);

  const workspaceIconOptions = useMemo(
    () => [
      ...new Set([
        "briefcase-outline",
        ...options.accountIcons,
        ...options.categoryIcons,
      ]),
    ],
    [],
  );
  const workspaceColorOptions = useMemo(() => options.colors, []);
  const usedWorkspaceIcons = useMemo(
    () =>
      workspaces
        .filter((item) => item.id !== workspace?.id)
        .map((item) => item.icon),
    [workspaces, workspace?.id],
  );
  const usedWorkspaceColors = useMemo(
    () =>
      workspaces
        .filter((item) => item.id !== workspace?.id)
        .map((item) => item.color),
    [workspaces, workspace?.id],
  );

  const handleSubmit = async () => {
    if (!localName.trim()) return;

    try {
      if (workspace) {
        await dispatch(
          updateWorkspaceAsync({
            id: workspace.id,
            data: { name: localName, icon: localIcon, color: localColor },
          }) as any,
        );
        toast.success(`${localName.trim()} updated`);
      } else {
        const newWorkspace = await dispatch(
          createWorkspaceAsync({
            name: localName,
            icon: localIcon,
            color: localColor,
            seedDefaults: true,
          }) as any,
        ).unwrap();
        toast.success(`${newWorkspace.name} created`);
      }
      onBack();
    } catch (error) {
      const fallback = workspace
        ? "Couldn't update workspace"
        : "Couldn't create workspace";
      toast.error(
        error instanceof Error ? `${fallback}: ${error.message}` : fallback,
      );
    }
  };

  const handleDelete = () => {
    if (!workspace) return;
    if (workspaces.length <= 1) {
      setShowDeleteBlockedAlert(true);
      return;
    }
    setDeleteTarget(workspace);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeleting) return false;
    try {
      setIsDeleting(true);
      await dispatch(deleteWorkspaceAndReload(deleteTarget.id) as any);
      toast.success(`${deleteTarget.name} workspace deleted`);
      setDeleteTarget(null);
      onBack();
      return true;
    } catch {
      toast.error("Couldn't delete workspace");
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteAccessory = workspace ? (
    <TouchableRipple
      borderless
      onPress={handleDelete}
      style={[
        styles.editorDeleteButton,
        {
          backgroundColor: theme.colors.errorContainer,
          borderColor: `${theme.colors.error}55`,
        },
      ]}
    >
      <MaterialCommunityIcons
        name="delete-outline"
        size={18}
        color={theme.colors.error}
      />
    </TouchableRipple>
  ) : undefined;

  return (
    <>
      <EntityEditLayout
        allColors={workspaceColorOptions}
        allIcons={workspaceIconOptions}
        usedColors={usedWorkspaceColors}
        usedIcons={usedWorkspaceIcons}
        background={theme.colors.background}
        canSubmit={localName.trim().length > 0}
        deleteAccessory={deleteAccessory}
        emptyPreviewLabel="Workspace name"
        iconGrid={DEFAULT_ICON_GRID}
        iconPickerVariant="account"
        isEditing={Boolean(workspace)}
        localColor={localColor}
        localIcon={localIcon}
        localName={localName}
        namePlaceholder="e.g. Business"
        nameLimit={WORKSPACE_NAME_LIMIT}
        onBack={onBack}
        onChangeColor={setLocalColor}
        onChangeIcon={setLocalIcon}
        onChangeName={setLocalName}
        onSubmit={() => void handleSubmit()}
        presentation="modal"
        submitLabelCreate="Create workspace"
        submitLabelEdit="Save changes"
        theme={theme}
        visible={visible}
      />
      <AlertModal
        confirmLabel="OK"
        icon="alert-circle-outline"
        isOpen={showDeleteBlockedAlert}
        message="Tally needs at least one workspace."
        onCancel={() => setShowDeleteBlockedAlert(false)}
        onConfirm={() => setShowDeleteBlockedAlert(false)}
        title="Can't delete workspace"
      />
      {deleteTarget ? (
        <AlertModal
          cancelLabel="Cancel"
          confirmDisabled={isDeleting}
          confirmLabel="Slide to delete"
          confirmMode="slide"
          destructive
          icon="delete-alert-outline"
          isOpen
          message="This will permanently delete the workspace."
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          title={`Delete ${deleteTarget.name}?`}
        />
      ) : null}
    </>
  );
}

export function WorkspaceModal({ visible, onDismiss }: WorkspaceModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { interactionHintsEnabled } = useAddonPrefs();
  const workspaces = useAppSelector(selectWorkspaces);
  const activeWorkspaceId = useAppSelector(selectActiveWorkspaceId);
  const workspacesLoading = useAppSelector(
    (state) => state.workspace.isLoading,
  );
  const workspacesError = useAppSelector((state) => state.workspace.error);

  const [switchingWorkspaceId, setSwitchingWorkspaceId] = useState<
    string | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<Workspace | null>(null);
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);
  const [showDeleteBlockedAlert, setShowDeleteBlockedAlert] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [workspaceToEdit, setWorkspaceToEdit] = useState<Workspace>();
  const firstSwipeableRef = React.useRef<any>(null);
  const workspaceHintTimersRef = React.useRef<ReturnType<typeof setTimeout>[]>(
    [],
  );
  const normalizedQuery = query.trim().toLowerCase();
  const visibleWorkspaces = normalizedQuery
    ? workspaces.filter((workspace) =>
        [
          workspace.name,
          workspace.ownerName,
          workspace.icon,
          activeWorkspaceId === workspace.id ? "active" : "",
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      )
    : workspaces;

  const stopWorkspaceHint = React.useCallback(() => {
    workspaceHintTimersRef.current.forEach((timer) => clearTimeout(timer));
    workspaceHintTimersRef.current = [];
    firstSwipeableRef.current?.close();
  }, []);

  React.useEffect(() => {
    if (!visible || !interactionHintsEnabled) {
      stopWorkspaceHint();
      return;
    }
    if (workspaceInteractionHintShown || visibleWorkspaces.length === 0) {
      return;
    }

    workspaceInteractionHintShown = true;
    const timers = [
      setTimeout(() => firstSwipeableRef.current?.openRight(), 520),
      setTimeout(() => firstSwipeableRef.current?.close(), 1500),
      setTimeout(() => firstSwipeableRef.current?.openLeft(), 1950),
      setTimeout(() => firstSwipeableRef.current?.close(), 2950),
    ];
    workspaceHintTimersRef.current = timers;

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [
    interactionHintsEnabled,
    stopWorkspaceHint,
    visible,
    visibleWorkspaces.length,
  ]);

  const openWorkspaceEditor = (workspace?: Workspace) => {
    setWorkspaceToEdit(workspace);
    setEditorOpen(true);
  };

  const closeWorkspaceEditor = () => {
    setEditorOpen(false);
    setWorkspaceToEdit(undefined);
  };

  const dismissModal = () => {
    closeWorkspaceEditor();
    onDismiss();
  };

  const handleDeleteWorkspace = (workspace: Workspace) => {
    if (workspaces.length <= 1) {
      setShowDeleteBlockedAlert(true);
      return;
    }
    setDeleteTarget(workspace);
  };

  const handleConfirmWorkspaceDelete = async () => {
    if (!deleteTarget || isDeletingWorkspace) return false;

    try {
      setIsDeletingWorkspace(true);
      await dispatch(deleteWorkspaceAndReload(deleteTarget.id) as any);
      toast.success(`${deleteTarget.name} workspace deleted`);
      setDeleteTarget(null);
      return true;
    } catch {
      toast.error("Couldn't delete workspace");
      return false;
    } finally {
      setIsDeletingWorkspace(false);
    }
  };

  React.useEffect(() => {
    if (visible) return;
    setQuery("");
    setSearchOpen(false);
    setEditorOpen(false);
    setWorkspaceToEdit(undefined);
  }, [visible]);

  React.useEffect(() => {
    if (!visible) return;

    void dispatch(fetchWorkspaces() as any);
  }, [dispatch, visible]);

  const finishWorkspaceSwitch = React.useCallback(
    async (workspace: Workspace) => {
      if (workspace.id === activeWorkspaceId || switchingWorkspaceId) return;
      setSwitchingWorkspaceId(workspace.id);

      try {
        await dispatch(switchWorkspaceAndReload(workspace.id) as any);
      } catch {
        // The active workspace is switched optimistically before reload work.
        // Avoid showing a false failure when follow-up refresh work rejects.
        console.log(
          `Workspace refresh after switching to ${workspace.name} failed`,
        );
      } finally {
        toast.success(`${workspace.name} workspace changed`);
        setSwitchingWorkspaceId(null);
      }
    },
    [activeWorkspaceId, dispatch, switchingWorkspaceId],
  );

  const renderEditAction = (workspace: Workspace) => (
    <Pressable
      accessibilityLabel={`Edit ${workspace.name}`}
      accessibilityRole="button"
      onPress={() => openWorkspaceEditor(workspace)}
      style={({ pressed }) => [
        styles.swipeAction,
        styles.swipeActionRight,
        {
          backgroundColor: theme.colors.primaryContainer,
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      <MaterialCommunityIcons
        name="pencil-outline"
        size={22}
        color={theme.colors.primary}
      />
    </Pressable>
  );

  const renderDeleteAction = (workspace: Workspace) => (
    <Pressable
      accessibilityLabel={`Delete ${workspace.name}`}
      accessibilityRole="button"
      onPress={() => handleDeleteWorkspace(workspace)}
      style={({ pressed }) => [
        styles.swipeAction,
        styles.swipeActionLeft,
        {
          backgroundColor: theme.colors.errorContainer,
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      <MaterialCommunityIcons
        name="delete-outline"
        size={22}
        color={theme.colors.error}
      />
    </Pressable>
  );

  return (
    <>
      <AnimatedPaperModal
      visible={visible && !editorOpen}
      onDismiss={dismissModal}
      presentation="sheet"
      contentContainerStyle={{
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: "92%",
        overflow: "hidden",
      }}
      keyboardAware
      includeBottomInset={true}
    >
      <View style={styles.handleWrap}>
        <View
          style={[
            styles.handle,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />
      </View>
      <>
          <SettingsHeader
            title="Workspaces"
            onBack={dismissModal}
            query={query}
            onQueryChange={setQuery}
            searchOpen={searchOpen}
            onSearchOpenChange={setSearchOpen}
            searchPlaceholder="Search workspaces"
            rightAccessoryBeforeSearch={
              <Pressable
                accessibilityLabel="Add workspace"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => openWorkspaceEditor()}
                style={({ pressed }) => ({
                  alignItems: "center",
                  backgroundColor: theme.colors.primary,
                  borderRadius: 16,
                  height: 32,
                  justifyContent: "center",
                  opacity: pressed ? 0.72 : 1,
                  width: 32,
                })}
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={18}
                  color={theme.colors.onPrimary}
                />
              </Pressable>
            }
            modal
          />
          <View style={styles.workspaceBody}>
            <KeyboardAwareScrollView
              bottomOffset={96 + insets.bottom}
              contentContainerStyle={[
                SettingsStyles.scrollContent,
                { paddingBottom: 24 + insets.bottom },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={styles.workspaceScroll}
            >
              {workspacesLoading && workspaces.length === 0 ? (
                <View
                  style={[
                    styles.emptySearch,
                    {
                      backgroundColor: theme.colors.elevation.level1,
                      borderColor: theme.colors.outlineVariant,
                    },
                  ]}
                >
                  <ActivityIndicator
                    color={theme.colors.primary}
                    size="small"
                  />
                  <Text
                    style={[
                      styles.emptySearchTitle,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    Loading workspaces
                  </Text>
                </View>
              ) : (
                <View style={styles.workspaceList}>
                  {visibleWorkspaces.map((workspace, workspaceIndex) => {
                    const active = activeWorkspaceId === workspace.id;
                    return (
                      <View
                        key={workspace.id}
                        onTouchStart={stopWorkspaceHint}
                        style={styles.swipeRowClip}
                      >
                        <Swipeable
                          ref={
                            workspaceIndex === 0
                              ? (instance) => {
                                  firstSwipeableRef.current = instance;
                                }
                              : undefined
                          }
                          animationOptions={{ speed: 5, bounciness: 0 }}
                          overshootLeft={false}
                          overshootRight={false}
                          renderLeftActions={() =>
                            renderDeleteAction(workspace)
                          }
                          renderRightActions={() => renderEditAction(workspace)}
                        >
                          <Pressable
                            accessibilityRole="button"
                            accessibilityState={{ selected: active }}
                            accessibilityLabel={
                              active
                                ? `${workspace.name} is selected`
                                : `Switch to ${workspace.name}`
                            }
                            disabled={active || Boolean(switchingWorkspaceId)}
                            onPressIn={stopWorkspaceHint}
                            onPress={() =>
                              void finishWorkspaceSwitch(workspace)
                            }
                            style={({ pressed }) => [
                              styles.workspaceRow,
                              {
                                backgroundColor: theme.colors.elevation.level1,
                                opacity: pressed ? 0.72 : 1,
                              },
                            ]}
                          >
                            <View style={styles.workspaceRowInner}>
                              <View
                                accessibilityLabel={`${workspace.name} workspace`}
                                style={styles.workspaceMainPressable}
                              >
                                <View style={styles.workspaceRowMain}>
                                  <View
                                    style={[
                                      styles.workspaceIcon,
                                      { backgroundColor: workspace.color },
                                    ]}
                                  >
                                    <MaterialCommunityIcons
                                      name={workspace.icon as any}
                                      size={22}
                                      color="#fff"
                                    />
                                  </View>

                                  <View style={styles.workspaceTextWrap}>
                                    <Text
                                      style={[
                                        styles.workspaceTitle,
                                        { color: theme.colors.onSurface },
                                      ]}
                                      numberOfLines={1}
                                    >
                                      {workspace.name}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                              <View style={styles.workspaceSelectIcon}>
                                <MaterialCommunityIcons
                                  name={
                                    active ? "check-circle" : "circle-outline"
                                  }
                                  size={20}
                                  color={
                                    active
                                      ? workspace.color
                                      : `${workspace.color}99`
                                  }
                                />
                              </View>
                            </View>
                          </Pressable>
                        </Swipeable>
                      </View>
                    );
                  })}
                </View>
              )}
              {!workspacesLoading && workspaces.length === 0 ? (
                <View
                  style={[
                    styles.emptySearch,
                    {
                      backgroundColor: theme.colors.elevation.level1,
                      borderColor: theme.colors.outlineVariant,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="briefcase-plus-outline"
                    size={24}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text
                    style={[
                      styles.emptySearchTitle,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    No workspaces yet
                  </Text>
                  <Text
                    style={[
                      styles.emptySearchText,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {workspacesError ??
                      "Create a workspace to start tracking here."}
                  </Text>
                </View>
              ) : null}
              {normalizedQuery &&
              workspaces.length > 0 &&
              visibleWorkspaces.length === 0 ? (
                <View
                  style={[
                    styles.emptySearch,
                    {
                      backgroundColor: theme.colors.elevation.level1,
                      borderColor: theme.colors.outlineVariant,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="magnify-close"
                    size={24}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text
                    style={[
                      styles.emptySearchTitle,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    No workspaces found
                  </Text>
                  <Text
                    style={[
                      styles.emptySearchText,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    Try another workspace name or owner.
                  </Text>
                </View>
              ) : null}
            </KeyboardAwareScrollView>
          </View>

          <AlertModal
            confirmLabel="OK"
            icon="alert-circle-outline"
            isOpen={showDeleteBlockedAlert}
            message="Tally needs at least one workspace."
            onCancel={() => setShowDeleteBlockedAlert(false)}
            onConfirm={() => {
              setShowDeleteBlockedAlert(false);
            }}
            title="Can't delete workspace"
          />
          {deleteTarget ? (
            <AlertModal
              cancelLabel="Cancel"
              confirmDisabled={isDeletingWorkspace}
              confirmLabel="Slide to delete"
              confirmMode="slide"
              destructive
              icon="delete-alert-outline"
              isOpen={Boolean(deleteTarget)}
              message="This will permanently delete the workspace."
              onCancel={() => setDeleteTarget(null)}
              onConfirm={handleConfirmWorkspaceDelete}
              title={`Delete ${deleteTarget.name}?`}
            />
          ) : null}
      </>
      </AnimatedPaperModal>
      <WorkspaceEditor
        onBack={closeWorkspaceEditor}
        theme={theme}
        visible={visible && editorOpen}
        workspace={workspaceToEdit}
      />
    </>
  );
}

const styles = StyleSheet.create({
  handle: {
    borderRadius: 999,
    height: 4,
    width: 42,
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: 10,
  },
  editorDeleteButton: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: 10,
    borderWidth: 0.5,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  emptySearch: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 0.5,
    gap: 6,
    marginHorizontal: 20,
    marginTop: 8,
    padding: 22,
  },
  emptySearchText: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
  emptySearchTitle: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
  workspaceList: {
    gap: 10,
    marginBottom: 20,
    marginHorizontal: 20,
  },
  workspaceBody: {
    flexShrink: 1,
    minHeight: 120,
  },
  workspaceScroll: {
    flexShrink: 1,
  },
  swipeAction: {
    alignItems: "center",
    height: "100%",
    justifyContent: "center",
    width: 80,
  },
  swipeActionLeft: {
    paddingRight: 16,
  },
  swipeActionRight: {
    paddingLeft: 16,
  },
  swipeRowClip: {
    borderRadius: 16,
    overflow: "hidden",
  },
  workspaceIcon: {
    alignItems: "center",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  workspaceRow: {
    minHeight: 72,
  },
  workspaceRowInner: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  workspaceSelectIcon: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  workspaceRowMain: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 14,
  },
  workspaceTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  workspaceMainPressable: {
    flex: 1,
  },
  workspaceTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
});
