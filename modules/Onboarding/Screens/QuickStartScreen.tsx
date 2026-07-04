import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text, type MD3Theme } from "react-native-paper";

import { StarterPillChip } from "../Components/StarterPillChip";
import {
  MIN_STARTER_SELECTION_COUNT,
  STARTER_ACCOUNTS,
  STARTER_EXPENSE_CATEGORIES,
  STARTER_INCOME_CATEGORIES,
} from "../Defaults";
import type { OnboardingStyles } from "../Styles";
import type {
  QuickStartSelection,
  StarterPill,
  StarterSetupTab,
} from "../Types";

const TAB_OPTIONS: { id: StarterSetupTab; label: string }[] = [
  { id: "income", label: "Income" },
  { id: "expense", label: "Expense" },
  { id: "accounts", label: "Accounts" },
];

const STARTER_OPTIONS: Record<StarterSetupTab, StarterPill[]> = {
  income: STARTER_INCOME_CATEGORIES,
  expense: STARTER_EXPENSE_CATEGORIES,
  accounts: STARTER_ACCOUNTS,
};

const OTHER_PILL_NAME: Record<StarterSetupTab, string> = {
  income: "Other Income",
  expense: "Other Expense",
  accounts: "Other Account",
};

const COLS = 2; // ← changed from 3 to 2
const GRID_GAP = 8;
const BOX_PADDING = 10;

const CARD_H = 56;
const MAX_ROWS = 3;
const SELECTED_BOX_MAX_H =
  CARD_H * MAX_ROWS + GRID_GAP * (MAX_ROWS - 1) + BOX_PADDING * 2;

const AVAILABLE_ROW_H = 58;
const AVAILABLE_VISIBLE_ROWS = 4;
const AVAILABLE_BOX_H =
  AVAILABLE_ROW_H * AVAILABLE_VISIBLE_ROWS +
  GRID_GAP * (AVAILABLE_VISIBLE_ROWS - 5);

type Props = {
  quickStart: QuickStartSelection;
  starterTab: StarterSetupTab;
  setStarterTab: (tab: StarterSetupTab) => void;
  toggleStarterPill: (tab: StarterSetupTab, pill: StarterPill) => void;
  styles: OnboardingStyles;
  theme: MD3Theme;
};

function sortStarterPills(
  pills: StarterPill[],
  tab: StarterSetupTab,
): StarterPill[] {
  const otherName = OTHER_PILL_NAME[tab];
  const otherPills = pills.filter((pill) => pill.name === otherName);
  const regularPills = pills.filter((pill) => pill.name !== otherName);
  return [...regularPills, ...otherPills];
}

export function QuickStartScreen({
  quickStart,
  starterTab,
  setStarterTab,
  toggleStarterPill,
  styles,
  theme,
}: Props) {
  const selected = React.useMemo(
    () => sortStarterPills(quickStart[starterTab], starterTab),
    [quickStart, starterTab],
  );
  const available = React.useMemo(
    () =>
      sortStarterPills(
        STARTER_OPTIONS[starterTab].filter(
          (pill) =>
            !quickStart[starterTab].some((item) => item.name === pill.name),
        ),
        starterTab,
      ),
    [quickStart, starterTab],
  );
  const needsMore = selected.length < MIN_STARTER_SELECTION_COUNT;

  const [innerWidth, setInnerWidth] = React.useState(0);
  const cardWidth =
    innerWidth > 0
      ? Math.floor((innerWidth - GRID_GAP * (COLS - 1)) / COLS)
      : 0;

  return (
    <View style={s.root}>
      {/* ── Fixed header ── */}
      <Text style={styles.compactTitle}>Quick Start Setup</Text>
      <Text style={[styles.compactDescription, s.description]}>
        Pick the categories and accounts you want to start with.
      </Text>

      {/* ── Tabs ── */}
      <View style={s.tabs}>
        {TAB_OPTIONS.map((tab) => {
          const active = starterTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setStarterTab(tab.id)}
              style={[
                s.tab,
                {
                  backgroundColor: active
                    ? theme.colors.primaryContainer
                    : "transparent",
                },
              ]}
            >
              <Text
                style={[
                  s.tabText,
                  {
                    color: active
                      ? theme.colors.onPrimaryContainer
                      : theme.colors.onSurfaceVariant,
                    fontWeight: active ? "600" : "400",
                  },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── Selected label ── */}
      <View style={s.sectionHeader}>
        <Text
          style={[s.sectionLabel, { color: theme.colors.onSurfaceVariant }]}
        >
          Selected ({selected.length})
        </Text>
        {needsMore ? (
          <View style={s.warningBadge}>
            <MaterialCommunityIcons
              color={theme.colors.error}
              name="alert-circle-outline"
              size={13}
            />
            <Text style={[s.warningText, { color: theme.colors.error }]}>
              {MIN_STARTER_SELECTION_COUNT} min
            </Text>
          </View>
        ) : (
          <MaterialCommunityIcons
            color={theme.colors.primary}
            name="check-circle-outline"
            size={16}
          />
        )}
      </View>

      {/* ── Selected box ── */}
      <View
        style={[
          s.box,
          {
            backgroundColor: theme.colors.elevation.level1,
            borderColor: theme.colors.outlineVariant,
            // Fixed height so ScrollView has a resolved parent to fill
            height: SELECTED_BOX_MAX_H,
          },
        ]}
      >
        {selected.length === 0 ? (
          <View style={s.emptyState}>
            <Text
              style={[s.emptyText, { color: theme.colors.onSurfaceVariant }]}
            >
              Tap + below to add items
            </Text>
          </View>
        ) : (
          /*
           * onLayout here measures the true inner width available after
           * the box's padding, so cardWidth is always accurate.
           * flex: 1 now works because the parent box has a concrete height.
           */
          <View
            style={s.gridMeasure}
            onLayout={(e) => setInnerWidth(e.nativeEvent.layout.width)}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              contentContainerStyle={s.selectedGrid}
            >
              {cardWidth > 0
                ? selected.map((pill) => (
                    <StarterPillChip
                      key={pill.name}
                      cardWidth={cardWidth}
                      onPress={() => toggleStarterPill(starterTab, pill)}
                      pill={pill}
                      selected
                      theme={theme}
                    />
                  ))
                : null}
            </ScrollView>
          </View>
        )}
      </View>

      {/* ── Available label ── */}
      <Text
        style={[
          s.sectionLabel,
          s.availableLabel,
          { color: theme.colors.onSurfaceVariant },
        ]}
      >
        Available
      </Text>

      {/* ── Available box ── */}
      <View
        style={[
          s.box,
          {
            backgroundColor: theme.colors.elevation.level1,
            borderColor: theme.colors.outlineVariant,
            height: AVAILABLE_BOX_H,
          },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          contentContainerStyle={s.availableList}
        >
          {available.map((pill) => (
            <StarterPillChip
              key={pill.name}
              onPress={() => toggleStarterPill(starterTab, pill)}
              pill={pill}
              selected={false}
              theme={theme}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 20,
  },
  description: {
    marginTop: 6,
  },
  tabs: {
    flexDirection: "row",
    gap: 6,
    marginTop: 18,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabText: {
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionLabel: {
    paddingHorizontal: 20,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  availableLabel: {
    marginTop: 14,
    marginBottom: 8,
  },
  warningBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  warningText: {
    fontSize: 12,
    fontWeight: "500",
  },
  box: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
    padding: BOX_PADDING,
  },
  gridMeasure: {
    flex: 1, // works now because parent box has a concrete `height`
  },
  selectedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },
  emptyState: {
    paddingVertical: 14,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
  },
  availableList: {
    gap: GRID_GAP,
    paddingBottom: 4,
  },
});
