import { useFadeSlide } from "@/components/animations/UseFadeSlide";
import { useStagger } from "@/components/animations/UseStagger";
import { EmptyState } from "@/components/EmptyStates";
import { Transaction, TransactionType } from "@/utils/Types";
import React from "react";
import {
  Animated,
  Platform,
  StyleProp,
  StyleSheet,
  UIManager,
  View,
  ViewStyle,
} from "react-native";
import { useTheme } from "react-native-paper";
import { TransactionRow } from "./TransactionRow";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (id: string) => void;
  cardedRows?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Include a context key (e.g. selectedDate or iso) so the stagger
   *  replays even when the same transaction IDs appear in a different
   *  sheet / date context. */
  animKey?: string;
}

interface SectionProps {
  type: TransactionType;
  transactions: Transaction[];
  hasActiveFilters: boolean;
  onEdit: (id: string) => void;
  onAddPress: (type: TransactionType) => void;
  cardedRows?: boolean;
  listStyle?: StyleProp<ViewStyle>;
  animKey?: string;
}

export function TransactionList({
  transactions,
  onEdit,
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
        { width: "100%", alignSelf: "stretch" },
        cardedRows
          ? {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline,
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
            onPressTransaction={onEdit}
            grouped={cardedRows}
            groupPosition={
              transactions.length === 1
                ? "single"
                : index === 0
                  ? "first"
                  : index === transactions.length - 1
                    ? "last"
                    : "middle"
            }
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
  onEdit,
  onAddPress,
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
        onEdit={onEdit}
        animKey={animKey}
      />
    </View>
  );
}

export function NonEmptySection({
  transactions,
  onEdit,
  cardedRows,
  listStyle,
  animKey,
}: {
  transactions: Transaction[];
  onEdit: (id: string) => void;
  cardedRows?: boolean;
  listStyle?: StyleProp<ViewStyle>;
  animKey?: string;
}) {
  const { animStyle } = useFadeSlide({
    from: "bottom",
    distance: 20,
    duration: 750,
    delay: 400,
  });

  if (transactions.length === 0) return null;

  return (
    <Animated.View style={[styles.sectionBlock, animStyle]}>
      <TransactionList
        key={animKey ?? transactions.map((t) => t.id).join(",")}
        transactions={transactions}
        onEdit={onEdit}
        cardedRows={cardedRows}
        style={listStyle}
        animKey={animKey}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sectionBlock: {
    gap: 12,
    paddingHorizontal: 20,
    alignSelf: "stretch",
    width: "100%",
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
