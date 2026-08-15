import { AlertModal } from "@/components/alert/AlertModal";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { toast } from "@/components/toast/ToastProvider";
import { useAppDispatch, useAppSelector } from "@/hooks/Redux";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import type { Workspace } from "@/modules/Core/Repository/SQLiteRepo";
import {
  deleteWorkspaceAndReload,
  fetchWorkspaces,
  selectActiveWorkspaceId,
  selectWorkspaces,
  switchWorkspaceAndReload,
} from "@/modules/Core/Slices/WorkspaceSlice";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { ActivityIndicator, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SettingsHeader } from "../Components/SettingsHeader";
import { SettingsStyles } from "../Styles";

type WorkspacesModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onOpenWorkspaceEdit: (workspace?: Workspace) => void;
};

export function WorkspacesModal({
  visible,
  onDismiss,
  onOpenWorkspaceEdit,
}: WorkspacesModalProps) {
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
  const firstSwipeableRef = React.useRef<any>(null);
  const workspaceHintPlayedRef = React.useRef(false);
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

  React.useEffect(() => {
    if (!visible || !interactionHintsEnabled) {
      workspaceHintPlayedRef.current = false;
      firstSwipeableRef.current?.close();
      return;
    }
    if (workspaceHintPlayedRef.current || visibleWorkspaces.length === 0) {
      return;
    }

    workspaceHintPlayedRef.current = true;
    const timers = [
      setTimeout(() => firstSwipeableRef.current?.openRight(), 520),
      setTimeout(() => firstSwipeableRef.current?.close(), 1500),
      setTimeout(() => firstSwipeableRef.current?.openLeft(), 1950),
      setTimeout(() => firstSwipeableRef.current?.close(), 2950),
    ];

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [interactionHintsEnabled, visible, visibleWorkspaces.length]);

  const openWorkspaceModal = () => {
    onOpenWorkspaceEdit();
  };

  const openEditWorkspaceModal = (workspace: Workspace) => {
    onOpenWorkspaceEdit(workspace);
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
      onPress={() => openEditWorkspaceModal(workspace)}
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
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onDismiss}
      presentation="sheet"
      contentContainerStyle={{
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: "92%",
        overflow: "hidden",
      }}
      keyboardAware
      includeBottomInset={false}
    >
      <View style={styles.handleWrap}>
        <View
          style={[
            styles.handle,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />
      </View>
      <SettingsHeader
        title="Workspaces"
        onBack={onDismiss}
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
            onPress={openWorkspaceModal}
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
              <ActivityIndicator color={theme.colors.primary} size="small" />
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
                  <View key={workspace.id} style={styles.swipeRowClip}>
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
                      renderLeftActions={() => renderDeleteAction(workspace)}
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
                          onPress={() => void finishWorkspaceSwitch(workspace)}
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
                              name={active ? "check-circle" : "circle-outline"}
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
    </AnimatedPaperModal>
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
