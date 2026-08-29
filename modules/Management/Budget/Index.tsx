import { useStagger } from "@/components/animations/UseStagger";
import { SortOptionSheet } from "@/components/SortOptionSheet";
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

type BudgetSortField = "budget" | "spent" | "remaining" | "name" | "usage";
type BudgetSortDirection = "asc" | "desc";

const BUDGET_SORT_OPTIONS: {
  id: BudgetSortField;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "budget",
    label: "Budget",
    description: "Sort by budget amount",
    icon: "cash-multiple",
  },
  {
    id: "spent",
    label: "Spent",
    description: "Sort by spending this month",
    icon: "chart-bar",
  },
  {
    id: "remaining",
    label: "Remaining",
    description: "Sort by remaining balance",
    icon: "progress-alert",
  },
  {
    id: "name",
    label: "Name",
    description: "Sort category names",
    icon: "sort-alphabetical-ascending",
  },
  {
    id: "usage",
    label: "Usage",
    description: "Sort by percent used",
    icon: "percent-outline",
  },
];

type BudgetCategoryEntry = ReturnType<
  typeof useBudgetManagement
>["categoryEntries"][number];
type BudgetStatusGroupId =
  | "overbudget"
  | "empty"
  | "nearlyEmpty"
  | "safe"
  | "unbudgeted";

const BUDGET_STATUS_GROUPS: {
  id: BudgetStatusGroupId;
  title: string;
  icon: string;
  color: string;
}[] = [
  {
    id: "safe",
    title: "Safe",
    icon: "shield-check-outline",
    color: "#2E7D32",
  },
  {
    id: "nearlyEmpty",
    title: "Nearly empty",
    icon: "progress-alert",
    color: "#C77700",
  },
  {
    id: "empty",
    title: "Budget used up",
    icon: "playlist-remove",
    color: "#5E6AD2",
  },
  {
    id: "overbudget",
    title: "Over budget",
    icon: "alert-circle-outline",
    color: "#B3261E",
  },
  {
    id: "unbudgeted",
    title: "No Budget set",
    icon: "shape-outline",
    color: "#5E6AD2",
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
  const {
    categoryEntries,
    minimalIconsEnabled,
    saveCategory,
    clearCategory,
  } = useBudgetManagement();

  const [selectedCategoryName, setSelectedCategoryName] = React.useState<
    string | null
  >(null);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [sortOpen, setSortOpen] = React.useState(false);
  const [sortField, setSortField] = React.useState<BudgetSortField>("budget");
  const [sortDirection, setSortDirection] =
    React.useState<BudgetSortDirection>("desc");
  const [collapsedSections, setCollapsedSections] = React.useState<
    Partial<Record<BudgetStatusGroupId, boolean>>
  >({});
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
        let result: number;
        if (sortField === "name") result = a.name.localeCompare(b.name);
        else {
          const aValue =
            sortField === "spent"
              ? a.spent
              : sortField === "remaining"
                ? a.budget > 0
                  ? a.budget - a.spent
                  : Number.MAX_SAFE_INTEGER
                : sortField === "usage"
                  ? a.budget > 0
                    ? a.spent / a.budget
                    : 0
                  : a.budget;
          const bValue =
            sortField === "spent"
              ? b.spent
              : sortField === "remaining"
                ? b.budget > 0
                  ? b.budget - b.spent
                  : Number.MAX_SAFE_INTEGER
                : sortField === "usage"
                  ? b.budget > 0
                    ? b.spent / b.budget
                    : 0
                  : b.budget;
          result = aValue - bValue;
        }
        return sortDirection === "asc" ? result : -result;
      }),
    [sortDirection, sortField, visibleCategoryEntries],
  );
  const workspaceDefaults = getWorkspaceDefaults(
    activeWorkspace?.id ?? "personal",
  );
  React.useEffect(() => {
    setSortField(workspaceDefaults.budgetSortField);
    setSortDirection(workspaceDefaults.budgetSortDirection);
  }, [workspaceDefaults.budgetSortDirection, workspaceDefaults.budgetSortField]);
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
      overbudget: [],
      empty: [],
      nearlyEmpty: [],
      safe: [],
      unbudgeted: [],
    };

    sortedCategoryEntries.forEach((category) => {
      const hasBudget = category.budget > 0;
      const percentUsed = hasBudget
        ? (category.spent / category.budget) * 100
        : 0;

      if (!hasBudget) {
        groups.unbudgeted.push(category);
      } else if (percentUsed > 100) {
        groups.overbudget.push(category);
      } else if (percentUsed >= 100) {
        groups.empty.push(category);
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
  const visibleGroups = React.useMemo(
    () =>
      BUDGET_STATUS_GROUPS.filter(
        (group) => groupedCategoryEntries[group.id].length > 0,
      ),
    [groupedCategoryEntries],
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
  const toggleSection = React.useCallback((groupId: BudgetStatusGroupId) => {
    setCollapsedSections((previous) => ({
      ...previous,
      [groupId]: !previous[groupId],
    }));
  }, []);
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
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.outlineVariant,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Sort budgets"
    >
      <MaterialCommunityIcons
        name="sort"
        size={20}
        color={c.onSurfaceVariant}
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
        {visibleGroups.length > 0 ? (
          visibleGroups.map((group) => (
            <BudgetStatusSection
              key={group.id}
              collapsed={Boolean(collapsedSections[group.id])}
              color={group.color}
              entries={groupedCategoryEntries[group.id]}
              expanded
              getAnimStyle={getAnimStyle}
              icon={group.icon}
              indexByName={animationIndexByName}
              onOpenCategory={handleOpenCategory}
              onToggle={() => toggleSection(group.id)}
              minimalIconsEnabled={minimalIconsEnabled}
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
          last30DaysSpent={currentCategory.last30DaysSpent}
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
      <SortOptionSheet
        visible={sortOpen}
        onDismiss={() => setSortOpen(false)}
        title="Sort budgets"
        subtitle="Choose how category budgets are ordered."
        options={BUDGET_SORT_OPTIONS}
        value={sortField}
        direction={sortDirection}
        resetDirection="desc"
        onChange={(value) => setSortField(value as BudgetSortField)}
        onDirectionChange={(direction) => setSortDirection(direction)}
      />
    </SafeAreaView>
  );
}

function BudgetStatusSection({
  collapsed,
  color,
  entries,
  expanded,
  getAnimStyle,
  icon,
  indexByName,
  onOpenCategory,
  onToggle,
  minimalIconsEnabled,
  theme,
  title,
}: {
  collapsed: boolean;
  color: string;
  entries: BudgetCategoryEntry[];
  expanded: boolean;
  getAnimStyle: (index: number) => Record<string, unknown>;
  icon: string;
  indexByName: Record<string, number>;
  onOpenCategory: (category: BudgetCategoryEntry) => void;
  onToggle: () => void;
  minimalIconsEnabled: boolean;
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${collapsed ? "Expand" : "Collapse"} ${title}`}
        onPress={onToggle}
        style={({ pressed }) => [
          budgetStyles.budgetSectionHeader,
          { opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <View
          style={[
            budgetStyles.budgetSectionIcon,
            {
              backgroundColor: minimalIconsEnabled
                ? theme.colors.background
                : darkenHex(color, 0.08),
              borderColor: minimalIconsEnabled
                ? theme.colors.elevation.level1
                : "transparent",
              borderWidth: minimalIconsEnabled ? 1 : 0,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={icon as any}
            size={15}
            color={minimalIconsEnabled ? theme.colors.primary : "#FFFFFF"}
          />
        </View>
        <Text
          style={[
            budgetStyles.budgetSectionTitle,
            {
              color: minimalIconsEnabled ? theme.colors.onSurface : color,
            },
          ]}
        >
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
        <MaterialCommunityIcons
          name={collapsed ? "chevron-down" : "chevron-up"}
          size={18}
          color={theme.colors.onSurfaceVariant}
        />
      </Pressable>
      {!collapsed ? (
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
                    minimalIconsEnabled={minimalIconsEnabled}
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
      ) : null}
    </View>
  );
}

function BudgetCategoryRow({
  category,
  minimalIconsEnabled,
  theme,
  onPress,
  expanded,
}: {
  category: {
    name: string;
    budget: number;
    spent: number;
    last30DaysSpent: number;
    icon: string;
    color: string;
  };
  minimalIconsEnabled: boolean;
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
  const overBy = Math.max(0, category.spent - category.budget);
  const isOverBudget = hasBudget && overBy > 0;
  const statusColor = isOverBudget ? theme.colors.error : category.color;
  const subtitle = `${formatInr(category.spent)} / ${formatInr(category.budget)}`;

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
              {
                backgroundColor: minimalIconsEnabled
                  ? theme.colors.background
                  : darkenHex(statusColor),
                borderColor: minimalIconsEnabled
                  ? theme.colors.elevation.level1
                  : "transparent",
                borderWidth: minimalIconsEnabled ? 1 : 0,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={category.icon as any}
              size={20}
              color={minimalIconsEnabled ? theme.colors.primary : "#FFFFFF"}
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
            {expanded && hasBudget ? (
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

      {expanded && hasBudget ? (
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

      {expanded && hasBudget ? (
        <View style={budgetStyles.accountLikeBottomRow}>
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
            {`${Math.max(0, rawPercent)}% used`}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
