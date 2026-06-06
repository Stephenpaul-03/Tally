import {
  EdgeButtons,
  useSetTabBarHeight,
  useTabBarEdgeButton,
  useTabBarHidden,
} from "@/components/tabbar/TabBarContext";
import { useFadeSlide } from "../animations/UseFadeSlide";
import React, { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  View,
  useWindowDimensions,
} from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EdgeButton } from "./molecules/edgebutton";
import { TabButton } from "./molecules/tabbutton";
import { styles } from "./styles";
import type { FloatingTabRoute } from "./types";
import {
  BAR_BOTTOM_OFFSET,
  BAR_HEIGHT,
  BAR_PADDING,
  DRAG_THRESHOLD,
  EDGE_MARGIN,
  PILL_INSET,
  TAB_SLOT,
} from "./types";

export type { FloatingTabRoute };

export function FloatingTabBar({
  routes,
  activeIndex,
  onTabPress,
  edgeButtons: edgeButtonsProp,
}: {
  routes: FloatingTabRoute[];
  activeIndex: number;
  onTabPress: (index: number) => void;
  edgeButtons?: EdgeButtons | null;
}) {
  const hidden = useTabBarHidden();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const setTabBarHeight = useSetTabBarHeight();
  const surfaceHeightRef = useRef(0);

  const edgeButtonsFromContext = useTabBarEdgeButton();
  const edgeButtons = edgeButtonsFromContext ?? edgeButtonsProp;

  // ── Entrance / hide-show animation ──────────────────────────────────────────
  const { animStyle, slideIn, slideOut } = useFadeSlide({
    from: "bottom",
    distance: 100,
    duration: 750,
  });

  // ── Layout ──────────────────────────────────────────────────────────────────
  const barWidth = Math.min(
    width - EDGE_MARGIN * 2,
    routes.length * TAB_SLOT + BAR_PADDING * 2,
  );
  const tabWidth = (barWidth - BAR_PADDING * 2) / routes.length;
  const pillSize = BAR_HEIGHT - PILL_INSET * 2;

  const pillTargetX = useCallback(
    (index: number) =>
      BAR_PADDING + index * tabWidth + tabWidth / 2 - pillSize / 2,
    [pillSize, tabWidth],
  );

  const pillX = useRef(new Animated.Value(pillTargetX(activeIndex))).current;
  const isDragging = useRef(false);

  // ── Mutable refs ────────────────────────────────────────────────────────────
  const activeIndexRef = useRef(activeIndex);
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const routesLengthRef = useRef(routes.length);
  useEffect(() => {
    routesLengthRef.current = routes.length;
  }, [routes.length]);

  const pillTargetXRef = useRef(pillTargetX);
  useEffect(() => {
    pillTargetXRef.current = pillTargetX;
  }, [pillTargetX]);

  const onTabPressRef = useRef(onTabPress);
  useEffect(() => {
    onTabPressRef.current = onTabPress;
  }, [onTabPress]);

  // ── Snap helpers ────────────────────────────────────────────────────────────
  const snapPillToIndex = useCallback(
    (index: number, animated = true) => {
      if (animated) {
        Animated.spring(pillX, {
          toValue: pillTargetX(index),
          damping: 22,
          stiffness: 220,
          useNativeDriver: true,
        }).start();
      } else {
        pillX.setValue(pillTargetX(index));
      }
    },
    [pillTargetX, pillX],
  );

  const snapPillToIndexRef = useRef(snapPillToIndex);
  useEffect(() => {
    snapPillToIndexRef.current = snapPillToIndex;
  }, [snapPillToIndex]);

  const nearestIndex = useCallback(
    (x: number) => {
      let best = 0;
      let bestDist = Infinity;
      routes.forEach((_, i) => {
        const dist = Math.abs(x - pillTargetX(i));
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      return best;
    },
    [routes, pillTargetX],
  );

  const nearestIndexRef = useRef(nearestIndex);
  useEffect(() => {
    nearestIndexRef.current = nearestIndex;
  }, [nearestIndex]);

  const dragOriginPillXRef = useRef(0);
  const dragHoveredIndexRef = useRef(activeIndex);

  useEffect(() => {
    if (!isDragging.current) {
      dragHoveredIndexRef.current = activeIndex;
      snapPillToIndex(activeIndex);
    }
  }, [activeIndex, snapPillToIndex]);

  // ── PanResponder ────────────────────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (
        _: GestureResponderEvent,
        gesture: PanResponderGestureState,
      ) => Math.abs(gesture.dx) > DRAG_THRESHOLD,
      onMoveShouldSetPanResponderCapture: (
        _: GestureResponderEvent,
        gesture: PanResponderGestureState,
      ) => Math.abs(gesture.dx) > DRAG_THRESHOLD,
      onPanResponderGrant: () => {
        isDragging.current = true;
        pillX.stopAnimation();
        dragOriginPillXRef.current = (pillX as any)._value;
        dragHoveredIndexRef.current = activeIndexRef.current;
      },
      onPanResponderMove: (
        _: GestureResponderEvent,
        gesture: PanResponderGestureState,
      ) => {
        const ptx = pillTargetXRef.current;
        const minX = ptx(0);
        const maxX = ptx(routesLengthRef.current - 1);
        const next = Math.min(
          maxX,
          Math.max(minX, dragOriginPillXRef.current + gesture.dx),
        );
        pillX.setValue(next);
        const hovered = nearestIndexRef.current(next);
        if (hovered !== dragHoveredIndexRef.current) {
          dragHoveredIndexRef.current = hovered;
          onTabPressRef.current(hovered);
        }
      },
      onPanResponderRelease: (
        _: GestureResponderEvent,
        gesture: PanResponderGestureState,
      ) => {
        isDragging.current = false;
        const ptx = pillTargetXRef.current;
        const minX = ptx(0);
        const maxX = ptx(routesLengthRef.current - 1);
        const rawX = Math.min(
          maxX,
          Math.max(minX, dragOriginPillXRef.current + gesture.dx),
        );
        const snappedIndex = nearestIndexRef.current(rawX);
        snapPillToIndexRef.current(snappedIndex);
        if (snappedIndex !== dragHoveredIndexRef.current) {
          onTabPressRef.current(snappedIndex);
        }
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
        snapPillToIndexRef.current(activeIndexRef.current);
      },
    }),
  ).current;

  // ── Theme ───────────────────────────────────────────────────────────────────
  const bottomPad = insets.bottom;
  const activeColor = theme.colors.onPrimary;
  const inactiveColor = theme.colors.onSurfaceVariant;
  const surfaceBg = theme.colors.elevation.level2;
  const borderColor = theme.colors.outlineVariant;
  const pillBg = theme.colors.primary;

  const publishHeight = useCallback(
    (surfaceHeight: number) => {
      setTabBarHeight(surfaceHeight + bottomPad + BAR_BOTTOM_OFFSET);
    },
    [bottomPad, setTabBarHeight],
  );

  useEffect(() => {
    publishHeight(surfaceHeightRef.current);
  }, [publishHeight]);

  useEffect(() => {
    return () => setTabBarHeight(0);
  }, [setTabBarHeight]);

  // ── Hide / show ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (hidden) {
      slideOut(() => setTabBarHeight(0));
    } else {
      slideIn();
      publishHeight(surfaceHeightRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidden]);

  const sharedEdgeProps = {
    bottomPad,
    bottomOffset: BAR_BOTTOM_OFFSET,
    show: !hidden,
    surfaceBg,
    borderColor,
    primaryColor: pillBg,
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.floatingWrap,
        { paddingBottom: bottomPad + BAR_BOTTOM_OFFSET },
      ]}
    >
      <EdgeButton
        side="left"
        config={edgeButtons?.left ?? null}
        {...sharedEdgeProps}
        show={Boolean(edgeButtons?.left) && !hidden}
      />
      <EdgeButton
        side="right"
        config={edgeButtons?.right ?? null}
        {...sharedEdgeProps}
        show={Boolean(edgeButtons?.right) && !hidden}
      />

      <Animated.View
        pointerEvents={hidden ? "none" : "box-none"}
        style={{
          transform: animStyle.transform,
          opacity: animStyle.opacity,
        }}
      >
        <View
          {...panResponder.panHandlers}
          onLayout={(e) => {
            const next = e.nativeEvent.layout.height;
            if (next === surfaceHeightRef.current) return;
            surfaceHeightRef.current = next;
            if (!hidden) publishHeight(next);
          }}
          style={[
            styles.surface,
            {
              width: barWidth,
              backgroundColor: surfaceBg,
              borderColor,
            },
          ]}
        >
          {/* Pill */}
          <Animated.View
            style={{
              position: "absolute",
              top: PILL_INSET,
              width: pillSize,
              height: pillSize,
              borderRadius: pillSize / 2,
              backgroundColor: pillBg,
              transform: [{ translateX: pillX }],
            }}
          />

          {/* Icons */}
          <View style={styles.tabRowClip}>
            <View
              style={{
                flexDirection: "row",
                paddingHorizontal: BAR_PADDING,
                height: BAR_HEIGHT,
                alignItems: "center",
              }}
            >
              {routes.map((route, index) => (
                <TabButton
                  key={route.key}
                  route={route}
                  focused={index === activeIndex}
                  onPress={() => onTabPress(index)}
                  tabWidth={tabWidth}
                  activeColor={activeColor}
                  inactiveColor={inactiveColor}
                />
              ))}
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}