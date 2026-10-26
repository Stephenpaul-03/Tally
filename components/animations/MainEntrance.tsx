import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useMotionEnabled, useMotionFocus } from "./Motion";

/** Replay on main-route entry, never on pager tab selection or modal changes. */
export function MainEntrance({
  children,
  index = 0,
  distance = 14,
  style,
}: {
  children: React.ReactNode;
  index?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const focused = useMotionFocus();
  const enabled = useMotionEnabled();
  const progress = useSharedValue(enabled ? 0 : 1);
  React.useLayoutEffect(() => {
    if (!enabled) {
      cancelAnimation(progress);
      progress.value = 1;
      return;
    }
    // Keep the departing route visible beneath the native stack transition.
    if (!focused) return;
    cancelAnimation(progress);
    progress.value = 0;
    progress.value = withDelay(
      Math.min(index, 6) * 45,
      withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }),
    );
  }, [focused, enabled, index, progress]);
  const entrance = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * distance }],
  }));
  return <Animated.View style={[style, entrance]}>{children}</Animated.View>;
}
