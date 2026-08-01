import { AlertModal } from "@/components/alert/AlertModal";
import { EntityEditLayout, type IconGrid } from "@/components/EntityEditLayout";
import {
  ACCOUNT_EXTRA_ICONS,
  CATEGORY_EXTRA_ICONS,
  MANAGEMENT_COLORS,
  MANAGEMENT_NAME_LIMIT,
} from "@/components/ManagementOptions";
import { toast } from "@/components/toast/ToastProvider";
import { useAppDispatch, useAppSelector } from "@/hooks/Redux";
import { useWorkspaceDefaults } from "@/hooks/use-workspace-defaults";
import { workspaceRepository } from "@/modules/Core/Repository/Index";
import {
  createWorkspaceAsync,
  deleteWorkspaceAndReload,
  selectActiveWorkspaceId,
  selectWorkspaces,
  switchWorkspaceAndReload,
  updateWorkspaceAsync,
} from "@/modules/Core/Slices/WorkspaceSlice";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  NavigationContext,
  NavigationRouteContext,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useMemo } from "react";
import { Alert } from "react-native";
import { TouchableRipple, useTheme, type MD3Theme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import type { SettingsStackParamList } from "../Navigation";

type Props = {
  workspaceName?: string;
  workspaceIcon?: string;
  workspaceColor?: string;
  onChangeName?: (v: string) => void;
  onChangeIcon?: (v: string) => void;
  onChangeColor?: (v: string) => void;

  allColors?: string[];
  allIcons?: string[];
  iconGrid?: IconGrid;

  isEditing?: boolean;
  canSubmit?: boolean;
  onSubmit?: () => void;

  onDelete?: () => void;

  headerTitle?: string;
  headerSubtitle?: string;
  onBack?: () => void;
  showHeader?: boolean;

  footer?: React.ReactNode;

  theme?: MD3Theme;
  background?: string;
};

const WORKSPACE_NAME_LIMIT = MANAGEMENT_NAME_LIMIT;

const DEFAULT_ICON_GRID = {
  columns: 6,
  itemSize: 42,
  iconSize: 18,
  spacing: 8,
  edgeInset: 0,
};

export function WorkspaceEditScreen(props: Props) {
  const paperTheme = useTheme();
  const theme = props.theme ?? paperTheme;
  const c = theme.colors;

  const route = React.useContext(NavigationRouteContext) as
    | RouteProp<SettingsStackParamList, "WorkspaceEdit">
    | undefined;
  const navigation = React.useContext(NavigationContext) as
    | NativeStackNavigationProp<SettingsStackParamList, "WorkspaceEdit">
    | undefined;

  const isNavScreen = Boolean(
    route && route.name === "WorkspaceEdit" && !props.workspaceName,
  );

  // Redux dispatch and select
  const dispatch = useAppDispatch();
  const workspaces = useAppSelector(selectWorkspaces);
  const activeWorkspaceId = useAppSelector(selectActiveWorkspaceId);
  const { getWorkspaceDefaults, setWorkspaceDefaults } = useWorkspaceDefaults();

  // Local state for Navigation Screen mode
  const paramWorkspace = route?.params?.workspace;
  const [localName, setLocalName] = React.useState(paramWorkspace?.name ?? "");
  const [localIcon, setLocalIcon] = React.useState(
    paramWorkspace?.icon ?? "briefcase-outline",
  );
  const [localColor, setLocalColor] = React.useState(
    paramWorkspace?.color ?? "#6366F1",
  );
  const [deleteTarget, setDeleteTarget] = React.useState<any | null>(null);
  const [showDeleteBlockedAlert, setShowDeleteBlockedAlert] =
    React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const workspaceIconOptions = useMemo(
    () =>
      [
        ...new Set([
          "briefcase-outline",
          ...ACCOUNT_EXTRA_ICONS,
          ...CATEGORY_EXTRA_ICONS,
        ]),
      ],
    [],
  );
  const workspaceColorOptions = useMemo(() => MANAGEMENT_COLORS, []);

  // Compute values based on mode
  const activeName = isNavScreen ? localName : (props.workspaceName ?? "");
  const activeIcon = isNavScreen
    ? localIcon
    : (props.workspaceIcon ?? "briefcase-outline");
  const activeColor = isNavScreen
    ? localColor
    : (props.workspaceColor ?? "#6366F1");
  const changeName = isNavScreen ? setLocalName : props.onChangeName;
  const changeIcon = isNavScreen ? setLocalIcon : props.onChangeIcon;
  const changeColor = isNavScreen ? setLocalColor : props.onChangeColor;

  const resolvedColors = props.allColors ?? workspaceColorOptions;
  const resolvedIcons = props.allIcons ?? workspaceIconOptions;
  const resolvedIconGrid = props.iconGrid ?? DEFAULT_ICON_GRID;
  const editingMode = isNavScreen
    ? Boolean(paramWorkspace)
    : Boolean(props.isEditing);
  const resolvedCanSubmit = isNavScreen
    ? localName.trim().length > 0
    : Boolean(props.canSubmit);

  const handleNavScreenSubmit = async () => {
    if (!localName.trim()) return;
    try {
      if (paramWorkspace) {
        await dispatch(
          updateWorkspaceAsync({
            id: paramWorkspace.id,
            data: {
              name: localName,
              icon: localIcon,
              color: localColor,
            },
          }) as any,
        );
        toast.success(`${localName.trim()} updated`);
      } else {
        const sourceWorkspaceId = activeWorkspaceId;
        const newWorkspace = await dispatch(
          createWorkspaceAsync({
            name: localName,
            icon: localIcon,
            color: localColor,
            seedDefaults: true,
          }) as any,
        ).unwrap();
        toast.success(`${newWorkspace.name} created`);
        Alert.alert(
          "Set up workspace",
          "Start fresh with onboarding, or copy accounts, categories, budgets, and defaults from your current workspace. Transactions are not copied.",
          [
            {
              text: "Onboarding",
              onPress: () => {
                void (async () => {
                  await dispatch(switchWorkspaceAndReload(newWorkspace.id) as any);
                  (navigation?.getParent() as any)?.navigate("Onboarding", {
                    mode: "workspace",
                    workspaceId: newWorkspace.id,
                  });
                })();
              },
            },
            {
              text: "Copy current",
              onPress: () => {
                void (async () => {
                  try {
                    await workspaceRepository.copyWorkspaceSetup(
                      sourceWorkspaceId,
                      newWorkspace.id,
                    );
                    setWorkspaceDefaults(
                      newWorkspace.id,
                      getWorkspaceDefaults(sourceWorkspaceId),
                    );
                    await dispatch(
                      switchWorkspaceAndReload(newWorkspace.id) as any,
                    );
                    toast.success("Workspace setup copied");
                  } catch {
                    toast.error("Couldn't copy workspace setup");
                  }
                })();
              },
            },
            {
              text: "Use defaults",
              style: "cancel",
              onPress: () => {
                void dispatch(switchWorkspaceAndReload(newWorkspace.id) as any);
              },
            },
          ],
        );
      }
      navigation?.goBack();
    } catch (error) {
      const fallback = paramWorkspace
        ? "Couldn't update workspace"
        : "Couldn't create workspace";
      toast.error(
        error instanceof Error ? `${fallback}: ${error.message}` : fallback,
      );
    }
  };

  const handleNavScreenDelete = () => {
    if (!paramWorkspace) return;
    if (workspaces.length <= 1) {
      setShowDeleteBlockedAlert(true);
      return;
    }
    setDeleteTarget(paramWorkspace);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeleting) return false;
    try {
      setIsDeleting(true);
      await dispatch(deleteWorkspaceAndReload(deleteTarget.id) as any);
      toast.success(`${deleteTarget.name} Workspace deleted`);
      setDeleteTarget(null);
      navigation?.goBack();
      return true;
    } catch {
      toast.error("Couldn't delete workspace");
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  const activeSubmit = isNavScreen ? handleNavScreenSubmit : props.onSubmit;
  const activeDelete = isNavScreen ? handleNavScreenDelete : props.onDelete;
  const activeOnBack = isNavScreen
    ? () => navigation?.goBack()
    : (props.onBack ?? (() => {}));

  const deleteAccessory = activeDelete ? (
    <TouchableRipple
      borderless
      onPress={activeDelete}
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

  const content = (
    <EntityEditLayout
      allColors={resolvedColors}
      allIcons={resolvedIcons}
      background={theme.colors.background}
      canSubmit={resolvedCanSubmit}
      deleteAccessory={deleteAccessory}
      emptyPreviewLabel="Workspace name"
      footer={props.footer}
      headerSubtitle={props.headerSubtitle}
      iconGrid={resolvedIconGrid}
      iconPickerVariant="account"
      isEditing={editingMode}
      localColor={activeColor}
      localIcon={activeIcon}
      localName={activeName}
      namePlaceholder="e.g. Business"
      nameLimit={WORKSPACE_NAME_LIMIT}
      onBack={activeOnBack}
      onChangeColor={changeColor!}
      onChangeIcon={changeIcon!}
      onChangeName={changeName!}
      onSubmit={activeSubmit!}
      showHeader={props.showHeader ?? true}
      submitLabelCreate="Create workspace"
      submitLabelEdit="Save changes"
      theme={theme}
    />
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {content}
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
          confirmDisabled={isDeleting}
          confirmLabel="Slide to delete"
          confirmMode="slide"
          destructive
          icon="delete-alert-outline"
          isOpen={Boolean(deleteTarget)}
          message="This will permanently delete the workspace."
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          title={`Delete ${deleteTarget.name}?`}
        />
      ) : null}
    </SafeAreaView>
  );
}
