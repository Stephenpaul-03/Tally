import { Gesture } from "react-native-gesture-handler";
import { HomeQuickFactsCard } from "./HomeQuickFactsCard";
import { homeQuickFacts } from "./homeQuickFacts";
import { TransactionRow } from "@/modules/Management/Transaction/Components/TransactionRow";
import { HomeBudgetCarousel } from "./HomeBudgetCarousel";
import React from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { DesignText as Text } from "@/components/DesignText";
import { useAppDispatch, useAppSelector } from "@/hooks/Redux";
import { useWorkspaceDefaults } from "@/hooks/use-workspace-defaults";
import {
  openDraftModal,
  selectTransactionDrafts,
  selectActiveExpenseCategories,
  selectCategoryBudgets,
} from "@/modules/Core/Slices/TransactionSlice";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import type { Transaction } from "@/utils/Types";
import { ledgerMoney } from "./presentation";
import { sortedHomeDrafts, homeBudgetPanel } from "./homeAttentionModel";
import { homeCardShape, homeCardTone } from "./homeCardAppearance";
import { HomeDraftPicker } from "./HomeDraftPicker";

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
  const { dark, colors: c } = useTheme();
  const dispatch = useAppDispatch();
  const drafts = useAppSelector(selectTransactionDrafts);
  const workspace = useAppSelector(selectActiveWorkspace);
  const expenseCategories = useAppSelector(selectActiveExpenseCategories);
  const categoryBudgets = useAppSelector(selectCategoryBudgets);
  const { getWorkspaceDefaults } = useWorkspaceDefaults();
  const orderedDrafts = React.useMemo(() => sortedHomeDrafts(drafts), [drafts]);
  const latest = orderedDrafts[0];
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [rowWidth, setRowWidth] = React.useState(0);
  React.useEffect(() => {
    setPickerOpen(false);
  }, [workspace?.id]);
  React.useEffect(() => {
    if (!active) setPickerOpen(false);
  }, [active]);
  const [draftBackground, draftForeground] = homeCardTone("drafts", dark);
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
  const cardHeight = rowWidth ? (rowWidth - 10) * 0.3 : 110;
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
      <View
        onLayout={(event) => setRowWidth(event.nativeEvent.layout.width)}
        style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}
      >
        {!latest && budgetPanel ? (
          <View
            style={{
              width: rowWidth ? (rowWidth - 12) * 0.65 : "63%",
              minWidth: 0,
            }}
          >
            <HomeBudgetCarousel
              panel={budgetPanel}
              currency={currency}
              symbol={symbol}
              onBudget={onBudget}
              pagePan={pagePan}
              compact
              cardHeight={cardHeight}
            />
          </View>
        ) : null}
        {latest ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              drafts.length > 1
                ? `Choose from ${drafts.length} drafts`
                : `Continue draft, ${latest.title || latest.category}`
            }
            onPress={() =>
              drafts.length > 1
                ? setPickerOpen(true)
                : dispatch(openDraftModal(latest.id))
            }
            style={({ pressed }) => ({
              width: rowWidth ? (rowWidth - 12) / 2 : "48%",
              minWidth: 0,
              height: cardHeight,
              justifyContent: "space-between",
              gap: 4,
              padding: 12,
              ...homeCardShape("drafts"),
              backgroundColor: draftBackground,
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Icon
              name="file-document-edit-outline"
              size={22}
              color={draftForeground}
            />
            <View style={{ gap: 3 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "800",
                  color: draftForeground,
                }}
              >
                {drafts.length > 1
                  ? "Your unfinished entries"
                  : "Continue a draft"}
              </Text>
              <Text
                numberOfLines={1}
                style={{ fontSize: 11, color: draftForeground }}
              >
                {drafts.length > 1
                  ? `${drafts.length} drafts · Choose one to continue`
                  : `${latest.title || latest.category} · ${ledgerMoney(latest.amount, latest.currencyCode || currency, latest.currencySymbol || symbol)}`}
              </Text>
            </View>
          </Pressable>
        ) : null}
        <HomeQuickFactsCard
          facts={cards}
          cardHeight={cardHeight}
          compact={!latest}
          active={active}
          pagePan={pagePan}
          cardWidth={
            rowWidth
              ? latest
                ? (rowWidth - 12) / 2
                : budgetPanel
                  ? (rowWidth - 12) * 0.35
                  : undefined
              : undefined
          }
        />
      </View>
      {latest ? (
        <HomeBudgetCarousel
          panel={budgetPanel}
          currency={currency}
          symbol={symbol}
          onBudget={onBudget}
          pagePan={pagePan}
        />
      ) : null}
      {facts.recent.length ? (
        <View
          style={{
            ...homeCardShape("greeting"),
            padding: 8,
            gap: 2,
            backgroundColor: c.surfaceVariant,
            overflow: "hidden",
          }}
        >
          <Text
            style={{
              padding: 10,
              fontSize: 18,
              fontWeight: "800",
              color: c.onSurface,
            }}
          >
            Recent transactions
          </Text>
          {facts.recent.map((row, index) => (
            <TransactionRow
              key={row.id}
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
          ))}
        </View>
      ) : null}
      <HomeDraftPicker
        visible={active && pickerOpen && drafts.length > 0}
        drafts={orderedDrafts}
        currency={currency}
        symbol={symbol}
        onClose={() => setPickerOpen(false)}
        onChoose={(id) => {
          setPickerOpen(false);
          dispatch(openDraftModal(id));
        }}
      />
    </View>
  );
}
