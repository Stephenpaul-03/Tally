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

export const MainEntranceTimeScale = React.createContext(1);

/** Enter once; only changed content can replay while the main route is visible. */
export function MainEntrance({
  children,
  index = 0,
  distance = 14,
  duration = 320,
  delay,
  replayKey,
  style,
}: {
  children: React.ReactNode;
  index?: number;
  distance?: number;
  duration?: number;
  delay?: number;
  replayKey?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const timeScale = React.useContext(MainEntranceTimeScale);
  const focused = useMotionFocus();
  const enabled = useMotionEnabled();
  const progress = useSharedValue(enabled ? 0 : 1);
  const entered = React.useRef(false);
  const lastKey = React.useRef(replayKey);
  React.useLayoutEffect(() => {
    if (!enabled) {
      cancelAnimation(progress);
      progress.value = 1;
      entered.current = true;
      lastKey.current = replayKey;
      return;
    }
    if (!focused) {
      // Changes made in Settings should already be visible when returning.
      if (entered.current) {
        lastKey.current = replayKey;
        cancelAnimation(progress);
        progress.value = 1;
      }
      return;
    }
    if (entered.current && lastKey.current === replayKey) return;
    entered.current = true;
    lastKey.current = replayKey;
    cancelAnimation(progress);
    progress.value = 0;
    progress.value = withDelay(
      (delay ?? Math.min(index, 6) * 45) * timeScale,
      withTiming(1, { duration: duration * timeScale, easing: Easing.out(Easing.cubic) }),
    );
  }, [focused, enabled, index, duration, delay, replayKey, progress, timeScale]);
  const entrance = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * distance }],
  }));
  return <Animated.View style={[style, entrance]}>{children}</Animated.View>;
}
