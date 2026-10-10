import React, { useEffect } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  FadeInDown, LinearTransition, ReduceMotion, useAnimatedStyle, useSharedValue, withSpring, withTiming,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
export const insightLayout = LinearTransition.duration(220).reduceMotion(ReduceMotion.System);

export function MotionPressable({ style, children, ...props }: Omit<PressableProps, "style" | "children"> & {
  style?: StyleProp<ViewStyle>; children: React.ReactNode;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const spring = { damping: 22, stiffness: 360, reduceMotion: ReduceMotion.System };
  return <AnimatedPressable {...props} style={[style, animatedStyle]}
    onPressIn={event => { scale.value = withSpring(0.98, spring); props.onPressIn?.(event); }}
    onPressOut={event => { scale.value = withSpring(1, spring); props.onPressOut?.(event); }}>
    {children}
  </AnimatedPressable>;
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
