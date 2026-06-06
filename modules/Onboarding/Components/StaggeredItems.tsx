import React from "react";
import { Animated, View } from "react-native";

import { useStagger } from "@/components/animations/UseStagger";

type Props = {
  children: React.ReactNode;
  contentContainerStyle?: object;
  dataKey?: unknown;
  itemStyle?: object;
  replayOnCountChange?: boolean;
};

export function StaggeredItems({
  children,
  contentContainerStyle,
  dataKey,
  itemStyle,
  replayOnCountChange = true,
}: Props) {
  const items = React.Children.toArray(children);
  const stagger = useStagger({
    count: items.length,
    dataKey,
    distance: 20,
    duration: 750,
    stagger: 100,
    replayOnCountChange,
  });

  return (
    <View style={contentContainerStyle}>
      {items.map((child, index) => (
        <Animated.View
          key={index}
          style={[itemStyle, stagger.getAnimStyle(index)]}
        >
          {child}
        </Animated.View>
      ))}
    </View>
  );
}
