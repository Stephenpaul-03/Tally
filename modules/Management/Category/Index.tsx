import { AnimatedPaperModal } from "@/components/modal/modal";
import options from "@/data/management-options.json";
import { useBreakpoint } from "@/hooks/use-breakpoints";
import { useCategoryManagement } from "@/hooks/use-category-manamgement";
import React, { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useTheme } from "react-native-paper";
import { CustomColorPickerModal } from "./Components/ColorPickerModal";
import { CategoryDeleteModal } from "./Screens/DeleteScreen";
import { CategoryEditModal } from "./Screens/EditScreen";
import { CategoryListModal } from "./Screens/ListScreen";
import { CategoryManagementStyles } from "./Styles";

// ── Constants ─────────────────────────────────────────────────────────────────

// ── Types ─────────────────────────────────────────────────────────────────────

type Screen = "list" | "edit" | "delete";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  management: ReturnType<typeof useCategoryManagement>;
  pickerMode?: boolean;
  selectedValue?: string;
  onSelectCategory?: (name: string) => void;
}

export function CategoryManagementModal({
  isOpen,
  onClose,
  management,
  pickerMode = false,
  selectedValue,
  onSelectCategory,
}: Props) {
  const theme = useTheme();
  const { height, width, isMobileLayout: isMobile } = useBreakpoint();
  const allColors = options.colors;
  const allIcons = options.categoryIcons;

  const [screen, setScreen] = useState<Screen>("list");
  const [localName, setLocalName] = useState("");
  const [localIcon, setLocalIcon] = useState(
    management.iconOptions[0] || allIcons[0] || "tag-outline",
  );
  const [localColor, setLocalColor] = useState(
    allColors.find((color) => !management.usedColors.includes(color)) ||
      allColors[0] ||
      "#3B82F6",
  );
  const [localDest, setLocalDest] = useState("");
  const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);

  const c = theme.colors;
  const bg = c.background;
  const divider = c.outlineVariant;

  useEffect(() => {
    if (!management.isEditOpen) return;
    if (management.editingCategory) {
      setLocalName(management.editingCategory.name);
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
    setScreen("edit");
  }, [
    allColors,
    allIcons,
    management.editingCategory,
    management.iconOptions,
    management.isEditOpen,
    management.usedColors,
  ]);

  useEffect(() => {
    if (management.isDeleteOpen) {
      setLocalDest("");
      setScreen("delete");
    }
  }, [management.isDeleteOpen]);

  useEffect(() => {
    if (!management.isEditOpen && !management.isDeleteOpen) setScreen("list");
  }, [management.isEditOpen, management.isDeleteOpen]);

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

  const handleSelectCategory = (name: string) => {
    onSelectCategory?.(name);
    onClose();
  };

  const canSubmitEdit =
    localName.trim().length > 0 &&
    localIcon.length > 0 &&
    localColor.length > 0;
  const canConfirmDelete = Boolean(localDest) && localDest !== deletingName;

  const modalMaxHeight = useMemo(() => Math.max(height * 0.96, 540), [height]);
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

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleClose = () => {
    management.handleCloseEdit();
    management.handleCancelDeleteCategory?.();
    setScreen("list");
    onClose();
  };

  const handleBack = () => {
    if (screen === "edit") management.handleCloseEdit();
    if (screen === "delete") management.handleCancelDeleteCategory?.();
    setScreen("list");
  };

  const handleSubmit = async () => {
    const saved = await management.handleSubmitCategory(
      localName,
      localIcon,
      localColor,
    );
    if (saved) setScreen("list");
  };

  const handleConfirmDelete = () => {
    management.handleConfirmDeleteCategory(localDest);
    setScreen("list");
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <CustomColorPickerModal
        visible={showCustomColorPicker}
        onDismiss={() => setShowCustomColorPicker(false)}
        onSelect={(color) => setLocalColor(color)}
        theme={theme}
        initialColor={localColor}
      />
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
                borderTopLeftRadius: 40,
                borderTopRightRadius: 40,
                borderTopWidth: 0,
                overflow: "hidden",
              }
            : {
                alignSelf: "center",
                maxWidth: "95%",
                borderRadius: 24,
                borderWidth: 0,
                overflow: "hidden",
              },
          {
            backgroundColor: bg,
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

        {screen === "list" ? (
          <CategoryListModal
            management={management}
            listHeight={listHeight}
            theme={theme}
            pickerMode={pickerMode}
            selectedValue={selectedValue}
            onSelectCategory={handleSelectCategory}
            onBack={handleClose}
            onClose={handleClose}
          />
        ) : (
          <KeyboardAwareScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {screen === "delete" && (
              <CategoryDeleteModal
                embedded
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
            )}
          </KeyboardAwareScrollView>
        )}

        {screen === "edit" && (
          <CategoryEditModal
            embedded
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
            bg={bg}
            theme={theme}
            onSubmit={handleSubmit}
            onBack={handleBack}
          />
        )}
      </AnimatedPaperModal>
    </>
  );
}
