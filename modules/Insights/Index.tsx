import { useFadeSlide } from "@/components/animations/UseFadeSlide";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { PageHeader } from "@/components/pageheader/PageHeader";
import {
  useSetTabBarEdgeButton,
  useTabBarHeight,
} from "@/components/tabbar/TabBarContext";
import { useTabBarModePreference } from "@/components/tabbar/TabBarModePreference";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import GuidedChat from "@/modules/Addons/QueryEngine/GuidedChat";
import { AccountManagementModal } from "@/modules/Common/Components/AccountManagement/Index";
import { CategoryManagementModal } from "@/modules/Common/Components/CategoryManagement/Index";
import {
  HeaderMenuButton,
  HeaderMenuSheet,
} from "@/modules/Common/Components/HeaderMenuModal/Index";
import { useAccountManagement } from "@/modules/Common/Hooks/UseAccountManagement";
import { useCategoryManagement } from "@/modules/Common/Hooks/UseCategoryManagement";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { FAB, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  IncomeVsExpensesCard,
  SpendingTrendCard,
} from "../Addons/BetterAnalytics/Index";
import { EmptyState } from "../Common/Components/EmptyStates";
import { AccountTransactionsSheet } from "./Components/BottomSheets/AccountTransactionsSheet";
import { BreakdownBottomSheet } from "./Components/BottomSheets/BreakdownListSheet";
import { CategoryTransactionsSheet } from "./Components/BottomSheets/BreakdownTransactionSheet";
import { PaymentMethodBreakdownCard } from "./Components/Cards/AccountBreakdownCard";
import { AdvancedInsightsCarousel } from "./Components/Cards/AdvancedInsightsCard";
import { BreakdownCard } from "./Components/Cards/CategoryBreakdownCard";
import { HeroCard } from "./Components/Cards/HeroCard";
import { useInsights } from "./Hooks";
import { buildInsightsTokens } from "./Tokens";

export default function InsightsPage() {
  const theme = useTheme();
  const isFocused = useIsFocused();
  const { animStyle, slideIn } = useFadeSlide({
    from: "bottom",
    distance: 20,
    duration: 1200,
    autoPlay: false,
    delay: 300,
  });

  const hasMountedRef = useRef(false);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    if (isFocused && !hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
      slideIn();
    }
  }, [isFocused, slideIn]);

  // Reset when user leaves, so it re-animates on return
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      hasAnimatedRef.current = true; // ← mark as already "animated" on first mount
      return;
    }
    if (isFocused && !hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
      slideIn();
    }
  }, [isFocused, slideIn]);

  const { height: windowHeight } = useWindowDimensions();
  const tabBarHeight = useTabBarHeight();
  const setTabBarEdgeButton = useSetTabBarEdgeButton();
  const { tabBarMode } = useTabBarModePreference();
  const usableSpace = tabBarHeight + 12;
  const addButtonSpacing = tabBarMode === "floating" ? 0 : 50;
  const { guidedChatEnabled, betterAnalyticsEnabled } = useAddonPrefs();
  const { isMobileLayout: isMobile } = useBreakpoint();
  const t = buildInsightsTokens(theme);
  const [isHeaderSheetOpen, setIsHeaderSheetOpen] = useState(false);
  const [isGuidedChatOpen, setIsGuidedChatOpen] = useState(false);
  const [guidedChatSessionKey, setGuidedChatSessionKey] = useState(0);
  const categoryManagement = useCategoryManagement("expense");
  const accountManagement = useAccountManagement();
  const emptyStateAnimatedRef = useRef(false);
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
  const fabTheme = useMemo(
    () => ({
      ...theme,
      fonts: {
        ...theme.fonts,
        labelLarge: {
          ...theme.fonts.labelLarge,
          ...typography.editorial.sectionLabel,
          fontSize: 16,
          lineHeight: 16,
          letterSpacing: 0.5,
          fontWeight: "normal" as const,
        },
      },
    }),
    [theme],
  );

  const {
    selectedDate,
    setSelectedDate,
    summary,
    comparison,
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
  const handleOpenGuidedChat = useCallback(() => {
    if (!guidedChatEnabled) return;
    setGuidedChatSessionKey((prev) => prev + 1);
    setIsGuidedChatOpen(true);
  }, [guidedChatEnabled]);

  const handleCloseGuidedChat = useCallback(() => {
    setIsGuidedChatOpen(false);
  }, []);

  const guidedChatSheetHeight = Math.round(windowHeight * 0.85);

  // Advanced analytics cards — shown in a swipeable carousel when
  // betterAnalyticsEnabled is on. Empty array hides the carousel entirely.
  const advancedCards = useMemo(() => {
    if (!betterAnalyticsEnabled) return [];

    return [
      {
        id: "spendingTrend",
        node: (
          <SpendingTrendCard
            analytics={analytics.spendingTrend}
            bg={t.elevatedCard}
            outline={t.outline}
            textColor={t.textColor}
            muted={t.muted}
          />
        ),
      },
      {
        id: "incomeVsExpenses",
        node: (
          <IncomeVsExpensesCard
            analytics={analytics.incomeVsExpenses}
            bg={t.elevatedCard}
            outline={t.outline}
            textColor={t.textColor}
            muted={t.muted}
          />
        ),
      },
    ];
  }, [
    analytics.incomeVsExpenses,
    analytics.spendingTrend,
    betterAnalyticsEnabled,
    t.elevatedCard,
    t.outline,
    t.textColor,
    t.muted,
  ]);

  // Core breakdown cards — always shown, fixed order.
  const insightCards = useMemo(() => {
    // spendingByCategory always passes comparison rows — the card itself
    // only renders dual rings/bars when betterAnalyticsEnabled is on.
    return [
      {
        id: "spendingByCategory",
        node: (
          <BreakdownCard
            summary={summary}
            bg={t.elevatedCard}
            outline={t.outline}
            textColor={t.textColor}
            muted={t.muted}
            trackColor={t.paymentTrack}
            onRowPress={openCategorySheet}
            categoryComparison={analytics.categoryComparison.rows}
            incomeCategoryComparison={analytics.categoryComparison.incomeRows}
          />
        ),
      },
      {
        id: "paymentMethodBreakdown",
        node: (
          <PaymentMethodBreakdownCard
            bg={t.elevatedCard}
            outline={t.outline}
            textColor={t.textColor}
            muted={t.muted}
            trackColor={t.paymentTrack}
            items={summary.paymentMethodBreakdown}
            onRowPress={openPaymentMethodSheet}
            paymentMethodVisuals={paymentMethodVisuals}
          />
        ),
      },
    ];
  }, [
    analytics.categoryComparison.rows,
    analytics.categoryComparison.incomeRows,
    openCategorySheet,
    openPaymentMethodSheet,
    paymentMethodVisuals,
    summary,
    t.elevatedCard,
    t.outline,
    t.paymentTrack,
    t.textColor,
    t.muted,
  ]);

  useEffect(() => {
    if (!guidedChatEnabled && isGuidedChatOpen) {
      setIsGuidedChatOpen(false);
    }
  }, [guidedChatEnabled, isGuidedChatOpen]);

  useFocusEffect(
    useCallback(() => {
      if (!isMobile) return;
      if (tabBarMode !== "floating") return;

      setTabBarEdgeButton({
        left: guidedChatEnabled
          ? {
              onPress: handleOpenGuidedChat,
              icon: ({ color, size }) => (
                <MaterialCommunityIcons
                  name="message-text-outline"
                  color={color}
                  size={size}
                />
              ),
              accessibilityLabel: "Ask Tally",
            }
          : null,
        right: null,
      });

      return () => setTabBarEdgeButton(null);
    }, [
      guidedChatEnabled,
      handleOpenGuidedChat,
      isMobile,
      setTabBarEdgeButton,
      tabBarMode,
    ]),
  );

  return (
    <View style={{ flex: 1, marginBottom: usableSpace }}>
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={{ flex: 1, backgroundColor: t.bg }}
      >
        <PageHeader
          title="Insights"
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          pickerMode="month-strip"
          left={{
            type: "custom",
            render: () => (
              <HeaderMenuButton
                accessibilityLabel="Open insights menu"
                onPress={() => setIsHeaderSheetOpen(true)}
              />
            ),
          }}
          right={{ type: "date" }}
          backgroundColor={t.bg}
        />

        <HeaderMenuSheet
          visible={isHeaderSheetOpen}
          onDismiss={() => setIsHeaderSheetOpen(false)}
          onOpenCategories={() =>
            categoryManagement.handleOpenManagement("expense")
          }
          onOpenAccounts={accountManagement.handleOpenManagement}
          insightsSummary={summary}
          insightsMonthLabel={categorySheetMonthLabel}
        />

        {isEmpty ? (
          <View
            style={{
              flex: 1,
              flexGrow: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <EmptyState
              icon="chart-bar-stacked"
              title="No transactions"
              subtitle={`Nothing recorded for this month \n Add a transaction to see your insights.`}
              skipInitialAnim={emptyStateAnimatedRef.current}
              onAnimated={() => {
                emptyStateAnimatedRef.current = true;
              }}
            />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                padding: 16,
                paddingBottom: addButtonSpacing,
                paddingTop: 0,
              }}
              showsVerticalScrollIndicator={false}
            >
              <HeroCard
                summary={summary}
                comparison={comparison}
                bg={t.elevatedCard}
                outline={t.outline}
                textColor={t.textColor}
                muted={t.muted}
              />
              {insightCards.map((card) => (
                <React.Fragment key={card.id}>{card.node}</React.Fragment>
              ))}
              <AdvancedInsightsCarousel
                cards={advancedCards}
                activeColor={theme.colors.primary}
                inactiveColor={t.muted}
              />
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

        {guidedChatEnabled && tabBarMode === "basic" ? (
          <Animated.View style={animStyle}>
            <View
              pointerEvents="box-none"
              style={[insightsActionStyles.bottomActionWrap]}
            >
              <FAB
                icon="message-text-outline"
                label="Ask"
                accessibilityLabel="Open guided chat"
                onPress={handleOpenGuidedChat}
                uppercase={false}
                color={theme.colors.surface}
                style={[
                  insightsActionStyles.askButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                theme={fabTheme}
              />
            </View>
          </Animated.View>
        ) : null}
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

      <AccountTransactionsSheet
        visible={Boolean(accountSheet)}
        onDismiss={() => setAccountSheet(null)}
        accountLabel={accountSheet?.label ?? ""}
        accountIcon={accountSheet?.icon}
        accountColor={accountSheet?.color}
        monthLabel={accountSheetMonthLabel}
        total={accountSheet?.total ?? 0}
        transactions={accountSheet?.transactions ?? []}
        mode={accountSheet?.mode ?? "expense"}
        bg={t.baseCard}
        outline={t.outline}
        textColor={t.textColor}
        muted={t.muted}
      />

      <CategoryManagementModal
        isOpen={categoryManagement.isManagementOpen}
        onClose={categoryManagement.handleCloseManagement}
        management={categoryManagement}
      />

      <AccountManagementModal
        isOpen={accountManagement.isManagementOpen}
        onClose={accountManagement.handleCloseManagement}
        management={accountManagement}
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

const insightsActionStyles = StyleSheet.create({
  bottomActionWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
  },
  askButton: {
    borderRadius: 20,
    minWidth: 96,
  },
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
