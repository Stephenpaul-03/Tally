import { useFadeSlide } from "@/components/animations/UseFadeSlide";
import type { RootParamList } from "@/navigation/types";
import {
  useIsFocused,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { SettingsNavigator } from "./Navigation";

export function SettingsScreen() {
  const isFocused = useIsFocused();
  const route = useRoute<RouteProp<RootParamList, "Settings">>();
  const initialRouteName =
    route.params?.section === "notification-reminders"
      ? "Labs"
      : "SettingsHome";
  const hasMountedRef = useRef(false);
  const { animStyle, slideIn } = useFadeSlide({
    from: "right",
    distance: 100,
    duration: 800,
    autoPlay: false,
  });

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      slideIn();
      return;
    }
    if (isFocused) {
      slideIn();
    }
  }, [isFocused, slideIn]);

  return (
    <Animated.View style={[{ flex: 1 }, animStyle]}>
      <SettingsNavigator
        key={initialRouteName}
        initialRouteName={initialRouteName}
      />
    </Animated.View>
  );
}
