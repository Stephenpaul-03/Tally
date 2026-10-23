import React from "react";
import {
  Animated as NativeAnimated,
  View,
  useWindowDimensions,
  type StyleProp,
  type TextStyle as NativeTextStyle,
} from "react-native";
import { useTheme } from "react-native-paper";
import Animated, {
  FadeInDown,
  FadeOutDown,
  ReduceMotion,
} from "react-native-reanimated";
import { useMotionEnabled } from "@/components/animations/Motion";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";

type TextStyle = StyleProp<NativeTextStyle>;
const enter = FadeInDown.duration(140).reduceMotion(ReduceMotion.System);
const exit = FadeOutDown.duration(100).reduceMotion(ReduceMotion.System);

/** Glyph lifetimes and transitions stay on the UI thread, including bulk clear. */
export const AnimatedAmountDisplay = React.memo(function AnimatedAmountDisplay({
  currencySymbol,
  value,
  color,
  style,
  currencyControl,
}: {
  currencySymbol: string;
  value: string;
  color: string;
  style: TextStyle;
  currencyControl?: (args: {
    color: string;
    textStyle: TextStyle;
  }) => React.ReactNode;
}) {
  const { width, fontScale } = useWindowDimensions();
  const theme = useTheme<ExtendedMD3Theme>();
  const enabled = useMotionEnabled();
  const fontSize = Math.min(
    64,
    Math.max(30, (width - 96) / ((Math.max(value.length, 1) + 1) * 0.58)),
  );
  const textStyle = [
    style,
    {
      fontSize,
      lineHeight: fontSize * 1.15,
      fontVariant: ["tabular-nums"] as "tabular-nums"[],
    },
    theme.expressive && {
      fontFamily: "Figtree-800",
      fontWeight: "normal" as const,
    },
  ];
  return (
    <View
      style={{
        alignItems: "center",
        minHeight: Math.ceil(74 * fontScale),
        flexDirection: "row",
        justifyContent: "center",
      }}
    >
      {currencyControl ? (
        currencyControl({ color, textStyle })
      ) : (
        <NativeAnimated.Text style={[textStyle, { color }]}>
          {currencySymbol}
        </NativeAnimated.Text>
      )}
      <Animated.View
        accessible
        accessibilityLabel={`${currencySymbol}${value || "0"}`}
        style={{ flexDirection: "row" }}
      >
        {(value || "0").split("").map((character, index) => (
          <Animated.Text
            key={`${index}:${character}`}
            entering={enabled ? enter : undefined}
            exiting={enabled ? exit : undefined}
            style={[textStyle, { color }]}
          >
            {character}
          </Animated.Text>
        ))}
      </Animated.View>
    </View>
  );
});
