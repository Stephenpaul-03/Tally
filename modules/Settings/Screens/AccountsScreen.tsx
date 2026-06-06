import { useAccountModalState } from "@/modules/Common/Components/AccountManagement/Hooks";
import { AccountDeleteScreen } from "@/modules/Common/Components/AccountManagement/Screens/DeleteScreen";
import { AccountEditScreen } from "@/modules/Common/Components/AccountManagement/Screens/EditScreen";
import { AccountListScreen } from "@/modules/Common/Components/AccountManagement/Screens/ListScreen";
import { useAccountManagement } from "@/modules/Common/Hooks/UseAccountManagement";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import type { SettingsStackParamList } from "../Navigation";

export function AccountsScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const management = useAccountManagement();

  const {
    iconGrid,
    listHeight,
    screen,
    reorderMode,
    setReorderMode,
    localName,
    localIcon,
    localColor,
    allColors,
    allIcons,
    canSubmitEdit,
    setLocalName,
    setLocalIcon,
    setLocalColor,
    deletingName,
    deleteDestinations,
    localDest,
    canConfirmDelete,
    setLocalDest,
    handleClose,
    handleBack,
    handleSubmit,
    handleConfirmDelete,
  } = useAccountModalState(management, () => navigation.goBack());

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
      }}
    >
      {screen === "list" && (
        <AccountListScreen
          management={management}
          showBack
          hideCloseButton
          listHeight={listHeight}
          reorderMode={reorderMode}
          onToggleReorderMode={() => setReorderMode((v) => !v)}
          onBack={handleClose}
          onClose={handleClose}
          theme={theme}
        />
      )}

      {screen === "edit" && (
        <AccountEditScreen
          management={management}
          localName={localName}
          localIcon={localIcon}
          localColor={localColor}
          allColors={allColors}
          allIcons={allIcons}
          iconGrid={iconGrid}
          canSubmitEdit={canSubmitEdit}
          onChangeName={setLocalName}
          onChangeIcon={setLocalIcon}
          onChangeColor={setLocalColor}
          onSubmit={handleSubmit}
          onBack={handleBack}
          onClose={handleClose}
          hideCloseButton
          theme={theme}
          background={theme.colors.background}
        />
      )}

      {screen === "delete" && (
        <AccountDeleteScreen
          management={management}
          deletingName={deletingName}
          deleteDestinations={deleteDestinations}
          localDest={localDest}
          canConfirmDelete={canConfirmDelete}
          onSelectDest={setLocalDest}
          onConfirmDelete={handleConfirmDelete}
          onBack={handleBack}
          onClose={handleClose}
          hideCloseButton
          theme={theme}
        />
      )}
    </SafeAreaView>
  );
}
