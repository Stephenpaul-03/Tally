import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useMotionEnabled } from "./Motion";
import { useManagementEntranceReady } from "./UseManagementEntrance";

/** One UI-thread timeline survives row rerenders, sorting and native completion. */
export function useManagementEntranceProgress() {
  const ready = useManagementEntranceReady();
  const enabled = useMotionEnabled();
  const started = React.useRef(false);
  const progress = useSharedValue(enabled ? 0 : 1);
  React.useEffect(() => {
    if (!enabled) {
      started.current = true;
      progress.value = 1;
    } else if (ready && !started.current) {
      started.current = true;
      progress.value = withTiming(1, { duration: 500, easing: Easing.linear });
    }
  }, [ready, enabled, progress]);
  return progress;
}

/** Keep the final row style owned by the UI thread after the entrance ends. */
export function ManagementEntranceItem({
  children,
  progress,
  animate = true,
  index,
  style,
}: {
  children: React.ReactNode;
  progress: SharedValue<number>;
  animate?: boolean;
  index: number;
  style?: StyleProp<ViewStyle>;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const phase = animate
      ? Math.max(
          0,
          Math.min(1, (progress.value * 500 - Math.min(index, 8) * 30) / 260),
        )
      : 1;
    const shown = 1 - Math.pow(1 - phase, 3);
    return {
      opacity: shown,
      transform: [{ translateY: (1 - shown) * 10 }],
    };
  });
  return (
    <Animated.View collapsable={false} style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
