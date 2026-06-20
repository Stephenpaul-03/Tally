import { useFadeSlide } from "@/components/animations/UseFadeSlide";
import {
  useSetTabBarHeight,
  useTabBarHidden,
} from "@/components/tabbar/TabBarContext";
import { typography } from "@/theme/typography";
import React, { useCallback, useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BottomTabRoute = {
  key: string;
  name: string;
  title: string;
  icon: (props: { color: string; size: number }) => React.ReactNode;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const BAR_HEIGHT = 60;
const INDICATOR_HEIGHT = 2.5;
const INDICATOR_WIDTH_RATIO = 0.45;

// ─── TabButton ────────────────────────────────────────────────────────────────
//
// Mount entrance: useFadeSlide with staggered delay per index.
// Press feedback: inline scale spring, stays on native driver.

function TabButton({
  route,
  focused,
  onPress,
  activeColor,
  inactiveColor,
  index,
}: {
  route: BottomTabRoute;
  focused: boolean;
  onPress: () => void;
  activeColor: string;
  inactiveColor: string;
  index: number;
}) {
  // Staggered fade-up entrance
  const { animStyle: mountStyle } = useFadeSlide({
    distance: 10,
    from: "bottom",
    duration: 400,
    delay: index * 55,
  });

  // Press squish — kept inline, no wrapper conflicts
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.88,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 14,
        stiffness: 220,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={route.title}
      style={styles.tabButton}
    >
      {/* Fade-up entrance wrapper */}
      <Animated.View style={mountStyle}>
        {/* Press scale wrapper */}
        <Animated.View style={[styles.tabInner, { transform: [{ scale }] }]}>
          {route.icon({
            color: focused ? activeColor : inactiveColor,
            size: 22,
          })}
          <Text
            numberOfLines={1}
            style={{
              ...typography.editorial.sectionLabel,
              fontSize: 12,
              lineHeight: 12,
              color: focused ? activeColor : inactiveColor,
              letterSpacing: 0.4,
            }}
          >
            {route.title}
          </Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

// ─── BasicTabBar ──────────────────────────────────────────────────────────────

function BasicTabBar({
  routes,
  activeIndex,
  onTabPress,
}: {
  routes: BottomTabRoute[];
  activeIndex: number;
  onTabPress: (index: number) => void;
}) {
  const hidden = useTabBarHidden();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const setTabBarHeight = useSetTabBarHeight();
  const surfaceHeightRef = useRef(0);

  // Bar entrance — same hook, larger distance
  const {
    animStyle: barEntranceStyle,
    slideIn,
    slideOut,
  } = useFadeSlide({
    distance: 80,
    from: "bottom",
    duration: 500,
    autoPlay: true,
  });

  const publishHeight = useCallback(
    (h: number) => setTabBarHeight(h + insets.bottom),
    [insets.bottom, setTabBarHeight],
  );

  // Hide / show
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (hidden) {
      slideOut(() => setTabBarHeight(0));
    } else {
      publishHeight(surfaceHeightRef.current);
      slideIn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidden]);

  // Indicator spring
  const indicatorLeft = useRef(new Animated.Value(0)).current;
  const barWidthRef = useRef(0);

  const updateIndicator = useCallback(
    (index: number, animated: boolean) => {
      const bw = barWidthRef.current;
      if (!bw) return;
      const tabW = bw / routes.length;
      const indicatorW = tabW * INDICATOR_WIDTH_RATIO;
      const target = index * tabW + tabW / 2 - indicatorW / 2;
      if (animated) {
        Animated.spring(indicatorLeft, {
          toValue: target,
          damping: 22,
          stiffness: 260,
          useNativeDriver: true,
        }).start();
      } else {
        indicatorLeft.setValue(target);
      }
    },
    [routes.length, indicatorLeft],
  );

  useEffect(() => {
    updateIndicator(activeIndex, true);
  }, [activeIndex, updateIndicator]);
  useEffect(() => {
    publishHeight(surfaceHeightRef.current);
  }, [publishHeight]);
  useEffect(() => () => setTabBarHeight(0), [setTabBarHeight]);

  const activeColor = theme.colors.primary;
  const inactiveColor = theme.colors.onSurfaceVariant;
  const surfaceBg = theme.colors.elevation.level2;
  const borderColor = theme.colors.outlineVariant;

  const indicatorWidth =
    barWidthRef.current > 0
      ? (barWidthRef.current / routes.length) * INDICATOR_WIDTH_RATIO
      : 0;

  return (
    <Animated.View
      pointerEvents={hidden ? "none" : "box-none"}
      style={[
        styles.container,
        {
          backgroundColor: surfaceBg,
          borderTopColor: borderColor,
          paddingBottom: insets.bottom,
        },
        barEntranceStyle,
      ]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width !== barWidthRef.current) {
          barWidthRef.current = width;
          updateIndicator(activeIndex, false);
        }
        const contentH = height - insets.bottom;
        if (contentH !== surfaceHeightRef.current) {
          surfaceHeightRef.current = contentH;
          if (!hidden) publishHeight(contentH);
        }
      }}
    >
      <View style={styles.tabRow}>
        {routes.map((route, index) => (
          <TabButton
            key={route.key}
            route={route}
            focused={index === activeIndex}
            onPress={() => onTabPress(index)}
            activeColor={activeColor}
            inactiveColor={inactiveColor}
            index={index}
          />
        ))}
      </View>

      <Animated.View
        style={[
          styles.indicator,
          {
            width: indicatorWidth,
            backgroundColor: activeColor,
            transform: [{ translateX: indicatorLeft }],
          },
        ]}
      />
    </Animated.View>
  );
}

// ─── BottomTabBar (public API) ────────────────────────────────────────────────

export function BottomTabBar({
  routes,
  activeIndex,
  onTabPress,
}: {
  routes: BottomTabRoute[];
  activeIndex: number;
  onTabPress: (index: number) => void;
}) {
  return (
    <BasicTabBar
      routes={routes}
      activeIndex={activeIndex}
      onTabPress={onTabPress}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabRow: {
    flexDirection: "row",
    height: BAR_HEIGHT,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: BAR_HEIGHT,
  },
  tabInner: {
    alignItems: "center",
    gap: 3,
  },
  indicator: {
    position: "absolute",
    top: 0,
    height: INDICATOR_HEIGHT,
    borderRadius: INDICATOR_HEIGHT,
  },
});
