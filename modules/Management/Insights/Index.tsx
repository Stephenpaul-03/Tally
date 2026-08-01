import React from "react";
import { ScrollView } from "react-native";
import { useTheme } from "react-native-paper";
import {
  CategoryIncomeBreakdownCard,
  IncomeAccountBreakdownCard,
} from "./Components/CategoryIncomeBreakdownCard";
import { HeroCard } from "./Components/HeroCard";
import { TrendsCard } from "./Components/TrendsCard";
import { insightStyles } from "./Styles";

export function InsightsScreen() {
  const theme = useTheme();

  return (
    <ScrollView
      style={[
        insightStyles.screen,
        { backgroundColor: theme.colors.background },
      ]}
      contentContainerStyle={insightStyles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <HeroCard />
      <TrendsCard />
      <CategoryIncomeBreakdownCard />
      <IncomeAccountBreakdownCard />
    </ScrollView>
  );
}
