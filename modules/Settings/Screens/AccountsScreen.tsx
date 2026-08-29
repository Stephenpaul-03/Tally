import { useAccountManagement } from "@/hooks/use-account-manangement";
import { useAccountModalState } from "@/modules/Management/Account/Hooks";
import { AccountDeleteModal } from "@/modules/Management/Account/Screens/DeleteScreen";
import { AccountEditModal } from "@/modules/Management/Account/Screens/EditScreen";
import { AccountListScreen } from "@/modules/Management/Account/Screens/ListScreen";
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
    localName,
    localIcon,
    localColor,
    allColors,
    allIcons,
    usedColors,
    usedIcons,
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
      <AccountListScreen
        management={management}
        listHeight={listHeight}
        onBack={handleClose}
        onClose={handleClose}
        theme={theme}
      />

      <AccountEditModal
        visible={screen === "edit"}
        management={management}
        localName={localName}
        localIcon={localIcon}
        localColor={localColor}
        allColors={allColors}
        allIcons={allIcons}
        usedColors={usedColors}
        usedIcons={usedIcons}
        iconGrid={iconGrid}
        canSubmitEdit={canSubmitEdit}
        onChangeName={setLocalName}
        onChangeIcon={setLocalIcon}
        onChangeColor={setLocalColor}
        onSubmit={handleSubmit}
        onBack={handleBack}
        onClose={handleBack}
        theme={theme}
        background={theme.colors.background}
      />

      <AccountDeleteModal
        visible={screen === "delete"}
        management={management}
        deletingName={deletingName}
        deleteDestinations={deleteDestinations}
        localDest={localDest}
        canConfirmDelete={canConfirmDelete}
        onSelectDest={setLocalDest}
        onConfirmDelete={handleConfirmDelete}
        onBack={handleBack}
        onClose={handleBack}
        theme={theme}
      />
    </SafeAreaView>
  );
}
