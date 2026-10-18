import React, { useEffect } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  FadeInDown, LinearTransition, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming,
} from "react-native-reanimated";

export const insightLayout = LinearTransition.duration(220).reduceMotion(ReduceMotion.System);

export function MotionPressable({ style, children, ...props }: Omit<PressableProps, "style" | "children"> & {
  style?: StyleProp<ViewStyle>; children: React.ReactNode;
}) {
  return <Pressable {...props} style={({ pressed }) => [style, pressed && { opacity: 0.65 }]}>
    {children}
  </Pressable>;
}

export function Reveal({ children, delay = 0, style }: {
  children: React.ReactNode; delay?: number; style?: StyleProp<ViewStyle>;
}) {
  return <Animated.View style={style} layout={insightLayout}
    entering={FadeInDown.duration(260).delay(delay).reduceMotion(ReduceMotion.System)}>
    {children}
  </Animated.View>;
}

export function AnimatedBar({ fraction, color, trackColor, height = 4 }: {
  fraction: number; color: string; trackColor: string; height?: number;
}) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(Math.max(0, Math.min(1, fraction)), {
      duration: 320, reduceMotion: ReduceMotion.System,
    });
  }, [fraction, progress]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  return <Animated.View style={{ height, backgroundColor: trackColor, borderRadius: height, overflow: "hidden" }}>
    <Animated.View style={[{ height, borderRadius: height, backgroundColor: color }, fillStyle]} />
  </Animated.View>;
}
