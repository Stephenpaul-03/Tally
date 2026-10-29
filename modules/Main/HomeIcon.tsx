import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { MainEntrance } from "@/components/animations/MainEntrance";
import { HOME_CONTENT_START } from "./homeTextTiming";

export function HomeIconReveal({ children, style }: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <MainEntrance delay={HOME_CONTENT_START} duration={160} distance={3} style={style}>
      {children}
    </MainEntrance>
  );
}
export function HomeIcon(props: React.ComponentProps<typeof Icon>) {
  return <HomeIconReveal><Icon {...props} /></HomeIconReveal>;
}
