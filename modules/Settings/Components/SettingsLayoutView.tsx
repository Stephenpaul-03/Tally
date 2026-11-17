import React from "react";
import { useWindowDimensions, type ViewProps } from "react-native";
import Animated from "react-native-reanimated";
import { motionLayout, useMotionEnabled } from "@/components/animations/Motion";

/** Resize the mounted content without replaying its entrance. */
export function SettingsLayoutView(props: ViewProps) {
  const enabled = useMotionEnabled();
  const { width, height } = useWindowDimensions();
  const tablet = Math.min(width, height) >= 600 && width >= 768;
  return <Animated.View {...props} layout={enabled && tablet ? motionLayout : undefined} />;
}
