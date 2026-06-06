import { useFadeSlide } from "@/components/animations/UseFadeSlide";
import { PageHeader } from "@/components/pageheader/PageHeader";
import { TabBarMode } from "@/components/tabbar/BottomTabBar";
import { useTabBarHeight } from "@/components/tabbar/TabBarContext";
import { toast } from "@/components/toast/toast";
import { useTransactionUiPrefs } from "@/hooks/use-transaction-ui-prefs";
import { EmptyState } from "@/modules/Common/Components/EmptyStates";
import {
  HeaderMenuButton,
  HeaderMenuSheet,
} from "@/modules/Common/Components/HeaderMenuModal/Index";
import { ListFooter } from "@/modules/Common/Components/ListFooter";
import { groupByDate, sortByDate } from "@/modules/Common/Utils/Helpers";
import { Transaction, TransactionType } from "@/modules/Common/Utils/Types";
import {
  NonEmptySection,
  SectionLabel,
} from "@/modules/Transactions/Components/Sections";
import { palette } from "@/theme/color_palette";
import { typography } from "@/theme/typography";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, ScrollView, View } from "react-native";
import { FAB, useTheme } from "react-native-paper";
import { formatSectionDateLabel, parseIso, totalForType } from "../../Utils";
import { mobileLayoutStyles } from "../Styles/MobileLayoutStyles";

interface Tone {
  bg: string;
  border: string;
  text: string;
  icon: string;
}

interface ColorsShape {
  background: { primary: string; card: string };
  border: { primary: string };
  text: { primary: string; secondary: string; muted: string };
}

interface Props {
  colors: ColorsShape;
  rangeLabel: string;
  incomeTotal: number;
  expenseTotal: number;
  netBalance: number;
  activeTab: TransactionType;
  allEmpty: boolean;
  filteredExpenseTransactions: Transaction[];
  filteredIncomeTransactions: Transaction[];
  expenseTone: Tone;
  incomeTone: Tone;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAddPress: (type: TransactionType) => void;
  onOpenCategories?: () => void;
  onOpenAccounts?: () => void;
  selectedDate?: string;
  onDateSelect?: (date: string) => void;
  monthMode?: boolean;
  onMonthModeChange?: (next: boolean) => void;
  collapseAllSignal?: number;
  expandAllSignal?: number;
  tabBarMode?: TabBarMode;
}

export function MobileLayout({
  activeTab,
  filteredExpenseTransactions,
  filteredIncomeTransactions,
  expenseTone,
  incomeTone,
  onEdit,
  onDelete,
  onAddPress,
  onOpenCategories,
  onOpenAccounts,
  allEmpty,
  selectedDate: propsSelectedDate,
  onDateSelect: propsOnDateSelect,
  monthMode: propsMonthMode,
  onMonthModeChange,
  collapseAllSignal = 0,
  expandAllSignal = 0,
  tabBarMode = "basic",
}: Props) {
  const theme = useTheme();
  const {
    datePickerCalendarMode,
    isHydrated: isPrefsHydrated,
    toggleDatePickerCalendarMode,
    monthMode: storedMonthMode,
    toggleMonthMode: toggleStoredMonthMode,
  } = useTransactionUiPrefs();
  const monthMode = isPrefsHydrated ? storedMonthMode : Boolean(propsMonthMode);
  const transactionsScrollRef = useRef<ScrollView | null>(null);
  const lastSelectedDateRef = useRef<string | null>(null);
  const pendingScrollDateRef = useRef<string | null>(null);
  const lastCollapseAllSignalRef = useRef(collapseAllSignal);
  const lastExpandAllSignalRef = useRef(expandAllSignal);
  const [sectionOffsets, setSectionOffsets] = useState<Record<string, number>>(
    {},
  );
  const [foldedSections, setFoldedSections] = useState<Record<string, boolean>>(
    {},
  );

  const [internalSelectedDate, setInternalSelectedDate] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });

  const selectedDate = propsSelectedDate ?? internalSelectedDate;
  const handleDateSelect = propsOnDateSelect ?? setInternalSelectedDate;
  const selectedMonthPrefix = useMemo(
    () => selectedDate.slice(0, 7),
    [selectedDate],
  );

  const dayTransactions = useMemo(() => {
    return {
      expense: filteredExpenseTransactions.filter(
        (t) => t.date === selectedDate,
      ),
      income: filteredIncomeTransactions.filter((t) => t.date === selectedDate),
    };
  }, [filteredExpenseTransactions, filteredIncomeTransactions, selectedDate]);

  const hasDayTransactions =
    dayTransactions.expense.length > 0 || dayTransactions.income.length > 0;

  const monthTransactionsByDate = useMemo(() => {
    const expenses = filteredExpenseTransactions.filter((t) =>
      t.date.startsWith(selectedMonthPrefix),
    );
    const income = filteredIncomeTransactions.filter((t) =>
      t.date.startsWith(selectedMonthPrefix),
    );
    const combined = sortByDate([...expenses, ...income]);
    return groupByDate(combined);
  }, [
    filteredExpenseTransactions,
    filteredIncomeTransactions,
    selectedMonthPrefix,
  ]);

  const monthDates = useMemo(() => {
    const { year, month } = parseIso(`${selectedMonthPrefix}-01`);
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthLabel = String(month).padStart(2, "0");
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = String(i + 1).padStart(2, "0");
      return `${year}-${monthLabel}-${day}`;
    }).reverse();
  }, [selectedMonthPrefix]);

  const monthDatesWithTransactions = useMemo(
    () =>
      monthDates.filter(
        (iso) => (monthTransactionsByDate[iso]?.length ?? 0) > 0,
      ),
    [monthDates, monthTransactionsByDate],
  );

  const hasMonthTransactions = useMemo(() => {
    return Object.keys(monthTransactionsByDate).length > 0;
  }, [monthTransactionsByDate]);

  const dayTotal = useMemo(() => {
    const expense = dayTransactions.expense.reduce((s, t) => s + t.amount, 0);
    const income = dayTransactions.income.reduce((s, t) => s + t.amount, 0);
    return { expense, income, net: income - expense };
  }, [dayTransactions]);

  const [isHeaderSheetOpen, setIsHeaderSheetOpen] = useState(false);
  const tabBarHeight = useTabBarHeight();
  const usableSpace = tabBarHeight + 12;
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

  const handleToggleMonthMode = useCallback(() => {
    const next = !monthMode;
    toggleStoredMonthMode();
    onMonthModeChange?.(next);
    toast.success(next ? "Switched to Month view" : "Switched to Day view");
    setIsHeaderSheetOpen(false);
  }, [monthMode, onMonthModeChange, toggleStoredMonthMode]);

  const handleToggleDatePickerStyle = useCallback(() => {
    if (!isPrefsHydrated) return;
    const next = !datePickerCalendarMode;
    toggleDatePickerCalendarMode();
    toast.success(
      next
        ? "Date picker set to Calendar mode"
        : "Date picker set to Strip mode",
    );
    setIsHeaderSheetOpen(false);
  }, [datePickerCalendarMode, isPrefsHydrated, toggleDatePickerCalendarMode]);

  const handleAddTransaction = useCallback(() => {
    onAddPress(activeTab);
  }, [activeTab, onAddPress]);

  React.useEffect(() => {
    setSectionOffsets({});
    setFoldedSections({});
  }, [monthMode, selectedMonthPrefix]);

  const handleSectionLayout = useCallback((iso: string, y: number) => {
    setSectionOffsets((prev) => {
      if (prev[iso] === y) return prev;
      return { ...prev, [iso]: y };
    });
  }, []);

  const toggleFoldedSection = useCallback((iso: string) => {
    setFoldedSections((prev) => ({ ...prev, [iso]: !prev[iso] }));
  }, []);

  const collapseAllSections = useCallback(() => {
    setFoldedSections(
      monthDatesWithTransactions.reduce<Record<string, boolean>>(
        (next, iso) => {
          next[iso] = true;
          return next;
        },
        {},
      ),
    );
  }, [monthDatesWithTransactions]);

  const expandAllSections = useCallback(() => {
    setFoldedSections({});
  }, []);

  const handleCollapseAllFromSheet = useCallback(() => {
    collapseAllSections();
    setIsHeaderSheetOpen(false);
    toast.success("Collapsed all days");
  }, [collapseAllSections]);

  const handleExpandAllFromSheet = useCallback(() => {
    expandAllSections();
    setIsHeaderSheetOpen(false);
    toast.success("Expanded all days");
  }, [expandAllSections]);

  React.useEffect(() => {
    if (lastCollapseAllSignalRef.current === collapseAllSignal) return;
    lastCollapseAllSignalRef.current = collapseAllSignal;
    if (!monthMode) return;
    collapseAllSections();
  }, [collapseAllSections, collapseAllSignal, monthMode]);

  React.useEffect(() => {
    if (lastExpandAllSignalRef.current === expandAllSignal) return;
    lastExpandAllSignalRef.current = expandAllSignal;
    if (!monthMode) return;
    expandAllSections();
  }, [expandAllSections, expandAllSignal, monthMode]);

  React.useEffect(() => {
    const selectedDateChanged = lastSelectedDateRef.current !== selectedDate;
    lastSelectedDateRef.current = selectedDate;
    if (!monthMode || !selectedDateChanged) return;
    pendingScrollDateRef.current = selectedDate;
    if (foldedSections[selectedDate]) {
      setFoldedSections((prev) => ({ ...prev, [selectedDate]: false }));
    }
  }, [foldedSections, monthMode, selectedDate]);

  React.useEffect(() => {
    if (!monthMode) return;
    const pendingScrollDate = pendingScrollDateRef.current;
    if (pendingScrollDate !== selectedDate) return;
    const selectedOffset = sectionOffsets[pendingScrollDate];
    if (selectedOffset === undefined) return;
    transactionsScrollRef.current?.scrollTo({
      y: Math.max(0, selectedOffset - 8),
      animated: false,
    });
    pendingScrollDateRef.current = null;
  }, [monthMode, sectionOffsets, selectedDate]);
  const emptyStateAnimatedRef = useRef(false);
  const { animStyle, slideIn } = useFadeSlide({
    from: "bottom",
    distance: 8,
    duration: 750,
    autoPlay: false,
    delay: 450,
  });

  useEffect(() => {
    slideIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <View
        style={[mobileLayoutStyles.mobileStack, { marginBottom: usableSpace }]}
      >
        <Animated.View
          style={[
            {
              borderBottomLeftRadius: 30,
              borderBottomRightRadius: 30,
            },
          ]}
        >
          <PageHeader
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            left={{
              type: "custom",
              render: () => (
                <HeaderMenuButton
                  accessibilityLabel="Open transaction menu"
                  onPress={() => setIsHeaderSheetOpen(true)}
                />
              ),
            }}
            right={{ type: "date" }}
            pickerMode={datePickerCalendarMode ? "calendar" : "day-strip"}
          />
        </Animated.View>

        <HeaderMenuSheet
          visible={isHeaderSheetOpen}
          onDismiss={() => setIsHeaderSheetOpen(false)}
          showViewSection
          monthMode={monthMode}
          onToggleMonthMode={handleToggleMonthMode}
          showDatePickerSection
          datePickerCalendarMode={datePickerCalendarMode}
          onToggleDatePickerStyle={handleToggleDatePickerStyle}
          isPrefsHydrated={isPrefsHydrated}
          showMonthSection={monthMode}
          onCollapseAll={handleCollapseAllFromSheet}
          onExpandAll={handleExpandAllFromSheet}
          onOpenCategories={onOpenCategories}
          onOpenAccounts={onOpenAccounts}
        />

        {allEmpty ||
        (monthMode ? !hasMonthTransactions : !hasDayTransactions) ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 16,
            }}
          >
            <EmptyState
              icon="inbox-outline"
              title="No transactions yet"
              subtitle={
                "Looks empty in here.\nAdd your first transaction to get started."
              }
              hint="Add a New transaction"
              onHintPress={handleAddTransaction}
              skipInitialAnim={emptyStateAnimatedRef.current}
              onAnimated={() => {
                emptyStateAnimatedRef.current = true;
              }}
            />
          </View>
        ) : (
          <View
            style={[
              mobileLayoutStyles.mobileTransactionCard,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <ScrollView
                ref={transactionsScrollRef}
                style={mobileLayoutStyles.mobileTransactionsScroll}
                contentContainerStyle={[
                  (monthMode ? !hasMonthTransactions : !hasDayTransactions)
                    ? [mobileLayoutStyles.mobileTransactionsScrollFill]
                    : null,
                ]}
                showsVerticalScrollIndicator={false}
              >
                {monthMode ? (
                  <View
                    style={[
                      mobileLayoutStyles.sectionStack,
                      mobileLayoutStyles.monthSectionStack,
                    ]}
                  >
                    {monthDates.map((iso) => {
                      const transactions = monthTransactionsByDate[iso] ?? [];
                      if (transactions.length === 0) return null;
                      const collapsed = Boolean(foldedSections[iso]);
                      const sectionExpenseTotal = totalForType(
                        transactions,
                        "expense",
                      );
                      const sectionIncomeTotal = totalForType(
                        transactions,
                        "income",
                      );
                      return (
                        <View
                          key={iso}
                          style={mobileLayoutStyles.monthSectionSurface}
                          onLayout={(event) =>
                            handleSectionLayout(iso, event.nativeEvent.layout.y)
                          }
                        >
                          <NonEmptySection
                            type="expense"
                            transactions={transactions}
                            isMobile
                            onEdit={onEdit}
                            onDelete={onDelete}
                            monthMode={monthMode}
                            cardedRows
                            hideList={collapsed}
                            // Each date section gets its own iso as the anim
                            // key — stagger replays correctly per date bucket.
                            animKey={iso}
                            header={
                              <SectionLabel
                                label={formatSectionDateLabel(iso)}
                                monthMode
                                collapsed={collapsed}
                                onToggle={() => toggleFoldedSection(iso)}
                              />
                            }
                            footer={
                              <SectionLabel
                                label="Summary"
                                monthMetrics={{
                                  expense: sectionExpenseTotal,
                                  income: sectionIncomeTotal,
                                  expenseColor: expenseTone.text,
                                  incomeColor: incomeTone.text,
                                }}
                                footerMode
                              />
                            }
                          />
                        </View>
                      );
                    })}
                    <ListFooter
                      monthMode={monthMode}
                      height={usableSpace + 40}
                      tabbarheight={tabBarHeight}
                    />
                  </View>
                ) : (
                  <View style={mobileLayoutStyles.sectionStack}>
                    {dayTransactions.expense.length > 0 && (
                      <View>
                        <NonEmptySection
                          type="expense"
                          transactions={dayTransactions.expense}
                          isMobile
                          onEdit={onEdit}
                          onDelete={onDelete}
                          monthMode={monthMode}
                          cardedRows
                          // selectedDate ensures stagger replays when the user
                          // moves to a different day with the same transactions.
                          animKey={selectedDate}
                          header={<SectionLabel label="Expenses" />}
                          footer={
                            <SectionLabel
                              label="Summary"
                              metricValue={dayTotal.expense}
                              metricColor={palette.status.danger}
                              footerMode
                            />
                          }
                        />
                      </View>
                    )}
                    {dayTransactions.income.length > 0 && (
                      <View>
                        <NonEmptySection
                          type="income"
                          transactions={dayTransactions.income}
                          isMobile
                          onEdit={onEdit}
                          onDelete={onDelete}
                          monthMode={monthMode}
                          cardedRows
                          // Same here — selectedDate as the context key.
                          animKey={selectedDate}
                          header={<SectionLabel label="Income" />}
                          footer={
                            <SectionLabel
                              label="Summary"
                              metricValue={dayTotal.income}
                              metricColor={palette.status.success}
                              footerMode
                            />
                          }
                        />
                      </View>
                    )}
                    <ListFooter
                      monthMode={monthMode}
                      height={usableSpace + 40}
                      tabbarheight={tabBarHeight}
                    />
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        )}

        {tabBarMode === "basic" && (
          <Animated.View style={animStyle}>
            <View
              pointerEvents="box-none"
              style={[mobileLayoutStyles.bottomActionWrap]}
            >
              <FAB
                icon="plus"
                label="Add"
                accessibilityLabel="Add transaction"
                onPress={handleAddTransaction}
                uppercase={false}
                color={theme.colors.surface}
                style={[
                  mobileLayoutStyles.bottomActionButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                theme={fabTheme}
              />
            </View>
          </Animated.View>
        )}
      </View>
    </View>
  );
}
