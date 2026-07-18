/* eslint-disable react-hooks/exhaustive-deps */
import { useAppShell, type ShellTab } from "@/components/AppShellContext";
import { useTabBarModePreference } from "@/components/tabbar/TabBarModePreference";
import { UniversalSearchBar } from "@/components/UniversalSearchBar";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Text, useTheme } from "react-native-paper";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

type ActiveTab = "default" | "left" | "right";
type ControlButtonIcon = React.ComponentProps<
  typeof MaterialCommunityIcons
>["name"];

export type GestureControlButtonConfig = {
  label?: string;
  icon: ControlButtonIcon;
  iconColor?: string;
  compact?: boolean;
  featured?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
  badgeCount?: number;
  badgeIcon?: ControlButtonIcon;
  search?: {
    value: string;
    onChangeText: (value: string) => void;
    placeholder?: string;
  };
};

type GestureControlButtons = {
  left?: GestureControlButtonConfig;
  leftMiddle?: GestureControlButtonConfig;
  middle?: GestureControlButtonConfig;
  rightMiddle?: GestureControlButtonConfig;
  right?: GestureControlButtonConfig;
};

type GestureDualCardLayoutViewProps = {
  controlButtons?: GestureControlButtons;
  children: React.ReactNode;
};

const CONTROL_BAR_HEIGHT = 64;
const CARD_RADIUS = 40;
const HANDLE_HEIGHT = 34;
const CONTROL_BAR_SIDE_PADDING = 20;

const LEFT_TAB_TOP_RATIO = 0.1;
const MAIN_TAB_TOP_RATIO = 0.3;
const DEFAULT_INSIGHTS_TAB_TOP_RATIO = 0.77;
const NO_TAB_BAR_INSIGHTS_TAB_TOP_RATIO = 0.85;

// Once the control bar's buttons have fully faded out (see
// controlBarDragOpacity below), the space between the two cards should
// never collapse to a hard seam — this is the floor it eases down to
// instead of 0.
const MIN_CARD_GAP = 10;

// Extra invisible touch area around the handle once a card is expanded,
// so it's still easy to grab even though it's a thin strip.
const HANDLE_HIT_SLOP = { top: 20, bottom: 20, left: 60, right: 60 };

// The decision to open or close is made ONCE, when the finger lifts —
// never mid-drag. Whichever state the card is closer to (as a fraction of
// the distance it travelled) at release time is where it animates to.
// Raise this toward 0.7-0.8 to require dragging further before it
// commits; lower it toward 0.3-0.4 to make it commit more eagerly.
const OPEN_COMMIT_RATIO = 0.5;

// Cards never overlap — bottomHeight is always screenHeight - topHeight -
// controlBarSpace (itself animated, see below), so there's nothing for
// z-index to arbitrate. These are constant and never swapped, unlike a
// layered "which one is on top" approach.
const TOP_CARD_Z_INDEX = 2;
const BOTTOM_CARD_Z_INDEX = 1;

// Used any time the split needs to settle to a resting position (drag
// released without crossing the commit threshold, or a tab-bar tap
// triggering the switch programmatically). Ease-out, no overshoot —
// deliberately not a spring, so there's no bounce.
const SETTLE_CONFIG = {
  duration: 300,
  easing: Easing.out(Easing.cubic),
};
const MOUNT_CARD_CONFIG = {
  duration: 1250,
  easing: Easing.out(Easing.cubic),
};
const MOUNT_BUTTON_CONFIG = {
  duration: 1000,
  easing: Easing.out(Easing.cubic),
};
const SEARCH_MORPH_CONFIG = {
  duration: 520,
  easing: Easing.out(Easing.cubic),
};
// Center button starts fading in once the bottom sheet has slid 80% of the way
// into place. Side buttons wait until the cards are fully settled (100%),
// then run their own fade-in on top.
const SIDE_BUTTON_MOUNT_DELAY = MOUNT_CARD_CONFIG.duration;
const DEFAULT_CONTROL_BUTTONS: Required<GestureControlButtons> = {
  left: {
    label: "Sort",
    icon: "sort-variant",
    onPress: () => {},
  },
  leftMiddle: {
    label: "Filter",
    icon: "filter-outline",
    onPress: () => {},
  },
  middle: {
    label: "Add",
    icon: "plus",
    featured: true,
    onPress: () => {},
  },
  rightMiddle: {
    label: "Search",
    icon: "magnify",
    accessibilityLabel: "Search transactions",
    onPress: () => {},
  },
  right: {
    label: "Collapse",
    icon: "arrow-collapse-vertical",
    onPress: () => {},
  },
};

function clamp(value: number, min: number, max: number) {
  "worklet";
  return Math.min(Math.max(value, min), max);
}

// Shared by bottomCardAnimatedStyle and controlBarAnimatedStyle so the
// two never disagree: the reserved band between the cards keeps a stable
// height while the controls themselves animate in/out.
function getControlBarSpace(
  _topHeight: number,
  _bottomOpenStop: number,
  _defaultStop: number,
  _topOpenStop: number,
) {
  "worklet";
  return CONTROL_BAR_HEIGHT;
}

function getTabProgressFromSplit(
  topHeight: number,
  bottomOpenStop: number,
  defaultStop: number,
  topOpenStop: number,
) {
  "worklet";
  if (topHeight >= defaultStop) {
    const range = topOpenStop - defaultStop;
    return 1 + (range > 0 ? (topHeight - defaultStop) / range : 0);
  }

  const range = defaultStop - bottomOpenStop;
  return range > 0 ? (topHeight - bottomOpenStop) / range : 1;
}

function toTabProgress(activeTab: ActiveTab) {
  "worklet";
  if (activeTab === "left") return 0;
  if (activeTab === "right") return 2;
  return 1;
}

function toShellTab(activeTab: ActiveTab): ShellTab {
  if (activeTab === "left") return "calendar";
  if (activeTab === "right") return "insights";
  return "transactions";
}

function toActiveTab(shellTab: ShellTab): ActiveTab {
  if (shellTab === "calendar") return "left";
  if (shellTab === "insights") return "right";
  return "default";
}

function ControlButton({
  label,
  icon,
  iconColor,
  compact = false,
  featured = false,
  onPress,
  accessibilityLabel,
  disabled,
  badgeCount,
  badgeIcon,
}: {
  label?: string;
  icon: ControlButtonIcon;
  iconColor?: string;
  compact?: boolean;
  featured?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
  badgeCount?: number;
  badgeIcon?: ControlButtonIcon;
}) {
  const theme = useTheme();
  const showBadge = Boolean(badgeIcon || badgeCount);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.controlButton,
        compact ? styles.iconButton : styles.dockButton,
        {
          opacity: disabled ? 0.45 : pressed ? 0.72 : 1,
        },
      ]}
    >
      <View
        style={[
          featured ? styles.featuredIconShell : styles.dockIconShell,
          featured && { backgroundColor: theme.colors.primary },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={featured ? 20 : 20}
          color={
            featured
              ? theme.colors.onPrimary
              : (iconColor ?? theme.colors.primary)
          }
        />
        {showBadge ? (
          <View
            style={[
              styles.controlBadge,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            {badgeIcon ? (
              <MaterialCommunityIcons
                name={badgeIcon}
                size={10}
                color={theme.colors.onPrimary}
              />
            ) : (
              <Text
                numberOfLines={1}
                style={[
                  styles.controlBadgeText,
                  { color: theme.colors.onPrimary },
                ]}
              >
                {badgeCount}
              </Text>
            )}
          </View>
        ) : null}
      </View>
      {label ? (
        <Text
          style={[styles.controlLabel, { color: theme.colors.onSurface }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function GestureDualCardLayoutView({
  controlButtons,
  children,
}: GestureDualCardLayoutViewProps) {
  const theme = useTheme();
  const { tabBarEnabled } = useTabBarModePreference();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const {
    registerDriver,
    registerProgressDriver,
    reportTab,
    reportTabProgress,
    activeTab,
  } = useAppShell();
  const [topAreaContent, bottomCard] = React.Children.toArray(children);
  const initialActiveTab = toActiveTab(activeTab);
  const mountAnimationStartedRef = useRef(false);
  const keyboardVisibleRef = useRef(false);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const insightsTabTopRatio = tabBarEnabled
    ? DEFAULT_INSIGHTS_TAB_TOP_RATIO
    : NO_TAB_BAR_INSIGHTS_TAB_TOP_RATIO;
  const initialScreenHeight = Math.max(1, windowHeight);
  const initialDefaultStop =
    Math.max(1, initialScreenHeight - CONTROL_BAR_HEIGHT) * MAIN_TAB_TOP_RATIO;
  const screenHeight = useSharedValue(initialScreenHeight);
  const searchProgress = useSharedValue(0);

  // Whether each card is currently the "open" tab. Used to decide whether
  // dragging is allowed from anywhere on the card (collapsed) or only from
  // its handle (expanded).
  const topCardOpen = activeTab === "insights";
  const bottomCardOpen = activeTab === "calendar";

  // THE single source of truth for the whole split. Bottom card height is
  // always derived as screenHeight - topHeightValue - controlBarSpace, so
  // the two cards can never both claim the same space — there is nothing
  // for z-index to fight over, and "switching tabs" is just this one
  // value animating from one stop to another. The card that was open
  // shrinks and the card opening grows as the exact same motion, not two
  // independent animations racing each other.
  const topHeightValue = useSharedValue(initialDefaultStop);

  // Snapshot of topHeightValue at the moment a drag begins, so mid-drag
  // math is a simple offset from wherever the split actually is right
  // now (including mid-animation), never from a stale assumption.
  const dragStartHeight = useSharedValue(0);

  const topDragging = useSharedValue(0);
  const bottomDragging = useSharedValue(0);
  const activeTabValue = useSharedValue(
    initialActiveTab === "right" ? 2 : initialActiveTab === "left" ? 1 : 0,
  );
  const bottomMountProgress = useSharedValue(0);
  const leftButtonMountProgress = useSharedValue(0);
  const rightButtonMountProgress = useSharedValue(0);

  const resolvedControlButtons = useMemo(
    () => ({
      left: { ...DEFAULT_CONTROL_BUTTONS.left, ...controlButtons?.left },
      leftMiddle: {
        ...DEFAULT_CONTROL_BUTTONS.leftMiddle,
        ...controlButtons?.leftMiddle,
      },
      middle: { ...DEFAULT_CONTROL_BUTTONS.middle, ...controlButtons?.middle },
      rightMiddle: {
        ...DEFAULT_CONTROL_BUTTONS.rightMiddle,
        ...controlButtons?.rightMiddle,
      },
      right: { ...DEFAULT_CONTROL_BUTTONS.right, ...controlButtons?.right },
    }),
    [controlButtons],
  );

  const palette = useMemo(
    () => ({
      screen: theme.colors.background,
      card: theme.colors.surface,
    }),
    [theme],
  );

  useEffect(() => {
    searchProgress.value = withTiming(searchOpen ? 1 : 0, SEARCH_MORPH_CONFIG);
  }, [searchOpen, searchProgress]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      keyboardVisibleRef.current = true;
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      keyboardVisibleRef.current = false;
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const closeSearch = useCallback(
    (clear = false) => {
      if (clear) {
        resolvedControlButtons.rightMiddle.search?.onChangeText("");
      }
      setSearchOpen(false);
    },
    [resolvedControlButtons.rightMiddle.search],
  );

  useEffect(() => {
    if (activeTab === "insights") {
      closeSearch(true);
    }
  }, [activeTab, closeSearch]);

  // The three stops topHeightValue can rest at. They intentionally map
  // to the requested top/bottom split ratios:
  // left tab 20/80, main tab 40/60, insights tab 88/12.
  const getStops = useCallback(() => {
    "worklet";
    const expandedCardsSpace = screenHeight.value - MIN_CARD_GAP;
    const defaultCardsSpace = screenHeight.value - CONTROL_BAR_HEIGHT;
    return {
      bottomOpenStop: expandedCardsSpace * LEFT_TAB_TOP_RATIO,
      defaultStop: defaultCardsSpace * MAIN_TAB_TOP_RATIO,
      topOpenStop: expandedCardsSpace * insightsTabTopRatio,
    };
  }, [insightsTabTopRatio, screenHeight]);

  const resetShell = useCallback(() => {
    const initialTab = toActiveTab(activeTab);
    const initialTabValue =
      initialTab === "left" ? 1 : initialTab === "right" ? 2 : 0;
    const { bottomOpenStop, defaultStop, topOpenStop } = getStops();
    const initialStop =
      initialTab === "left"
        ? bottomOpenStop
        : initialTab === "right"
          ? topOpenStop
          : defaultStop;

    activeTabValue.value = initialTabValue;
    reportTab(activeTab);
    reportTabProgress(toTabProgress(initialTab));
    topDragging.value = 0;
    bottomDragging.value = 0;
    topHeightValue.value = initialStop;
  }, [
    activeTab,
    activeTabValue,
    bottomDragging,
    getStops,
    reportTab,
    reportTabProgress,
    screenHeight,
    topDragging,
    topHeightValue,
  ]);

  const hasLaidOutRef = useRef(false);

  const handleRootLayout = useCallback(
    (height: number) => {
      if (height <= 0) return; // ignore spurious/zero measurements entirely
      const previousHeight = screenHeight.value;

      if (keyboardVisibleRef.current && previousHeight > 0) {
        return;
      }

      screenHeight.value = height;

      if (!hasLaidOutRef.current) {
        hasLaidOutRef.current = true;
        resetShell();
        setIsLayoutReady(true);
      } else if (Math.abs(previousHeight - height) > 0.5) {
        const { bottomOpenStop, defaultStop, topOpenStop } = getStops();
        const target =
          activeTabValue.value === 1
            ? bottomOpenStop
            : activeTabValue.value === 2
              ? topOpenStop
              : defaultStop;
        cancelAnimation(topHeightValue);
        topHeightValue.value = target;
      }

      if (!mountAnimationStartedRef.current) {
        mountAnimationStartedRef.current = true;
        bottomMountProgress.value = withTiming(1, MOUNT_CARD_CONFIG);
        leftButtonMountProgress.value = withDelay(
          SIDE_BUTTON_MOUNT_DELAY,
          withTiming(1, MOUNT_BUTTON_CONFIG),
        );
        rightButtonMountProgress.value = withDelay(
          SIDE_BUTTON_MOUNT_DELAY,
          withTiming(1, MOUNT_BUTTON_CONFIG),
        );
      }
    },
    [
      bottomMountProgress,
      getStops,
      activeTabValue,
      leftButtonMountProgress,
      resetShell,
      rightButtonMountProgress,
      screenHeight,
      topHeightValue,
    ],
  );

  // Only called from JS (tab-bar tap via registerDriver) — never from
  // inside a gesture worklet. Just animates the one value to its target
  // stop; the shrink and the grow are the same animation, so they're
  // always in lockstep and never race each other.
  const switchToAdjacentTab = useCallback(
    (nextTab: ActiveTab) => {
      const nextTabValue = nextTab === "left" ? 1 : nextTab === "right" ? 2 : 0;
      const { bottomOpenStop, defaultStop, topOpenStop } = getStops();

      activeTabValue.value = nextTabValue;
      reportTab(toShellTab(nextTab));

      cancelAnimation(topHeightValue);
      const target =
        nextTab === "left"
          ? bottomOpenStop
          : nextTab === "right"
            ? topOpenStop
            : defaultStop;
      topHeightValue.value = withTiming(target, SETTLE_CONFIG);
    },
    [activeTabValue, getStops, reportTab, topHeightValue],
  );

  useEffect(() => {
    registerDriver((tab: ShellTab) => {
      switchToAdjacentTab(toActiveTab(tab));
    });

    return () => {
      registerDriver(() => {});
    };
  }, [registerDriver, switchToAdjacentTab]);

  const setSplitFromProgress = useCallback(
    (progress: number) => {
      const { bottomOpenStop, defaultStop, topOpenStop } = getStops();
      const clampedProgress = Math.min(2, Math.max(0, progress));
      cancelAnimation(topHeightValue);

      if (clampedProgress <= 1) {
        topHeightValue.value =
          bottomOpenStop + (defaultStop - bottomOpenStop) * clampedProgress;
        return;
      }

      topHeightValue.value =
        defaultStop + (topOpenStop - defaultStop) * (clampedProgress - 1);
    },
    [getStops, topHeightValue],
  );

  useEffect(() => {
    registerProgressDriver(setSplitFromProgress);

    return () => {
      registerProgressDriver(() => {});
    };
  }, [registerProgressDriver, setSplitFromProgress]);

  function createTopGesture(fullRange = false) {
    return Gesture.Pan()
      .activeOffsetY([-10, 10])
      .failOffsetX([-18, 18])
      .onBegin(() => {
        runOnJS(closeSearch)(true);
        cancelAnimation(topHeightValue);
        dragStartHeight.value = topHeightValue.value;
        topDragging.value = 1;
      })
      .onUpdate((event) => {
        const { bottomOpenStop, defaultStop, topOpenStop } = getStops();
        const minStop = fullRange
          ? bottomOpenStop
          : Math.min(defaultStop, dragStartHeight.value);

        // Card content only opens its own side. Handles can push/pull the
        // split across the full range, so the top handle can also move up
        // toward Calendar and the bottom handle can move down toward Insights.
        topHeightValue.value = clamp(
          dragStartHeight.value + event.translationY,
          minStop,
          topOpenStop,
        );
        runOnJS(reportTabProgress)(
          getTabProgressFromSplit(
            topHeightValue.value,
            bottomOpenStop,
            defaultStop,
            topOpenStop,
          ),
        );
      })
      .onFinalize(() => {
        const { bottomOpenStop, defaultStop, topOpenStop } = getStops();
        const topRange = topOpenStop - defaultStop;
        const bottomRange = defaultStop - bottomOpenStop;
        const topFraction =
          topRange > 0 ? (topHeightValue.value - defaultStop) / topRange : 0;
        const bottomFraction =
          bottomRange > 0
            ? (defaultStop - topHeightValue.value) / bottomRange
            : 0;
        const nextTab =
          topFraction >= OPEN_COMMIT_RATIO
            ? "right"
            : bottomFraction >= OPEN_COMMIT_RATIO
              ? "left"
              : "default";
        const nextTabValue =
          nextTab === "left" ? 1 : nextTab === "right" ? 2 : 0;
        const nextTabProgress = toTabProgress(nextTab);
        const nextShellTab =
          nextTab === "left"
            ? "calendar"
            : nextTab === "right"
              ? "insights"
              : "transactions";
        const target =
          nextTab === "left"
            ? bottomOpenStop
            : nextTab === "right"
              ? topOpenStop
              : defaultStop;

        if (activeTabValue.value !== nextTabValue) {
          activeTabValue.value = nextTabValue;
          runOnJS(reportTab)(nextShellTab);
        }
        runOnJS(reportTabProgress)(nextTabProgress);

        topHeightValue.value = withTiming(target, SETTLE_CONFIG);
        topDragging.value = 0;
      });
  }

  function createBottomGesture(fullRange = false) {
    return Gesture.Pan()
      .activeOffsetY([-10, 10])
      .failOffsetX([-18, 18])
      .onBegin(() => {
        runOnJS(closeSearch)(true);
        cancelAnimation(topHeightValue);
        dragStartHeight.value = topHeightValue.value;
        bottomDragging.value = 1;
      })
      .onUpdate((event) => {
        const { bottomOpenStop, defaultStop, topOpenStop } = getStops();
        const maxStop = fullRange ? topOpenStop : defaultStop;

        // bottomHeight = screenHeight - topHeightValue - controlBarSpace,
        // so growing the bottom card means topHeightValue must DECREASE.
        // Dragging up (translationY negative) should grow/open it, and
        // since topHeightValue moves in the same direction as
        // translationY here (both go down together), we ADD translationY.
        // Card content only opens its own side; handles can push/pull the
        // split across the full range.
        topHeightValue.value = clamp(
          dragStartHeight.value + event.translationY,
          bottomOpenStop,
          maxStop,
        );
        runOnJS(reportTabProgress)(
          getTabProgressFromSplit(
            topHeightValue.value,
            bottomOpenStop,
            defaultStop,
            topOpenStop,
          ),
        );
      })
      .onFinalize(() => {
        const { bottomOpenStop, defaultStop, topOpenStop } = getStops();
        const topRange = topOpenStop - defaultStop;
        const bottomRange = defaultStop - bottomOpenStop;
        const topFraction =
          topRange > 0 ? (topHeightValue.value - defaultStop) / topRange : 0;
        const bottomFraction =
          bottomRange > 0
            ? (defaultStop - topHeightValue.value) / bottomRange
            : 0;
        const nextTab =
          bottomFraction >= OPEN_COMMIT_RATIO
            ? "left"
            : topFraction >= OPEN_COMMIT_RATIO
              ? "right"
              : "default";
        const nextTabValue =
          nextTab === "left" ? 1 : nextTab === "right" ? 2 : 0;
        const nextTabProgress = toTabProgress(nextTab);
        const nextShellTab =
          nextTab === "left"
            ? "calendar"
            : nextTab === "right"
              ? "insights"
              : "transactions";
        const target =
          nextTab === "left"
            ? bottomOpenStop
            : nextTab === "right"
              ? topOpenStop
              : defaultStop;

        if (activeTabValue.value !== nextTabValue) {
          activeTabValue.value = nextTabValue;
          runOnJS(reportTab)(nextShellTab);
        }
        runOnJS(reportTabProgress)(nextTabProgress);

        topHeightValue.value = withTiming(target, SETTLE_CONFIG);
        bottomDragging.value = 0;
      });
  }

  // Collapsed top content can be dragged to open Insights. The bottom card
  // keeps its tab drag on the handle so the transaction list owns vertical
  // scrolling in both directions.
  const topContentGesture = useMemo(
    () => createTopGesture().enabled(!topCardOpen),
    [topCardOpen],
  );
  const bottomContentGesture = useMemo(
    () => createBottomGesture().enabled(false),
    [],
  );
  const bottomHandleGesture = useMemo(
    () =>
      createBottomGesture(true).hitSlop(bottomCardOpen ? HANDLE_HIT_SLOP : {}),
    [bottomCardOpen],
  );

  const topAreaAnimatedStyle = useAnimatedStyle(() => {
    const { bottomOpenStop, defaultStop, topOpenStop } = getStops();
    const fallbackHeight =
      (screenHeight.value - CONTROL_BAR_HEIGHT) * MAIN_TAB_TOP_RATIO;
    const topHeight = topHeightValue.value || fallbackHeight;
    const controlBarSpace = getControlBarSpace(
      topHeight,
      bottomOpenStop,
      defaultStop,
      topOpenStop,
    );

    return {
      height: topHeight + controlBarSpace,
    };
  });

  const topContentFrameStyle = useAnimatedStyle(() => {
    const fallbackHeight =
      (screenHeight.value - CONTROL_BAR_HEIGHT) * MAIN_TAB_TOP_RATIO;
    const topHeight = topHeightValue.value || fallbackHeight;

    return {
      height: topHeight,
    };
  });

  // The bottom card stays pinned to full screen width in every tab. It
  // only animates height and mount translation, so the main tab no
  // longer gets a special horizontal inset.
  const bottomCardAnimatedStyle = useAnimatedStyle(() => {
    const { bottomOpenStop, defaultStop, topOpenStop } = getStops();
    const topHeight = topHeightValue.value || defaultStop;
    const controlBarSpace = getControlBarSpace(
      topHeight,
      bottomOpenStop,
      defaultStop,
      topOpenStop,
    );
    const h = Math.max(0, screenHeight.value - topHeight - controlBarSpace);
    return {
      height: h,
      transform: [
        {
          translateY: interpolate(
            bottomMountProgress.value,
            [0, 1],
            [screenHeight.value, 0],
            "clamp",
          ),
        },
      ],
    };
  });

  // The top card owns its internal collapsed presentation. When the
  // lower card opens, the insights child keeps its summary visible while
  // fading/collapsing only its greeting.
  const topContentStyle = useAnimatedStyle(() => {
    return {};
  });

  // The bottom card still fades out as the top card opens, rather than
  // squashing its list rows into an illegible strip.
  const bottomContentStyle = useAnimatedStyle(() => {
    const { defaultStop, topOpenStop } = getStops();
    const topHeight = topHeightValue.value || defaultStop;
    return {
      opacity: interpolate(
        topHeight,
        [defaultStop, topOpenStop],
        [1, 0],
        "clamp",
      ),
    };
  });

  // Drives the control bar buttons' fade purely off the live split
  // position — NOT off activeTab/reportTab, which only update once a
  // drag commits. This is what makes the buttons fade away smoothly as
  // you drag a card open, and fade back in as you drag it back toward
  // default, rather than popping in/out abruptly at release.
  const controlBarDragOpacity = useDerivedValue(() => {
    const { defaultStop, topOpenStop } = getStops();
    const topHeight = topHeightValue.value || defaultStop;
    if (topHeight >= defaultStop) {
      return interpolate(
        topHeight,
        [defaultStop, topOpenStop],
        [1, 0],
        "clamp",
      );
    }
    return 1;
  });

  const effectiveSearchProgress = useDerivedValue(() => searchProgress.value);

  const searchContentExpanded = searchOpen;

  const dockMountStyle = useAnimatedStyle(() => ({
    opacity:
      leftButtonMountProgress.value *
      rightButtonMountProgress.value *
      controlBarDragOpacity.value,
  }));

  const collapsedDockItemWidth = Math.max(
    0,
    (windowWidth - CONTROL_BAR_SIDE_PADDING * 2) / 5,
  );
  const expandedSearchWidth = Math.max(
    56,
    windowWidth - CONTROL_BAR_SIDE_PADDING * 2,
  );

  const collapsingDockItemStyle = useAnimatedStyle(() => ({
    width: interpolate(
      effectiveSearchProgress.value,
      [0, 1],
      [collapsedDockItemWidth, 0],
      "clamp",
    ),
    opacity: 1 - effectiveSearchProgress.value,
    transform: [
      {
        scale: interpolate(
          effectiveSearchProgress.value,
          [0, 1],
          [1, 0.88],
          "clamp",
        ),
      },
    ],
  }));

  const searchDockItemStyle = useAnimatedStyle(() => ({
    width: interpolate(
      effectiveSearchProgress.value,
      [0, 1],
      [collapsedDockItemWidth, expandedSearchWidth],
      "clamp",
    ),
  }));

  const dockDividerStyle = useAnimatedStyle(() => ({
    opacity: 1 - effectiveSearchProgress.value,
  }));

  // Tracks both the seam position AND the seam's own height (see
  // getControlBarSpace) so the bar's footprint always exactly matches the
  // gap bottomCardAnimatedStyle has carved out for it — no separate
  // "visible vs not" state to fall out of sync with the drag.
  const controlBarAnimatedStyle = useAnimatedStyle(() => {
    const { bottomOpenStop, defaultStop, topOpenStop } = getStops();
    const topHeight = topHeightValue.value || defaultStop;
    return {
      height: getControlBarSpace(
        topHeight,
        bottomOpenStop,
        defaultStop,
        topOpenStop,
      ),
      paddingHorizontal: interpolate(
        effectiveSearchProgress.value,
        [0, 1],
        [CONTROL_BAR_SIDE_PADDING, CONTROL_BAR_SIDE_PADDING],
        "clamp",
      ),
    };
  });

  return (
    <View
      onLayout={(event) => {
        handleRootLayout(event.nativeEvent.layout.height);
      }}
      style={[styles.root, { backgroundColor: palette.screen }]}
    >
      {isLayoutReady ? (
        <Animated.View
          style={[
            styles.topArea,
            {
              zIndex: TOP_CARD_Z_INDEX,
            },
            topAreaAnimatedStyle,
          ]}
        >
          <GestureDetector gesture={topContentGesture}>
            <Animated.View
              style={[
                styles.topContentFrame,
                topContentFrameStyle,
                topContentStyle,
              ]}
            >
              {topAreaContent}
            </Animated.View>
          </GestureDetector>
          <Animated.View
            pointerEvents={activeTab === "insights" ? "none" : "auto"}
            style={[
              styles.controlBar,
              { backgroundColor: palette.screen },
              controlBarAnimatedStyle,
            ]}
          >
            <Animated.View style={[styles.controlDock, dockMountStyle]}>
              <Animated.View
                style={[
                  styles.controlDockDivider,
                  { left: "20%" },
                  dockDividerStyle,
                ]}
              />
              <Animated.View
                style={[
                  styles.controlDockDivider,
                  { left: "40%" },
                  dockDividerStyle,
                ]}
              />
              <Animated.View
                style={[
                  styles.controlDockDivider,
                  { left: "60%" },
                  dockDividerStyle,
                ]}
              />
              <Animated.View
                style={[
                  styles.controlDockDivider,
                  { left: "80%" },
                  dockDividerStyle,
                ]}
              />
              <Animated.View
                pointerEvents={searchContentExpanded ? "none" : "auto"}
                style={[styles.dockItem, collapsingDockItemStyle]}
              >
                <ControlButton {...resolvedControlButtons.left} />
              </Animated.View>
              <Animated.View
                pointerEvents={searchContentExpanded ? "none" : "auto"}
                style={[styles.dockItem, collapsingDockItemStyle]}
              >
                <ControlButton {...resolvedControlButtons.leftMiddle} />
              </Animated.View>
              <Animated.View
                pointerEvents={searchContentExpanded ? "none" : "auto"}
                style={[styles.dockItem, collapsingDockItemStyle]}
              >
                <ControlButton {...resolvedControlButtons.middle} />
              </Animated.View>
              <Animated.View style={[styles.dockItem, searchDockItemStyle]}>
                {resolvedControlButtons.rightMiddle.search &&
                searchContentExpanded ? (
                  <UniversalSearchBar
                    value={resolvedControlButtons.rightMiddle.search.value}
                    onChangeText={
                      resolvedControlButtons.rightMiddle.search.onChangeText
                    }
                    placeholder={
                      resolvedControlButtons.rightMiddle.search.placeholder ??
                      "Search transactions"
                    }
                    bg={theme.colors.surface}
                    iconColor={resolvedControlButtons.rightMiddle.iconColor}
                    autoFocus={searchOpen}
                    containerStyle={styles.searchControl}
                    animation={{
                      expanded: true,
                      onExpandedChange: (expanded) => {
                        if (expanded) {
                          setSearchOpen(true);
                          return;
                        }
                        closeSearch(true);
                      },
                      mode: "center",
                      collapsedWidth: 56,
                      expandedWidth: expandedSearchWidth,
                      externalWidth: true,
                      duration: 80,
                      clearOnCollapse: true,
                    }}
                  />
                ) : (
                  <ControlButton
                    {...resolvedControlButtons.rightMiddle}
                    onPress={() => {
                      resolvedControlButtons.rightMiddle.onPress?.();
                      setSearchOpen(true);
                    }}
                  />
                )}
              </Animated.View>
              <Animated.View
                pointerEvents={searchContentExpanded ? "none" : "auto"}
                style={[styles.dockItem, collapsingDockItemStyle]}
              >
                <ControlButton {...resolvedControlButtons.right} />
              </Animated.View>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      ) : null}

      {isLayoutReady ? (
        <Animated.View
          style={[
            styles.bottomCard,
            {
              backgroundColor: palette.card,
              zIndex: BOTTOM_CARD_Z_INDEX,
            },
            bottomCardAnimatedStyle,
          ]}
        >
          <GestureDetector gesture={bottomHandleGesture}>
            <View style={styles.bottomHandleZone}>
              <View
                style={[
                  styles.handle,
                  { backgroundColor: theme.colors.onSurfaceVariant },
                ]}
              />
            </View>
          </GestureDetector>
          <GestureDetector gesture={bottomContentGesture}>
            <Animated.View style={[styles.cardSlot, bottomContentStyle]}>
              {bottomCard}
            </Animated.View>
          </GestureDetector>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
  },
  controlBar: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  controlButton: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
  },
  controlDock: {
    alignItems: "center",
    backgroundColor: "rgba(28, 29, 31, 0.96)",
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    height: 52,
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  controlDockDivider: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    height: 30,
    position: "absolute",
    top: 11,
    width: StyleSheet.hairlineWidth,
  },
  dockItem: {
    justifyContent: "center",
    height: "100%",
    minWidth: 0,
    overflow: "hidden",
  },
  controlLabel: {
    fontSize: 10,
    lineHeight: 12,
    marginTop: 3,
  },
  dockButton: {
    paddingHorizontal: 2,
  },
  dockIconShell: {
    alignItems: "center",
    height: 22,
    justifyContent: "center",
    position: "relative",
    width: 28,
  },
  featuredIconShell: {
    alignItems: "center",
    borderRadius: 999,
    height: 28,
    justifyContent: "center",
    position: "relative",
    width: 28,
  },
  controlBadge: {
    alignItems: "center",
    borderRadius: 999,
    height: 15,
    justifyContent: "center",
    minWidth: 15,
    paddingHorizontal: 3,
    position: "absolute",
    right: -6,
    top: -6,
  },
  controlBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    lineHeight: 11,
  },
  iconButton: {
    width: 56,
  },
  searchControl: {
    height: 44,
    borderRadius: 100,
    paddingLeft: 14,
    paddingRight: 8,
    width: "100%",
  },
  topContentFrame: {
    minHeight: 0,
  },
  bottomCard: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    overflow: "hidden",
  },
  cardSlot: {
    flex: 1,
    minHeight: 0,
  },
  bottomHandleZone: {
    height: HANDLE_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  handle: {
    width: 46,
    height: 5,
    borderRadius: 999,
    opacity: 0.45,
  },
  kicker: {
    ...typography.editorial.sectionLabel,
    fontSize: 14,
    letterSpacing: 0.8,
    lineHeight: 18,
    textTransform: "uppercase",
  },
  title: {
    ...typography.editorial.hero,
    fontSize: 34,
    lineHeight: 40,
    marginTop: 8,
  },
  caption: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 280,
  },
});
