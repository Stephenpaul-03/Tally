import options from "@/data/management-options.json";
import { useBreakpoint } from "@/hooks/use-breakpoints";
import { useCategoryManagement } from "@/hooks/use-category-manamgement";
import { CustomColorPickerModal } from "@/modules/Management/Category/Components/ColorPickerModal";
import { CategoryDeleteModal } from "@/modules/Management/Category/Screens/DeleteScreen";
import { CategoryEditModal } from "@/modules/Management/Category/Screens/EditScreen";
import { CategoryListScreen } from "@/modules/Management/Category/Screens/ListScreen";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
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
      management.iconOptions[0] ??
      allIcons[0] ??
      "tag-outline",
  );
  const [localColor, setLocalColor] = useState(
    management.editingCategory?.color ??
      allColors.find((color) => !management.usedColors.includes(color)) ??
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
      setLocalIcon(management.iconOptions[0] || allIcons[0] || "tag-outline");
      setLocalColor(
        allColors.find((color) => !management.usedColors.includes(color)) ||
          allColors[0] ||
          "#3B82F6",
      );
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
  const canConfirmDelete = !management.isDeleting && (management.deleteAffectCount === 0 || (Boolean(localDest) && localDest !== deletingName));

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

      <CategoryListScreen
        management={management}
        listHeight={listHeight}
        theme={theme}
        onBack={handleClose}
      />

      <CategoryEditModal
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
        usedColors={management.usedColors}
        usedIcons={management.usedIcons}
        iconGrid={iconGrid}
        canSubmitEdit={canSubmitEdit}
        bg={theme.colors.background}
        theme={theme}
        onSubmit={handleSubmit}
        onBack={handleBack}
      />

      <CategoryDeleteModal
        visible={management.isDeleteOpen}
        management={management}
        deletingName={deletingName}
        deletingType={deletingType}
        deleteDestinations={deleteDestinations}
        localDest={localDest}
        setLocalDest={setLocalDest}
        canConfirmDelete={canConfirmDelete}
        theme={theme}
        onConfirmDelete={handleConfirmDelete}
        onBack={handleBack}
      />
    </SafeAreaView>
  );
}
