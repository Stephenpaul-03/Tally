import { typography } from "@/theme/typography";
import { Gesture } from "react-native-gesture-handler";
import { HomeQuickFactsCard } from "./HomeQuickFactsCard";
import { homeQuickFacts } from "./homeQuickFacts";
import { TransactionRow } from "@/modules/Management/Transaction/Components/TransactionRow";
import { HomeBudgetCarousel } from "./HomeBudgetCarousel";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { DesignText as Text } from "@/components/DesignText";
import { useAppSelector } from "@/hooks/Redux";
import { useWorkspaceDefaults } from "@/hooks/use-workspace-defaults";
import {
  selectActiveExpenseCategories,
  selectCategoryBudgets,
} from "@/modules/Core/Slices/TransactionSlice";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import type { Transaction } from "@/utils/Types";
import { ledgerMoney } from "./presentation";
import { homeBudgetPanel } from "./homeAttentionModel";
import { useClassicHome, useHomeCardShape } from "./HomeCardContext";

export function HomeAttention({
  active,
  pagePan,
  raw,
  month,
  currency,
  symbol,
  onBudget,
  onTransaction,
}: {
  active: boolean;
  pagePan: ReturnType<typeof Gesture.Pan>;
  raw: Transaction[];
  month: string;
  currency: string;
  symbol: string;
  onBudget: () => void;
  onTransaction: (id: string) => void;
}) {
  const { colors: c } = useTheme();
  const classic = useClassicHome();
  const homeCardShape = useHomeCardShape();
  const workspace = useAppSelector(selectActiveWorkspace);
  const expenseCategories = useAppSelector(selectActiveExpenseCategories);
  const categoryBudgets = useAppSelector(selectCategoryBudgets);
  const { getWorkspaceDefaults } = useWorkspaceDefaults();
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const defaults = getWorkspaceDefaults(workspace?.id ?? "personal");
  const safeBelowPercent = defaults.budgetSafeBelowPercent;
  const nearlyEmptyFromPercent = defaults.budgetNearlyEmptyFromPercent;
  const budgetPanel = React.useMemo(
    () =>
      homeBudgetPanel({
        rows: raw,
        month,
        today,
        currency,
        workspaceCurrency: workspace?.currencyCode ?? currency,
        expenseCategories,
        categoryBudgets,
        safeBelowPercent,
        nearlyEmptyFromPercent,
      }),
    [
      raw,
      month,
      today,
      currency,
      workspace?.currencyCode,
      expenseCategories,
      categoryBudgets,
      safeBelowPercent,
      nearlyEmptyFromPercent,
    ],
  );
  const facts = React.useMemo(
    () => homeQuickFacts(raw, month, currency, today),
    [raw, month, currency, today],
  );
  const money = (amount: number) => ledgerMoney(amount, currency, symbol);
  const cards = [
    {
      label: "Daily average",
      value: money(facts.dailyAverage),
      caption: `Across ${facts.days} days`,
    },
    {
      label: "Entries this month",
      value: String(facts.entryCount),
      caption: "Recorded entries",
    },
    ...(facts.largest
      ? [
          {
            label: "Largest expense",
            value: money(facts.largest.amount),
            caption: facts.largest.title || facts.largest.category,
          },
        ]
      : []),
  ];
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", gap: 10, alignItems: "stretch" }}>
        {budgetPanel && (
          <View style={{ flex: 7, minWidth: 0 }}>
            <HomeBudgetCarousel
              panel={budgetPanel}
              currency={currency}
              symbol={symbol}
              onBudget={onBudget}
              pagePan={pagePan}
              active={active}
              compact
              cardHeight={112}
            />
          </View>
        )}
        <View style={{ flex: 3, minWidth: 0 }}>
          <HomeQuickFactsCard
            facts={cards}
            cardHeight={112}
            compact
            narrow={Boolean(budgetPanel)}
            active={active}
            pagePan={pagePan}
          />
        </View>
      </View>
      {facts.recent.length ? (
        <View
          style={{
            ...(classic
              ? {
                  borderRadius: 20,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: c.outlineVariant,
                }
              : homeCardShape("greeting")),
            padding: 8,
            gap: 2,
            backgroundColor: classic ? c.surface : c.surfaceVariant,
          }}
        >
          <Text
            style={{
              padding: 10,
              fontSize: 18,
              fontWeight: "800",
              ...(classic ? typography.editorial.sectionLabel : {}),
              color: c.onSurface,
            }}
          >
            Recent transactions
          </Text>
          {facts.recent.map((row, index) => (
            <View
              key={row.id}
              style={
                classic
                  ? {
                      borderTopWidth: index > 0 ? StyleSheet.hairlineWidth : 0,
                      borderColor: c.outlineVariant,
                      paddingHorizontal: 2,
                      paddingVertical: 4,
                    }
                  : undefined
              }
            >
              <TransactionRow
                transaction={row}
                grouped
                groupPosition={
                  index === facts.recent.length - 1 ? "last" : "middle"
                }
                showDivider={false}
                disableLongPress
                secondaryLabelMode="date"
                onPressTransaction={onTransaction}
              />
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
