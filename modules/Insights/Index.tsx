import { useFadeSlide } from "@/components/animations/UseFadeSlide";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { PageHeader } from "@/components/pageheader/PageHeader";
import { useTabBarHeight } from "@/components/tabbar/TabBarContext";
import { useAccountManagement } from "@/hooks/use-account-manangement";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { useCategoryManagement } from "@/hooks/use-category-manamgement";
import GuidedChat from "@/modules/Labs/QueryEngine/GuidedChat";
import { AccountManagementModal } from "@/modules/Management/Account/Index";
import { CategoryManagementModal } from "@/modules/Management/Category/Index";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
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
import { EmptyState } from "../../components/EmptyStates";
import {
  IncomeVsExpensesCard,
  SpendingTrendCard,
} from "../Labs/BetterAnalytics/Index";
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
  const usableSpace = tabBarHeight + 12;
  const addButtonSpacing = 50;
  const { guidedChatEnabled, betterAnalyticsEnabled } = useAddonPrefs();
  const t = buildInsightsTokens(theme);
  const [isGuidedChatOpen, setIsGuidedChatOpen] = useState(false);
  const [guidedChatSessionKey, setGuidedChatSessionKey] = useState(0);
  const categoryManagement = useCategoryManagement("expense");
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

  return (
    <View style={{ flex: 1, marginBottom: usableSpace }}>
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={{ flex: 1, backgroundColor: t.bg }}
      >
        <PageHeader
          variant="date"
          title="Insights"
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          initialPickerMode="month-strip"
          backgroundColor={t.bg}
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

        {guidedChatEnabled ? (
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
