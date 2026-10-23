import { TonalSummaryTile } from "./TonalSummaryTile";
import { categoryTone } from "@/theme/sage";
import { sortCategories } from "@/utils/category-order";
import { CategoryIconBadge } from "@/components/CategoryIconBadge";
import { typography } from "@/theme/typography";
import { getCategoryColor, getCategoryIconName } from "@/utils/Helpers";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { useWindowDimensions, View } from "react-native";
import { useTheme } from "react-native-paper";
import { DesignText as Text } from "@/components/DesignText";
import Animated, {
  FadeIn,
  FadeOut,
  ReduceMotion,
} from "react-native-reanimated";
import { amountChangeLabel, percentLabel, type Group } from "../calculations";
import { CardEmptyState } from "./CardEmptyState";
import { insightLayout, MotionPressable } from "./Motion";
import { CardFooterAction, Section } from "./Primitives";

export function CategorySection({
  title,
  type,
  groups,
  money,
  icons,
  colors,
  onSelect,
  incomeTotal = 0,
  budgets,
  comparison = false,
  comparisonPeriod = "last month",
  emptyState,
  showAll = false,
  onShowAll,
  inset = 14,
  expressive = false,
}: {
  title?: string;
  type: "income" | "expense";
  groups: Group[];
  money: (value: number) => string;
  icons: Record<string, string>;
  colors: Record<string, string>;
  onSelect: (group: Group) => void;
  incomeTotal?: number;
  budgets?: Record<string, number>;
  comparison?: boolean;
  comparisonPeriod?: string;
  emptyState?: React.ReactNode;
  showAll?: boolean;
  onShowAll?: () => void;
  inset?: number;
  expressive?: boolean;
}) {
  const theme = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 380 || fontScale > 1.25;
  const rows = sortCategories(
    groups.filter(
      (group) => group.count > 0 || (comparison && group.previousCount > 0),
    ),
    (group) => group.name,
  );
  const visible = showAll ? rows : rows.slice(0, 3);
  if (
    expressive &&
    !showAll &&
    !comparison &&
    incomeTotal === 0 &&
    rows.length
  ) {
    const tiles = [
      ...visible,
      ...(rows.length > 3
        ? [
            {
              name: `${rows.length - 3} more`,
              amount: rows.slice(3).reduce((sum, row) => sum + row.amount, 0),
              share: rows.slice(3).reduce((sum, row) => sum + row.share, 0),
              aggregate: true,
            },
          ]
        : []),
    ];
    return (
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {tiles.map((group, index) => {
          const aggregate = "aggregate" in group;
          const [backgroundColor, color] = categoryTone(
            group.name,
            theme.dark,
            aggregate ? undefined : getCategoryColor(group.name, type, colors),
          );
          const budget = budgets?.[group.name];
          return (
            <TonalSummaryTile
              key={group.name}
              index={index}
              background={backgroundColor}
              foreground={color}
              icon={
                aggregate
                  ? "view-grid-outline"
                  : (getCategoryIconName(
                      group.name,
                      type,
                      icons,
                    ) as React.ComponentProps<
                      typeof MaterialCommunityIcons
                    >["name"])
              }
              value={money(group.amount)}
              caption={`${group.name} · ${percentLabel(group.share * 100)}`}
              onPress={() =>
                aggregate ? onShowAll?.() : onSelect(group as Group)
              }
              note={
                budget && budget > 0
                  ? `${money(Math.abs(budget - group.amount))} ${group.amount > budget ? "over budget" : "budget left"}`
                  : undefined
              }
              noteColor={
                budget && group.amount > budget ? theme.colors.error : color
              }
            />
          );
        })}
      </View>
    );
  }
  const content = (
    <Animated.View layout={insightLayout}>
      {!rows.length
        ? (emptyState ?? (
            <CardEmptyState
              message={
                type === "expense"
                  ? "Nothing spent yet"
                  : "Income still to tally"
              }
            />
          ))
        : null}
      {visible.map((group) => {
        const budget = budgets?.[group.name];
        const hasBudget =
          budget !== undefined && Number.isFinite(budget) && budget > 0;
        const hasMetadata =
          (incomeTotal > 0 && group.count > 0) || comparison || hasBudget;
        const remaining = hasBudget ? budget - group.amount : 0;
        const change = !group.count
          ? `No entries this month · ${comparisonPeriod} ${money(group.previous)}`
          : !group.previousCount
            ? `No entries in ${comparisonPeriod}`
            : group.amount === group.previous
              ? `Same as ${comparisonPeriod}`
              : amountChangeLabel(
                  group.amount,
                  group.previous,
                  money,
                  comparisonPeriod,
                );
        return (
          <Animated.View
            key={group.name}
            layout={insightLayout}
            entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)}
            exiting={FadeOut.duration(120).reduceMotion(ReduceMotion.System)}
          >
            <MotionPressable
              onPress={() => onSelect(group)}
              accessibilityRole="button"
              accessibilityLabel={`${group.name}, ${money(group.amount)}. ${comparison ? change + ". " : ""}View recorded entries.`}
              style={{
                flexDirection: "row",
                alignItems: hasMetadata ? "flex-start" : "center",
                gap: 10,
                minHeight: 44,
                paddingVertical: 8,
              }}
            >
              <CategoryIconBadge
                categoryName={group.name}
                icon={
                  getCategoryIconName(
                    group.name,
                    type,
                    icons,
                  ) as React.ComponentProps<
                    typeof MaterialCommunityIcons
                  >["name"]
                }
                color={getCategoryColor(group.name, type, colors)}
              />
              <View style={{ flex: 1, gap: 3 }}>
                <View
                  style={{
                    gap: 4,
                    flexDirection: stacked ? "column" : "row",
                    alignItems: stacked ? "flex-start" : "center",
                    flexWrap: "wrap",
                  }}
                >
                  <Text
                    style={{
                      ...typography.bodyMedium,
                      fontSize: 14,
                      flexShrink: 1,
                      ...(!stacked ? { flexGrow: 1, flexBasis: 90 } : {}),
                    }}
                  >
                    {group.name}
                  </Text>
                  <Text
                    style={[
                      {
                        ...typography.bodyMedium,
                        fontSize: 14,
                        maxWidth: "100%",
                      },
                    ]}
                  >
                    {money(group.amount)}
                  </Text>
                </View>
                {hasMetadata ? (
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}
                  >
                    {incomeTotal > 0 && group.count > 0 ? (
                      <Text
                        style={{
                          ...typography.body,
                          fontSize: 12,
                          color: theme.colors.onSurfaceVariant,
                          backgroundColor: theme.colors.elevation.level2,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 8,
                        }}
                      >
                        {percentLabel((group.amount / incomeTotal) * 100)} of
                        income{type === "expense" ? " used" : " received"}
                      </Text>
                    ) : null}
                    {comparison ? (
                      <Text
                        style={{
                          ...typography.body,
                          fontSize: 12,
                          lineHeight: 18,
                          color: theme.colors.onSurface,
                          backgroundColor: theme.colors.elevation.level2,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 8,
                        }}
                      >
                        {change}
                      </Text>
                    ) : null}
                    {hasBudget ? (
                      <Text
                        style={{
                          ...typography.bodyMedium,
                          fontSize: 13,
                          color:
                            remaining < 0
                              ? theme.colors.error
                              : theme.colors.onSurfaceVariant,
                        }}
                      >
                        {money(Math.abs(remaining))}{" "}
                        {remaining < 0
                          ? "over category budget"
                          : "category budget left"}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={16}
                color={theme.colors.onSurfaceVariant}
                style={{ marginTop: hasMetadata ? 6 : 0 }}
              />
            </MotionPressable>
          </Animated.View>
        );
      })}
      {!showAll && rows.length > 3 && onShowAll ? (
        <CardFooterAction
          label={`View ${rows.length - 3} more`}
          onPress={onShowAll}
          inset={inset}
        />
      ) : null}
    </Animated.View>
  );
  return title ? <Section title={title}>{content}</Section> : content;
}
