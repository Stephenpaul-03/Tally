import { useFadeSlide } from "@/components/animations/UseFadeSlide";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Animated, Pressable, View } from "react-native";
import { Text } from "react-native-paper";
import type { PillCardThemeProps } from "../Types";

// ─── Border header ────────────────────────────────────────────────────────────
// Generic "floating label(s) on a border" header. Used both by InsightPillCard
// (title + optional "View All" action) and reused elsewhere (e.g. the
// date/amount section headers in MobileLayout) via the `rightContent` slot.
type BorderHeaderProps = {
  title: string;
  muted: string;
  accentColor: string;
  surfaceColor: string;
  outline: string;
  /** Arbitrary node rendered as the floating pill on the right. Omit for a title-only header. */
  rightContent?: React.ReactNode;
};

export function BorderHeader({
  title,
  muted,
  outline,
  accentColor,
  surfaceColor,
  rightContent,
}: BorderHeaderProps) {
  return (
    <View
      style={{
        position: "absolute",
        top: -12,
        left: 0,
        right: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
      }}
      pointerEvents="box-none"
    >
      <View
        style={{
          backgroundColor: surfaceColor,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 20,
          borderColor: outline,
          borderWidth: 0.5,
          flexShrink: 1,
          maxWidth: "70%",
        }}
      >
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{
            fontSize: 10,
            lineHeight: 16,
            fontWeight: "600",
            letterSpacing: 0.8,
            color: accentColor,
            textTransform: "uppercase",
          }}
        >
          {title}
        </Text>
      </View>
      {rightContent ?? null}
    </View>
  );
}

// ─── Insight pill card ────────────────────────────────────────────────────────
export function InsightPillCard({
  title,
  bg,
  outline,
  accentColor,
  muted,
  onViewAll,
  children,
}: PillCardThemeProps & {
  title: string;
  muted?: string;
  onViewAll?: () => void;
  children: React.ReactNode;
}) {
  const { animStyle } = useFadeSlide({
    from: "bottom",
    distance: 20,
    duration: 750,
  });

  return (
    <Animated.View
      style={{
        backgroundColor: bg,
        marginTop: 15,
        borderRadius: 20,
        borderWidth: 0.5,
        borderColor: outline,
        overflow: "visible",
        paddingHorizontal: 20,
        paddingTop: 25,
        paddingBottom: 18,
        position: "relative",
        opacity: animStyle.opacity,
        transform: animStyle.transform,
      }}
    >
      <BorderHeader
        title={title}
        muted={muted ?? accentColor}
        outline={outline}
        accentColor={accentColor}
        surfaceColor={bg}
        rightContent={
          onViewAll ? (
            <Pressable
              onPress={onViewAll}
              hitSlop={20}
              style={({ pressed }) => ({
                backgroundColor: bg,
                borderRadius: 20,
                borderColor: outline,
                borderWidth: 0.5,
                paddingHorizontal: 8,
                paddingVertical: 4,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                flexShrink: 0,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text
                style={{
                  fontSize: 9,
                  lineHeight: 16,
                  fontWeight: "400",
                  letterSpacing: 0.8,
                  color: muted ?? accentColor,
                  textTransform: "uppercase",
                }}
              >
                View All
              </Text>
              <MaterialCommunityIcons
                name="arrow-right"
                size={12}
                color={muted ?? accentColor}
              />
            </Pressable>
          ) : null
        }
      />
      {children}
    </Animated.View>
  );
}