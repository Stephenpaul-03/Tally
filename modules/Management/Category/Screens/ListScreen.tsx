import { useStagger } from "@/components/animations/UseStagger";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { SectionLabel } from "@/components/SectionLabel";
import { TypeToggle } from "@/components/TypeToggle";
import { UniversalSearchBar } from "@/components/UniversalSearchBar";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { useCategoryManagement } from "@/hooks/use-category-manamgement";
import { typography } from "@/theme/typography";
import type { TransactionType } from "@/utils/Types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Animated, Pressable, useWindowDimensions, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Text, TouchableRipple, type MD3Theme } from "react-native-paper";
import { CategoryTile } from "../Components/CategoryTile";

type ListScreenProps = {
  management: ReturnType<typeof useCategoryManagement>;
  listHeight: number;
  theme: MD3Theme;
  pickerMode?: boolean;
  useSettingsHeader?: boolean;
  selectedValue?: string;
  onSelectCategory?: (name: string) => void;
  renderHeader: (opts: {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    accentColor?: string;
    iconName?: string;
    rightAccessory?: React.ReactNode;
    rightAccessoryBeforeSearch?: React.ReactNode;
    centerContent?: React.ReactNode;
    hideBack?: boolean;
    searchOpen?: boolean;
    query?: string;
    onQueryChange?: (value: string) => void;
    onSearchOpenChange?: (value: boolean) => void;
    searchPlaceholder?: string;
  }) => React.ReactNode;
};

type CategorySortMode = "custom" | "nameAsc" | "nameDesc" | "usageDesc";

const CATEGORY_SORT_OPTIONS: {
  id: CategorySortMode;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "custom",
    label: "Workspace order",
    description: "Use the current category order",
    icon: "view-grid-outline",
  },
  {
    id: "nameAsc",
    label: "Name A-Z",
    description: "Alphabetical",
    icon: "sort-alphabetical-ascending",
  },
  {
    id: "nameDesc",
    label: "Name Z-A",
    description: "Reverse alphabetical",
    icon: "sort-alphabetical-descending",
  },
  {
    id: "usageDesc",
    label: "Most used",
    description: "Highest transaction count first",
    icon: "chart-bar",
  },
];

export function ListScreen({
  management,
  listHeight,
  theme,
  pickerMode = false,
  useSettingsHeader = false,
  selectedValue,
  onSelectCategory,
  renderHeader,
}: ListScreenProps) {
  const { minimalIconsEnabled } = useAddonPrefs();
  const c = theme.colors;
  const divider = c.outlineVariant;
  const { width } = useWindowDimensions();
  const [query, setQuery] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [sortOpen, setSortOpen] = React.useState(false);
  const [sortMode, setSortMode] = React.useState<CategorySortMode>("custom");
  const animatedOnceRef = React.useRef(false);
  const [useIntroAnimation, setUseIntroAnimation] = React.useState(true);
  const pageProgress = React.useRef(
    new Animated.Value(management.selectedType === "income" ? 1 : 0),
  ).current;
  const [pageWidth, setPageWidth] = React.useState(0);
  const effectivePageWidth = pageWidth || width;
  const normalizedQuery = query.trim().toLowerCase();

  const count =
    management.selectedType === "income"
      ? management.counts.income
      : management.counts.expense;

  const buildPage = React.useCallback(
    (type: TransactionType) => {
      const fallbackName = type === "income" ? "Other Income" : "Other Expense";
      const rawCategories =
        type === "income"
          ? management.incomeCategories
          : management.expenseCategories;
      const ordered = [
        ...rawCategories.filter((n) => n !== fallbackName),
        ...rawCategories.filter((n) => n === fallbackName),
      ].filter((name) =>
        normalizedQuery
          ? [
              name,
              type,
              management.getCategoryIcon(name, type),
              `${management.categoryStatsByType[type][name]?.count ?? 0} transactions`,
            ]
              .join(" ")
              .toLowerCase()
              .includes(normalizedQuery)
          : true,
      );

      return [...ordered].sort((a, b) => {
        if (sortMode === "nameAsc") return a.localeCompare(b);
        if (sortMode === "nameDesc") return b.localeCompare(a);
        if (sortMode === "usageDesc") {
          return (
            (management.categoryStatsByType[type][b]?.count ?? 0) -
            (management.categoryStatsByType[type][a]?.count ?? 0)
          );
        }
        return ordered.indexOf(a) - ordered.indexOf(b);
      });
    },
    [management, normalizedQuery, sortMode],
  );

  const expenseCategories = React.useMemo(
    () => buildPage("expense"),
    [buildPage],
  );
  const incomeCategories = React.useMemo(
    () => buildPage("income"),
    [buildPage],
  );
  const activeCategories =
    management.selectedType === "income" ? incomeCategories : expenseCategories;
  const categoryHasActivity = React.useMemo(
    () =>
      Object.values(management.categoryStatsByType.income).some(
        (stats) => stats.count > 0,
      ) ||
      Object.values(management.categoryStatsByType.expense).some(
        (stats) => stats.count > 0,
      ),
    [management.categoryStatsByType],
  );

  const buildRows = (items: string[]) => {
    const rows: string[][] = [];
    for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
    return rows;
  };

  const expenseRows = React.useMemo(
    () => buildRows(expenseCategories),
    [expenseCategories],
  );
  const incomeRows = React.useMemo(
    () => buildRows(incomeCategories),
    [incomeCategories],
  );
  const pickerViewportHeight = listHeight + 36;
  const pickerModalHeight = pickerViewportHeight + 64;

  const { getAnimStyle } = useStagger({
    count: activeCategories.length,
    stagger: 70,
    distance: 20,
    duration: 550,
    dataKey: "categories-first-mount",
    autoPlay: !animatedOnceRef.current,
    replayOnCountChange: false,
  });

  React.useEffect(() => {
    animatedOnceRef.current = true;
  }, []);

  const handleSelectType = React.useCallback(
    (type: TransactionType) => {
      if (type === management.selectedType) return;
      setUseIntroAnimation(false);
      pageProgress.stopAnimation();
      management.handleSelectType(type);
    },
    [management, pageProgress],
  );

  const sortAccessory = !pickerMode ? (
    <TouchableRipple
      onPress={() => setSortOpen(true)}
      borderless
      style={{
        width: 32,
        height: 32,
        borderRadius: 99,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: sortMode !== "custom" ? c.primaryContainer : c.surface,
        borderWidth: 1,
        borderColor: sortMode !== "custom" ? c.primary : c.outlineVariant,
      }}
      accessibilityLabel="Sort categories"
    >
      <MaterialCommunityIcons
        name="sort"
        size={18}
        color={sortMode !== "custom" ? c.primary : c.onSurfaceVariant}
      />
    </TouchableRipple>
  ) : undefined;
  const headerSearchWidth = Math.min(240, Math.max(150, width - 190));
  const searchAccessory = useSettingsHeader ? undefined : (
    <View style={{ flexDirection: "row", gap: 8 }}>
      <UniversalSearchBar
        bg={c.elevation.level1}
        value={query}
        onChangeText={setQuery}
        placeholder="Search categories"
        autoFocus={searchOpen}
        containerStyle={{
          height: 36,
          borderRadius: 10,
        }}
        animation={{
          expanded: searchOpen,
          onExpandedChange: (expanded) => {
            setSearchOpen(expanded);
            if (!expanded) setQuery("");
          },
          mode: "right",
          collapsedWidth: 36,
          expandedWidth: headerSearchWidth,
          duration: 240,
          clearOnCollapse: true,
        }}
      />
      {sortAccessory}
    </View>
  );

  return (
    <View
      style={
        pickerMode
          ? { height: pickerModalHeight, flexShrink: 0 }
          : {
              flex: 1,
              minHeight: listHeight + 128,
            }
      }
    >
      {renderHeader({
        title: pickerMode ? "Select category" : "Categories",
        subtitle: `${count} ${management.selectedType}`,
        iconName: "tag-multiple-outline",
        searchOpen,
        query,
        onQueryChange: setQuery,
        onSearchOpenChange: setSearchOpen,
        searchPlaceholder: "Search categories",
        rightAccessory: searchAccessory,
        rightAccessoryBeforeSearch: useSettingsHeader
          ? sortAccessory
          : undefined,
      })}

      {pickerMode ? (
        <View style={{ height: pickerViewportHeight, overflow: "hidden" }}>
          <CategoryPage
            type={management.selectedType}
            rows={
              management.selectedType === "income" ? incomeRows : expenseRows
            }
            pageWidth={pageWidth}
            listHeight={listHeight}
            normalizedQuery={normalizedQuery}
            selectedValue={selectedValue}
            pickerMode
            onSelectCategory={onSelectCategory}
            management={management}
            minimalIconsEnabled={minimalIconsEnabled}
            showTransactionLabels={categoryHasActivity}
            getAnimStyle={getAnimStyle}
            theme={theme}
            divider={divider}
          />
        </View>
      ) : (
        <View
          style={{
            flex: 1,
            minHeight: listHeight,
            overflow: "hidden",
          }}
          onLayout={(event) => setPageWidth(event.nativeEvent.layout.width)}
        >
          <Animated.View
            style={{
              flex: 1,
              flexDirection: "row",
              width: effectivePageWidth * 2,
              transform: [
                {
                  translateX: pageProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -effectivePageWidth],
                  }),
                },
              ],
            }}
          >
            <CategoryPage
              type="expense"
              rows={expenseRows}
              pageWidth={effectivePageWidth}
              listHeight={listHeight}
              normalizedQuery={normalizedQuery}
              selectedValue={selectedValue}
              pickerMode={pickerMode}
              onSelectCategory={onSelectCategory}
              management={management}
              minimalIconsEnabled={minimalIconsEnabled}
              showTransactionLabels={categoryHasActivity}
              getAnimStyle={
                useIntroAnimation && management.selectedType === "expense"
                  ? getAnimStyle
                  : undefined
              }
              theme={theme}
              divider={divider}
            />
            <CategoryPage
              type="income"
              rows={incomeRows}
              pageWidth={effectivePageWidth}
              listHeight={listHeight}
              normalizedQuery={normalizedQuery}
              selectedValue={selectedValue}
              pickerMode={pickerMode}
              onSelectCategory={onSelectCategory}
              management={management}
              minimalIconsEnabled={minimalIconsEnabled}
              showTransactionLabels={categoryHasActivity}
              getAnimStyle={
                useIntroAnimation && management.selectedType === "income"
                  ? getAnimStyle
                  : undefined
              }
              theme={theme}
              divider={divider}
            />
          </Animated.View>
        </View>
      )}

      {!pickerMode && (
        <View style={{ paddingHorizontal: 20, paddingTop: 8, gap: 10 }}>
          <TypeToggle
            value={management.selectedType}
            onChange={handleSelectType}
            progressAnim={pageProgress}
          />
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
      <AnimatedPaperModal
        visible={sortOpen}
        onDismiss={() => setSortOpen(false)}
        presentation="sheet"
        dismissable
        contentContainerStyle={{
          backgroundColor: c.background,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: 16,
        }}
      >
        <View
          style={{
            alignSelf: "center",
            width: 38,
            height: 4,
            borderRadius: 999,
            backgroundColor: theme.colors.outlineVariant,
          }}
        />
        <View style={{ gap: 4, marginBottom: 8 }}>
          <Text
            style={{
              ...typography.editorial.sectionLabel,
              fontSize: 18,
              color: c.onSurface,
            }}
          >
            Sort categories
          </Text>
          <Text style={{ fontSize: 12, color: c.onSurfaceVariant }}>
            Choose how the category grid is ordered.
          </Text>
        </View>
        {CATEGORY_SORT_OPTIONS.map(({ id, label, description, icon }) => {
          const selected = sortMode === id;
          return (
            <Pressable
              key={id}
              onPress={() => {
                setSortMode(id as CategorySortMode);
                setSortOpen(false);
              }}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingVertical: 12,
                paddingHorizontal: 10,
                borderRadius: 14,
                backgroundColor: selected ? c.primaryContainer : "transparent",
                opacity: pressed ? 0.65 : 1,
              })}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: selected ? c.surface : c.elevation.level1,
                  borderWidth: 1,
                  borderColor: selected ? c.primary : c.outlineVariant,
                }}
              >
                <MaterialCommunityIcons
                  name={icon as any}
                  size={18}
                  color={selected ? c.primary : c.onSurfaceVariant}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: c.onSurface,
                  }}
                >
                  {label}
                </Text>
                <Text style={{ fontSize: 12, color: c.onSurfaceVariant }}>
                  {description}
                </Text>
              </View>
              <MaterialCommunityIcons
                name={selected ? "radiobox-marked" : "radiobox-blank"}
                size={20}
                color={selected ? c.primary : c.onSurfaceVariant}
              />
            </Pressable>
          );
        })}
      </AnimatedPaperModal>
    </View>
  );
}

function CategoryPage({
  type,
  rows,
  pageWidth,
  listHeight,
  normalizedQuery,
  selectedValue,
  pickerMode,
  onSelectCategory,
  management,
  minimalIconsEnabled,
  showTransactionLabels,
  getAnimStyle,
  theme,
  divider,
}: {
  type: TransactionType;
  rows: string[][];
  pageWidth: number;
  listHeight: number;
  normalizedQuery: string;
  selectedValue?: string;
  pickerMode: boolean;
  onSelectCategory?: (name: string) => void;
  management: ReturnType<typeof useCategoryManagement>;
  minimalIconsEnabled: boolean;
  showTransactionLabels: boolean;
  getAnimStyle?: ReturnType<typeof useStagger>["getAnimStyle"];
  theme: MD3Theme;
  divider: string;
}) {
  const c = theme.colors;

  return (
    <View style={{ flex: 1, width: pageWidth || "100%" }}>
      <SectionLabel
        label={type === "income" ? "Income categories" : "Expense categories"}
      />
      <View
        style={
          pickerMode
            ? { height: listHeight, marginHorizontal: 20 }
            : { flex: 1, minHeight: listHeight, marginHorizontal: 20 }
        }
      >
        <KeyboardAwareScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
        >
          {rows.length === 0 ? (
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
                {normalizedQuery
                  ? "No matching categories"
                  : "No categories yet"}
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
                        getAnimStyle?.(animatedIndex),
                      ]}
                    >
                      <CategoryTile
                        name={name}
                        icon={management.getCategoryIcon(name, type)}
                        color={management.getCategoryColor(name, type)}
                        transactionCount={
                          management.categoryStatsByType[type][name]?.count ?? 0
                        }
                        showTransactionLabel={showTransactionLabels}
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
        </KeyboardAwareScrollView>
      </View>
    </View>
  );
}
