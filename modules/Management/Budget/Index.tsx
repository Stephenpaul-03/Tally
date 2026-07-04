import { SettingsHeader } from "@/modules/Settings/Components/SettingsHeader";
import type { SettingsStackParamList } from "@/modules/Settings/Navigation";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { BudgetDetailsSheet } from "./Components/BudgetDetailsSheet";
import { BudgetSummaryCard } from "./Components/BudgetSummaryCard";
import { formatInr, useBudgetManagement } from "./Hooks";
import { budgetStyles } from "./Styles";

export function BudgetScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const { categoryEntries, saveCategory, clearCategory } =
    useBudgetManagement();

  const [selectedCategoryName, setSelectedCategoryName] = React.useState<
    string | null
  >(null);
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  const allocated = categoryEntries.reduce(
    (sum, category) => sum + category.budget,
    0,
  );
  const spent = categoryEntries.reduce((sum, item) => sum + item.spent, 0);
  const remaining = allocated - spent;
  const currentCategory = React.useMemo(
    () =>
      selectedCategoryName
        ? (categoryEntries.find(
            (category) => category.name === selectedCategoryName,
          ) ?? null)
        : null,
    [categoryEntries, selectedCategoryName],
  );
  const handleOpenCategory = (category: (typeof categoryEntries)[number]) => {
    setSelectedCategoryName(category.name);
    setDetailsOpen(true);
  };

  return (
    <SafeAreaView
      style={[
        budgetStyles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <SettingsHeader title="Budget" onBack={() => navigation.goBack()} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={budgetStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <BudgetSummaryCard
          theme={theme}
          totalBudget={allocated}
          spent={spent}
          remaining={remaining}
          categoryEntries={categoryEntries}
        />
        <View
          style={[
            budgetStyles.tableCard,
            { backgroundColor: theme.colors.elevation.level1 },
          ]}
        >
          <View
            style={[
              budgetStyles.tableHeader,
              { borderColor: theme.colors.outline },
            ]}
          >
            <Text
              style={[
                budgetStyles.headerCellCategory,
                {
                  ...typography.editorial.sectionLabel,
                  fontSize: 16,
                  paddingVertical: 12,
                  color: theme.colors.onSurfaceVariant,
                },
              ]}
            >
              Category
            </Text>
            <View
              style={[
                budgetStyles.tableVerticalDivider,
                { backgroundColor: theme.colors.outlineVariant },
              ]}
            />
            <Text
              style={[
                budgetStyles.headerCell,
                {
                  ...typography.editorial.sectionLabel,
                  fontSize: 16,
                  paddingVertical: 12,
                  color: theme.colors.onSurfaceVariant,
                },
              ]}
            >
              Spent
            </Text>
            <View
              style={[
                budgetStyles.tableVerticalDivider,
                { backgroundColor: theme.colors.outlineVariant },
              ]}
            />
            <Text
              style={[
                budgetStyles.headerCell,
                {
                  ...typography.editorial.sectionLabel,
                  fontSize: 16,
                  paddingVertical: 12,
                  color: theme.colors.onSurfaceVariant,
                },
              ]}
            >
              Budget
            </Text>
          </View>

          {categoryEntries.map((category, index) => {
            const hasBudget = category.budget > 0;
            const statusColor =
              hasBudget && category.spent > category.budget
                ? theme.colors.error
                : hasBudget && category.spent >= category.budget * 0.8
                  ? theme.colors.tertiary
                  : category.color;
            return (
              <Pressable
                key={category.name}
                onPress={() => handleOpenCategory(category)}
                style={({ pressed }) => [
                  budgetStyles.tableRow,
                  index !== categoryEntries.length - 1 && [
                    budgetStyles.tableRowDivider,
                    { borderBottomColor: theme.colors.outlineVariant },
                  ],
                  { opacity: pressed ? 0.78 : 1 },
                ]}
              >
                <View style={budgetStyles.categoryCell}>
                  <View style={[budgetStyles.categoryBadge]}>
                    <MaterialCommunityIcons
                      name={category.icon as any}
                      size={20}
                      color={statusColor}
                    />
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[
                      budgetStyles.categoryName,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    {category.name}
                  </Text>
                </View>
                <View
                  style={[
                    budgetStyles.tableVerticalDivider,
                    { backgroundColor: theme.colors.outlineVariant },
                  ]}
                />
                <Text
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  style={[
                    budgetStyles.tableCellValue,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  {formatInr(category.spent)}
                </Text>
                <View
                  style={[
                    budgetStyles.tableVerticalDivider,
                    { backgroundColor: theme.colors.outlineVariant },
                  ]}
                />
                <Text
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  style={[
                    budgetStyles.tableCellValue,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  {formatInr(category.budget)}
                </Text>
              </Pressable>
            );
          })}
          {categoryEntries.length === 0 ? (
            <View style={budgetStyles.emptyState}>
              <Text
                style={[
                  budgetStyles.emptyStateText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                No category budgets yet.
              </Text>
            </View>
          ) : null}
        </View>
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
    </SafeAreaView>
  );
}
