import React from "react";
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useMotionEnabled } from "./Motion";

/** Open groups use normal Yoga flow, so animated child heights move siblings in the same frame. */
export function FlowDisclosure({ open, children }: { open: boolean; children: React.ReactNode }) {
  const enabled = useMotionEnabled();
  const height = useSharedValue(0);
  const frameHeight = useSharedValue(0);
  const progress = useSharedValue(open ? 1 : 0);
  const flowing = useSharedValue(open);
  React.useLayoutEffect(() => {
    cancelAnimation(progress);
    if (!enabled) { flowing.value = open; progress.value = open ? 1 : 0; return; }
    if (open && flowing.value && progress.value === 1) return;
    frameHeight.value = height.value;
    flowing.value = false;
    progress.value = withTiming(open ? 1 : 0, { duration: 200 }, (finished) => {
      if (finished && open) flowing.value = true;
    });
  }, [open, enabled, flowing, progress, height, frameHeight]);
  const frame = useAnimatedStyle(() => ({ height: flowing.value ? "auto" : frameHeight.value * progress.value, opacity: progress.value }));
  const content = useAnimatedStyle(() => ({ position: flowing.value ? "relative" : "absolute" }));
  return <Animated.View style={[{ overflow: "hidden" }, frame]} pointerEvents={open ? "auto" : "none"}
    accessibilityElementsHidden={!open} importantForAccessibility={open ? "auto" : "no-hide-descendants"}>
    <Animated.View collapsable={false} style={[{ top: 0, left: 0, right: 0, width: "100%" }, content]}
      onLayout={(event) => { height.value = event.nativeEvent.layout.height; if (open) frameHeight.value = event.nativeEvent.layout.height; }}>
      {children}
    </Animated.View>
  </Animated.View>;
}
