import { colorTreatment } from "@/theme/colorTreatment";
import { useFadeSlide } from "@/components/animations/UseFadeSlide";
import {
  useSetTabBarHeight,
  useTabBarHidden,
} from "@/components/tabbar/TabBarContext";
import { useTabBarModePreference } from "@/components/tabbar/TabBarModePreference";
import { typography } from "@/theme/typography";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
const PILL_GAP = 6;

// Gap between the top of the bar and the bottom of the action pills
const ACTION_GAP = 8;
// Pill height matches the active pill inside the bar
const ACTION_PILL_HEIGHT = 40;

// Minimum finger movement (px) before a touch on the pill counts as a drag
// rather than a tap.
const DRAG_ACTIVATION_THRESHOLD = 4;

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
          {action.icon({ color: theme.colors.onPrimary, size: iconOnly ? 20 : 14 })}
          {!iconOnly ? <Text style={[styles.actionLabel, { color: theme.colors.onPrimary }]}>
            {action.label.toUpperCase()}
          </Text> : null}
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
}: {
  route: BottomTabRoute;
  focused: boolean;
  onPress: () => void;
  activeColor: string;
  inactiveColor: string;
  index: number;
}) {
  const { animStyle: mountStyle } = useFadeSlide({
    distance: 10,
    from: "bottom",
    duration: 400,
    delay: index * 55,
  });

  const handlePress = () => {
    onPress();
  };

  const { hideLabels } = useTabBarModePreference();
  const iconColor = focused ? activeColor : inactiveColor;
  const labelColor = focused ? activeColor : inactiveColor;

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={route.title}
      style={styles.tabButton}
      // tabButton carries the raised zIndex (above the pill) so its icon +
      // label paint on top. But that same zIndex makes this whole Pressable
      // win hit-testing for the focused tab — the one the pill physically
      // sits under. pointerEvents="none" on an inner layer doesn't help,
      // since the *parent* Pressable is what's intercepting. So when this
      // tab is focused, we make the whole Pressable pass touches through to
      // the pill underneath (which owns drag-to-select). Tapping an already
      // -active tab was always a no-op, so nothing functional is lost.
      // Unfocused tabs are never overlapped by the pill, so they keep
      // normal touch handling.
      pointerEvents={focused ? "none" : "auto"}
    >
      <Animated.View style={[mountStyle, styles.tabContentLayer]}>
        <Animated.View style={styles.tabInner}>
          {route.icon({ color: iconColor, size: 22 })}
          {!hideLabels ? <Text
            numberOfLines={1}
            style={[styles.tabLabel, { color: labelColor }]}
          >
            {route.title.toUpperCase()}
          </Text> : null}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

// ─── BasicTabBar ──────────────────────────────────────────────────────────────

function BasicTabBar({
  routes,
  activeIndex,
  activePosition,
  onTabPress,
  onTabDrag,
  actionButtons,
}: {
  routes: BottomTabRoute[];
  activeIndex: number;
  activePosition?: number;
  onTabPress: (index: number) => void;
  onTabDrag?: (position: number) => void;
  actionButtons?: Partial<Record<string, TabActionPair>>;
}) {
  const hidden = useTabBarHidden();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const setTabBarHeight = useSetTabBarHeight();
  const [surfaceHeight, setSurfaceHeight] = useState(BAR_HEIGHT + BAR_BORDER_WIDTH * 2);
  const barWidthRef = useRef(0);
  const pillLeft = useRef(new Animated.Value(0)).current;
  const [pillWidth, setPillWidth] = useState(0);

  // Keep the latest activeIndex/onTabPress available to the PanResponder
  // handlers below without needing to recreate the responder every render.
  const activeIndexRef = useRef(activeIndex);
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const onTabPressRef = useRef(onTabPress);
  useEffect(() => {
    onTabPressRef.current = onTabPress;
  }, [onTabPress]);

  const onTabDragRef = useRef(onTabDrag);
  useEffect(() => {
    onTabDragRef.current = onTabDrag;
  }, [onTabDrag]);

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

  // Publish the bar's footprint, excluding the safe inset that consumers
  // already add. Keep publication and cleanup in one lifecycle so a remount
  // or effect replay cannot leave a visible bar reporting zero height.
  useLayoutEffect(() => {
    setTabBarHeight(hidden ? 0 : surfaceHeight + BAR_BOTTOM_GAP);
    return () => setTabBarHeight(0);
  }, [hidden, surfaceHeight, setTabBarHeight]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (hidden) {
      slideOut();
    } else {
      slideIn();
    }
  }, [hidden]); // eslint-disable-line react-hooks/exhaustive-deps

  const inactiveColor = theme.colors.onBackground + 40;
  const activeTint = colorTreatment(theme.colors.primary, theme.dark, true, theme.colors.elevation.level1);
  const activeColor = activeTint.foregroundColor;

  // Geometry helpers shared by the settle animation and the drag gesture.
  const getTabWidth = useCallback(() => {
    const width = barWidthRef.current;
    if (!width) return 0;
    const innerWidth = Math.max(0, width - PILL_INSET * 2);
    return innerWidth / routes.length;
  }, [routes.length]);

  const getLeftForIndex = useCallback(
    (index: number, tabWidth: number) =>
      PILL_INSET + index * tabWidth + PILL_GAP / 2,
    [],
  );

  // Position-only — safe to run on the native driver now that width isn't coupled to it.
  const updatePill = useCallback(
    (position: number, animated: boolean) => {
      const tabWidth = getTabWidth();
      if (!tabWidth) return;

      const maxPosition = Math.max(0, routes.length - 1);
      const nextPosition = Math.min(maxPosition, Math.max(0, position));
      const nextLeft = getLeftForIndex(nextPosition, tabWidth);

      pillLeft.stopAnimation();

      if (animated) {
        Animated.timing(pillLeft, {
          toValue: nextLeft,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true, // transform-only now, safe to go native
        }).start();
      } else {
        pillLeft.setValue(nextLeft);
      }
    },
    [getLeftForIndex, getTabWidth, pillLeft, routes.length],
  );
  useEffect(() => {
    const nextPosition = activePosition ?? activeIndex;
    const shouldAnimate = Number.isInteger(nextPosition);
    updatePill(nextPosition, shouldAnimate);
  }, [activeIndex, activePosition, updatePill]);

  // ─── Drag-to-select gesture ─────────────────────────────────────────────
  // The pill follows the finger 1:1 while dragging. The tab selection
  // (onTabPress) only fires once the gesture ends, based on whichever tab
  // the pill was released closest to. A simple tap (no meaningful drag)
  // releases over the same tab and is a no-op, same as before.

  const dragBaseLeftRef = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        Math.abs(gesture.dx) > DRAG_ACTIVATION_THRESHOLD,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: () => {
        // Snapshot wherever the pill currently is (it may be mid-animation)
        // so the drag starts from the visible position, not a stale value.
        pillLeft.stopAnimation((value) => {
          dragBaseLeftRef.current = value;
        });
      },

      onPanResponderMove: (_, gesture) => {
        const tabWidth = getTabWidth();
        if (!tabWidth) return;
        const routeCount = routes.length;
        const minLeft = getLeftForIndex(0, tabWidth);
        const maxLeft = getLeftForIndex(routeCount - 1, tabWidth);
        const nextLeft = Math.min(
          maxLeft,
          Math.max(minLeft, dragBaseLeftRef.current + gesture.dx),
        );
        const nextPosition = (nextLeft - minLeft) / tabWidth;
        pillLeft.setValue(nextLeft);
        onTabDragRef.current?.(nextPosition);
      },

      onPanResponderRelease: (_, gesture) => {
        const tabWidth = getTabWidth();
        if (!tabWidth) {
          updatePill(activeIndexRef.current, true);
          return;
        }
        const routeCount = routes.length;
        const minLeft = getLeftForIndex(0, tabWidth);
        const maxLeft = getLeftForIndex(routeCount - 1, tabWidth);
        const finalLeft = Math.min(
          maxLeft,
          Math.max(minLeft, dragBaseLeftRef.current + gesture.dx),
        );
        const rawIndex = Math.round((finalLeft - minLeft) / tabWidth);
        const nextIndex = Math.min(routeCount - 1, Math.max(0, rawIndex));

        // Snap the pill home (to the new index, or back to the current one).
        updatePill(nextIndex, true);
        onTabPressRef.current(nextIndex);
      },

      onPanResponderTerminate: () => {
        updatePill(activeIndexRef.current, true);
        onTabDragRef.current?.(activeIndexRef.current);
      },
    }),
  ).current;

  const activeActions = getActiveActions(routes, activeIndex, actionButtons);

  return (
    <Animated.View
      pointerEvents={hidden ? "none" : "box-none"}
      style={[
        styles.container,
        {
          marginBottom: insets.bottom,
          backgroundColor: theme.colors.background,
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

      <View
        style={styles.tabRow}
        onLayout={(e) => {
          const nextWidth = e.nativeEvent.layout.width;
          if (nextWidth !== barWidthRef.current) {
            barWidthRef.current = nextWidth;
            // Keep width static so the native-driven position never receives a layout animation.
            setPillWidth(Math.max(0, getTabWidth() - PILL_GAP));
            updatePill(activeIndex, false);
          }
        }}
      >
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.activePill,
            {
              backgroundColor: activeTint.backgroundColor,
              borderWidth: 1,
              borderColor: activeTint.borderColor,
              transform: [{ translateX: pillLeft }],
              width: pillWidth,
            },
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
          />
        ))}
      </View>
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
  onTabDrag,
  actionButtons,
}: {
  routes: BottomTabRoute[];
  activeIndex: number;
  activePosition?: number;
  onTabPress: (index: number) => void;
  onTabDrag?: (position: number) => void;
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
      onTabDrag={onTabDrag}
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
