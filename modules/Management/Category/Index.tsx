import { BackButton } from "@/components/backbutton/BackButton";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { useBreakpoint } from "@/hooks/use-breakpoints";
import { useCategoryManagement } from "@/hooks/use-category-manamgement";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { Text, TouchableRipple, useTheme } from "react-native-paper";
import { CustomColorPickerModal } from "./Components/ColorPickerModal";
import { DeleteScreen } from "./Screens/DeleteScreen";
import { CategoryEditScreen as EditScreen } from "./Screens/EditScreen";
import { ListScreen } from "./Screens/ListScreen";
import { CategoryManagementStyles } from "./Styles";

// ── Constants ─────────────────────────────────────────────────────────────────

const EXTRA_COLORS = [
  "#EF4444",
  "#F97316",
  "#F59E0B",
  "#EAB308",
  "#84CC16",
  "#22C55E",
  "#10B981",
  "#14B8A6",
  "#06B6D4",
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#A855F7",
  "#EC4899",
  "#F43F5E",
  "#64748B",
  "#78716C",
  "#1D4ED8",
  "#047857",
  "#B45309",
  "#7C3AED",
  "#DB2777",
  "#0E7490",
  "#065F46",
];

const EXTRA_ICONS = [
  "cash",
  "credit-card-outline",
  "bank-outline",
  "wallet-outline",
  "currency-usd",
  "chart-line",
  "trending-up",
  "trending-down",
  "piggy-bank-outline",
  "safe-square-outline",
  "food-outline",
  "coffee-outline",
  "beer-outline",
  "pizza",
  "silverware-fork-knife",
  "cup-water",
  "cake-variant-outline",
  "ice-cream",
  "car-outline",
  "bus",
  "train",
  "airplane",
  "bicycle",
  "motorbike",
  "taxi",
  "gas-station-outline",
  "shopping-outline",
  "shopping-search-outline",
  "cart-outline",
  "tshirt-crew-outline",
  "hanger",
  "heart-pulse",
  "hospital-box-outline",
  "pill",
  "run",
  "weight-lifter",
  "yoga",
  "meditation",
  "home-outline",
  "sofa-outline",
  "lightbulb-outline",
  "water-outline",
  "washing-machine",
  "broom",
  "tools",
  "music-note",
  "television-play",
  "gamepad-variant-outline",
  "movie-open-outline",
  "book-open-outline",
  "headphones",
  "microphone-outline",
  "laptop",
  "cellphone",
  "tablet",
  "printer-outline",
  "router-wireless",
  "cloud-outline",
  "account-group-outline",
  "human-male-female",
  "baby-face-outline",
  "dog-side",
  "cat",
  "tag-outline",
  "star-outline",
  "gift-outline",
  "alarm-outline",
  "clipboard-list-outline",
  "calendar-outline",
  "map-marker-outline",
  "school-outline",
  "briefcase-outline",
  "leaf-outline",
  "flower-outline",
  "recycle",
  "fire",
  "snowflake",
  "weather-sunny",
];

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

  const [screen, setScreen] = useState<Screen>("list");
  const [localName, setLocalName] = useState("");
  const [localIcon, setLocalIcon] = useState(
    management.iconOptions[0] || "tag-outline",
  );
  const [localColor, setLocalColor] = useState(
    management.colorOptions[0] || "#3B82F6",
  );
  const [localDest, setLocalDest] = useState("");
  const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);

  const c = theme.colors;
  const bg = c.background;
  const divider = c.outlineVariant;

  const allColors = useMemo(() => {
    const base = management.colorOptions ?? [];
    const merged = [...base];
    for (const color of EXTRA_COLORS) {
      if (!merged.includes(color)) merged.push(color);
    }
    return merged;
  }, [management.colorOptions]);

  const allIcons = useMemo(() => {
    const base = management.iconOptions ?? [];
    const merged = [...base];
    for (const icon of EXTRA_ICONS) {
      if (!merged.includes(icon)) merged.push(icon);
    }
    return merged;
  }, [management.iconOptions]);

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
  }: {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    accentColor?: string;
    iconName?: string;
    rightAccessory?: React.ReactNode;
  }) => (
    <View
      style={[CategoryManagementStyles.header, { borderBottomColor: divider }]}
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

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {screen === "list" && (
            <ListScreen
              management={management}
              fallbackName={fallbackName}
              listHeight={listHeight}
              theme={theme}
              pickerMode={pickerMode}
              selectedValue={selectedValue}
              onSelectCategory={handleSelectCategory}
              renderHeader={renderHeader}
            />
          )}
          {screen === "edit" && (
            <EditScreen
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
            />
          )}
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
        </ScrollView>
      </AnimatedPaperModal>
    </>
  );
}
