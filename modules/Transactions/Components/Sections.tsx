import { useFadeSlide } from "@/components/animations/UseFadeSlide";
import { useStagger } from "@/components/animations/UseStagger";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
    Animated,
    Easing,
    Platform,
    Pressable,
    StyleProp,
    StyleSheet,
    UIManager,
    View,
    ViewStyle,
} from "react-native";
import { Text, useTheme } from "react-native-paper";
import { EmptyState } from "../../Common/Components/EmptyStates";
import { Transaction, TransactionType } from "../../Common/Utils/Types";
import { mobileLayoutStyles } from "../Layouts/Styles/MobileLayoutStyles";
import { formatCurrency } from "../Utils";
import { TransactionRow } from "./TransactionRow";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Tone {
  bg: string;
  border: string;
  text: string;
  icon: string;
}

interface ColorsShape {
  background: { card: string };
  border: { primary: string };
  text: { primary: string; secondary: string };
}

interface TransactionListProps {
  transactions: Transaction[];
  isMobile: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  monthMode?: boolean;
  cardedRows?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Include a context key (e.g. selectedDate or iso) so the stagger
   *  replays even when the same transaction IDs appear in a different
   *  sheet / date context. */
  animKey?: string;
}

interface SectionLabelProps {
  label: string;
  metricValue?: number;
  metricColor?: string;
  monthMetrics?: {
    expense: number;
    income: number;
    expenseColor: string;
    incomeColor: string;
  };
  monthMode?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
  footerMode?: boolean;
}

interface SectionProps {
  type: TransactionType;
  transactions: Transaction[];
  hasActiveFilters: boolean;
  isMobile: boolean;
  colors: ColorsShape;
  expenseTone: Tone;
  incomeTone: Tone;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAddPress: (type: TransactionType) => void;
  monthMode?: boolean;
  cardedRows?: boolean;
  listStyle?: StyleProp<ViewStyle>;
  animKey?: string;
}

export function TransactionList({
  transactions,
  isMobile,
  onEdit,
  onDelete,
  monthMode = false,
  cardedRows = true,
  style,
  animKey,
}: TransactionListProps) {
  const theme = useTheme();
  const { getAnimStyle } = useStagger({
    count: transactions.length,
    // Combine animKey (sheet/date context) with the transaction IDs so the
    // stagger replays whenever either the context OR the list contents change.
    dataKey: `${animKey ?? ""}-${transactions.map((t) => t.id).join(",")}`,
    stagger: 100,
    distance: 20,
    duration: 1000,
    baseDelay: 300,
  });

  return (
    <View
      style={[
        style,
        cardedRows
          ? {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
              borderWidth: 0.5,
              borderRadius: 20,
              overflow: "hidden",
            }
          : null,
      ]}
    >
      {transactions.map((transaction, index) => (
        <Animated.View key={transaction.id} style={getAnimStyle(index)}>
          <TransactionRow
            transaction={transaction}
            onPress={() => onEdit(transaction.id)}
            monthMode={monthMode}
            grouped={cardedRows}
            showDivider={cardedRows && index < transactions.length - 1}
          />
        </Animated.View>
      ))}
    </View>
  );
}

export function TransactionSection({
  type,
  transactions,
  hasActiveFilters,
  isMobile,
  onEdit,
  onDelete,
  onAddPress,
  monthMode,
  animKey,
}: SectionProps) {
  if (transactions.length === 0) {
    return (
      <View
        style={[
          styles.sectionBlock,
          hasActiveFilters ? styles.sectionFill : null,
        ]}
      >
        <View
          style={
            hasActiveFilters ? styles.emptyCenterWrap : styles.emptyInlineWrap
          }
        >
          <EmptyState
            icon="inbox-outline"
            title="No transactions yet"
            subtitle={
              "Looks empty in here.\nAdd your first transaction to get started."
            }
            hint="Add a New transaction"
            onHintPress={() => onAddPress(type)}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.sectionBlock}>
      <TransactionList
        transactions={transactions}
        isMobile={isMobile}
        onEdit={onEdit}
        onDelete={onDelete}
        monthMode={monthMode}
        animKey={animKey}
      />
    </View>
  );
}

export function NonEmptySection({
  transactions,
  isMobile,
  onEdit,
  onDelete,
  monthMode,
  cardedRows,
  listStyle,
  header,
  footer,
  hideList = false,
  animKey,
}: Omit<
  SectionProps,
  "hasActiveFilters" | "colors" | "expenseTone" | "incomeTone" | "onAddPress"
> & {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  hideList?: boolean;
  animKey?: string;
}) {
  const theme = useTheme();
  const { animationsEnabled } = useAddonPrefs();
  const { animStyle } = useFadeSlide({
    from: "bottom",
    distance: 20,
    duration: 750,
    delay: 400,
  });
  const listHeight = React.useRef(new Animated.Value(0)).current;
  const [measuredHeight, setMeasuredHeight] = React.useState<number | null>(
    null,
  );

  const animateListHeight = React.useCallback(
    (toValue: number) => {
      listHeight.stopAnimation();
      Animated.timing(listHeight, {
        toValue,
        duration: 750,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }).start();
    },
    [listHeight],
  );

  React.useEffect(() => {
    if (measuredHeight == null) return;
    animateListHeight(hideList ? 0 : measuredHeight);
  }, [animateListHeight, hideList, measuredHeight, transactions.length]);

  if (transactions.length === 0) return null;

  const showUnifiedCard = Boolean(header) && Boolean(cardedRows);

  const content = showUnifiedCard ? (
    <View
      style={[
        styles.sectionCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
        },
        listStyle,
      ]}
    >
      {header}
      {header && (!hideList || footer) ? (
        <View
          style={[
            styles.cardDivider,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />
      ) : null}
      {animationsEnabled ? (
        <Animated.View
          style={[
            { overflow: "hidden" },
            measuredHeight == null
              ? null
              : { height: listHeight, opacity: hideList ? 0.98 : 1 },
          ]}
        >
          <View
            onLayout={(e) => {
              const nextHeight = e.nativeEvent.layout.height;
              if (nextHeight === 0) return;

              if (measuredHeight == null) {
                setMeasuredHeight(nextHeight);
                listHeight.setValue(hideList ? 0 : nextHeight);
                return;
              }

              if (nextHeight !== measuredHeight) {
                setMeasuredHeight(nextHeight);
                animateListHeight(hideList ? 0 : nextHeight);
              }
            }}
          >
            {!hideList ? (
              <TransactionList
                key={animKey ?? transactions.map((t) => t.id).join(",")}
                transactions={transactions}
                isMobile={isMobile}
                onEdit={onEdit}
                onDelete={onDelete}
                monthMode={monthMode}
                cardedRows={false}
                animKey={animKey}
              />
            ) : null}
          </View>
        </Animated.View>
      ) : !hideList ? (
        <TransactionList
          key={animKey ?? transactions.map((t) => t.id).join(",")}
          transactions={transactions}
          isMobile={isMobile}
          onEdit={onEdit}
          onDelete={onDelete}
          monthMode={monthMode}
          cardedRows={false}
          animKey={animKey}
        />
      ) : null}
      {footer ? (
        <>
          {!hideList ? (
            <View
              style={[
                styles.cardDivider,
                { backgroundColor: theme.colors.outlineVariant },
              ]}
            />
          ) : null}
          {footer}
        </>
      ) : null}
    </View>
  ) : (
    <TransactionList
      key={animKey ?? transactions.map((t) => t.id).join(",")}
      transactions={transactions}
      isMobile={isMobile}
      onEdit={onEdit}
      onDelete={onDelete}
      monthMode={monthMode}
      cardedRows={cardedRows}
      style={listStyle}
      animKey={animKey}
    />
  );

  return (
    <Animated.View style={[styles.sectionBlock, animStyle]}>
      {content}
    </Animated.View>
  );
}

export function SectionLabel({
  label,
  metricValue,
  metricColor,
  monthMetrics,
  monthMode = false,
  collapsed = false,
  onToggle,
  footerMode = false,
}: SectionLabelProps) {
  const theme = useTheme();
  const displayLabelStyle = {
    ...typography.editorial.sectionLabel,
    fontSize: 14,
    lineHeight: 14,
    letterSpacing: 0.7,
    textTransform: "uppercase" as const,
    opacity: 0.55,
  };

  const accentColor = theme.dark
    ? theme.colors.primary
    : theme.colors.onSurfaceVariant;

  const visibleMonthMetrics = monthMetrics
    ? [
        {
          key: "income",
          value: monthMetrics.income,
          color: monthMetrics.incomeColor,
        },
        {
          key: "expense",
          value: monthMetrics.expense,
          color: monthMetrics.expenseColor,
        },
      ].filter((item) => item.value > 0)
    : [];

  if (monthMode) {
    return (
      <View
        style={[
          mobileLayoutStyles.sectionLabelRow,
          mobileLayoutStyles.monthSectionLabelRow,
        ]}
      >
        <Pressable
          accessibilityRole="button"
          onPress={onToggle}
          hitSlop={8}
          style={({ pressed }) => [
            mobileLayoutStyles.sectionLabelLeft,
            { opacity: pressed ? 0.72 : 1 },
          ]}
        >
          <MaterialCommunityIcons
            name="calendar-month-outline"
            size={16}
            color={accentColor}
            style={mobileLayoutStyles.sectionLabelIcon}
          />
          <Text
            style={[
              mobileLayoutStyles.sectionLabel,
              displayLabelStyle,
              { color: accentColor },
            ]}
          >
            {label}
          </Text>
        </Pressable>
        <View style={mobileLayoutStyles.sectionLabelRight}>
          {visibleMonthMetrics.length > 0 && (
            <View style={mobileLayoutStyles.monthSectionMetrics}>
              {visibleMonthMetrics.map((item) => (
                <Text
                  key={item.key}
                  style={[
                    mobileLayoutStyles.sectionLabelMetric,
                    { color: item.color },
                  ]}
                >
                  {formatCurrency(item.value)}
                </Text>
              ))}
            </View>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={onToggle}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}
          >
            <MaterialCommunityIcons
              name={collapsed ? "chevron-down" : "chevron-up"}
              size={20}
              color={accentColor}
              style={mobileLayoutStyles.sectionAccordionIcon}
            />
          </Pressable>
        </View>
      </View>
    );
  }

  if (footerMode) {
    return (
      <View
        style={[
          mobileLayoutStyles.sectionLabelRow,
          mobileLayoutStyles.sectionFooterRow,
        ]}
      >
        <Text
          style={[
            mobileLayoutStyles.sectionLabel,
            displayLabelStyle,
            { color: accentColor },
          ]}
        >
          {label}
        </Text>
        {visibleMonthMetrics.length > 0 ? (
          <View style={mobileLayoutStyles.monthSectionMetrics}>
            {visibleMonthMetrics.map((item, index) => (
              <React.Fragment key={item.key}>
                {index > 0 ? (
                  <View
                    style={[
                      mobileLayoutStyles.summaryMetricDivider,
                      { backgroundColor: theme.colors.outlineVariant },
                    ]}
                  />
                ) : null}
                <Text
                  style={[
                    mobileLayoutStyles.sectionLabelMetric,
                    { color: item.color },
                  ]}
                >
                  {formatCurrency(item.value)}
                </Text>
              </React.Fragment>
            ))}
          </View>
        ) : metricValue !== undefined && metricColor ? (
          <Text
            style={[
              mobileLayoutStyles.sectionLabelMetric,
              { color: metricColor },
            ]}
          >
            {formatCurrency(metricValue)}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View
      style={[
        mobileLayoutStyles.sectionLabelRow,
        { paddingBottom: 8, marginBottom: 8 },
        { borderBottomColor: theme.colors.outlineVariant },
      ]}
    >
      <View style={mobileLayoutStyles.sectionLabelLeft}>
        <Text
          style={[
            mobileLayoutStyles.sectionLabel,
            displayLabelStyle,
            { color: accentColor },
          ]}
        >
          {label}
        </Text>
      </View>
      <View style={mobileLayoutStyles.sectionLabelRight}>
        {metricValue !== undefined && metricColor && (
          <Text
            style={[
              mobileLayoutStyles.sectionLabelMetric,
              { color: metricColor },
            ]}
          >
            {formatCurrency(metricValue)}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionBlock: {
    gap: 12,
    paddingHorizontal: 20,
  },
  sectionCard: {
    borderWidth: 0.5,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardDivider: {
    height: 0.5,
  },
  sectionFill: {
    flexGrow: 1,
    minHeight: 0,
  },
  emptyInlineWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  emptyCenterWrap: {
    flex: 1,
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
