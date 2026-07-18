import { EmptyState } from "@/components/EmptyStates";
import { useSharedTabHeader } from "@/components/pageheader/SharedTabHeader";
import { useTabBarHeight } from "@/components/tabbar/TabBarContext";
import { useAppDispatch, useAppSelector } from "@/hooks/Redux";
import {
  openAddModal,
  selectExpenseTransactions,
  selectIncomeTransactions,
  selectOverallBudget,
} from "@/modules/Core/Slices/TransactionSlice";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import { HeroCard } from "@/modules/Insights/Components/Cards/HeroCard";
import { formatAmount } from "@/modules/Insights/Utils";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo } from "react";
import { Animated, ScrollView, View, useWindowDimensions } from "react-native";
import { useTheme } from "react-native-paper";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { CalendarGrid } from "./Components/CalendarGrid";
import { DaySummaryCard } from "./Components/DaySummaryCard";
import { useCalendarMonth, useRowAnimations, useSelectedDay } from "./Hooks";
import { buildCalendarStyles } from "./Styles";
import { buildCalendarTokens } from "./Tokens";
import type { CalendarMonth, DayActivity } from "./Types";
import { buildCalendarMonth, getActiveDayCount } from "./Utils";

function buildMonthActivities(
  year: number,
  month: number,
  incomeTransactions: ReturnType<typeof selectIncomeTransactions>,
  expenseTransactions: ReturnType<typeof selectExpenseTransactions>,
): DayActivity[] {
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  const activityMap = new Map<string, DayActivity>();

  const ensureActivity = (date: string) => {
    const existing = activityMap.get(date);
    if (existing) {
      return existing;
    }
    const next: DayActivity = {
      date,
      hasIncome: false,
      hasExpense: false,
      incomeTotal: 0,
      expenseTotal: 0,
      transactionCount: 0,
    };
    activityMap.set(date, next);
    return next;
  };

  for (const transaction of incomeTransactions) {
    if (!transaction.date.startsWith(monthKey)) {
      continue;
    }
    const activity = ensureActivity(transaction.date);
    activity.hasIncome = true;
    activity.incomeTotal += Math.abs(transaction.amount);
    activity.transactionCount += 1;
  }

  for (const transaction of expenseTransactions) {
    if (!transaction.date.startsWith(monthKey)) {
      continue;
    }
    const activity = ensureActivity(transaction.date);
    activity.hasExpense = true;
    activity.expenseTotal += Math.abs(transaction.amount);
    activity.transactionCount += 1;
  }

  return Array.from(activityMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

function attachActivities(
  calendarMonth: CalendarMonth,
  activities: DayActivity[],
): CalendarMonth {
  const activityMap = new Map(
    activities.map((activity) => [activity.date, activity]),
  );

  return {
    ...calendarMonth,
    weeks: calendarMonth.weeks.map((week) =>
      week.map((day) => ({
        ...day,
        activity: day.dateString
          ? (activityMap.get(day.dateString) ?? null)
          : null,
      })),
    ),
  };
}

export default function CalendarPage() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const tabBarHeight = useTabBarHeight();
  const { bottom } = useSafeAreaInsets();
  const usableSpace = tabBarHeight + bottom + 60;
  const tokens = useMemo(() => buildCalendarTokens(theme), [theme]);
  const styles = useMemo(() => buildCalendarStyles(tokens), [tokens]);
  const now = useMemo(() => new Date(), []);
  const { currentYear, currentMonth, slideAnim, setCalendarMonth } =
    useCalendarMonth(now.getFullYear(), now.getMonth());
  const { selectedDateString, summary, selectDay, clearSelection } =
    useSelectedDay();
  const incomeTransactions = useAppSelector(selectIncomeTransactions);
  const expenseTransactions = useAppSelector(selectExpenseTransactions);
  const overallBudget = useAppSelector(selectOverallBudget);
  const activeWorkspace = useAppSelector(selectActiveWorkspace);
  const currencyCode = activeWorkspace?.currencyCode ?? "INR";
  const currencySymbol = activeWorkspace?.currencySymbol ?? "₹";

  const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
  const selectedHeaderDate = `${monthKey}-01`;
  const activities = useMemo(
    () =>
      buildMonthActivities(
        currentYear,
        currentMonth,
        incomeTransactions,
        expenseTransactions,
      ),
    [currentYear, currentMonth, expenseTransactions, incomeTransactions],
  );
  const getMonthToDateBalance = useCallback(
    (dateString: string) =>
      activities.reduce((total, activity) => {
        if (activity.date > dateString) {
          return total;
        }
        return (
          total +
          Math.max(activity.incomeTotal, 0) -
          Math.max(activity.expenseTotal, 0)
        );
      }, 0),
    [activities],
  );
  const calendarMonth = useMemo(
    () =>
      attachActivities(
        buildCalendarMonth(currentYear, currentMonth),
        activities,
      ),
    [activities, currentYear, currentMonth],
  );
  const rowAnims = useRowAnimations(calendarMonth.weeks.length, monthKey);
  const cellSize = useMemo(() => {
    const horizontalPadding = tokens.spacing.lg * 2;
    const rowGap = tokens.spacing.sm;
    const weekdayHeight = 20;
    const gridLabelGap = tokens.spacing.md;
    const maxGridHeight = windowHeight * 0.7;
    const widthBasedSize = (windowWidth - horizontalPadding - rowGap * 6) / 7;
    const heightBasedSize =
      (maxGridHeight -
        weekdayHeight -
        gridLabelGap -
        rowGap * (calendarMonth.weeks.length - 1)) /
      calendarMonth.weeks.length;

    return Math.max(36, Math.floor(Math.min(widthBasedSize, heightBasedSize)));
  }, [
    calendarMonth.weeks.length,
    tokens.spacing.lg,
    tokens.spacing.md,
    tokens.spacing.sm,
    windowHeight,
    windowWidth,
  ]);

  useEffect(() => {
    clearSelection();
  }, [clearSelection, currentMonth, currentYear]);

  const activeDayCount = getActiveDayCount(activities);
  const isCurrentMonth =
    currentYear === now.getFullYear() && currentMonth === now.getMonth();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  const elapsedDays = isCurrentMonth ? now.getDate() : totalDays;
  const runningTotals = useMemo(() => {
    const cutoffDateString = `${monthKey}-${String(elapsedDays).padStart(2, "0")}`;
    return activities.reduce(
      (totals, activity) => {
        if (activity.date > cutoffDateString) {
          return totals;
        }
        totals.income += Math.max(activity.incomeTotal, 0);
        totals.expense += Math.max(activity.expenseTotal, 0);
        return totals;
      },
      { income: 0, expense: 0 },
    );
  }, [activities, elapsedDays, monthKey]);
  const savingsLeft = runningTotals.income - runningTotals.expense;
  const isMonthSummaryEmpty =
    runningTotals.income === 0 && runningTotals.expense === 0;
  const isDaySummaryEmpty = !summary || !summary.hasActivity;
  const shouldShowSummaryEmptyState =
    isMonthSummaryEmpty && isDaySummaryEmpty;
  const hasBudget = overallBudget > 0;
  const budgetProgress = hasBudget
    ? (runningTotals.expense / overallBudget) * 100
    : 0;
  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-IN", {
        month: "long",
      }).format(new Date(currentYear, currentMonth, 1)),
    [currentMonth, currentYear],
  );
  const monthTranslateX = slideAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-12, 0, 12],
  });
  const handleHeaderDateSelect = useCallback(
    (dateString: string) => {
      const [year, month] = dateString.split("-").map(Number);
      setCalendarMonth(year, month - 1);
    },
    [setCalendarMonth],
  );

  useSharedTabHeader({
    variant: "date",
    title: "Calendar",
    selectedDate: selectedHeaderDate,
    onDateSelect: handleHeaderDateSelect,
    initialPickerMode: "month-strip",
    backgroundColor: tokens.colors.background,
  });

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.screen}>
      <StatusBar
        style={theme.dark ? "light" : "dark"}
        backgroundColor={tokens.colors.background}
      />
      {shouldShowSummaryEmptyState ? (
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
            icon="calendar-blank-outline"
            title="Nothing here yet"
            subtitle="Add income or expense to see your month and day summaries."
          />
        </View>
      ) : (
        <ScrollView
          style={styles.screen}
          contentContainerStyle={[
            styles.screenContent,
            {
              paddingBottom: usableSpace,
              paddingHorizontal: 20,
              flexGrow: 1,
              gap: 10,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <>
            <Animated.View
              style={[
                styles.monthBody,
                { transform: [{ translateX: monthTranslateX }] },
              ]}
            >
              <CalendarGrid
                weeks={calendarMonth.weeks}
                selectedDateString={selectedDateString}
                rowAnims={rowAnims}
                onDayPress={(day) => {
                  if (!day.dateString) {
                    return;
                  }
                  selectDay(
                    day.dateString,
                    day.activity,
                    getMonthToDateBalance(day.dateString),
                  );
                }}
                onDayLongPress={(day) => {
                  if (!day.dateString) {
                    return;
                  }
                  navigation.navigate("Transactions");
                  dispatch(
                    openAddModal({ type: "expense", date: day.dateString }),
                  );
                }}
                cellSize={cellSize}
                tokens={tokens}
              />
            </Animated.View>

            <View style={styles.activeCountWrap}>
              <Animated.Text style={styles.activeCountText}>
                {activeDayCount} of {elapsedDays} active days this month
              </Animated.Text>
            </View>

            <HeroCard
              heroLabel={`${monthLabel} Summary`}
              showGreeting={false}
              primary={{
                label: "Expense",
                value: formatAmount(
                  runningTotals.expense,
                  currencyCode,
                  currencySymbol,
                ),
                caption: hasBudget
                  ? `${Math.round(budgetProgress)}% of ${formatAmount(overallBudget, currencyCode, currencySymbol)} budget`
                  : "spent this month",
              }}
              middle={{
                label: "Income",
                value: formatAmount(
                  runningTotals.income,
                  currencyCode,
                  currencySymbol,
                ),
                caption: "earned this month",
              }}
              right={{
                label: "LeftOver",
                value: formatAmount(savingsLeft, currencyCode, currencySymbol),
                caption: "money left",
              }}
              accentColor={theme.colors.primary}
              outline={theme.colors.outline}
              textColor={theme.colors.onSurface}
              muted={theme.colors.onSurfaceVariant}
            />

            <DaySummaryCard
              summary={summary}
              onViewAll={(dateString) => {
                navigation.navigate("Transactions", { date: dateString });
              }}
              tokens={tokens}
              currencyCode={currencyCode}
              currencySymbol={currencySymbol}
            />
          </>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
