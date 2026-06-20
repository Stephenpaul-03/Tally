import { IconCategoryPicker } from "@/components/IconCategoryPicker";
import { MANAGEMENT_NAME_LIMIT } from "@/components/ManagementOptions";
import { SectionLabel } from "@/components/SectionLabel";
import { SheetCard } from "@/components/SheetCard";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Text, TextInput, type MD3Theme } from "react-native-paper";

export type IconGrid = {
  columns: number;
  itemSize: number;
  iconSize: number;
  spacing: number;
  edgeInset: number;
};

export type EntityEditLayoutProps = {
  // Field values
  localName: string;
  localIcon: string;
  localColor: string;

  // Field setters
  onChangeName: (v: string) => void;
  onChangeIcon: (v: string) => void;
  onChangeColor: (v: string) => void;

  // Options
  allColors: string[];
  allIcons: string[];
  iconGrid: IconGrid;

  // Labels / copy
  namePlaceholder?: string;
  nameLabel?: string;
  emptyPreviewLabel?: string;
  iconPickerVariant?: "category" | "account";

  // Submit
  canSubmit: boolean;
  isEditing: boolean;
  submitLabelCreate?: string;
  submitLabelEdit?: string;
  onSubmit: () => void;

  // Header — render prop so callers keep full control
  renderHeader: (opts: {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    rightAccessory?: React.ReactNode;
  }) => React.ReactNode;

  // Optional delete button content (caller decides guard logic)
  deleteAccessory?: React.ReactNode;

  // Slot for a custom footer (replaces default save button)
  footer?: React.ReactNode;

  // Theme
  theme: MD3Theme;
  background: string;

  // Optional name char limit (defaults to MANAGEMENT_NAME_LIMIT)
  nameLimit?: number;
};

export function EntityEditLayout({
  localName,
  localIcon,
  localColor,
  onChangeName,
  onChangeIcon,
  onChangeColor,
  allColors,
  allIcons,
  iconGrid,
  namePlaceholder = "Enter a name",
  nameLabel = "Name",
  emptyPreviewLabel = "Name",
  iconPickerVariant = "account",
  canSubmit,
  isEditing,
  submitLabelCreate = "Add",
  submitLabelEdit = "Save changes",
  onSubmit,
  renderHeader,
  deleteAccessory,
  footer,
  theme,
  background,
  nameLimit = MANAGEMENT_NAME_LIMIT,
}: EntityEditLayoutProps) {
  const { minimalIconsEnabled } = useAddonPrefs();
  const c = theme.colors;

  const colorColumnWidth = iconGrid.itemSize * 3 + iconGrid.spacing * 2;

  return (
    <>
      {renderHeader({
        showBack: true,
        rightAccessory: deleteAccessory,
        title: "",
      })}

      {/* Preview + Color picker */}
      <SectionLabel label="Preview" theme={theme} />
      <View
        style={{
          marginHorizontal: 12,
          borderRadius: 16,
          paddingVertical: 12,
          paddingHorizontal: 12,
          backgroundColor: c.surfaceVariant,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* Preview — left */}
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <View
            style={{
              width: 128,
              height: 128,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: c.background,
            }}
          >
            <MaterialCommunityIcons
              name={(localIcon || "tag-outline") as any}
              size={96}
              color={minimalIconsEnabled ? c.primary : localColor || c.primary}
            />
          </View>

          <Text
            numberOfLines={1}
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: localName.trim() ? c.onSurface : c.onSurfaceVariant,
              textAlign: "center",
            }}
          >
            {localName.trim() || emptyPreviewLabel}
          </Text>

          {minimalIconsEnabled ? (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <MaterialCommunityIcons
                name="information-outline"
                size={14}
                color={c.primary}
              />
              <Text
                style={{
                  flex: 1,
                  fontSize: 11,
                  lineHeight: 15,
                  color: c.onSurfaceVariant,
                }}
              >
                Minimal Icons is on.
              </Text>
            </View>
          ) : null}
        </View>

        {/* Divider */}
        <View
          style={{
            width: 1,
            alignSelf: "stretch",
            backgroundColor: `${c.onSurface}18`,
            borderRadius: 1,
          }}
        />

        {/* Color picker — right, 3 columns */}
        <View style={{ width: colorColumnWidth }}>
          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            style={{
              maxHeight: iconGrid.itemSize * 4 + iconGrid.spacing * 3,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: iconGrid.spacing,
              }}
            >
              {allColors.map((color) => {
                const isSelected = localColor === color;
                return (
                  <Pressable
                    key={color}
                    onPress={() => onChangeColor(color)}
                    style={({ pressed }) => ({
                      width: iconGrid.itemSize,
                      height: iconGrid.itemSize,
                      borderRadius: Math.max(
                        10,
                        Math.floor(iconGrid.itemSize * 0.28),
                      ),
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: color,
                      borderWidth: isSelected ? 2.5 : 1.5,
                      borderColor: isSelected ? c.onSurface : `${color}44`,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    {isSelected && (
                      <MaterialCommunityIcons
                        name="check"
                        size={iconGrid.iconSize}
                        color={c.onPrimary}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Name */}
      <SectionLabel label="Name" theme={theme} />
      <SheetCard theme={theme} style={{ padding: 10, paddingTop: 5 }}>
        <TextInput
          label={nameLabel}
          maxLength={nameLimit}
          mode="outlined"
          onChangeText={(value) => onChangeName(value.slice(0, nameLimit))}
          placeholder={namePlaceholder}
          right={
            <TextInput.Affix
              text={`${localName.length}/${nameLimit}`}
              textStyle={{ color: c.onSurfaceVariant, fontSize: 12 }}
            />
          }
          style={{ backgroundColor: background }}
          value={localName}
        />
      </SheetCard>

      {/* Icon */}
      <SectionLabel label="Icon" theme={theme} />
      <SheetCard theme={theme} style={{ padding: 10 }}>
        <IconCategoryPicker
          allIcons={allIcons}
          background={background}
          iconGrid={iconGrid}
          onSelectIcon={onChangeIcon}
          selectedIcon={localIcon}
          theme={theme}
          variant={iconPickerVariant}
        />
      </SheetCard>

      {footer ?? (
        <View style={{ flexDirection: "row", margin: 12, marginTop: "auto" }}>
          <Pressable
            disabled={!canSubmit}
            onPress={onSubmit}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingVertical: 14,
              borderRadius: 14,
              backgroundColor: c.primary,
              opacity: pressed ? 0.65 : !canSubmit ? 0.4 : 1,
            })}
          >
            <MaterialCommunityIcons
              color={c.onPrimary}
              name={isEditing ? "content-save-outline" : "plus"}
              size={18}
            />
            <Text
              style={{
                ...typography.editorial.sectionLabel,
                fontSize: 14,
                color: c.onPrimary,
              }}
            >
              {isEditing ? submitLabelEdit : submitLabelCreate}
            </Text>
          </Pressable>
        </View>
      )}
    </>
  );
}
