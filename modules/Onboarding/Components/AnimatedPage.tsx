import React from "react";
import { Animated } from "react-native";

import { useFadeSlide } from "@/components/animations/UseFadeSlide";

type Props = {
  children: React.ReactNode;
};

export function AnimatedPage({ children }: Props) {
  const { animStyle } = useFadeSlide({
    distance: 20,
    duration: 750,
    from: "bottom",
  });

  return <Animated.View style={animStyle}>{children}</Animated.View>;
}
