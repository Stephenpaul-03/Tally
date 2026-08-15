import { AnimatedPaperModal } from "@/components/modal/modal";
import { CategoryManagementStyles } from "@/modules/Management/Category/Styles";
import React from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useTheme } from "react-native-paper";
import { useAccountModalState } from "./Hooks";
import { AccountDeleteScreen } from "./Screens/DeleteScreen";
import { AccountEditScreen } from "./Screens/EditScreen";
import { AccountListScreen } from "./Screens/ListScreen";
import type { AccountManagementModalProps } from "./Types";

export function AccountManagementModal({
  isOpen,
  onClose,
  management,
  selectedAccount,
  onSelectAccount,
}: AccountManagementModalProps) {
  const theme = useTheme();
  const c = theme.colors;
  const divider = c.outlineVariant;

  const {
    isMobile,
    modalMaxHeight,
    modalWidth,
    iconGrid,
    listHeight,
    screen,
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
  } = useAccountModalState(management, onClose);

  return (
    <AnimatedPaperModal
      visible={isOpen}
      onDismiss={handleClose}
      presentation={isMobile ? "sheet" : "modal"}
      escapeEnabled={screen === "list"}
      keyboardAware
      style={isMobile ? { justifyContent: "flex-end", margin: 0 } : undefined}
      contentContainerStyle={[
        isMobile
          ? {
              borderTopLeftRadius: 26,
              borderTopRightRadius: 26,
              borderTopWidth: 0.5,
              overflow: "hidden",
            }
          : {
              alignSelf: "center",
              maxWidth: "95%",
              borderRadius: 24,
              borderWidth: 0.5,
              overflow: "hidden",
            },
        {
          backgroundColor: c.background,
          maxHeight: modalMaxHeight,
          width: isMobile ? "100%" : modalWidth,
        },
      ]}
    >
      {isMobile && (
        <View style={CategoryManagementStyles.dragHandleWrap}>
          <View
            style={[
              CategoryManagementStyles.dragHandle,
              { backgroundColor: divider },
            ]}
          />
        </View>
      )}

      {screen === "list" && (
        <AccountListScreen
          management={management}
          selectedAccount={selectedAccount}
          onSelectAccount={onSelectAccount}
          listHeight={listHeight}
          onBack={onSelectAccount ? handleClose : handleBack}
          onClose={handleClose}
          theme={theme}
          useSettingsHeader={Boolean(onSelectAccount)}
        />
      )}

      {screen === "edit" ? (
        <KeyboardAwareScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AccountEditScreen
            visible
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
            theme={theme}
            background={c.background}
          />
        </KeyboardAwareScrollView>
      ) : null}

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
          theme={theme}
        />
      )}
    </AnimatedPaperModal>
  );
}
