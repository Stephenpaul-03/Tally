import { mixHex } from "@/theme/expressivePalette";
import { typography } from "@/theme/typography";
import { useMotionEnabled } from "@/components/animations/Motion";
import React from "react";
import { AppState, Pressable, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { FadeIn, runOnJS } from "react-native-reanimated";
import { useTheme } from "react-native-paper";
import { DesignText as Text } from "@/components/DesignText";
import { useClassicHome, useHomeCardShape } from "./HomeCardContext";

export function HomeQuickFactsCard({
  facts,
  active,
  pagePan,
  cardWidth,
  cardHeight = 110,
  compact = false,
  narrow = false,
}: {
  narrow?: boolean;
  cardWidth?: number;
  cardHeight?: number;
  compact?: boolean;
  facts: { label: string; value: string; caption: string }[];
  active: boolean;
  pagePan: ReturnType<typeof Gesture.Pan>;
}) {
  const { colors: c } = useTheme();
  const classic = useClassicHome();
  const homeCardShape = useHomeCardShape();
  const ink = classic ? c.onSurface : c.onTertiaryContainer;
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
  const factColor =
    {
      "Daily average": "#41B7C4",
      "Entries this month": "#AF8FE8",
      "Largest expense": "#E8A35D",
    }[fact.label] ?? c.primary;
  const factBackground = mixHex(c.surface, factColor, 0.1);
  return (
    <GestureDetector gesture={pan}>
      <View
        style={{
          flex: classic || cardWidth ? undefined : 1,
          width: classic ? "100%" : cardWidth,
          height: cardHeight,
          minWidth: 0,
          ...(classic && !narrow ? {} : homeCardShape("date")),
          backgroundColor: classic
            ? narrow
              ? factBackground
              : "transparent"
            : c.tertiaryContainer,
          ...(classic && narrow
            ? {
                borderWidth: 0.5,
                borderColor: mixHex(c.outlineVariant, factColor, 0.25),
              }
            : {}),
          overflow: "hidden",
        }}
      >
        <Pressable
          onPress={() => advance()}
          accessibilityRole="button"
          accessibilityLabel={`${fact.label}, ${fact.value}. ${fact.caption}. Next statistic`}
          style={{
            padding: narrow ? 10 : classic ? 4 : 12,
            flex: 1,
            justifyContent: "space-between",
            gap: 5,
          }}
        >
          <Animated.View
            key={index % facts.length}
            entering={active && !reduced ? FadeIn.duration(220) : undefined}
            style={{
              gap: 3,
              flexDirection: classic && !narrow ? "row" : "column",
              alignItems: classic && !narrow ? "center" : undefined,
            }}
          >
            <Text
              numberOfLines={narrow ? 2 : undefined}
              adjustsFontSizeToFit={narrow}
              style={{
                fontSize: compact ? 11 : 12,
                fontWeight: "700",
                ...(classic
                  ? {
                      ...typography.editorial.sectionLabel,
                      fontSize: narrow ? 11 : 16,
                      lineHeight: narrow ? 13 : 22,
                    }
                  : {}),
                color: classic ? c.onSurfaceVariant : ink,
                flex: classic && !narrow ? 1 : undefined,
              }}
            >
              {fact.label}
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{
                ...(classic ? typography.bodyStrong : {}),
                fontSize: narrow ? 24 : compact ? 22 : 25,
                fontWeight: "800",
                letterSpacing: narrow ? -0.4 : -1,
                color: ink,
              }}
            >
              {fact.value}
            </Text>
            {!classic && (
              <Text
                numberOfLines={1}
                style={{ fontSize: 10, color: c.onTertiaryContainer }}
              >
                {fact.caption}
              </Text>
            )}
          </Animated.View>
          <View
            style={{
              flexDirection: narrow ? "column" : "row",
              gap: narrow ? 6 : 4,
              alignItems: narrow ? "flex-start" : "center",
            }}
          >
            {classic && (
              <Text
                numberOfLines={narrow ? 2 : 1}
                style={{
                  flex: narrow ? undefined : 1,
                  fontSize: narrow ? 9 : 11,
                  color: c.onSurfaceVariant,
                }}
              >
                {fact.caption}
              </Text>
            )}
            <View style={{ flexDirection: "row", gap: narrow ? 3 : 4 }}>
              {facts.map((_, i) => (
                <View
                  key={i}
                  style={{
                    width:
                      i === index % facts.length
                        ? narrow
                          ? 8
                          : 14
                        : narrow
                          ? 3
                          : 5,
                    height: narrow ? 3 : 5,
                    borderRadius: 3,
                    backgroundColor: ink,
                    opacity: i === index % facts.length ? 1 : 0.25,
                  }}
                />
              ))}
            </View>
          </View>
        </Pressable>
      </View>
    </GestureDetector>
  );
}
