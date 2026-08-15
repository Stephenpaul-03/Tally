import React from "react";
import { ScrollView, View } from "react-native";
import { useTheme } from "react-native-paper";
import { HeroCard } from "./Components/HeroCard";
import { insightStyles } from "./Styles";

export function InsightsScreen() {
  const theme = useTheme();

  return (
    <View style={[insightStyles.screen, { backgroundColor: theme.colors.background }]}> 
      <ScrollView
        contentContainerStyle={insightStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <HeroCard />
      </ScrollView>
    </View>
  );
}
