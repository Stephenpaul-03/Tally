import { useStagger } from "@/components/animations/UseStagger";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { SectionLabel } from "@/components/SectionLabel";
import { useAppSelector } from "@/hooks/Redux";
import { useWorkspaceDefaults } from "@/hooks/use-workspace-defaults";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import { SettingsSearchHeader } from "@/modules/Settings/Components/SettingsSearchHeader";
import type { SettingsStackParamList } from "@/modules/Settings/Navigation";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { Animated, Pressable, ScrollView, View } from "react-native";
import { Text, useTheme, type MD3Theme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { BudgetDetailsSheet } from "./Components/BudgetDetailsSheet";
import { formatInr, useBudgetManagement } from "./Hooks";
import { budgetStyles } from "./Styles";

type BudgetSortMode =
  | "budgetDesc"
  | "spentDesc"
  | "remainingAsc"
  | "nameAsc"
  | "usageDesc";

const BUDGET_SORT_OPTIONS: {
  id: BudgetSortMode;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "budgetDesc",
    label: "Highest budget",
    description: "Largest category budgets first",
    icon: "cash-multiple",
  },
  {
    id: "spentDesc",
    label: "Most spent",
    description: "Highest spending this month",
    icon: "chart-bar",
  },
  {
    id: "remainingAsc",
    label: "Closest to limit",
    description: "Lowest remaining balance first",
    icon: "progress-alert",
  },
  {
    id: "nameAsc",
    label: "Name A-Z",
    description: "Alphabetical by category",
    icon: "sort-alphabetical-ascending",
  },
  {
    id: "usageDesc",
    label: "Percent used",
    description: "Highest budget usage first",
    icon: "percent-outline",
  },
];

type BudgetCategoryEntry = ReturnType<
  typeof useBudgetManagement
>["categoryEntries"][number];
type BudgetStatusGroupId = "empty" | "overbudget" | "nearlyEmpty" | "safe";

const BUDGET_STATUS_GROUPS: {
  id: BudgetStatusGroupId;
  title: string;
  icon: string;
  emptyText: string;
  color: string;
}[] = [
  {
    id: "safe",
    title: "Safe",
    icon: "shield-check-outline",
    emptyText: "No safe categories",
    color: "#2E7D32",
  },
  {
    id: "nearlyEmpty",
    title: "Nearly empty",
    icon: "progress-alert",
    emptyText: "No nearly empty categories",
    color: "#C77700",
  },
  {
    id: "empty",
    title: "Budget used up",
    icon: "playlist-remove",
    emptyText: "No used up budgets",
    color: "#5E6AD2",
  },
  {
    id: "overbudget",
    title: "Over budget",
    icon: "alert-circle-outline",
    emptyText: "No over budget categories",
    color: "#B3261E",
  },
];

function darkenHex(hex: string, amount = 0.18) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;
  const num = parseInt(clean, 16);
  const r = Math.max(0, Math.round(((num >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((num >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((num & 0xff) * (1 - amount)));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export function BudgetScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const activeWorkspace = useAppSelector(selectActiveWorkspace);
  const { getWorkspaceDefaults } = useWorkspaceDefaults();
  const { categoryEntries, saveCategory, clearCategory } =
    useBudgetManagement();

  const [selectedCategoryName, setSelectedCategoryName] = React.useState<
    string | null
  >(null);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [sortOpen, setSortOpen] = React.useState(false);
  const [sortMode, setSortMode] = React.useState<BudgetSortMode>("budgetDesc");
  const animatedOnceRef = React.useRef(false);
  const normalizedQuery = query.trim().toLowerCase();

  const currentCategory = React.useMemo(
    () =>
      selectedCategoryName
        ? (categoryEntries.find(
            (category) => category.name === selectedCategoryName,
          ) ?? null)
        : null,
    [categoryEntries, selectedCategoryName],
  );
  const visibleCategoryEntries = normalizedQuery
    ? categoryEntries.filter((category) =>
        [
          category.name,
          category.icon,
          category.budget > 0 ? "budget allocated" : "no budget",
          category.spent > category.budget && category.budget > 0
            ? "over budget"
            : "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      )
    : categoryEntries;
  const sortedCategoryEntries = React.useMemo(
    () =>
      [...visibleCategoryEntries].sort((a, b) => {
        if (sortMode === "spentDesc") return b.spent - a.spent;
        if (sortMode === "remainingAsc") {
          const aRemaining =
            a.budget > 0 ? a.budget - a.spent : Number.MAX_SAFE_INTEGER;
          const bRemaining =
            b.budget > 0 ? b.budget - b.spent : Number.MAX_SAFE_INTEGER;
          return aRemaining - bRemaining;
        }
        if (sortMode === "nameAsc") return a.name.localeCompare(b.name);
        if (sortMode === "usageDesc") {
          const aUsage = a.budget > 0 ? a.spent / a.budget : 0;
          const bUsage = b.budget > 0 ? b.spent / b.budget : 0;
          return bUsage - aUsage;
        }
        if (b.budget !== a.budget) return b.budget - a.budget;
        return b.spent - a.spent;
      }),
    [sortMode, visibleCategoryEntries],
  );
  const workspaceDefaults = getWorkspaceDefaults(
    activeWorkspace?.id ?? "personal",
  );
  const safeBelowPercent = Math.max(
    0,
    Math.min(100, Math.round(workspaceDefaults.budgetSafeBelowPercent)),
  );
  const nearlyEmptyFromPercent = Math.max(
    0,
    Math.min(100, Math.round(workspaceDefaults.budgetNearlyEmptyFromPercent)),
  );
  const groupedCategoryEntries = React.useMemo(() => {
    const groups: Record<BudgetStatusGroupId, BudgetCategoryEntry[]> = {
      empty: [],
      overbudget: [],
      nearlyEmpty: [],
      safe: [],
    };

    sortedCategoryEntries.forEach((category) => {
      const hasBudget = category.budget > 0;
      const percentUsed = hasBudget
        ? (category.spent / category.budget) * 100
        : 0;

      if (!hasBudget) {
        groups.empty.push(category);
      } else if (percentUsed > 100) {
        groups.overbudget.push(category);
      } else if (percentUsed >= nearlyEmptyFromPercent) {
        groups.nearlyEmpty.push(category);
      } else if (percentUsed < safeBelowPercent) {
        groups.safe.push(category);
      } else {
        groups.safe.push(category);
      }
    });

    return groups;
  }, [nearlyEmptyFromPercent, safeBelowPercent, sortedCategoryEntries]);
  const animationIndexByName = React.useMemo(
    () =>
      Object.fromEntries(
        sortedCategoryEntries.map((category, index) => [category.name, index]),
      ),
    [sortedCategoryEntries],
  );
  const anyCategoryHasBudget = React.useMemo(
    () => categoryEntries.some((category) => category.budget > 0),
    [categoryEntries],
  );
  const { getAnimStyle } = useStagger({
    count: sortedCategoryEntries.length,
    stagger: 70,
    distance: 20,
    duration: 550,
    dataKey: "budgets-first-mount",
    autoPlay: !animatedOnceRef.current,
    replayOnCountChange: false,
  });

  React.useEffect(() => {
    animatedOnceRef.current = true;
  }, []);

  const handleOpenCategory = (category: (typeof categoryEntries)[number]) => {
    setSelectedCategoryName(category.name);
    setDetailsOpen(true);
  };
  const sortAccessory = (
    <Pressable
      onPress={() => setSortOpen(true)}
      style={({ pressed }) => [
        budgetStyles.headerIconButton,
        {
          width: 32,
          height: 32,
          borderRadius: 99,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor:
            sortMode !== "budgetDesc" ? c.primaryContainer : c.surface,
          borderWidth: 1,
          borderColor: sortMode !== "budgetDesc" ? c.primary : c.outlineVariant,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Sort budgets"
    >
      <MaterialCommunityIcons
        name="sort"
        size={20}
        color={sortMode !== "budgetDesc" ? c.primary : c.onSurfaceVariant}
      />
    </Pressable>
  );

  return (
    <SafeAreaView
      style={[
        budgetStyles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <SettingsSearchHeader
        title="Budget"
        onBack={() => navigation.goBack()}
        query={query}
        onQueryChange={setQuery}
        searchOpen={searchOpen}
        onSearchOpenChange={setSearchOpen}
        rightAccessoryBeforeSearch={sortAccessory}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={budgetStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {sortedCategoryEntries.length > 0 ? (
          BUDGET_STATUS_GROUPS.map((group) => (
            <BudgetStatusSection
              key={group.id}
              color={group.color}
              entries={groupedCategoryEntries[group.id]}
              expanded={anyCategoryHasBudget}
              getAnimStyle={getAnimStyle}
              icon={group.icon}
              emptyText={group.emptyText}
              indexByName={animationIndexByName}
              onOpenCategory={handleOpenCategory}
              theme={theme}
              title={group.title}
            />
          ))
        ) : (
          <>
            <SectionLabel label="Expense categories" />
            <View
              style={[
                budgetStyles.emptyState,
                {
                  backgroundColor: theme.colors.elevation.level1,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
            >
              <Text
                style={[
                  budgetStyles.emptyStateText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {normalizedQuery
                  ? "No budget categories match your search."
                  : "No category budgets yet."}
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {currentCategory ? (
        <BudgetDetailsSheet
          visible={detailsOpen}
          onDismiss={() => setDetailsOpen(false)}
          name={currentCategory.name}
          icon={currentCategory.icon}
          color={currentCategory.color}
          budget={currentCategory.budget}
          onRemoveBudget={async () => {
            await clearCategory(currentCategory.name);
            setDetailsOpen(false);
          }}
          onSaveBudget={async (value) => {
            await saveCategory(currentCategory.name, value);
            setDetailsOpen(false);
          }}
        />
      ) : null}
      <AnimatedPaperModal
        visible={sortOpen}
        onDismiss={() => setSortOpen(false)}
        dismissable
        presentation="sheet"
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
        <View style={budgetStyles.sortSheetHeader}>
          <Text style={[budgetStyles.sortSheetTitle, { color: c.onSurface }]}>
            Sort budgets
          </Text>
          <Text
            style={[
              budgetStyles.sortSheetSubtitle,
              { color: c.onSurfaceVariant },
            ]}
          >
            Choose how category budgets are ordered.
          </Text>
        </View>
        {BUDGET_SORT_OPTIONS.map(({ id, label, description, icon }) => {
          const selected = sortMode === id;
          return (
            <Pressable
              key={id}
              onPress={() => {
                setSortMode(id);
                setSortOpen(false);
              }}
              style={({ pressed }) => [
                budgetStyles.sortOption,
                {
                  backgroundColor: selected
                    ? c.primaryContainer
                    : "transparent",
                  opacity: pressed ? 0.65 : 1,
                },
              ]}
            >
              <View
                style={[
                  budgetStyles.sortOptionIcon,
                  {
                    backgroundColor: selected ? c.surface : c.elevation.level1,
                    borderColor: selected ? c.primary : c.outlineVariant,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={icon as any}
                  size={18}
                  color={selected ? c.primary : c.onSurfaceVariant}
                />
              </View>
              <View style={budgetStyles.sortOptionBody}>
                <Text
                  style={[budgetStyles.sortOptionTitle, { color: c.onSurface }]}
                >
                  {label}
                </Text>
                <Text
                  style={[
                    budgetStyles.sortOptionDescription,
                    { color: c.onSurfaceVariant },
                  ]}
                >
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
    </SafeAreaView>
  );
}

function BudgetStatusSection({
  color,
  emptyText,
  entries,
  expanded,
  getAnimStyle,
  icon,
  indexByName,
  onOpenCategory,
  theme,
  title,
}: {
  color: string;
  emptyText: string;
  entries: BudgetCategoryEntry[];
  expanded: boolean;
  getAnimStyle: (index: number) => Record<string, unknown>;
  icon: string;
  indexByName: Record<string, number>;
  onOpenCategory: (category: BudgetCategoryEntry) => void;
  theme: MD3Theme;
  title: string;
}) {
  const rows = React.useMemo(
    () =>
      Array.from({ length: Math.ceil(entries.length / 2) }, (_, index) =>
        entries.slice(index * 2, index * 2 + 2),
      ),
    [entries],
  );

  return (
    <View style={budgetStyles.budgetSection}>
      <View style={budgetStyles.budgetSectionHeader}>
        <View
          style={[
            budgetStyles.budgetSectionIcon,
            { backgroundColor: darkenHex(color, 0.08) },
          ]}
        >
          <MaterialCommunityIcons name={icon as any} size={15} color="#FFFFFF" />
        </View>
        <Text style={[budgetStyles.budgetSectionTitle, { color }]}>
          {title}
        </Text>
        <Text
          style={[
            budgetStyles.budgetSectionCount,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          {entries.length}
        </Text>
      </View>
      {entries.length > 0 ? (
        <View style={budgetStyles.categoryList}>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={budgetStyles.categoryGridRow}>
              {row.map((category) => (
                <Animated.View
                  key={category.name}
                  style={[
                    budgetStyles.categoryGridItem,
                    getAnimStyle(indexByName[category.name] ?? 0),
                  ]}
                >
                  <BudgetCategoryRow
                    category={category}
                    theme={theme}
                    onPress={() => onOpenCategory(category)}
                    expanded={expanded}
                  />
                </Animated.View>
              ))}
              {row.length === 1 ? (
                <View style={budgetStyles.categoryGridItem} />
              ) : null}
            </View>
          ))}
        </View>
      ) : (
        <View
          style={[
            budgetStyles.budgetSectionEmpty,
            { backgroundColor: theme.colors.elevation.level1 },
          ]}
        >
          <MaterialCommunityIcons
            name={icon as any}
            size={18}
            color={color}
          />
          <Text
            style={[
              budgetStyles.budgetSectionEmptyText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {emptyText}
          </Text>
        </View>
      )}
    </View>
  );
}

function BudgetCategoryRow({
  category,
  theme,
  onPress,
  expanded,
}: {
  category: {
    name: string;
    budget: number;
    spent: number;
    icon: string;
    color: string;
  };
  theme: MD3Theme;
  onPress: () => void;
  expanded: boolean;
}) {
  const hasBudget = category.budget > 0;
  const rawPercent = hasBudget
    ? Math.round((category.spent / category.budget) * 100)
    : 0;
  const progress = hasBudget
    ? Math.min(1, category.spent / category.budget)
    : 0;
  const remaining = Math.max(0, category.budget - category.spent);
  const overBy = Math.max(0, category.spent - category.budget);
  const isOverBudget = hasBudget && overBy > 0;
  const statusColor = isOverBudget ? theme.colors.error : category.color;
  const subtitle = hasBudget
    ? `${formatInr(category.spent)} / ${formatInr(category.budget)}`
    : "No budget yet";

  return (
    <Pressable
      accessibilityLabel={`${category.name} budget ${formatInr(
        category.budget,
      )}${hasBudget ? `, ${Math.max(0, rawPercent)}% used` : ""}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        budgetStyles.accountLikeTile,
        !expanded && budgetStyles.accountLikeTileCompact,
        {
          backgroundColor: theme.colors.elevation.level1,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <View style={budgetStyles.accountLikeTopRow}>
        <View style={budgetStyles.accountLikeLeading}>
          <View
            style={[
              budgetStyles.accountLikeIconBadge,
              { backgroundColor: darkenHex(statusColor) },
            ]}
          >
            <MaterialCommunityIcons
              name={category.icon as any}
              size={20}
              color="#FFFFFF"
            />
          </View>
          <View style={budgetStyles.accountLikeText}>
            <Text
              style={[
                budgetStyles.accountLikeTitle,
                { color: theme.colors.onSurface },
              ]}
              numberOfLines={1}
            >
              {category.name}
            </Text>
            {expanded ? (
              <Text
                style={[
                  budgetStyles.accountLikeSubtitle,
                  {
                    color: isOverBudget
                      ? theme.colors.error
                      : theme.colors.onSurfaceVariant,
                  },
                ]}
                numberOfLines={1}
              >
                {isOverBudget
                  ? `${subtitle} • ${formatInr(overBy)} over`
                  : subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={15}
          color={theme.colors.onSurfaceVariant}
          style={{ opacity: 0.4 }}
        />
      </View>

      {expanded ? (
        <View
          style={[
            budgetStyles.accountLikeProgressTrack,
            { backgroundColor: theme.colors.elevation.level3 },
          ]}
        >
          {progress > 0 ? (
            <View
              style={[
                budgetStyles.accountLikeProgressFill,
                {
                  width: `${Math.max(progress * 100, 4)}%`,
                  backgroundColor: statusColor,
                },
              ]}
            />
          ) : null}
        </View>
      ) : null}

      {expanded ? (
        <View
          style={[
            budgetStyles.accountLikeBottomRow,
            !hasBudget && { justifyContent: "center" },
          ]}
        >
          <Text
            style={[
              budgetStyles.accountLikeMeta,
              {
                color: isOverBudget
                  ? theme.colors.error
                  : theme.colors.onSurfaceVariant,
              },
            ]}
          >
            {hasBudget ? `${Math.max(0, rawPercent)}% used` : "No limit yet"}
          </Text>
          {hasBudget ? (
            <Text
              numberOfLines={1}
              style={[
                budgetStyles.accountLikeMeta,
                {
                  color: isOverBudget
                    ? theme.colors.error
                    : theme.colors.onSurfaceVariant,
                },
              ]}
            >
              {isOverBudget
                ? `${formatInr(overBy)} over`
                : `${formatInr(remaining)} left`}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}
