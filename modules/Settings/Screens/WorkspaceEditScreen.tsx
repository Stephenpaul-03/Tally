import { AlertModal } from "@/components/alert/AlertModal";
import { EntityEditLayout, type IconGrid } from "@/components/EntityEditLayout";
import { MANAGEMENT_NAME_LIMIT } from "@/components/ManagementOptions";
import { toast } from "@/components/toast/ToastProvider";
import { useAppDispatch, useAppSelector } from "@/hooks/Redux";
import {
  createWorkspaceAndSwitch,
  deleteWorkspaceAndReload,
  selectWorkspaces,
  updateWorkspaceAsync,
} from "@/modules/Data/Slices/WorkspaceSlice";
import { typography } from "@/theme/typography";
import {
  getAccountIconOptions,
  getCategoryColorOptions,
} from "@/utils/Helpers";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useMemo } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import {
  Text,
  TouchableRipple,
  useTheme,
  type MD3Theme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { SettingsHeader } from "../Components/SettingsHeader";
import type { SettingsStackParamList } from "../Navigation";
import { SettingsStyles } from "../Styles";

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
  renderHeader?: (opts: {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    rightAccessory?: React.ReactNode;
  }) => React.ReactNode;

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

  // React Navigation hooks
  let route: any = null;
  let navigation: any = null;
  try {
    route = useRoute<RouteProp<SettingsStackParamList, "WorkspaceEdit">>();
    navigation =
      useNavigation<
        NativeStackNavigationProp<SettingsStackParamList, "WorkspaceEdit">
      >();
  } catch (e) {
    // Hooks may fail if not inside a navigation context (unlikely but safe fallback)
  }

  const isNavScreen = Boolean(
    route && route.name === "WorkspaceEdit" && !props.workspaceName,
  );

  // Redux dispatch and select
  const dispatch = useAppDispatch();
  const workspaces = useAppSelector(selectWorkspaces);

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
  const [isDeleting, setIsDeleting] = React.useState(false);

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
        const newWorkspace = await dispatch(
          createWorkspaceAndSwitch({
            name: localName,
            icon: localIcon,
            color: localColor,
          }) as any,
        );
        toast.success(`Switched to ${newWorkspace.name}`);
      }
      navigation?.goBack();
    } catch (error) {
      toast.error(
        paramWorkspace
          ? "Couldn't update workspace"
          : "Couldn't create workspace",
        error instanceof Error ? error.message : undefined,
      );
    }
  };

  const handleNavScreenDelete = () => {
    if (!paramWorkspace) return;
    if (workspaces.length <= 1) {
      Alert.alert(
        "Can't delete workspace",
        "Tally needs at least one workspace.",
      );
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

  const submitButton = (
    <View style={{ flexDirection: "row", margin: 12, marginTop: "auto" }}>
      <Pressable
        disabled={!resolvedCanSubmit}
        onPress={activeSubmit}
        style={({ pressed }) => ({
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingVertical: 14,
          borderRadius: 14,
          backgroundColor: c.primary,
          opacity: pressed ? 0.65 : !resolvedCanSubmit ? 0.4 : 1,
        })}
      >
        <MaterialCommunityIcons
          color={c.onPrimary}
          name={editingMode ? "content-save-outline" : "plus"}
          size={18}
        />
        <Text
          style={{
            ...typography.editorial.sectionLabel,
            fontSize: 14,
            color: c.onPrimary,
          }}
        >
          {editingMode ? "Save changes" : "Create workspace"}
        </Text>
      </Pressable>
    </View>
  );

  const content = (
    <EntityEditLayout
      allColors={resolvedColors}
      allIcons={resolvedIcons}
      background={props.background ?? theme.colors.elevation.level1}
      canSubmit={resolvedCanSubmit}
      deleteAccessory={deleteAccessory}
      emptyPreviewLabel="Workspace name"
      footer={isNavScreen ? <View /> : props.footer}
      iconGrid={resolvedIconGrid}
      iconPickerVariant="account"
      isEditing={editingMode}
      localColor={activeColor}
      localIcon={activeIcon}
      localName={activeName}
      nameLabel="Workspace name"
      namePlaceholder="e.g. Business"
      nameLimit={WORKSPACE_NAME_LIMIT}
      onChangeColor={changeColor!}
      onChangeIcon={changeIcon!}
      onChangeName={changeName!}
      onSubmit={activeSubmit!}
      renderHeader={(opts) => {
        if (isNavScreen) return null;
        return (
          props.renderHeader?.({
            ...opts,
            title:
              props.headerTitle ??
              (editingMode ? "Edit workspace" : "New workspace"),
            subtitle: props.headerSubtitle,
          }) ?? null
        );
      }}
      submitLabelCreate="Create workspace"
      submitLabelEdit="Save changes"
      theme={theme}
    />
  );

  if (isNavScreen) {
    return (
      <SafeAreaView
        style={[
          SettingsStyles.safeArea,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <SettingsHeader
          title={paramWorkspace ? "Edit workspace" : "New workspace"}
          onBack={() => navigation?.goBack()}
          rightAccessory={deleteAccessory}
        />
        <ScrollView
          contentContainerStyle={[
            SettingsStyles.scrollContent,
            { paddingBottom: 20 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
        {submitButton}

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

  return content;
}
