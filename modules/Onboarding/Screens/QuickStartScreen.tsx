import React from "react";
import { Pressable, View } from "react-native";
import { Text, type MD3Theme } from "react-native-paper";

import { StaggeredItems } from "../Components/StaggeredItems";
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

type Props = {
  quickStart: QuickStartSelection;
  starterTab: StarterSetupTab;
  setStarterTab: (tab: StarterSetupTab) => void;
  toggleStarterPill: (tab: StarterSetupTab, pill: StarterPill) => void;
  styles: OnboardingStyles;
  theme: MD3Theme;
};

export function QuickStartScreen({
  quickStart,
  starterTab,
  setStarterTab,
  toggleStarterPill,
  styles,
  theme,
}: Props) {
  const selected = quickStart[starterTab];
  const available = STARTER_OPTIONS[starterTab].filter(
    (pill) => !selected.some((item) => item.name === pill.name),
  );

  return (
    <View style={[styles.screenStack, styles.screenTopStack, styles.fullHeightScreen]}>
      <Text style={styles.compactTitle}>Quick Start Setup</Text>
      <Text style={styles.compactDescription}>
        Pick the categories and accounts you want. Selected pills live in the
        box, and each tab needs at least {MIN_STARTER_SELECTION_COUNT}.
      </Text>

      <View style={styles.setupTabs}>
        {TAB_OPTIONS.map((tab) => {
          const active = starterTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setStarterTab(tab.id)}
              style={[
                styles.setupTab,
                active && {
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.setupTabText,
                  {
                    color: active
                      ? theme.colors.onPrimary
                      : theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.selectedPillBox}>
        <View style={styles.selectedBoxHeader}>
          <Text style={styles.sectionLabel}>Selected</Text>
          <Text
            style={[
              styles.selectionCount,
              selected.length < MIN_STARTER_SELECTION_COUNT && {
                color: theme.colors.error,
              },
            ]}
          >
            {selected.length}/{MIN_STARTER_SELECTION_COUNT} minimum
          </Text>
        </View>
        <StaggeredItems
          contentContainerStyle={styles.pillWrap}
          dataKey={starterTab}
          replayOnCountChange={false}
        >
          {selected.map((pill) => (
            <StarterPillChip
              key={pill.name}
              onPress={() => toggleStarterPill(starterTab, pill)}
              pill={pill}
              selected
              styles={styles}
              theme={theme}
            />
          ))}
        </StaggeredItems>
      </View>

      <View style={styles.availablePillsBlock}>
        <Text style={styles.sectionLabel}>Available</Text>
        <StaggeredItems
          contentContainerStyle={styles.pillWrap}
          dataKey={starterTab}
          replayOnCountChange={false}
        >
          {available.map((pill) => (
            <StarterPillChip
              key={pill.name}
              onPress={() => toggleStarterPill(starterTab, pill)}
              pill={pill}
              selected={false}
              styles={styles}
              theme={theme}
            />
          ))}
        </StaggeredItems>
      </View>
    </View>
  );
}
