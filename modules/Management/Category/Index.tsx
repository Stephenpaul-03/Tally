import options from "@/data/management-options.json";
import { BackButton } from "@/components/backbutton/BackButton";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { useBreakpoint } from "@/hooks/use-breakpoints";
import { useCategoryManagement } from "@/hooks/use-category-manamgement";
import { SettingsHeader } from "@/modules/Settings/Components/SettingsHeader";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Text, TouchableRipple, useTheme } from "react-native-paper";
import { CustomColorPickerModal } from "./Components/ColorPickerModal";
import { DeleteScreen } from "./Screens/DeleteScreen";
import { CategoryEditScreen as EditScreen } from "./Screens/EditScreen";
import { ListScreen } from "./Screens/ListScreen";
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
    allIcons[0] || "tag-outline",
  );
  const [localColor, setLocalColor] = useState(
    allColors[0] || "#3B82F6",
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
      setLocalIcon(allIcons[0] || "tag-outline");
      setLocalColor(allColors[0] || "#3B82F6");
    }
    setScreen("edit");
  }, [allColors, allIcons, management.editingCategory, management.isEditOpen]);

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

  // ── Shared header ────────────────────────────────────────────────────────────

  const renderHeader = ({
    title,
    subtitle,
    showBack = false,
    accentColor,
    iconName,
    rightAccessory,
    rightAccessoryBeforeSearch,
    searchOpen,
    query,
    onQueryChange,
    onSearchOpenChange,
    searchPlaceholder,
  }: {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    accentColor?: string;
    iconName?: string;
    rightAccessory?: React.ReactNode;
    rightAccessoryBeforeSearch?: React.ReactNode;
    searchOpen?: boolean;
    query?: string;
    onQueryChange?: (value: string) => void;
    onSearchOpenChange?: (value: boolean) => void;
    searchPlaceholder?: string;
  }) => (
    pickerMode ? (
      <SettingsHeader
        title={title}
        onBack={handleClose}
        query={query}
        onQueryChange={onQueryChange}
        searchOpen={searchOpen}
        onSearchOpenChange={onSearchOpenChange}
        searchPlaceholder={searchPlaceholder}
        rightAccessoryBeforeSearch={rightAccessoryBeforeSearch}
        modal
      />
    ) : (
      <View
        style={[
          CategoryManagementStyles.header,
          { borderBottomColor: divider },
        ]}
      >
        {showBack ? (
          <BackButton onPress={handleBack} theme={theme} size={34} />
        ) : (
          <View
            style={[
              CategoryManagementStyles.headerIconBadge,
              {
                backgroundColor: c.elevation.level1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={(iconName || "tag-multiple-outline") as any}
              size={17}
              color={accentColor || c.primary}
            />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text
            style={[
              CategoryManagementStyles.headerTitle,
              {
                ...typography.editorial.sectionLabel,
                fontSize: 18,
                color: c.onSurface,
              },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                CategoryManagementStyles.headerSubtitle,
                { color: c.onSurfaceVariant },
              ]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        {rightAccessory ?? null}
        <TouchableRipple
          onPress={handleClose}
          borderless
          style={[
            CategoryManagementStyles.headerBtn,
            CategoryManagementStyles.headerBtnRound,
            { backgroundColor: c.elevation.level1, borderColor: divider },
          ]}
        >
          <MaterialCommunityIcons
            name="close"
            size={17}
            color={c.onSurfaceVariant}
          />
        </TouchableRipple>
      </View>
    )
  );

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
          <ListScreen
            management={management}
            listHeight={listHeight}
            theme={theme}
            pickerMode={pickerMode}
            useSettingsHeader={pickerMode}
            selectedValue={selectedValue}
            onSelectCategory={handleSelectCategory}
            renderHeader={renderHeader}
          />
        ) : (
          <KeyboardAwareScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          {screen === "delete" && (
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
          )}
          </KeyboardAwareScrollView>
        )}

        <EditScreen
          visible={screen === "edit"}
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
          bg={bg}
          theme={theme}
          onSubmit={handleSubmit}
          onBack={handleBack}
          presentation="modal"
        />
      </AnimatedPaperModal>
    </>
  );
}
