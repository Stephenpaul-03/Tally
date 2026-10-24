import Animated, {
  cancelAnimation,
  Easing,
  scrollTo,
  useAnimatedRef,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useMotionEnabled } from "@/components/animations/Motion";
import { carouselTarget } from "./carouselGeometry";
import React from "react";
import { Pressable, View, useWindowDimensions } from "react-native";
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
import { useClassicHome, useHomeCardShape } from "./HomeCardContext";
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
  active = true,
}: {
  active?: boolean;
  compact?: boolean;
  cardHeight?: number;
  panel: HomeBudgetPanelData | null;
  currency: string;
  symbol: string;
  onBudget: () => void;
  pagePan: ReturnType<typeof Gesture.Pan>;
}) {
  const { colors: c, dark } = useTheme();
  const classic = useClassicHome();
  const homeCardShape = useHomeCardShape();
  const categoryColors = useAppSelector(selectCategoryColors);
  const categoryIcons = useAppSelector(selectCategoryIcons);
  const { width } = useWindowDimensions();
  const [viewport, setViewport] = React.useState(width - 32);
  const cardWidth = viewport;
  const scroll = useAnimatedRef<Animated.ScrollView>();
  const offset = useSharedValue(0);
  const start = useSharedValue(0);
  const selected = useSharedValue(0);
  const dragging = useSharedValue(false);
  const motion = useMotionEnabled();
  const count = panel?.nudges.length ?? 0;
  useDerivedValue(() => {
    if (scroll()) scrollTo(scroll, offset.value, 0, false);
  });
  React.useEffect(() => {
    // Resizing, navigating away, or changed budgets must not retain a partial page.
    cancelAnimation(offset);
    selected.value = Math.min(Math.max(0, count - 1), selected.value);
    offset.value = selected.value * cardWidth;
  }, [active, cardWidth, count, offset, selected]);
  const settle = (velocity = 0) => {
    "worklet";
    selected.value = carouselTarget(offset.value, cardWidth, count, velocity);
    offset.value = withTiming(selected.value * cardWidth, {
      duration: motion ? 180 : 0,
      easing: Easing.out(Easing.cubic),
    });
  };
  const carouselPan = Gesture.Pan()
    .enabled(active && count > 1)
    .activeOffsetX([-6, 6])
    .failOffsetY([-14, 14])
    .blocksExternalGesture(pagePan)
    .onStart(() => {
      cancelAnimation(offset);
      start.value = offset.value;
      dragging.value = true;
    })
    .onUpdate((event) => {
      offset.value = Math.max(
        0,
        Math.min((count - 1) * cardWidth, start.value - event.translationX),
      );
    })
    .onEnd((event, success) => {
      dragging.value = false;
      settle(success ? -event.velocityX : 0);
    })
    .onFinalize(() => {
      if (!dragging.value) return;
      dragging.value = false;
      settle();
    });
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
        backgroundColor: classic
          ? mixHex(c.surface, c.primary, 0.07)
          : c.secondaryContainer,
        ...(classic
          ? {
              borderWidth: 0.5,
              borderColor: mixHex(c.outlineVariant, c.primary, 0.2),
            }
          : {}),
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <Icon
        name="wallet-plus-outline"
        size={26}
        color={classic ? c.onSurface : c.onSecondaryContainer}
      />
      <View style={{ flex: 1, gap: 4 }}>
        <Text
          style={{
            fontSize: compact ? 13 : 16,
            fontWeight: "800",
            color: classic ? c.onSurface : c.onSecondaryContainer,
          }}
        >
          Set a budget
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: classic ? c.onSurface : c.onSecondaryContainer,
          }}
        >
          Give your spending a limit and see what’s left.
        </Text>
      </View>
      <Icon
        name="chevron-right"
        size={22}
        color={classic ? c.onSurface : c.onSecondaryContainer}
      />
    </Pressable>
  );
  if (panel.needsSetup) return setup;
  return (
    <View
      style={{ gap: 8 }}
      onLayout={(event) => setViewport(event.nativeEvent.layout.width)}
    >
      <GestureDetector gesture={carouselPan}>
        <Animated.ScrollView
          ref={scroll}
          scrollEnabled={false}
          accessibilityActions={[
            { name: "increment", label: "Next budget" },
            { name: "decrement", label: "Previous budget" },
          ]}
          onAccessibilityAction={(event) => {
            const next =
              selected.value +
              (event.nativeEvent.actionName === "increment" ? 1 : -1);
            selected.value = Math.max(0, Math.min(count - 1, next));
            offset.value = withTiming(selected.value * cardWidth, {
              duration: motion ? 180 : 0,
            });
          }}
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
          style={{ overflow: "hidden" }}
        >
          {panel.nudges.map((nudge) => {
            const [background, foreground] = categoryTone(
              nudge.category || "",
              dark,
              getCategoryColor(nudge.category || "", "expense", categoryColors),
            );
            const categoryAccent = getCategoryColor(
              nudge.category || "",
              "expense",
              categoryColors,
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
                  backgroundColor: classic
                    ? mixHex(c.surface, categoryAccent, 0.07)
                    : background,
                  ...(classic
                    ? {
                        borderWidth: 0.5,
                        borderColor: mixHex(
                          c.outlineVariant,
                          categoryAccent,
                          0.2,
                        ),
                      }
                    : {}),
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
                      color: classic ? c.onSurface : foreground,
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
                        color: classic ? c.onSurface : foreground,
                      }}
                    >
                      {money(Math.abs(nudge.remaining))}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: classic ? c.onSurface : foreground,
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
                      color: classic ? c.onSurface : foreground,
                      fontSize: 12,
                      fontWeight: "800",
                    }}
                  >
                    {percent}% spent
                  </Text>
                  <Text
                    style={{
                      color: classic ? c.onSurface : foreground,
                      fontSize: 12,
                    }}
                  >
                    of {money(nudge.budget)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </Animated.ScrollView>
      </GestureDetector>
    </View>
  );
}
