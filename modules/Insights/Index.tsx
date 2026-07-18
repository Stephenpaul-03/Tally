import { AnimatedPaperModal } from "@/components/modal/modal";
import { useSharedTabHeader } from "@/components/pageheader/SharedTabHeader";
import {
  useSetTabBarEdgeButton,
  useTabBarHeight,
} from "@/components/tabbar/TabBarContext";
import { useAppSelector } from "@/hooks/Redux";
import { useAccountManagement } from "@/hooks/use-account-manangement";
import {
  type InsightCardId,
  DEFAULT_INSIGHTS_CARD_ORDER,
  useAddonPrefs,
} from "@/hooks/use-addon-prefs";
import { useQuickShareInsights } from "@/hooks/use-quickshare-insights";
import { selectCategoryBudgets } from "@/modules/Core/Slices/TransactionSlice";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import GuidedChat from "@/modules/Labs/QueryEngine/GuidedChat";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useTheme } from "react-native-paper";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { EmptyState } from "../../components/EmptyStates";
import {
  BudgetSummaryCard,
  CategoryTrendsCard,
  WeeklySpendingCard,
} from "../Labs/BetterAnalytics/Index";
import { BreakdownBottomSheet } from "./Components/BottomSheets/BreakdownListSheet";
import { CategoryTransactionsSheet } from "./Components/BottomSheets/BreakdownTransactionSheet";
import { PaymentMethodBreakdownCard } from "./Components/Cards/AccountBreakdownCard";
import { BreakdownCard } from "./Components/Cards/CategoryBreakdownCard";
import { HeroCard } from "./Components/Cards/HeroCard";
import { QuickShareInsightsModal } from "./Components/QuickShareInsightsModal";
import { useInsights } from "./Hooks";
import { buildInsightsTokens } from "./Tokens";
import { formatAmount, formatMonthLabel, shiftMonth } from "./Utils";

export default function InsightsPage() {
  const theme = useTheme();
  const isFocused = useIsFocused();
  const setTabBarEdgeButton = useSetTabBarEdgeButton();

  const { height: windowHeight } = useWindowDimensions();
  const tabBarHeight = useTabBarHeight();
  const { bottom } = useSafeAreaInsets();
  const usableSpace = tabBarHeight + bottom + 60;
  const { guidedChatEnabled, betterAnalyticsEnabled, insightsCardOrder } =
    useAddonPrefs();
  const t = buildInsightsTokens(theme);
  const activeWorkspace = useAppSelector(selectActiveWorkspace);
  const categoryBudgets = useAppSelector(selectCategoryBudgets);
  const currencyCode = activeWorkspace?.currencyCode ?? "INR";
  const currencySymbol = activeWorkspace?.currencySymbol ?? "";
  const [isGuidedChatOpen, setIsGuidedChatOpen] = useState(false);
  const [guidedChatSessionKey, setGuidedChatSessionKey] = useState(0);
  const [isQuickShareOpen, setIsQuickShareOpen] = useState(false);
  const accountManagement = useAccountManagement();
  const paymentMethodVisuals = useMemo(
    () =>
      Object.fromEntries(
        accountManagement.activeAccounts.map((account) => [
          account.trim().toLowerCase(),
          {
            accent: accountManagement.getAccountColor(account),
            icon: accountManagement.getAccountIcon(
              account,
            ) as React.ComponentProps<typeof MaterialCommunityIcons>["name"],
            label: account,
          },
        ]),
      ),
    [accountManagement],
  );

  const {
    selectedDate,
    selectedMonth,
    setSelectedDate,
    summary,
    overallBudget,
    heroSummary,
    sheetVisible,
    setSheetVisible,
    sheetMode,
    activeFullBreakdown,
    setSheetMode,
    categorySheet,
    setCategorySheet,
    accountSheet,
    setAccountSheet,
    openCategorySheet,
    openPaymentMethodSheet,
    openCategorySheetFromBreakdownSheet,
    categorySheetMonthLabel,
    accountSheetMonthLabel,
    analytics,
  } = useInsights();
  const previousMonthLabel = formatMonthLabel(shiftMonth(selectedMonth, -1));
  const { shareInsights, isGenerating, activeMode } = useQuickShareInsights(
    summary,
    categorySheetMonthLabel,
    previousMonthLabel,
    activeWorkspace?.name,
    currencyCode,
    analytics.categoryComparison.rows,
    analytics.categoryComparison.incomeRows,
    overallBudget,
    categoryBudgets,
  );

  const isEmpty = summary.expenseTotal === 0 && summary.incomeTotal === 0;
  const hasBudget = overallBudget > 0;
  const budgetProgress = hasBudget
    ? (summary.expenseTotal / overallBudget) * 100
    : 0;
  const savingsLeft = summary.incomeTotal - summary.expenseTotal;
  const handleOpenGuidedChat = useCallback(() => {
    if (!guidedChatEnabled) return;
    setGuidedChatSessionKey((prev) => prev + 1);
    setIsGuidedChatOpen(true);
  }, [guidedChatEnabled]);

  const handleCloseGuidedChat = useCallback(() => {
    setIsGuidedChatOpen(false);
  }, []);

  const handleOpenQuickShare = useCallback(() => {
    setIsQuickShareOpen(true);
  }, []);

  const handleCloseQuickShare = useCallback(() => {
    if (isGenerating) {
      return;
    }
    setIsQuickShareOpen(false);
  }, [isGenerating]);

  const handleShareInsights = useCallback(
    async (mode: Parameters<typeof shareInsights>[0]) => {
      await shareInsights(mode);
      setIsQuickShareOpen(false);
    },
    [shareInsights],
  );

  const guidedChatSheetHeight = Math.round(windowHeight * 0.85);

  useEffect(() => {
    if (!isFocused || !guidedChatEnabled) {
      return;
    }
    setTabBarEdgeButton({
      right: {
        label: "Ask",
        accessibilityLabel: "Open guided chat",
        onPress: handleOpenGuidedChat,
        icon: ({ color, size }) => (
          <MaterialCommunityIcons
            name="message-text-outline"
            color={color}
            size={size}
          />
        ),
      },
    });
    return () => setTabBarEdgeButton(null);
  }, [
    guidedChatEnabled,
    handleOpenGuidedChat,
    isFocused,
    setTabBarEdgeButton,
  ]);

  const insightCards = useMemo(() => {
    const cardMap: Partial<Record<InsightCardId, React.ReactNode>> = {
      spendingByCategory: (
        <BreakdownCard
          summary={summary}
          bg={theme.colors.surface}
          accentColor={theme.colors.primary}
          outline={theme.colors.outline}
          textColor={theme.colors.onSurface}
          muted={theme.colors.onSurfaceVariant}
          trackColor={theme.colors.surfaceVariant}
          onRowPress={openCategorySheet}
          categoryComparison={analytics.categoryComparison.rows}
          incomeCategoryComparison={analytics.categoryComparison.incomeRows}
        />
      ),
      spendingByPaymentMethod: (
        <PaymentMethodBreakdownCard
          bg={theme.colors.surface}
          accentColor={theme.colors.primary}
          outline={theme.colors.outline}
          textColor={theme.colors.onSurface}
          muted={theme.colors.onSurfaceVariant}
          trackColor={theme.colors.surfaceVariant}
          items={summary.paymentMethodBreakdown}
          onRowPress={openPaymentMethodSheet}
          paymentMethodVisuals={paymentMethodVisuals}
        />
      ),
    };
    if (hasBudget) {
      cardMap.budgetSummary = (
        <BudgetSummaryCard
          theme={theme}
          totalBudget={overallBudget}
          spent={summary.expenseTotal}
          remaining={overallBudget - summary.expenseTotal}
          currencyCode={currencyCode}
          currencySymbol={currencySymbol}
          categoryEntries={summary.groupedExpenseBreakdown.map((item) => ({
            name: item.category,
            budget: categoryBudgets[item.category] ?? 0,
            spent: item.amount,
          }))}
        />
      );
    }

    if (betterAnalyticsEnabled) {
      cardMap.categoryTrends = (
        <CategoryTrendsCard
          analytics={analytics.categoryTrends}
          bg={theme.colors.surface}
          accentColor={theme.colors.primary}
          outline={theme.colors.outline}
          textColor={theme.colors.onSurface}
          muted={theme.colors.onSurfaceVariant}
        />
      );
      cardMap.weeklySpending = (
        <WeeklySpendingCard
          analytics={analytics.weeklySpending}
          bg={theme.colors.surface}
          accentColor={theme.colors.primary}
          outline={theme.colors.outline}
          textColor={theme.colors.onSurface}
          muted={theme.colors.onSurfaceVariant}
        />
      );
    }

    const visibleCardIds = DEFAULT_INSIGHTS_CARD_ORDER.filter(
      (id) =>
        id === "budgetSummary" ||
        id === "spendingByCategory" ||
        id === "spendingByPaymentMethod" ||
        betterAnalyticsEnabled,
    );
    const orderedIds = [
      ...insightsCardOrder.filter((id): id is InsightCardId =>
        visibleCardIds.includes(id as InsightCardId),
      ),
      ...visibleCardIds.filter((id) => !insightsCardOrder.includes(id)),
    ];

    return orderedIds.map((id) => ({
      id,
      node: cardMap[id] ?? null,
    }));
  }, [
    summary,
    theme,
    openCategorySheet,
    analytics.categoryComparison.rows,
    analytics.categoryComparison.incomeRows,
    analytics.categoryTrends,
    analytics.weeklySpending,
    openPaymentMethodSheet,
    paymentMethodVisuals,
    hasBudget,
    betterAnalyticsEnabled,
    insightsCardOrder,
    overallBudget,
    currencyCode,
    currencySymbol,
    categoryBudgets,
  ]);

  useEffect(() => {
    if (!guidedChatEnabled && isGuidedChatOpen) {
      setIsGuidedChatOpen(false);
    }
  }, [guidedChatEnabled, isGuidedChatOpen]);

  useEffect(() => {
    if (!isFocused) {
      setIsQuickShareOpen(false);
    }
  }, [isFocused]);

  useEffect(() => {
    if (isEmpty) {
      setIsQuickShareOpen(false);
    }
  }, [isEmpty]);

  const quickShareHeaderButton = useMemo(
    () => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open insight share options"
        disabled={isGenerating}
        onPress={handleOpenQuickShare}
        hitSlop={8}
        style={({ pressed }) => ({
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 0.5,
          borderColor: theme.colors.outlineVariant,
          backgroundColor: isQuickShareOpen
            ? theme.colors.primary
            : theme.colors.surface,
          opacity: pressed || isGenerating ? 0.7 : 1,
        })}
      >
        <MaterialCommunityIcons
          name="share-variant-outline"
          size={18}
          color={
            isQuickShareOpen ? theme.colors.onPrimary : theme.colors.onSurface
          }
        />
      </Pressable>
    ),
    [
      handleOpenQuickShare,
      isGenerating,
      isQuickShareOpen,
      theme.colors.onPrimary,
      theme.colors.onSurface,
      theme.colors.outlineVariant,
      theme.colors.primary,
      theme.colors.surface,
    ],
  );

  useSharedTabHeader({
    variant: "date",
    title: "Insights",
    selectedDate,
    onDateSelect: setSelectedDate,
    initialPickerMode: "month-strip",
    backgroundColor: t.bg,
    rightSlot: isEmpty ? undefined : quickShareHeaderButton,
  });

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView
        edges={["left", "right"]}
        style={{ flex: 1, backgroundColor: t.bg }}
      >
        {isEmpty ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 20,
              paddingBottom: usableSpace,
            }}
          >
            <EmptyState
              icon="chart-bar-stacked"
              title="No transactions"
              subtitle={`Nothing recorded for this month \n Add a transaction to see your insights.`}
            />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 12,
                paddingBottom: usableSpace,
              }}
              showsVerticalScrollIndicator={false}
            >
              <HeroCard
                showGreeting={false}
                heroLabel="Balance left"
                primary={{
                  label: "Balance left",
                  value: formatAmount(
                    savingsLeft,
                    currencyCode,
                    currencySymbol,
                  ),
                  caption:
                    Number(heroSummary?.daysUntilMonthEnd) > 0
                      ? `${heroSummary.daysUntilMonthEnd} days remaining`
                      : "income - expense",
                }}
                middle={{
                  label: "Expense",
                  value: formatAmount(
                    summary.expenseTotal,
                    currencyCode,
                    currencySymbol,
                  ),
                  caption: hasBudget
                    ? `${Math.round(budgetProgress)}% of ${formatAmount(overallBudget, currencyCode, currencySymbol)} budget`
                    : Number(heroSummary?.daysUntilMonthEnd) > 0
                      ? "spent until today"
                      : "spent this month",
                }}
                right={{
                  label: "Income",
                  value: formatAmount(
                    summary.incomeTotal,
                    currencyCode,
                    currencySymbol,
                  ),
                  caption:
                    Number(heroSummary?.daysUntilMonthEnd) > 0
                      ? "earned until today"
                      : "earned this month",
                }}
                accentColor={theme.colors.primary}
                outline={theme.colors.outline}
                textColor={theme.colors.onSurface}
                muted={theme.colors.onSurfaceVariant}
              />
              {insightCards.map((card) => (
                <React.Fragment key={card.id}>{card.node}</React.Fragment>
              ))}
            </ScrollView>
          </View>
        )}

        <BreakdownBottomSheet
          visible={sheetVisible}
          onDismiss={() => setSheetVisible(false)}
          breakdown={activeFullBreakdown}
          mode={sheetMode}
          bg={t.baseCard}
          outline={t.outline}
          textColor={t.textColor}
          muted={t.muted}
          trackColor={t.paymentTrack}
          categoryComparison={
            sheetMode === "income"
              ? analytics.categoryComparison.incomeRows
              : analytics.categoryComparison.rows
          }
          onModeChange={setSheetMode}
          onRowPress={openCategorySheetFromBreakdownSheet}
        />

        {null}
      </SafeAreaView>
      <CategoryTransactionsSheet
        visible={Boolean(categorySheet)}
        onDismiss={() => setCategorySheet(null)}
        categoryLabel={categorySheet?.label ?? ""}
        monthLabel={categorySheetMonthLabel}
        total={categorySheet?.total ?? 0}
        transactions={categorySheet?.transactions ?? []}
        mode={categorySheet?.mode ?? "expense"}
        bg={t.baseCard}
        outline={t.outline}
        textColor={t.textColor}
        muted={t.muted}
        categoryIcon={categorySheet?.icon}
        categoryColor={categorySheet?.color}
      />

      <CategoryTransactionsSheet
        visible={Boolean(accountSheet)}
        onDismiss={() => setAccountSheet(null)}
        categoryLabel={accountSheet?.label ?? ""}
        monthLabel={accountSheetMonthLabel}
        total={accountSheet?.total ?? 0}
        transactions={accountSheet?.transactions ?? []}
        mode={accountSheet?.mode ?? "expense"}
        bg={t.baseCard}
        outline={t.outline}
        textColor={t.textColor}
        muted={t.muted}
        categoryIcon={accountSheet?.icon}
        categoryColor={accountSheet?.color}
      />

      <QuickShareInsightsModal
        visible={isQuickShareOpen}
        onDismiss={handleCloseQuickShare}
        isGenerating={isGenerating}
        activeMode={activeMode}
        onShare={handleShareInsights}
      />

      {guidedChatEnabled ? (
        <AnimatedPaperModal
          visible={isGuidedChatOpen}
          onDismiss={handleCloseGuidedChat}
          presentation="sheet"
        >
          <View
            style={[
              insightsActionStyles.guidedChatSheet,
              {
                height: guidedChatSheetHeight,
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <View style={insightsActionStyles.handleWrap}>
              <View
                style={[
                  insightsActionStyles.handle,
                  { backgroundColor: theme.colors.outlineVariant },
                ]}
              />
            </View>
            <View style={insightsActionStyles.guidedChatContent}>
              {isGuidedChatOpen ? (
                <GuidedChat key={guidedChatSessionKey} userName="there" />
              ) : null}
            </View>
          </View>
        </AnimatedPaperModal>
      ) : null}
    </View>
  );
}

export function InsightsCardsOnly({
  contentPaddingBottom = 24,
}: {
  contentPaddingBottom?: number;
}) {
  const theme = useTheme();
  const { betterAnalyticsEnabled, insightsCardOrder } = useAddonPrefs();
  const t = buildInsightsTokens(theme);
  const activeWorkspace = useAppSelector(selectActiveWorkspace);
  const categoryBudgets = useAppSelector(selectCategoryBudgets);
  const currencyCode = activeWorkspace?.currencyCode ?? "INR";
  const currencySymbol = activeWorkspace?.currencySymbol ?? "";
  const accountManagement = useAccountManagement();
  const paymentMethodVisuals = useMemo(
    () =>
      Object.fromEntries(
        accountManagement.activeAccounts.map((account) => [
          account.trim().toLowerCase(),
          {
            accent: accountManagement.getAccountColor(account),
            icon: accountManagement.getAccountIcon(
              account,
            ) as React.ComponentProps<typeof MaterialCommunityIcons>["name"],
            label: account,
          },
        ]),
      ),
    [accountManagement],
  );

  const {
    summary,
    overallBudget,
    sheetVisible,
    setSheetVisible,
    sheetMode,
    activeFullBreakdown,
    setSheetMode,
    categorySheet,
    setCategorySheet,
    accountSheet,
    setAccountSheet,
    openCategorySheet,
    openPaymentMethodSheet,
    openCategorySheetFromBreakdownSheet,
    categorySheetMonthLabel,
    accountSheetMonthLabel,
    analytics,
  } = useInsights();

  const isEmpty = summary.expenseTotal === 0 && summary.incomeTotal === 0;
  const hasBudget = overallBudget > 0;

  const insightCards = useMemo(() => {
    const cardMap: Partial<Record<InsightCardId, React.ReactNode>> = {
      spendingByCategory: (
        <BreakdownCard
          summary={summary}
          bg={theme.colors.surface}
          accentColor={theme.colors.primary}
          outline={theme.colors.outline}
          textColor={theme.colors.onSurface}
          muted={theme.colors.onSurfaceVariant}
          trackColor={theme.colors.surfaceVariant}
          onRowPress={openCategorySheet}
          categoryComparison={analytics.categoryComparison.rows}
          incomeCategoryComparison={analytics.categoryComparison.incomeRows}
        />
      ),
      spendingByPaymentMethod: (
        <PaymentMethodBreakdownCard
          bg={theme.colors.surface}
          accentColor={theme.colors.primary}
          outline={theme.colors.outline}
          textColor={theme.colors.onSurface}
          muted={theme.colors.onSurfaceVariant}
          trackColor={theme.colors.surfaceVariant}
          items={summary.paymentMethodBreakdown}
          onRowPress={openPaymentMethodSheet}
          paymentMethodVisuals={paymentMethodVisuals}
        />
      ),
    };

    if (hasBudget) {
      cardMap.budgetSummary = (
        <BudgetSummaryCard
          theme={theme}
          totalBudget={overallBudget}
          spent={summary.expenseTotal}
          remaining={overallBudget - summary.expenseTotal}
          currencyCode={currencyCode}
          currencySymbol={currencySymbol}
          categoryEntries={summary.groupedExpenseBreakdown.map((item) => ({
            name: item.category,
            budget: categoryBudgets[item.category] ?? 0,
            spent: item.amount,
          }))}
        />
      );
    }

    if (betterAnalyticsEnabled) {
      cardMap.categoryTrends = (
        <CategoryTrendsCard
          analytics={analytics.categoryTrends}
          bg={theme.colors.surface}
          accentColor={theme.colors.primary}
          outline={theme.colors.outline}
          textColor={theme.colors.onSurface}
          muted={theme.colors.onSurfaceVariant}
        />
      );
      cardMap.weeklySpending = (
        <WeeklySpendingCard
          analytics={analytics.weeklySpending}
          bg={theme.colors.surface}
          accentColor={theme.colors.primary}
          outline={theme.colors.outline}
          textColor={theme.colors.onSurface}
          muted={theme.colors.onSurfaceVariant}
        />
      );
    }

    const visibleCardIds = DEFAULT_INSIGHTS_CARD_ORDER.filter(
      (id) =>
        id === "budgetSummary" ||
        id === "spendingByCategory" ||
        id === "spendingByPaymentMethod" ||
        betterAnalyticsEnabled,
    );
    const orderedIds = [
      ...insightsCardOrder.filter((id): id is InsightCardId =>
        visibleCardIds.includes(id as InsightCardId),
      ),
      ...visibleCardIds.filter((id) => !insightsCardOrder.includes(id)),
    ];

    return orderedIds.map((id) => ({
      id,
      node: cardMap[id] ?? null,
    }));
  }, [
    summary,
    theme,
    openCategorySheet,
    analytics.categoryComparison.rows,
    analytics.categoryComparison.incomeRows,
    analytics.categoryTrends,
    analytics.weeklySpending,
    openPaymentMethodSheet,
    paymentMethodVisuals,
    hasBudget,
    betterAnalyticsEnabled,
    insightsCardOrder,
    overallBudget,
    currencyCode,
    currencySymbol,
    categoryBudgets,
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {isEmpty ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 20,
            paddingBottom: contentPaddingBottom,
          }}
        >
          <EmptyState
            icon="chart-bar-stacked"
            title="No transactions"
            subtitle={`Nothing recorded for this month \n Add a transaction to see your insights.`}
          />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: contentPaddingBottom,
          }}
          showsVerticalScrollIndicator={false}
        >
          {insightCards.map((card) => (
            <React.Fragment key={card.id}>{card.node}</React.Fragment>
          ))}
        </ScrollView>
      )}

      <BreakdownBottomSheet
        visible={sheetVisible}
        onDismiss={() => setSheetVisible(false)}
        breakdown={activeFullBreakdown}
        mode={sheetMode}
        bg={t.baseCard}
        outline={t.outline}
        textColor={t.textColor}
        muted={t.muted}
        trackColor={t.paymentTrack}
        categoryComparison={
          sheetMode === "income"
            ? analytics.categoryComparison.incomeRows
            : analytics.categoryComparison.rows
        }
        onModeChange={setSheetMode}
        onRowPress={openCategorySheetFromBreakdownSheet}
      />

      <CategoryTransactionsSheet
        visible={Boolean(categorySheet)}
        onDismiss={() => setCategorySheet(null)}
        categoryLabel={categorySheet?.label ?? ""}
        monthLabel={categorySheetMonthLabel}
        total={categorySheet?.total ?? 0}
        transactions={categorySheet?.transactions ?? []}
        mode={categorySheet?.mode ?? "expense"}
        bg={t.baseCard}
        outline={t.outline}
        textColor={t.textColor}
        muted={t.muted}
        categoryIcon={categorySheet?.icon}
        categoryColor={categorySheet?.color}
      />

      <CategoryTransactionsSheet
        visible={Boolean(accountSheet)}
        onDismiss={() => setAccountSheet(null)}
        categoryLabel={accountSheet?.label ?? ""}
        monthLabel={accountSheetMonthLabel}
        total={accountSheet?.total ?? 0}
        transactions={accountSheet?.transactions ?? []}
        mode={accountSheet?.mode ?? "expense"}
        bg={t.baseCard}
        outline={t.outline}
        textColor={t.textColor}
        muted={t.muted}
        categoryIcon={accountSheet?.icon}
        categoryColor={accountSheet?.color}
      />
    </View>
  );
}

const insightsActionStyles = StyleSheet.create({
  guidedChatSheet: {
    alignSelf: "stretch",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 32,
    height: 4,
    borderRadius: 999,
  },
  guidedChatContent: {
    flex: 1,
    minHeight: 0,
  },
});
