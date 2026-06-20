import { useStagger } from "@/components/animations/UseStagger";
import type { AnalyticsData } from "@/modules/Insights/Types";
import { typography } from "@/theme/typography";
import React from "react";
import { Animated, ScrollView, View } from "react-native";
import { Text } from "react-native-paper";
import { CategoryComparisonTile } from "../Molecules/CategoryComparisonTile";
import { EmptyCardState } from "../Molecules/EmptyCardState";
import type { CardThemeProps } from "../Types";
import { AnalyticsCard } from "./AnalyticsCard";

export function CategoryComparisonCard({
  analytics,
  bg,
  outline,
  textColor,
  muted,
}: CardThemeProps & { analytics: AnalyticsData["categoryComparison"] }) {
  const hasData = analytics.hasPreviousMonthData && analytics.rows.length > 0;
  const { getAnimStyle } = useStagger({
    count: analytics.rows.length,
    stagger: 100,
    distance: 20,
    duration: 750,
    dataKey: analytics.rows.map((r) => r.category).join("|"),
  });

  return (
    <AnalyticsCard
      bg={bg}
      outline={outline}
      textColor={textColor}
      muted={muted}
    >
      <View style={{ gap: 4 }}>
        <Text
          style={{
            ...typography.editorial.sectionLabel,
            color: textColor,
            fontSize: 18,
            letterSpacing: 0.5,
          }}
        >
          Category Comparison vs Last Month
        </Text>
        <Text style={{ fontSize: 12, lineHeight: 17, color: muted }}>
          All categories compared with last month
        </Text>
      </View>

      {hasData ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingRight: 2 }}
        >
          {analytics.rows.map((row, index) => (
            <Animated.View key={row.category} style={getAnimStyle(index)}>
              <CategoryComparisonTile
                item={row}
                textColor={textColor}
                muted={muted}
              />
            </Animated.View>
          ))}
        </ScrollView>
      ) : (
        <EmptyCardState
          title="No previous month data available."
          muted={muted}
          icon="compare-horizontal"
        />
      )}
    </AnalyticsCard>
  );
}
