import { useMotionEnabled } from "@/components/animations/Motion";
import React from "react";
import { AppState, Pressable, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { FadeIn, runOnJS } from "react-native-reanimated";
import { useTheme } from "react-native-paper";
import { DesignText as Text } from "@/components/DesignText";
import { homeCardShape } from "./homeCardAppearance";

export function HomeQuickFactsCard({
  facts,
  active,
  pagePan,
  cardWidth,
  cardHeight = 110,
  compact = false,
}: {
  cardWidth?: number;
  cardHeight?: number;
  compact?: boolean;
  facts: { label: string; value: string; caption: string }[];
  active: boolean;
  pagePan: ReturnType<typeof Gesture.Pan>;
}) {
  const { colors: c } = useTheme();
  const reduced = !useMotionEnabled();
  const [index, setIndex] = React.useState(0);
  const [foreground, setForeground] = React.useState(
    AppState.currentState === "active",
  );
  React.useEffect(() => {
    const sub = AppState.addEventListener("change", (state) =>
      setForeground(state === "active"),
    );
    return () => sub.remove();
  }, []);
  const advance = React.useCallback(
    (step = 1) => setIndex((i) => (i + step + facts.length) % facts.length),
    [facts.length],
  );
  React.useEffect(() => {
    if (!active || !foreground || reduced || facts.length < 2) return;
    const timer = setInterval(() => advance(), 6500);
    return () => clearInterval(timer);
  }, [active, foreground, reduced, facts.length, advance]);
  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-14, 14])
    .blocksExternalGesture(pagePan)
    .onEnd((event) => {
      if (Math.abs(event.translationX) > 24)
        runOnJS(advance)(event.translationX < 0 ? 1 : -1);
    });
  const fact = facts[index % facts.length];
  return (
    <GestureDetector gesture={pan}>
      <View
        style={{
          flex: cardWidth ? undefined : 1,
          width: cardWidth,
          height: cardHeight,
          minWidth: 0,
          ...homeCardShape("date"),
          backgroundColor: c.tertiaryContainer,
          overflow: "hidden",
        }}
      >
        <Pressable
          onPress={() => advance()}
          accessibilityRole="button"
          accessibilityLabel={`${fact.label}, ${fact.value}. ${fact.caption}. Next statistic`}
          style={{
            padding: 12,
            flex: 1,
            justifyContent: "space-between",
            gap: 5,
          }}
        >
          <Animated.View
            key={index % facts.length}
            entering={active && !reduced ? FadeIn.duration(220) : undefined}
            style={{ gap: 3 }}
          >
            <Text
              style={{
                fontSize: compact ? 11 : 12,
                fontWeight: "700",
                color: c.onTertiaryContainer,
              }}
            >
              {fact.label}
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{
                fontSize: compact ? 22 : 25,
                fontWeight: "800",
                letterSpacing: -1,
                color: c.onTertiaryContainer,
              }}
            >
              {fact.value}
            </Text>
            <Text
              numberOfLines={1}
              style={{ fontSize: 10, color: c.onTertiaryContainer }}
            >
              {fact.caption}
            </Text>
          </Animated.View>
          <View style={{ flexDirection: "row", gap: 4 }}>
            {facts.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === index % facts.length ? 14 : 5,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: c.onTertiaryContainer,
                  opacity: i === index % facts.length ? 1 : 0.25,
                }}
              />
            ))}
          </View>
        </Pressable>
      </View>
    </GestureDetector>
  );
}
