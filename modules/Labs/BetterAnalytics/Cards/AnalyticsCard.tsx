import { useFadeSlide } from "@/components/animations/UseFadeSlide";
import React from "react";
import { Animated } from "react-native";
import type { CardThemeProps } from "../Types";

const CARD_STYLE = {
  borderRadius: 22,
  borderWidth: 1,
  paddingHorizontal: 18,
  paddingTop: 18,
  paddingBottom: 16,
  gap: 14,
  marginBottom: 12,
} as const;

export function AnalyticsCard({
  bg,
  outline,
  children,
}: CardThemeProps & { children: React.ReactNode }) {
  const { animStyle } = useFadeSlide({
    from: "bottom",
    distance: 20,
    duration: 750,
  });

  return (
    <Animated.View
      style={[
        CARD_STYLE,
        { backgroundColor: bg, borderColor: outline },
        animStyle,
      ]}
    >
      {children}
    </Animated.View>
  );
}
