import options from "@/data/management-options.json";
import { useBreakpoint } from "@/hooks/use-breakpoints";
import { useCategoryManagement } from "@/hooks/use-category-manamgement";
import { CustomColorPickerModal } from "@/modules/Management/Category/Components/ColorPickerModal";
import { DeleteScreen } from "@/modules/Management/Category/Screens/DeleteScreen";
import { CategoryEditScreen } from "@/modules/Management/Category/Screens/EditScreen";
import { ListScreen } from "@/modules/Management/Category/Screens/ListScreen";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { SettingsHeader } from "../Components/SettingsHeader";
import type { SettingsStackParamList } from "../Navigation";

const NAME_LIMIT = 30;

export function CategoriesScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const { height, width, isMobileLayout: isMobile } = useBreakpoint();
  const management = useCategoryManagement("expense");
  const allColors = options.colors;
  const allIcons = options.categoryIcons;
  const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);
  const [localName, setLocalName] = useState(
    management.editingCategory?.name.slice(0, NAME_LIMIT) ?? "",
  );
  const [localIcon, setLocalIcon] = useState(
    management.editingCategory?.icon ??
      allIcons[0] ??
      "tag-outline",
  );
  const [localColor, setLocalColor] = useState(
    management.editingCategory?.color ??
      allColors[0] ??
      "#3B82F6",
  );
  const [localDest, setLocalDest] = useState("");

  useLayoutEffect(() => {
    if (!management.isEditOpen) return;
    if (management.editingCategory) {
      setLocalName(management.editingCategory.name.slice(0, NAME_LIMIT));
      setLocalIcon(management.editingCategory.icon);
      setLocalColor(management.editingCategory.color);
    } else {
      setLocalName("");
      setLocalIcon(allIcons[0] || "tag-outline");
      setLocalColor(allColors[0] || "#3B82F6");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [management.isEditOpen, management.editingCategory]);

  useEffect(() => {
    if (management.isDeleteOpen) setLocalDest("");
  }, [management.isDeleteOpen]);

  const fallbackName =
    management.selectedType === "income" ? "Other Income" : "Other Expense";
  const deletingName = management.deletingCategory?.name ?? "";
  const deletingType =
    management.deletingCategory?.type ?? management.selectedType;
  const deleteDestinations = useMemo(
    () => [
      ...management.activeCategories.filter(
        (category) => category !== deletingName && category !== fallbackName,
      ),
      ...management.activeCategories.filter(
        (category) => category !== deletingName && category === fallbackName,
      ),
    ],
    [deletingName, fallbackName, management.activeCategories],
  );

  const canSubmitEdit =
    localName.trim().length > 0 &&
    localName.trim().length <= NAME_LIMIT &&
    localIcon.length > 0 &&
    localColor.length > 0;
  const canConfirmDelete = Boolean(localDest) && localDest !== deletingName;

  const modalWidth = useMemo(() => Math.min(680, width - 48), [width]);
  const iconGrid = useMemo(() => {
    const outerPaddingX = 12 * 2;
    const pickerPaddingX = 10 * 2;
    const edgeInset = 2;
    const contentWidth = (isMobile ? width : modalWidth) - outerPaddingX;
    const availableWidth = Math.max(
      240,
      contentWidth - pickerPaddingX - edgeInset * 2,
    );
    const spacing = 8;
    const minSize = 34;
    const targetSize = 40;
    const maxColumns = 9;
    const minColumns = 5;
    let columns = Math.max(
      minColumns,
      Math.min(
        maxColumns,
        Math.floor((availableWidth + spacing) / (targetSize + spacing)),
      ),
    );
    let itemSize = Math.floor(
      (availableWidth - spacing * (columns - 1)) / columns,
    );
    while (columns > 3 && itemSize < minSize) {
      columns -= 1;
      itemSize = Math.floor(
        (availableWidth - spacing * (columns - 1)) / columns,
      );
    }
    const iconSize = Math.max(17, Math.floor(itemSize * 0.46));
    return { columns, itemSize, iconSize, spacing, edgeInset };
  }, [isMobile, modalWidth, width]);

  const listHeight = useMemo(() => {
    const base = isMobile ? 400 : 480;
    return Math.min(base, Math.max(200, height * (isMobile ? 0.38 : 0.48)));
  }, [height, isMobile]);

  const handleClose = () => {
    management.handleCloseManagement?.();
    navigation.goBack();
  };

  const handleBack = () => {
    if (management.isEditOpen) management.handleCloseEdit();
    if (management.isDeleteOpen) management.handleCancelDeleteCategory();
  };

  const handleSubmit = async () => {
    const saved = await management.handleSubmitCategory(
      localName.slice(0, NAME_LIMIT),
      localIcon,
      localColor,
    );
    if (saved) management.handleCloseEdit();
  };

  const handleConfirmDelete = () => {
    management.handleConfirmDeleteCategory(localDest);
  };

  const renderHeader = ({
    title,
    showBack = false,
    rightAccessory,
    rightAccessoryBeforeSearch,
    centerContent,
    hideBack = false,
    searchOpen,
    query,
    onQueryChange,
    onSearchOpenChange,
    searchPlaceholder,
  }: {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    rightAccessory?: React.ReactNode;
    rightAccessoryBeforeSearch?: React.ReactNode;
    centerContent?: React.ReactNode;
    hideBack?: boolean;
    searchOpen?: boolean;
    query?: string;
    onQueryChange?: (value: string) => void;
    onSearchOpenChange?: (value: boolean) => void;
    searchPlaceholder?: string;
  }) => (
    <SettingsHeader
      title={title}
      centerContent={centerContent}
      onBack={hideBack ? undefined : showBack ? handleBack : handleClose}
      rightAccessory={rightAccessory}
      rightAccessoryBeforeSearch={rightAccessoryBeforeSearch}
      searchOpen={searchOpen}
      query={query}
      onQueryChange={onQueryChange}
      onSearchOpenChange={onSearchOpenChange}
      searchPlaceholder={searchPlaceholder}
    />
  );

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
      }}
    >
      <CustomColorPickerModal
        visible={showCustomColorPicker}
        onDismiss={() => setShowCustomColorPicker(false)}
        onSelect={(color) => setLocalColor(color)}
        theme={theme}
        initialColor={localColor}
      />

      <ListScreen
        management={management}
        listHeight={listHeight}
        theme={theme}
        renderHeader={renderHeader}
        useSettingsHeader
      />

      <CategoryEditScreen
        visible={management.isEditOpen}
          management={management}
          localName={localName}
          setLocalName={setLocalName}
          localIcon={localIcon}
          setLocalIcon={setLocalIcon}
          localColor={localColor}
          setLocalColor={setLocalColor}
          allColors={allColors}
          allIcons={allIcons}
          iconGrid={iconGrid}
          canSubmitEdit={canSubmitEdit}
          bg={theme.colors.background}
          theme={theme}
          onSubmit={handleSubmit}
          onBack={handleBack}
          presentation="modal"
        />

      {management.isDeleteOpen ? (
        <DeleteScreen
          management={management}
          deletingName={deletingName}
          deletingType={deletingType}
          deleteDestinations={deleteDestinations}
          localDest={localDest}
          setLocalDest={setLocalDest}
          canConfirmDelete={canConfirmDelete}
          theme={theme}
          onConfirmDelete={handleConfirmDelete}
          renderHeader={renderHeader}
        />
      ) : null}
    </SafeAreaView>
  );
}
