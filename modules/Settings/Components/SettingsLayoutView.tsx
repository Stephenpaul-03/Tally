import React from "react";
import type { ViewProps } from "react-native";
import { useTabletLayout } from "@/hooks/use-tablet-layout";
import Animated from "react-native-reanimated";
import { motionLayout, useMotionEnabled } from "@/components/animations/Motion";

/** Resize the mounted content without replaying its entrance. */
export function SettingsLayoutView(props: ViewProps) {
  const enabled = useMotionEnabled();
  const tablet = useTabletLayout();
  return <Animated.View {...props} layout={enabled && tablet ? motionLayout : undefined} />;
}
