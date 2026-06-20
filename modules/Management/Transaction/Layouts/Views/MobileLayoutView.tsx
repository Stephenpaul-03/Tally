import { useFadeSlide } from "@/components/animations/UseFadeSlide";
import { EmptyState } from "@/components/EmptyStates";
import { ListFooter } from "@/components/ListFooter";
import { PageHeader } from "@/components/pageheader/PageHeader";
import { useTabBarHeight } from "@/components/tabbar/TabBarContext";
import { useTransactionUiPrefs } from "@/hooks/use-transaction-ui-prefs";
import { NonEmptySection } from "@/modules/Management/Transaction/Components/Sections";
import { typography } from "@/theme/typography";
import { TransactionType } from "@/utils/Types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Animated, ScrollView, View } from "react-native";
import { FAB, useTheme } from "react-native-paper";
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
  filteredExpenseTransactions: import("@/utils/Types").Transaction[];
  filteredIncomeTransactions: import("@/utils/Types").Transaction[];
  expenseTone: Tone;
  incomeTone: Tone;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAddPress: (type: TransactionType) => void;
  selectedDate?: string;
  onDateSelect?: (date: string) => void;
}

export function MobileLayout({
  activeTab,
  filteredExpenseTransactions,
  filteredIncomeTransactions,
  onEdit,
  onAddPress,
  allEmpty,
  selectedDate: propsSelectedDate,
  onDateSelect: propsOnDateSelect,
}: Props) {
  const theme = useTheme();
  const { datePickerCalendarMode } = useTransactionUiPrefs();
  const transactionsScrollRef = React.useRef<ScrollView | null>(null);
  const tabBarHeight = useTabBarHeight();
  const usableSpace = tabBarHeight + 12;

  const [internalSelectedDate, setInternalSelectedDate] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });

  const selectedDate = propsSelectedDate ?? internalSelectedDate;
  const handleDateSelect = propsOnDateSelect ?? setInternalSelectedDate;

  const dayTransactions = useMemo(
    () => ({
      expense: filteredExpenseTransactions.filter(
        (t) => t.date === selectedDate,
      ),
      income: filteredIncomeTransactions.filter((t) => t.date === selectedDate),
    }),
    [filteredExpenseTransactions, filteredIncomeTransactions, selectedDate],
  );

  const hasDayTransactions =
    dayTransactions.expense.length > 0 || dayTransactions.income.length > 0;

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

  const handleAddTransaction = useCallback(() => {
    onAddPress(activeTab);
  }, [activeTab, onAddPress]);

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
            title="Tally"
            variant="date"
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            initialPickerMode={
              datePickerCalendarMode ? "calendar" : "day-strip"
            }
          />
        </Animated.View>

        {!hasDayTransactions || allEmpty ? (
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
                  mobileLayoutStyles.mobileTransactionsScrollFill,
                ]}
                showsVerticalScrollIndicator={false}
              >
                <View style={mobileLayoutStyles.sectionStack}>
                  {dayTransactions.expense.length > 0 ? (
                    <NonEmptySection
                      transactions={dayTransactions.expense}
                      onEdit={onEdit}
                      cardedRows
                      animKey={selectedDate}
                    />
                  ) : null}
                  {dayTransactions.income.length > 0 ? (
                    <NonEmptySection
                      transactions={dayTransactions.income}
                      onEdit={onEdit}
                      cardedRows
                      animKey={selectedDate}
                    />
                  ) : null}
                  <ListFooter
                    height={usableSpace + 40}
                    tabbarheight={tabBarHeight}
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        )}

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
      </View>
    </View>
  );
}
