import { sortCategories } from "@/utils/category-order";
import { CategoryBulkDeleteModal } from "../Components/BulkDeleteModal";
import { useStagger } from "@/components/animations/UseStagger";
import { SectionLabel } from "@/components/SectionLabel";
import { SortOptionSheet } from "@/components/SortOptionSheet";
import { TypeToggle } from "@/components/TypeToggle";
import { UniversalSearchBar } from "@/components/UniversalSearchBar";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { useWorkspaceDefaults } from "@/hooks/use-workspace-defaults";
import { useAppSelector } from "@/hooks/Redux";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import { useCategoryManagement } from "@/hooks/use-category-manamgement";
import { CategoryManagementStyles } from "../Styles";
import { SettingsHeader } from "@/modules/Settings/Components/SettingsHeader";
import { typography } from "@/theme/typography";
import type { TransactionType } from "@/utils/Types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Animated, Pressable, useWindowDimensions, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Text, TouchableRipple, type MD3Theme } from "react-native-paper";
import { CategoryTile } from "../Components/CategoryTile";

type CategoryListHeaderOptions = {
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
};

type ListScreenProps = {
  management: ReturnType<typeof useCategoryManagement>;
  listHeight: number;
  theme: MD3Theme;
  pickerMode?: boolean;
  useSettingsHeader?: boolean;
  selectedValue?: string;
  onSelectCategory?: (name: string) => void;
  renderHeader: (opts: CategoryListHeaderOptions) => React.ReactNode;
};

type CategorySortField = "name" | "usage";
type CategorySortDirection = "asc" | "desc";

const CATEGORY_SORT_OPTIONS: {
  id: CategorySortField;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "name",
    label: "Name",
    description: "Sort category names",
    icon: "sort-alphabetical-ascending",
  },
  {
    id: "usage",
    label: "Usage",
    description: "Sort by transaction count",
    icon: "chart-bar",
  },
];

function CategoryListContent({
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
  const { getWorkspaceDefaults } = useWorkspaceDefaults();
  const activeWorkspace = useAppSelector(selectActiveWorkspace);
  const c = theme.colors;
  const divider = c.outlineVariant;
  const { width } = useWindowDimensions();
  const [query, setQuery] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [sortOpen, setSortOpen] = React.useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
  const workspaceDefaults = getWorkspaceDefaults(activeWorkspace?.id ?? "personal");
  const [sortField, setSortField] = React.useState<CategorySortField>(
    workspaceDefaults.categorySortField,
  );
  const [sortDirection, setSortDirection] =
    React.useState<CategorySortDirection>(workspaceDefaults.categorySortDirection);
  React.useEffect(() => {
    setSortField(workspaceDefaults.categorySortField);
    setSortDirection(workspaceDefaults.categorySortDirection);
  }, [workspaceDefaults.categorySortDirection, workspaceDefaults.categorySortField]);
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
      const rawCategories =
        type === "income"
          ? management.incomeCategories
          : management.expenseCategories;
      const ordered = rawCategories.filter((name) =>
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

      return sortCategories(ordered, name => name, (a, b) => {
        const result =
          sortField === "name"
            ? a.localeCompare(b)
            : (management.categoryStatsByType[type][a]?.count ?? 0) -
              (management.categoryStatsByType[type][b]?.count ?? 0);
        return sortDirection === "asc" ? result : -result;
      });
    },
    [management, normalizedQuery, sortDirection, sortField],
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
    <View style={{ flexDirection: "row", gap: 8 }}>
    <TouchableRipple accessibilityLabel="Delete multiple categories" onPress={() => setBulkDeleteOpen(true)} borderless style={{ width: 32, height: 32, borderRadius: 99, alignItems: "center", justifyContent: "center" }}>
      <MaterialCommunityIcons name="checkbox-multiple-marked-outline" size={20} color={c.onSurfaceVariant} />
    </TouchableRipple>
    <TouchableRipple
      onPress={() => setSortOpen(true)}
      borderless
      style={{
        width: 32,
        height: 32,
        borderRadius: 99,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.outlineVariant,
      }}
      accessibilityLabel="Sort categories"
    >
      <MaterialCommunityIcons
        name="sort"
        size={18}
        color={c.onSurfaceVariant}
      />
    </TouchableRipple>
    </View>
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
      {!pickerMode ? <CategoryBulkDeleteModal visible={bulkDeleteOpen} onDismiss={() => setBulkDeleteOpen(false)} management={management} /> : null}
      <SortOptionSheet
        visible={sortOpen}
        onDismiss={() => setSortOpen(false)}
        title="Sort categories"
        subtitle="Choose how the category grid is ordered."
        options={CATEGORY_SORT_OPTIONS}
        value={sortField}
        direction={sortDirection}
        resetDirection="asc"
        onChange={(value) => setSortField(value as CategorySortField)}
        onDirectionChange={(direction) => setSortDirection(direction)}
      />
    </View>
  );
}

type CategoryListProps = Omit<
  ListScreenProps,
  "renderHeader" | "useSettingsHeader"
>;

export function CategoryListScreen({
  onBack,
  ...props
}: CategoryListProps & { onBack: () => void }) {
  return (
    <CategoryListContent
      {...props}
      pickerMode={false}
      useSettingsHeader
      renderHeader={(options) => (
        <SettingsHeader
          title={options.title}
          onBack={onBack}
          searchOpen={options.searchOpen}
          query={options.query}
          onQueryChange={options.onQueryChange}
          onSearchOpenChange={options.onSearchOpenChange}
          searchPlaceholder={options.searchPlaceholder}
          rightAccessory={options.rightAccessory}
          rightAccessoryBeforeSearch={options.rightAccessoryBeforeSearch}
        />
      )}
    />
  );
}

export function CategoryListModal({
  onBack,
  onClose,
  pickerMode = false,
  ...props
}: CategoryListProps & {
  onBack: () => void;
  onClose: () => void;
  pickerMode?: boolean;
}) {
  return (
    <CategoryListContent
      {...props}
      pickerMode={pickerMode}
      useSettingsHeader={pickerMode}
      renderHeader={(options) =>
        pickerMode ? (
          <SettingsHeader
            title={options.title}
            onBack={onBack}
            searchOpen={options.searchOpen}
            query={options.query}
            onQueryChange={options.onQueryChange}
            onSearchOpenChange={options.onSearchOpenChange}
            searchPlaceholder={options.searchPlaceholder}
            rightAccessory={options.rightAccessory}
            rightAccessoryBeforeSearch={options.rightAccessoryBeforeSearch}
            modal
          />
        ) : (
          <View
            style={[
              CategoryManagementStyles.header,
              { borderBottomColor: props.theme.colors.outlineVariant },
            ]}
          >
            <View
              style={[
                CategoryManagementStyles.headerIconBadge,
                { backgroundColor: props.theme.colors.elevation.level1 },
              ]}
            >
              <MaterialCommunityIcons
                name="tag-multiple-outline"
                size={17}
                color={props.theme.colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  CategoryManagementStyles.headerTitle,
                  { color: props.theme.colors.onSurface },
                ]}
                numberOfLines={1}
              >
                {options.title}
              </Text>
              <Text
                style={[
                  CategoryManagementStyles.headerSubtitle,
                  { color: props.theme.colors.onSurfaceVariant },
                ]}
              >
                {options.subtitle}
              </Text>
            </View>
            {options.rightAccessory}
            <TouchableRipple
              onPress={onClose}
              borderless
              style={[
                CategoryManagementStyles.headerBtn,
                CategoryManagementStyles.headerBtnRound,
                {
                  backgroundColor: props.theme.colors.elevation.level1,
                  borderColor: props.theme.colors.outlineVariant,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="close"
                size={17}
                color={props.theme.colors.onSurfaceVariant}
              />
            </TouchableRipple>
          </View>
        )
      }
    />
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
