// breakdowncard.tsx
import { useAppSelector } from "@/hooks/Redux";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { selectCategoryBudgets } from "@/modules/Core/Slices/TransactionSlice";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { useTheme } from "react-native-paper";
import type {
  BreakdownItem,
  CategoryComparisonRow,
  MonthSummary,
} from "../../Types";
import { formatAmount } from "../../Utils";
import { BreakdownBottomSheet } from "../BottomSheets/BreakdownListSheet";
import {
  BreakdownRowItem,
  DefaultIconBox,
  GenericBreakdownCard,
} from "../BreakdownCard";

type BreakdownCardProps = {
  summary: MonthSummary;
  bg: string;
  outline: string;
  textColor: string;
  muted: string;
  trackColor: string;
  accentColor: string;
  categoryComparison?: CategoryComparisonRow[];
  incomeCategoryComparison?: CategoryComparisonRow[];
  onRowPress: (mode: "expense" | "income", item: BreakdownItem) => void;
};

function toRowItem(
  item: BreakdownItem,
  categoryBudgets: Record<string, number>,
): BreakdownRowItem {
  return {
    key: item.category,
    icon: item.icon as React.ComponentProps<
      typeof MaterialCommunityIcons
    >["name"],
    accent: item.color,
    label: item.category,
    amount: item.amount,
    percentage: item.percentage,
  };
}

export function BreakdownCard({
  summary,
  bg,
  outline,
  textColor,
  muted,
  trackColor,
  accentColor,
  categoryComparison,
  incomeCategoryComparison,
  onRowPress,
}: BreakdownCardProps) {
  const theme = useTheme();
  const categoryBudgets = useAppSelector(selectCategoryBudgets);
  const activeWorkspace = useAppSelector(selectActiveWorkspace);
  const { minimalIconsEnabled } = useAddonPrefs();
  const currencyCode = activeWorkspace?.currencyCode ?? "INR";
  const currencySymbol = activeWorkspace?.currencySymbol ?? "";
  const [sheetMode, setSheetMode] = React.useState<"expense" | "income">(
    "expense",
  );

  const expenseItems = summary.groupedExpenseBreakdown.map((item) =>
    toRowItem(item, categoryBudgets),
  );

  return (
    <>
      <GenericBreakdownCard
        title="Spending by Categories"
        items={expenseItems}
        bg={bg}
        outline={outline}
        textColor={textColor}
        accentColor={accentColor}
        muted={muted}
        formatAmount={(amount) =>
          formatAmount(amount, currencyCode, currencySymbol)
        }
        emptyMessage="Add transactions to unlock your category breakdown."
        onRowPress={(row) => {
          const original = summary.groupedExpenseBreakdown.find(
            (i) => i.category === row.key,
          );
          if (original) onRowPress("expense", original);
        }}
        buildIcon={(row) => (
          <DefaultIconBox
            item={row}
            resolvedAccent={
              minimalIconsEnabled ? theme.colors.primary : row.accent
            }
          />
        )}
        renderSheet={({ visible, onDismiss }) => (
          <BreakdownBottomSheet
            title="Spending by Categories"
            visible={visible}
            onDismiss={onDismiss}
            breakdown={
              sheetMode === "expense"
                ? summary.fullExpenseBreakdown
                : summary.fullIncomeBreakdown
            }
            mode={sheetMode}
            bg={bg}
            outline={outline}
            textColor={textColor}
            muted={muted}
            trackColor={trackColor}
            categoryComparison={
              sheetMode === "income"
                ? incomeCategoryComparison
                : categoryComparison
            }
            onModeChange={setSheetMode}
            onRowPress={(item) => {
              onDismiss();
              onRowPress(sheetMode, item);
            }}
          />
        )}
      />
    </>
  );
}
