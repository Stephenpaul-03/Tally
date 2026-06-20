import { useStagger } from "@/components/animations/UseStagger";
import { SectionLabel } from "@/components/SectionLabel";
import { TypeToggle } from "@/components/TypeToggle";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { useCategoryManagement } from "@/hooks/use-category-manamgement";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Animated, Pressable, ScrollView, View } from "react-native";
import { Text, type MD3Theme } from "react-native-paper";
import { CategoryTile } from "../Components/CategoryTile";

type ListScreenProps = {
  management: ReturnType<typeof useCategoryManagement>;
  fallbackName: string;
  listHeight: number;
  theme: MD3Theme;
  pickerMode?: boolean;
  selectedValue?: string;
  onSelectCategory?: (name: string) => void;
  renderHeader: (opts: {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    accentColor?: string;
    iconName?: string;
    rightAccessory?: React.ReactNode;
  }) => React.ReactNode;
};

export function ListScreen({
  management,
  fallbackName,
  listHeight,
  theme,
  pickerMode = false,
  selectedValue,
  onSelectCategory,
  renderHeader,
}: ListScreenProps) {
  const { minimalIconsEnabled } = useAddonPrefs();
  const c = theme.colors;
  const divider = c.outlineVariant;

  const count =
    management.selectedType === "income"
      ? management.counts.income
      : management.counts.expense;

  const rawCategories = management.activeCategories;
  const categories = [
    ...rawCategories.filter((n) => n !== fallbackName),
    ...rawCategories.filter((n) => n === fallbackName),
  ];
  const rows: string[][] = [];
  for (let i = 0; i < categories.length; i += 2)
    rows.push(categories.slice(i, i + 2));

  const { getAnimStyle } = useStagger({
    count: categories.length,
    stagger: 100,
    distance: 20,
    duration: 750,
    dataKey: categories.join("|"),
  });

  return (
    <>
      {renderHeader({
        title: pickerMode ? "Select category" : "Categories",
        subtitle: `${count} ${management.selectedType}`,
        iconName: "tag-multiple-outline",
      })}

      {!pickerMode && (
        <View style={{ paddingHorizontal: 12, paddingTop: 14 }}>
          <TypeToggle
            value={management.selectedType}
            onChange={management.handleSelectType}
          />
        </View>
      )}

      <SectionLabel
        label={
          management.selectedType === "income"
            ? "Income categories"
            : "Expense categories"
        }
        theme={theme}
      />

      <View style={{ height: listHeight, marginHorizontal: 12 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
        >
          {categories.length === 0 ? (
            <View
              style={{
                borderRadius: 16,
                padding: 24,
                alignItems: "center",
                gap: 10,
                backgroundColor: c.elevation.level1,
                borderWidth: 0.5,
                borderColor: divider,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: c.elevation.level2,
                  borderWidth: 0.5,
                  borderColor: divider,
                }}
              >
                <MaterialCommunityIcons
                  name="tag-outline"
                  size={24}
                  color={c.onSurfaceVariant}
                />
              </View>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "500",
                  color: c.onSurfaceVariant,
                }}
              >
                No categories yet
              </Text>
            </View>
          ) : (
            rows.map((row, rowIdx) => (
              <View key={rowIdx} style={{ flexDirection: "row", gap: 8 }}>
                {row.map((name, itemIndex) => {
                  const animatedIndex = rowIdx * 2 + itemIndex;
                  return (
                    <Animated.View
                      key={name}
                      style={[
                        { flex: 1, maxWidth: "50%" },
                        getAnimStyle(animatedIndex),
                      ]}
                    >
                      <CategoryTile
                        name={name}
                        icon={management.getCategoryIcon(name)}
                        color={management.getCategoryColor(name)}
                        transactionCount={
                          management.categoryStats[name]?.count ?? 0
                        }
                        iconColorOverride={
                          minimalIconsEnabled ? theme.colors.primary : undefined
                        }
                        isSelected={pickerMode && selectedValue === name}
                        pickerMode={pickerMode}
                        onPress={() =>
                          pickerMode
                            ? onSelectCategory?.(name)
                            : management.handleEditCategory(name)
                        }
                        theme={theme}
                      />
                    </Animated.View>
                  );
                })}
                {row.length === 1 && (
                  <View style={{ flex: 1, maxWidth: "50%" }} />
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {!pickerMode && (
        <View style={{ padding: 12, marginTop: "auto" }}>
          <Pressable
            onPress={management.handleAddNewCategory}
            disabled={management.iconOptions.length === 0}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              paddingVertical: 14,
              paddingHorizontal: 20,
              borderRadius: 14,
              backgroundColor: c.primary,
              opacity: pressed
                ? 0.75
                : management.iconOptions.length === 0
                  ? 0.4
                  : 1,
            })}
          >
            <MaterialCommunityIcons name="plus" size={20} color={c.onPrimary} />
            <Text
              style={{
                ...typography.editorial.sectionLabel,
                fontSize: 14,
                color: c.onPrimary,
              }}
            >
              Add new category
            </Text>
          </Pressable>
        </View>
      )}
    </>
  );
}
