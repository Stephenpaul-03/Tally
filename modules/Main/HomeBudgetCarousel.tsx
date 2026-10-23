import React from "react";
import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { DesignText as Text } from "@/components/DesignText";
import { useAppSelector } from "@/hooks/Redux";
import {
  selectCategoryColors,
  selectCategoryIcons,
} from "@/modules/Core/Slices/TransactionSlice";
import { categoryTone } from "@/theme/sage";
import { mixHex } from "@/theme/expressivePalette";
import { getCategoryColor, getCategoryIconName } from "@/utils/Helpers";
import { homeCardShape } from "./homeCardAppearance";
import type { HomeBudgetPanelData } from "./homeAttentionModel";
import { ledgerMoney } from "./presentation";

export function HomeBudgetCarousel({
  panel,
  currency,
  symbol,
  onBudget,
  pagePan,
  compact = false,
  cardHeight,
}: {
  compact?: boolean;
  cardHeight?: number;
  panel: HomeBudgetPanelData | null;
  currency: string;
  symbol: string;
  onBudget: () => void;
  pagePan: ReturnType<typeof Gesture.Pan>;
}) {
  const { colors: c, dark } = useTheme();
  const categoryColors = useAppSelector(selectCategoryColors);
  const categoryIcons = useAppSelector(selectCategoryIcons);
  const { width } = useWindowDimensions();
  const [viewport, setViewport] = React.useState(width - 32);
  const cardWidth = viewport;
  const nativeScroll = Gesture.Native().blocksExternalGesture(pagePan);
  if (!panel) return null;
  const money = (amount: number) => ledgerMoney(amount, currency, symbol);
  const setup = (
    <Pressable
      onPress={onBudget}
      accessibilityRole="button"
      accessibilityLabel="Set a budget"
      style={({ pressed }) => ({
        padding: compact ? 12 : 20,
        minHeight: compact ? cardHeight : undefined,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        ...homeCardShape("nudge"),
        backgroundColor: c.secondaryContainer,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <Icon
        name="wallet-plus-outline"
        size={26}
        color={c.onSecondaryContainer}
      />
      <View style={{ flex: 1, gap: 4 }}>
        <Text
          style={{
            fontSize: compact ? 13 : 16,
            fontWeight: "800",
            color: c.onSecondaryContainer,
          }}
        >
          Set a budget
        </Text>
        <Text style={{ fontSize: 12, color: c.onSecondaryContainer }}>
          Give your spending a limit and see what’s left.
        </Text>
      </View>
      <Icon name="chevron-right" size={22} color={c.onSecondaryContainer} />
    </Pressable>
  );
  if (panel.needsSetup) return setup;
  return (
    <View
      style={{ gap: 8 }}
      onLayout={(event) => setViewport(event.nativeEvent.layout.width)}
    >
      <GestureDetector gesture={nativeScroll}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          snapToInterval={cardWidth}
          disableIntervalMomentum
          bounces={false}
          decelerationRate="fast"
          style={{ overflow: "hidden" }}
        >
          {panel.nudges.map((nudge) => {
            const [background, foreground] = categoryTone(
              nudge.category || "",
              dark,
              getCategoryColor(nudge.category || "", "expense", categoryColors),
            );
            const percent = Math.floor(nudge.percent * 10) / 10;
            return (
              <Pressable
                key={nudge.key}
                onPress={onBudget}
                accessibilityRole="button"
                accessibilityLabel={`${nudge.label}, ${percent}% spent, ${money(Math.abs(nudge.remaining))} ${nudge.remaining < 0 ? "over budget" : "under budget"}`}
                style={({ pressed }) => ({
                  width: cardWidth,
                  padding: compact ? 12 : 16,
                  height: compact ? cardHeight : undefined,
                  justifyContent: "space-between",
                  gap: compact ? 6 : 14,
                  ...homeCardShape("nudge"),
                  backgroundColor: background,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      width: compact ? 28 : 38,
                      height: compact ? 28 : 38,
                      borderRadius: 14,
                      backgroundColor: mixHex(background, foreground, 0.08),
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon
                      name={
                        getCategoryIconName(
                          nudge.category || "",
                          "expense",
                          categoryIcons,
                        ) as React.ComponentProps<typeof Icon>["name"]
                      }
                      size={compact ? 19 : 23}
                      color={foreground}
                    />
                  </View>
                  <Text
                    numberOfLines={2}
                    style={{
                      flex: 1,
                      fontSize: compact ? 13 : 16,
                      fontWeight: "800",
                      color: foreground,
                    }}
                  >
                    {nudge.label}
                  </Text>
                  <View style={{ alignItems: "flex-end", flexShrink: 1 }}>
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={{
                        fontSize: compact ? 22 : 28,
                        fontWeight: "800",
                        letterSpacing: -1,
                        color: foreground,
                      }}
                    >
                      {money(Math.abs(nudge.remaining))}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: foreground,
                      }}
                    >
                      {nudge.remaining < 0
                        ? "Over budget"
                        : nudge.remaining === 0
                          ? "Budget reached"
                          : "Under budget"}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    height: 6,
                    borderRadius: 3,
                    overflow: "hidden",
                    backgroundColor: mixHex(background, foreground, 0.15),
                  }}
                >
                  <View
                    style={{
                      height: 6,
                      borderRadius: 3,
                      width: `${Math.min(100, percent)}%`,
                      backgroundColor: foreground,
                    }}
                  />
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      color: foreground,
                      fontSize: 12,
                      fontWeight: "800",
                    }}
                  >
                    {percent}% spent
                  </Text>
                  <Text style={{ color: foreground, fontSize: 12 }}>
                    of {money(nudge.budget)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </GestureDetector>
    </View>
  );
}
