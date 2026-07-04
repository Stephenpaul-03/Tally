import { BackButton } from "@/components/backbutton/BackButton";
import { useBreakpoint } from "@/hooks/use-breakpoints";
import { useCategoryManagement } from "@/hooks/use-category-manamgement";
import { CustomColorPickerModal } from "@/modules/Management/Category/Components/ColorPickerModal";
import { DeleteScreen } from "@/modules/Management/Category/Screens/DeleteScreen";
import { CategoryEditScreen } from "@/modules/Management/Category/Screens/EditScreen";
import { ListScreen } from "@/modules/Management/Category/Screens/ListScreen";
import { CategoryManagementStyles } from "@/modules/Management/Category/Styles";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import type { SettingsStackParamList } from "../Navigation";

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

const NAME_LIMIT = 30;

export function CategoriesScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const { height, width, isMobileLayout: isMobile } = useBreakpoint();
  const management = useCategoryManagement("expense");
  const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);
  const [localName, setLocalName] = useState(
    management.editingCategory?.name.slice(0, NAME_LIMIT) ?? "",
  );
  const [localIcon, setLocalIcon] = useState(
    management.editingCategory?.icon ??
      management.iconOptions[0] ??
      "tag-outline",
  );
  const [localColor, setLocalColor] = useState(
    management.editingCategory?.color ??
      management.colorOptions[0] ??
      "#3B82F6",
  );
  const [localDest, setLocalDest] = useState("");

  const allColors = useMemo(() => {
    const merged = [...management.colorOptions];
    for (const color of EXTRA_COLORS) {
      if (!merged.includes(color)) merged.push(color);
    }
    return merged;
  }, [management.colorOptions]);

  const allIcons = useMemo(() => {
    const merged = [...management.iconOptions];
    for (const icon of EXTRA_ICONS) {
      if (!merged.includes(icon)) merged.push(icon);
    }
    return merged;
  }, [management.iconOptions]);

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
    subtitle,
    showBack = false,
    rightAccessory,
  }: {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    rightAccessory?: React.ReactNode;
  }) => (
    <View
      style={[
        CategoryManagementStyles.header,
        { borderBottomColor: theme.colors.outlineVariant },
      ]}
    >
      <BackButton
        onPress={showBack ? handleBack : handleClose}
        theme={theme}
        size={34}
      />
      <View style={{ flex: 1 }}>
        <Text
          style={[
            CategoryManagementStyles.headerTitle,
            {
              color: theme.colors.onSurface,
              fontSize: 18,
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
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightAccessory ?? null}
    </View>
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

      {management.isEditOpen ? (
        <CategoryEditScreen
          key={management.editingCategory?.name ?? "new"}
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
        />
      ) : management.isDeleteOpen ? (
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
      ) : (
        <ListScreen
          management={management}
          fallbackName={fallbackName}
          listHeight={listHeight}
          theme={theme}
          renderHeader={renderHeader}
        />
      )}
    </SafeAreaView>
  );
}
