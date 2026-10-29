import { MainEntrance } from "@/components/animations/MainEntrance";
import { useFadeSlide } from "@/components/animations/UseFadeSlide";
import {
  useSetTabBarHeight,
  useTabBarHidden,
} from "@/components/tabbar/TabBarContext";
import { useTabBarModePreference } from "@/components/tabbar/TabBarModePreference";
import { typography } from "@/theme/typography";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useAppShell } from "@/components/AppShellContext";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  cancelAnimation,
  Easing as REasing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import {
  clampTabPosition,
  snapTabIndex,
  classicTabBarGeometry,
  settledTabIndex,
  tabWeight,
} from "@/modules/Main/pagerGeometry";
import {
  useMotionFocus,
  useMotionEnabled,
} from "@/components/animations/Motion";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BottomTabRoute = {
  key: string;
  name: string;
  title: string;
  icon: (props: { color: string; size: number }) => React.ReactNode;
};

export type TabActionButton = {
  label: string;
  icon: (props: { color: string; size: number }) => React.ReactNode;
  onPress: () => void;
};

export type TabActionPair = {
  left?: TabActionButton;
  right?: TabActionButton;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const BAR_HEIGHT = 64;
const BAR_BOTTOM_GAP = 5;
const BAR_BORDER_WIDTH = 1;
const BAR_SIDE_GAP = 20;
const PILL_INSET = 5;

// Gap between the top of the bar and the bottom of the action pills
const ACTION_GAP = 8;
// Pill height matches the active pill inside the bar
const ACTION_PILL_HEIGHT = 40;

// ─── RaisedActionButton ───────────────────────────────────────────────────────

function RaisedActionButton({
  action,
  visible,
  primaryColor,
  side,
  detached = false,
}: {
  action: TabActionButton;
  visible: boolean;
  primaryColor: string;
  side: "left" | "right";
  detached?: boolean;
}) {
  const { animStyle, slideIn, slideOut } = useFadeSlide({
    from: side, // left pill slides in from left, right from right
    distance: 24,
    duration: 320,
    autoPlay: false, // we drive it manually via visible
  });

  const isFirstRender = useRef(true);
  useEffect(() => {
    // Skip the very first render so we don't fire slideOut on mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (visible) slideIn();
      return;
    }
    if (visible) {
      slideIn();
    } else {
      slideOut();
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const pressScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.93,
      damping: 18,
      stiffness: 300,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      damping: 14,
      stiffness: 220,
      useNativeDriver: true,
    }).start();
  };
  const theme = useTheme();
  const { hideLabels } = useTabBarModePreference();
  const iconOnly = hideLabels || !action.label;

  return (
    <Animated.View
      pointerEvents={visible ? "box-none" : "none"}
      style={[
        styles.actionWrapper,
        detached ? styles.actionWrapperDetached : null,
        side === "left" ? styles.actionWrapperLeft : styles.actionWrapperRight,
        animStyle,
      ]}
    >
      <Pressable
        onPress={action.onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={action.label}
        hitSlop={{ top: 20, left: 20, right: 10, bottom: 0 }}
      >
        <Animated.View
          style={[
            styles.actionPill,
            iconOnly && styles.actionCircle,
            {
              backgroundColor: primaryColor,
              transform: [{ scale: pressScale }],
            },
          ]}
        >
          {action.icon({
            color: theme.colors.onPrimary,
            size: iconOnly ? 20 : 14,
          })}
          {!iconOnly ? (
            <Text
              style={[styles.actionLabel, { color: theme.colors.onPrimary }]}
            >
              {action.label.toUpperCase()}
            </Text>
          ) : null}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

function getActiveActions(
  routes: BottomTabRoute[],
  activeIndex: number,
  actionButtons?: Partial<Record<string, TabActionPair>>,
) {
  const activeRouteKey = routes[activeIndex]?.key;
  return activeRouteKey ? actionButtons?.[activeRouteKey] : undefined;
}

// ─── TabButton ────────────────────────────────────────────────────────────────

function TabButton({
  route,
  focused,
  onPress,
  activeColor,
  inactiveColor,
  index,
  position,
}: {
  route: BottomTabRoute;
  focused: boolean;
  onPress: () => void;
  activeColor: string;
  inactiveColor: string;
  index: number;
  position: SharedValue<number>;
}) {
  const handlePress = () => {
    onPress();
  };

  const { hideLabels } = useTabBarModePreference();
  const activeStyle = useAnimatedStyle(() => ({
    opacity: tabWeight(position.value, index),
  }));
  const inactiveStyle = useAnimatedStyle(() => ({
    opacity: 1 - tabWeight(position.value, index),
  }));

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={route.title}
      style={styles.tabButton}
      pointerEvents="auto"
    >
      <MainEntrance delay={260 + index * 60} duration={180} distance={6} style={styles.tabContentLayer}>
        <Animated.View style={styles.tabInner}>
          <View style={{ alignItems: "center", justifyContent: "center" }}>
            <Reanimated.View style={[styles.tabInner, inactiveStyle]}>
              {route.icon({ color: inactiveColor, size: 22 })}
              {!hideLabels && (
                <Text
                  numberOfLines={1}
                  style={[styles.tabLabel, { color: inactiveColor }]}
                >
                  {route.title.toUpperCase()}
                </Text>
              )}
            </Reanimated.View>
            <Reanimated.View
              pointerEvents="none"
              style={[styles.tabInner, { position: "absolute" }, activeStyle]}
            >
              {route.icon({ color: activeColor, size: 22 })}
              {!hideLabels && (
                <Text
                  numberOfLines={1}
                  style={[styles.tabLabel, { color: activeColor }]}
                >
                  {route.title.toUpperCase()}
                </Text>
              )}
            </Reanimated.View>
          </View>
        </Animated.View>
      </MainEntrance>
    </Pressable>
  );
}

// ─── BasicTabBar ──────────────────────────────────────────────────────────────

function BasicTabBar({
  routes,
  activeIndex,
  activePosition,
  onTabPress,
  actionButtons,
}: {
  routes: BottomTabRoute[];
  activeIndex: number;
  activePosition?: number;
  onTabPress: (index: number) => void;
  actionButtons?: Partial<Record<string, TabActionPair>>;
}) {
  const hidden = useTabBarHidden();
  const focused = useMotionFocus();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const setTabBarHeight = useSetTabBarHeight();
  const [surfaceHeight, setSurfaceHeight] = useState(
    BAR_HEIGHT + BAR_BORDER_WIDTH * 2,
  );
  const [barWidth, setBarWidth] = useState(0);
  const { classicPosition, classicDriving, classicTarget } = useAppShell();
  const localPosition = useSharedValue(activeIndex);
  const localDriving = useSharedValue(false);
  const localTarget = useSharedValue(-1);
  const navigationTarget = classicTarget ?? localTarget;
  const position = classicPosition ?? localPosition;
  const driving = classicDriving ?? localDriving;
  const start = useSharedValue(activeIndex);
  const origin = useSharedValue(activeIndex);
  const dragging = useSharedValue(false);
  const motionEnabled = useMotionEnabled();
  const tabWidth = classicTabBarGeometry(barWidth, 0, routes.length).step;
  useEffect(() => {
    if (classicPosition || driving.value) return;
    const target = activePosition ?? activeIndex;
    position.value = Number.isInteger(target)
      ? withTiming(target, { duration: motionEnabled ? 180 : 0 })
      : target;
  }, [
    activeIndex,
    activePosition,
    classicPosition,
    driving,
    motionEnabled,
    position,
  ]);
  const pillMotion = useAnimatedStyle(() => {
    const geometry = classicTabBarGeometry(
      barWidth,
      position.value,
      routes.length,
    );
    return {
      opacity: barWidth > 0 ? 1 : 0,
      width: geometry.pillWidth,
      transform: [{ translateX: geometry.pillLeft }],
    };
  });
  const commit = (index: number) => {
    if (settledTabIndex(position.value, navigationTarget.value) !== index)
      return;
    onTabPress(index);
  };
  const pan = Gesture.Pan()
    .enabled(barWidth > 0)
    .activeOffsetX([-4, 4])
    .failOffsetY([-18, 18])
    .onStart(() => {
      cancelAnimation(position);
      navigationTarget.value = -1;
      start.value = position.value;
      origin.value = activeIndex;
      dragging.value = true;
      driving.value = true;
    })
    .onUpdate((event) => {
      position.value = clampTabPosition(
        start.value + event.translationX / Math.max(1, tabWidth),
      );
    })
    .onEnd((event, success) => {
      dragging.value = false;
      const target = snapTabIndex(
        position.value,
        success ? event.velocityX / Math.max(1, tabWidth) : 0,
      );
      navigationTarget.value = target;
      position.value = withTiming(
        target,
        {
          duration: motionEnabled ? 180 : 0,
          easing: REasing.out(REasing.cubic),
        },
        (finished) => {
          if (!finished) return;
          driving.value = false;
          runOnJS(commit)(target);
        },
      );
    })
    .onFinalize(() => {
      if (!dragging.value) return;
      dragging.value = false;
      position.value = withTiming(
        origin.value,
        { duration: motionEnabled ? 180 : 0 },
        (finished) => {
          if (finished) driving.value = false;
        },
      );
    });
  const {
    animStyle: barEntranceStyle,
    slideIn,
    slideOut,
  } = useFadeSlide({
    distance: 0,
    from: "bottom",
    duration: motionEnabled ? 220 : 0,
    autoPlay: false,
  });

  // Publish the bar's footprint, excluding the safe inset that consumers
  // already add. Keep publication and cleanup in one lifecycle so a remount
  // or effect replay cannot leave a visible bar reporting zero height.
  useLayoutEffect(() => {
    setTabBarHeight(hidden ? 0 : surfaceHeight + BAR_BOTTOM_GAP);
    return () => setTabBarHeight(0);
  }, [hidden, surfaceHeight, setTabBarHeight]);

  const barEntered = useRef(false);
  const barWasHidden = useRef(hidden);
  useEffect(() => {
    if (hidden) {
      barWasHidden.current = true;
      slideOut();
    } else if (focused && (!barEntered.current || barWasHidden.current)) {
      barEntered.current = true;
      barWasHidden.current = false;
      slideIn();
    }
    // Returning from Settings retains the already-visible bar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidden, focused, motionEnabled]);

  const inactiveColor = theme.colors.onBackground + 40;
  const activeColor = theme.colors.onPrimary;

  const activeActions = getActiveActions(routes, activeIndex, actionButtons);

  return (
    <Animated.View
      pointerEvents={hidden ? "none" : "box-none"}
      style={[
        styles.container,
        {
          marginBottom: insets.bottom,
          backgroundColor: theme.colors.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.outlineVariant,
        },
        barEntranceStyle,
      ]}
      onLayout={(e) => {
        const { height } = e.nativeEvent.layout;
        if (height > 0) setSurfaceHeight(height);
      }}
    >
      {/*
        Action pills live OUTSIDE the tabRow, absolutely positioned relative
        to the container. bottom: BAR_HEIGHT + ACTION_GAP places their bottom
        edge just above the top of the bar. left/right align them to the
        bar's rounded corners.
      */}
      {activeActions?.left && (
        <RaisedActionButton
          action={activeActions.left}
          visible={!hidden}
          primaryColor={theme.colors.primary}
          side="left"
        />
      )}
      {activeActions?.right && (
        <RaisedActionButton
          action={activeActions.right}
          visible={!hidden}
          primaryColor={theme.colors.primary}
          side="right"
        />
      )}

      <GestureDetector gesture={pan}>
        <View
          style={styles.tabRow}
          onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
        >
          <Reanimated.View
            pointerEvents="none"
            style={[
              styles.activePill,
              {
                backgroundColor: theme.colors.primary,
                borderWidth: 1,
                borderColor: theme.colors.primary,
              },
              pillMotion,
            ]}
          />

          {routes.map((route, index) => (
            <TabButton
              key={route.key}
              route={route}
              focused={index === activeIndex}
              onPress={() => onTabPress(index)}
              activeColor={activeColor}
              inactiveColor={inactiveColor}
              index={index}
              position={position}
            />
          ))}
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

// ─── BottomTabBar (public API) ────────────────────────────────────────────────

function DisabledTabBarActions({
  activeActions,
}: {
  activeActions?: TabActionPair;
}) {
  const setTabBarHeight = useSetTabBarHeight();
  const hidden = useTabBarHidden();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  useLayoutEffect(() => {
    setTabBarHeight(0);
  }, [setTabBarHeight]);

  if (hidden || (!activeActions?.left && !activeActions?.right)) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.actionOnlyContainer, { marginBottom: insets.bottom }]}
    >
      {activeActions.left ? (
        <RaisedActionButton
          action={activeActions.left}
          visible
          primaryColor={theme.colors.primary}
          side="left"
          detached
        />
      ) : null}
      {activeActions.right ? (
        <RaisedActionButton
          action={activeActions.right}
          visible
          primaryColor={theme.colors.primary}
          side="right"
          detached
        />
      ) : null}
    </View>
  );
}

export function BottomTabBar({
  routes,
  activeIndex,
  activePosition,
  onTabPress,
  actionButtons,
}: {
  routes: BottomTabRoute[];
  activeIndex: number;
  activePosition?: number;
  onTabPress: (index: number) => void;
  /**
   * Map of route.key → { left?, right? } action pill config.
   * When that tab is active the pills float above the bar —
   * left pill at the top-left corner, right pill at the top-right corner.
   * Tapping calls onPress without switching tabs.
   *
   * Example:
   *   actionButtons={{
   *     home: {
   *       left:  { label: "Filter", icon: FilterIcon, onPress: openFilter },
   *       right: { label: "Add",    icon: PlusIcon,   onPress: handleAdd  },
   *     },
   *   }}
   */
  actionButtons?: Partial<Record<string, TabActionPair>>;
}) {
  const { tabBarEnabled } = useTabBarModePreference();
  const activeActions = getActiveActions(routes, activeIndex, actionButtons);

  if (!tabBarEnabled) {
    return <DisabledTabBarActions activeActions={activeActions} />;
  }

  return (
    <BasicTabBar
      routes={routes}
      activeIndex={activeIndex}
      activePosition={activePosition}
      onTabPress={onTabPress}
      actionButtons={actionButtons}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: BAR_SIDE_GAP,
    right: BAR_SIDE_GAP,
    bottom: BAR_BOTTOM_GAP,
    borderRadius: 999,
    borderWidth: BAR_BORDER_WIDTH,
    overflow: "visible",
  },
  actionOnlyContainer: {
    position: "absolute",
    left: BAR_SIDE_GAP,
    right: BAR_SIDE_GAP,
    bottom: 5,
    height: ACTION_PILL_HEIGHT,
    overflow: "visible",
  },
  tabRow: {
    flexDirection: "row",
    height: BAR_HEIGHT,
    paddingHorizontal: PILL_INSET,
    alignItems: "center",
    position: "relative",
    overflow: "visible",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: BAR_HEIGHT,
    overflow: "visible",
    position: "relative",
    // tabButton (not tabContentLayer) is the actual sibling of activePill
    // inside tabRow — zIndex only resolves stacking order among siblings
    // under the same parent, so this is the level that needs to outrank
    // the pill's zIndex 5 / elevation 5. Safe to do now that the focused
    // tab's content layer sets pointerEvents="none", so it no longer
    // competes with the pill for touch.
    zIndex: 10,
    elevation: 10,
  },
  tabContentLayer: {
    position: "relative",
  },
  tabInner: {
    width: "100%",
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 14,
  },
  activePill: {
    position: "absolute",
    top: PILL_INSET,
    bottom: PILL_INSET,
    borderRadius: 999,
    zIndex: 5,
    elevation: 5,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    lineHeight: 12,
  },

  // ─── Action pills ──────────────────────────────────────────────────────────

  actionWrapper: {
    position: "absolute",
    bottom: BAR_HEIGHT + ACTION_GAP,
    height: ACTION_PILL_HEIGHT,
    justifyContent: "center",
    zIndex: 20,
  },
  actionWrapperDetached: {
    bottom: 0,
  },
  actionWrapperLeft: {
    left: 0,
  },
  actionWrapperRight: {
    right: 0,
  },
  actionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: ACTION_PILL_HEIGHT,
    paddingHorizontal: 15,
    paddingVertical: 2,
    borderRadius: 999,
  },
  actionCircle: {
    width: ACTION_PILL_HEIGHT,
    height: ACTION_PILL_HEIGHT,
    borderRadius: ACTION_PILL_HEIGHT / 2,
    paddingHorizontal: 0,
    paddingVertical: 0,
    gap: 0,
    justifyContent: "center",
  },
  actionLabel: {
    ...typography.editorial.sectionLabel,
    fontSize: 16,
    lineHeight: 12,
  },
});
