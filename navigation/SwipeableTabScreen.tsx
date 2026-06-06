import { useNavigation } from "@react-navigation/native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import type { NavigationProp } from "@react-navigation/native";
import React, { useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { TAB_ROUTES, type AppRouteName } from "@/constants/routes";
import type { RootParamList } from "@/navigation/types";

type SwipeableTabScreenProps = {
  children: React.ReactNode;
};

export function SwipeableTabScreen({ children }: SwipeableTabScreenProps) {
  const navigation = useNavigation<NavigationProp<RootParamList> & {
    getState(): Readonly<{ routeNames: string[]; index: number | undefined }>;
  }>();

  const swipeableRouteNames = TAB_ROUTES.map((r) => r.name as AppRouteName);
  const swipeCount = swipeableRouteNames.length;

  const handleSwipeEnd = useCallback(
    (translationX: number) => {
      if (Math.abs(translationX) < 60) return;

      const state = navigation.getState();
      const currentRoute = state.routeNames[state.index ?? -1];
      const currentIndex = swipeableRouteNames.indexOf(
        currentRoute as AppRouteName,
      );
      if (currentIndex === -1) return;

      const isSwipeLeft = translationX < 0;
      const nextIndex = isSwipeLeft
        ? Math.min(currentIndex + 1, swipeCount - 1)
        : Math.max(currentIndex - 1, 0);

      if (nextIndex !== currentIndex) {
        navigation.navigate(swipeableRouteNames[nextIndex] as keyof RootParamList);
      }
    },
    [navigation, swipeableRouteNames, swipeCount],
  );

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .minDistance(20)
        .activeOffsetX([-50, 50])
        .onEnd((e: { translationX: number }) => {
          handleSwipeEnd(e.translationX);
        }),
    [handleSwipeEnd],
  );

  return (
    <GestureDetector gesture={gesture}>
      <View collapsable={false} style={styles.container}>
        {children}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
