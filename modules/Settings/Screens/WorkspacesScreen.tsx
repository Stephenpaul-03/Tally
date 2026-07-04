import { AlertModal } from "@/components/alert/AlertModal";
import { SheetCard } from "@/components/SheetCard";
import { toast } from "@/components/toast/ToastProvider";
import { useAppDispatch, useAppSelector } from "@/hooks/Redux";
import type { Workspace } from "@/modules/Core/Repository/SQLiteRepo";
import {
  deleteWorkspaceAndReload,
  selectActiveWorkspaceId,
  selectWorkspaces,
  switchWorkspaceAndReload,
} from "@/modules/Core/Slices/WorkspaceSlice";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Text, useTheme } from "react-native-paper";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { SectionLabel } from "../Components/SectionLabel";
import { SettingsHeader } from "../Components/SettingsHeader";
import type { SettingsStackParamList } from "../Navigation";
import { SettingsStyles } from "../Styles";

export function WorkspacesScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const dispatch = useAppDispatch();
  const workspaces = useAppSelector(selectWorkspaces);
  const activeWorkspaceId = useAppSelector(selectActiveWorkspaceId);

  const [workspaceDeleteTarget, setWorkspaceDeleteTarget] =
    useState<Workspace | null>(null);
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);
  const [chargingWorkspaceId, setChargingWorkspaceId] = useState<string | null>(
    null,
  );
  const [switchingWorkspaceId, setSwitchingWorkspaceId] = useState<
    string | null
  >(null);
  const chargeProgress = React.useRef(new Animated.Value(0)).current;
  const splashScale = React.useRef(new Animated.Value(0)).current;
  const splashOpacity = React.useRef(new Animated.Value(0)).current;
  const switchCompletedRef = React.useRef(false);

  const splashSize = Math.max(width, height) * 2.4;
  const splashPosition = {
    left: width / 2 - splashSize / 2,
    top: height / 2 - splashSize / 2,
  };

  React.useEffect(() => {
    return () => {
      chargeProgress.stopAnimation();
      splashScale.stopAnimation();
      splashOpacity.stopAnimation();
    };
  }, [chargeProgress, splashOpacity, splashScale]);

  const openWorkspaceModal = () => {
    navigation.navigate({ name: "WorkspaceEdit", params: {} });
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

  const finishWorkspaceSwitch = React.useCallback(
    async (workspace: Workspace) => {
      setSwitchingWorkspaceId(workspace.id);
      splashScale.setValue(0);
      splashOpacity.setValue(1);

      Animated.timing(splashScale, {
        toValue: 1,
        duration: 760,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      await new Promise<void>((resolve) => setTimeout(resolve, 520));

      try {
        await dispatch(switchWorkspaceAndReload(workspace.id) as any);
      } catch {
        toast.error(`Couldn't switch to ${workspace.name}`);
      } finally {
        Animated.sequence([
          Animated.delay(260),
          Animated.timing(splashOpacity, {
            toValue: 0,
            duration: 420,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start(() => {
          setSwitchingWorkspaceId(null);
          switchCompletedRef.current = false;
          splashScale.setValue(0);
        });
      }
    },
    [dispatch, splashOpacity, splashScale],
  );

  const startWorkspaceSwitchCharge = React.useCallback(
    (workspace: Workspace, active: boolean) => {
      if (active || chargingWorkspaceId || switchingWorkspaceId) return;

      switchCompletedRef.current = false;
      setChargingWorkspaceId(workspace.id);
      chargeProgress.setValue(0);

      Animated.timing(chargeProgress, {
        toValue: 1,
        duration: 1100,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (!finished) return;
        switchCompletedRef.current = true;
        setChargingWorkspaceId(null);
        void finishWorkspaceSwitch(workspace);
      });
    },
    [
      chargeProgress,
      chargingWorkspaceId,
      finishWorkspaceSwitch,
      switchingWorkspaceId,
    ],
  );

  const cancelWorkspaceSwitchCharge = React.useCallback(() => {
    if (switchCompletedRef.current) return;

    chargeProgress.stopAnimation(() => {
      Animated.timing(chargeProgress, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start(() => setChargingWorkspaceId(null));
    });
  }, [chargeProgress]);

  return (
    <SafeAreaView
      style={[
        SettingsStyles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <SettingsHeader title="Workspaces" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={[
          SettingsStyles.scrollContent,
          { paddingBottom: 116 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel label="Workspaces" />
        {workspaces.map((workspace) => {
          const active = activeWorkspaceId === workspace.id;
          const canDelete = workspaces.length > 1 && !active;
          const charging = chargingWorkspaceId === workspace.id;
          return (
            <SheetCard
              key={workspace.id}
              theme={theme}
              style={{ marginBottom: 12 }}
            >
              {charging ? (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.chargeFill,
                    {
                      backgroundColor: workspace.color,
                      opacity: chargeProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.12, 0.3],
                      }),
                      width: chargeProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", "100%"],
                      }),
                    },
                  ]}
                />
              ) : null}
              <Pressable
                accessibilityHint={
                  active
                    ? `${workspace.name} is the active workspace`
                    : `Hold until the card fills to switch to ${workspace.name}`
                }
                accessibilityLabel={
                  active
                    ? `${workspace.name} workspace, active`
                    : `Hold to switch to ${workspace.name}`
                }
                onPressIn={() => startWorkspaceSwitchCharge(workspace, active)}
                onPressOut={cancelWorkspaceSwitchCharge}
                style={({ pressed }) => ({
                  opacity: pressed && !active ? 0.78 : 1,
                })}
              >
                <View style={styles.workspaceRow}>
                  <View
                    style={[
                      styles.workspaceIcon,
                      { backgroundColor: theme.colors.background },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={workspace.icon as any}
                      size={18}
                      color={workspace.color}
                    />
                  </View>

                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={[
                        SettingsStyles.rowTitle,
                        {
                          color: theme.colors.onSurface,
                          fontWeight: active ? "600" : "500",
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {workspace.name}
                    </Text>
                    <Text
                      style={[
                        SettingsStyles.rowSub,
                        { color: theme.colors.onSurfaceVariant, marginTop: 2 },
                      ]}
                      numberOfLines={1}
                    >
                      {workspace.ownerName || workspace.name}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.workspaceDivider,
                      { backgroundColor: theme.colors.outlineVariant },
                    ]}
                  />

                  <View style={styles.workspaceStatus}>
                    <Text
                      style={{
                        color: theme.colors.onSurface,
                        fontSize: 13,
                        fontWeight: "700",
                      }}
                    >
                      {workspace.currencyCode}
                    </Text>
                    <Text
                      style={{
                        fontSize: 10,
                        marginTop: 3,
                        color: active
                          ? theme.colors.primary
                          : theme.colors.onSurfaceVariant,
                        opacity: active ? 1 : 0.7,
                      }}
                    >
                      {active ? "Active" : "Hold to switch"}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.workspaceDivider,
                      { backgroundColor: theme.colors.outlineVariant },
                    ]}
                  />

                  <Pressable
                    accessibilityLabel={`Edit ${workspace.name}`}
                    hitSlop={8}
                    onPress={() => openEditWorkspaceModal(workspace)}
                    style={({ pressed }) => [
                      styles.workspaceActionButton,
                      { opacity: pressed ? 0.6 : 1 },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="pencil-outline"
                      size={15}
                      color={theme.colors.primary}
                    />
                  </Pressable>

                  <View
                    style={[
                      styles.workspaceDivider,
                      { backgroundColor: theme.colors.outlineVariant },
                    ]}
                  />

                  <Pressable
                    accessibilityLabel={`Delete ${workspace.name}`}
                    disabled={!canDelete}
                    hitSlop={8}
                    onPress={() => handleDeleteWorkspace(workspace)}
                    style={({ pressed }) => [
                      styles.workspaceActionButton,
                      { opacity: !canDelete ? 0.35 : pressed ? 0.6 : 1 },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={15}
                      color={theme.colors.error}
                    />
                  </Pressable>
                </View>
              </Pressable>
            </SheetCard>
          );
        })}
      </ScrollView>

      <View
        style={[
          styles.stickyAddWrap,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <Pressable
          onPress={openWorkspaceModal}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            borderRadius: 18,
            paddingVertical: 15,
            backgroundColor: theme.colors.primary,
            opacity: pressed ? 0.78 : 1,
          })}
        >
          <MaterialCommunityIcons
            name="plus"
            size={18}
            color={theme.colors.onPrimary}
          />
          <Text
            style={{
              color: theme.colors.onPrimary,
              fontSize: 14,
              fontWeight: "700",
            }}
          >
            Add Workspace
          </Text>
        </Pressable>
      </View>

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

      <Modal
        animationType="none"
        onRequestClose={() => {}}
        statusBarTranslucent
        transparent
        visible={Boolean(switchingWorkspaceId)}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.splash,
            {
              width: splashSize,
              height: splashSize,
              borderRadius: splashSize / 2,
              backgroundColor: theme.colors.primary,
              opacity: splashOpacity,
              transform: [{ scale: splashScale }],
              left: splashPosition.left,
              top: splashPosition.top,
            },
          ]}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  chargeFill: {
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
  },
  splash: {
    position: "absolute",
  },
  stickyAddWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 0,
    paddingTop: 8,
  },
  workspaceActionButton: {
    alignItems: "center",
    borderRadius: 9,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  workspaceDivider: {
    alignSelf: "stretch",
    flexShrink: 0,
    marginHorizontal: 4,
    width: StyleSheet.hairlineWidth,
  },
  workspaceIcon: {
    alignItems: "center",
    borderRadius: 11,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  workspaceRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  workspaceStatus: {
    alignItems: "center",
    flexShrink: 0,
    justifyContent: "center",
    width: 72,
  },
});
