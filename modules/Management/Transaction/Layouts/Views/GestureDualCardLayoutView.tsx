import { colorTreatment } from "@/theme/colorTreatment";
import { useSpotlightTarget } from "@/modules/Onboarding/SpotlightTour";
/* eslint-disable react-hooks/exhaustive-deps */
import { InsightsExpansionContext } from "@/components/InsightsExpansionContext";
import { ExpandedControlsContext, InsightsHeadingContext, type InsightsHeadingControl, type ExpandedControl } from "@/components/ExpandedControlsContext";
import { useAppShell, type ShellTab } from "@/components/AppShellContext";
import { useTabBarHeight } from "@/components/tabbar/TabBarContext";
import { useTabBarModePreference } from "@/components/tabbar/TabBarModePreference";
import { navigationRef } from "@/navigation/RootNavigation";
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
  TextInput,
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
  runOnUI,
  ReduceMotion,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  topContent?: React.ReactNode;
  suspendLayout?: boolean;
};

const CONTROL_BAR_HEIGHT = 64;
const HOME_INSIGHTS_SHARE = 0.15;
const HANDLE_HEIGHT = 34;
const CONTROL_BAR_SIDE_PADDING = 20;
const APP_HEADER_FALLBACK_HEIGHT = 68;
const TRANSACTION_OPEN_TOP_STOP = 0;
const MIN_SYSTEM_BOTTOM_CLEARANCE = 28;
const CUSTOM_TAB_BAR_BOTTOM_GAP = 0;

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
// triggering the switch programmatically). Ease-in-out, no overshoot —
// deliberately not a spring, so there's no bounce. A pure ease-out here
// made the motion feel lopsided: it jumps to near-full-speed the instant
// the animation starts, then spends the back half of the duration
// crawling the last few percent toward the target. That made shrinking
// the bottom card (transaction -> home) read as sluggish at the tail
// end, and made the header's opacity — which rides this same value —
// flash out almost immediately and then linger barely-visible for the
// rest of the transition (home -> transaction). Easing both ends removes
// the abrupt start, which is what reads as "jarring" / "not smooth".
const SETTLE_CONFIG = {
  duration: 300,
  reduceMotion: ReduceMotion.System,
  easing: Easing.inOut(Easing.cubic),
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

function ExpandedPillButton({ control, expandedWidth }: { control: ExpandedControl; expandedWidth: number }) {
  const targetWidth = control.selected ? expandedWidth : 44;
  const width = useSharedValue(targetWidth);
  useEffect(() => {
    width.value = withTiming(targetWidth, { duration: 200, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System });
  }, [targetWidth, width]);
  const size = useAnimatedStyle(() => ({ width: width.value }));
  return <Animated.View style={[{ height: 44, overflow: "hidden" }, size]}>
    <ControlButton {...control} compact={false} inlineLabel tintSelection={control.group === "views"} label={control.selected ? control.label : undefined} />
  </Animated.View>;
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
  selected,
  inlineLabel = false,
  hideLabel = false,
  tintSelection = false,
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
  selected?: boolean;
  inlineLabel?: boolean;
  hideLabel?: boolean;
  tintSelection?: boolean;
}) {
  const theme = useTheme();
  const showBadge = Boolean(badgeIcon || badgeCount);
  const selectionTint = colorTreatment(theme.colors.primary, theme.dark, true, theme.colors.elevation.level1);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.controlButton,
        compact ? styles.iconButton : styles.dockButton,
        inlineLabel && { flexDirection: "row", gap: 6, paddingHorizontal: 8 },
        {
          opacity: disabled ? 0.45 : pressed ? 0.72 : 1,
          ...(selected ? { backgroundColor: tintSelection ? selectionTint.backgroundColor : theme.colors.primaryContainer, borderRadius: 22,
            ...(tintSelection ? { borderWidth: 1, borderColor: selectionTint.borderColor } : {}) } : {}),
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
      {label && !hideLabel ? (
        <Text
          style={[styles.controlLabel, { color: selected ? theme.colors.onPrimaryContainer : theme.colors.onSurface },
            inlineLabel && { ...typography.bodyMedium, fontSize: 12, lineHeight: 16, marginTop: 0, flexShrink: 1 }]}
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
  topContent,
  suspendLayout = false,
}: GestureDualCardLayoutViewProps) {
  const entryControlsRef = useSpotlightTarget("entry-controls");
  const insightsControlsRef = useSpotlightTarget("insights-controls");
  const theme = useTheme();
  const { tabBarEnabled, hideLabels } = useTabBarModePreference();
  const tabBarHeight = useTabBarHeight();
  // Hiding navigation for an overlay must not change the resting card split.
  // A disabled tab bar still uses the separate tabBarEnabled branch below.
  const lastTabBarHeight = useRef(tabBarHeight);
  if (tabBarHeight > 0) lastTabBarHeight.current = tabBarHeight;
  const layoutTabBarHeight = tabBarHeight || lastTabBarHeight.current;
  const { bottom: safeBottom } = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const {
    registerDriver,
    registerProgressDriver,
    reportTab,
    reportTabProgress,
    activeTab,
  } = useAppShell();
  const bottomCard = children;
  const initialActiveTab = toActiveTab(activeTab);
  const mountAnimationStartedRef = useRef(false);
  const keyboardVisibleRef = useRef(false);
  const searchInputRef = useRef<TextInput>(null);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [headingControl, setHeadingControl] = useState<InsightsHeadingControl | null>(null);
  const [expandedControls, setExpandedControls] = useState<ExpandedControl[]>([]);
  const pendingScreenHeightRef = useRef<number | null>(null);
  const resolvedBottomNavigationClearance = tabBarEnabled
    ? layoutTabBarHeight + safeBottom + CUSTOM_TAB_BAR_BOTTOM_GAP
    : Math.max(safeBottom, MIN_SYSTEM_BOTTOM_CLEARANCE);
  // The handle zone centers the grip between the card edge and tab bar.
  const resolvedBottomClearance =
    resolvedBottomNavigationClearance + HANDLE_HEIGHT;
  const initialScreenHeight = Math.max(1, windowHeight);
  const initialTopOpenStop = Math.max(
    APP_HEADER_FALLBACK_HEIGHT + MIN_CARD_GAP,
    initialScreenHeight - CONTROL_BAR_HEIGHT - resolvedBottomClearance,
  );
  const initialDefaultStop =
    APP_HEADER_FALLBACK_HEIGHT + (initialTopOpenStop - APP_HEADER_FALLBACK_HEIGHT) * HOME_INSIGHTS_SHARE;
  const screenHeight = useSharedValue(initialScreenHeight);
  const topChromeHeight = useSharedValue(APP_HEADER_FALLBACK_HEIGHT);
  const bottomEdgeClearance = useSharedValue(resolvedBottomClearance);
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
  const hasSearchControl = Boolean(resolvedControlButtons.rightMiddle.search);
  const appHeaderTitle = activeTab === "insights" ? "Insights" : "Tally";

  const palette = useMemo(
    () => ({
      screen: theme.colors.background,
      card: theme.colors.surface,
      dock: theme.colors.surface,
    }),
    [theme],
  );

  useEffect(() => {
    searchProgress.value = withTiming(searchOpen ? 1 : 0, SEARCH_MORPH_CONFIG);
  }, [searchOpen, searchProgress]);

  useEffect(() => {
    if (!searchOpen) return;

    const animationFrame = requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [searchOpen]);

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

  const handleOpenSettings = useCallback(() => {
    if (navigationRef.isReady()) {
      navigationRef.navigate("Settings");
    }
  }, []);

  useEffect(() => {
    if (activeTab === "insights") {
      closeSearch(true);
    }
  }, [activeTab, closeSearch]);

  // The three stops topHeightValue can rest at. The extremes are component
  // based: the lower tab starts where the control bar touches the top edge,
  // and Insights leaves only the bottom navigation/system-bar clearance.
  // Home gives Insights one quarter of the space beneath the app header.
  const getStops = useCallback(() => {
    "worklet";
    const topChromeStop = Math.max(1, topChromeHeight.value);
    const bottomOpenStop = TRANSACTION_OPEN_TOP_STOP;
    const topOpenStop = Math.max(
      topChromeStop + MIN_CARD_GAP,
      screenHeight.value - CONTROL_BAR_HEIGHT - bottomEdgeClearance.value,
    );
    const defaultStop = topChromeStop + (topOpenStop - topChromeStop) * HOME_INSIGHTS_SHARE;

    return {
      bottomOpenStop,
      defaultStop,
      topOpenStop,
    };
  }, [bottomEdgeClearance, screenHeight, topChromeHeight]);

  useEffect(() => {
    // Update clearance and read the resulting stops on the same thread.
    // A JS write followed immediately by getStops can read the previous
    // UI-thread clearance when the navigation bar is toggled.
    runOnUI((clearance: number, laidOut: boolean) => {
      bottomEdgeClearance.value = clearance;
      if (!laidOut) return;
      const { bottomOpenStop, defaultStop, topOpenStop } = getStops();
      const target = activeTabValue.value === 1 ? bottomOpenStop
        : activeTabValue.value === 2 ? topOpenStop : defaultStop;
      cancelAnimation(topHeightValue);
      topHeightValue.value = withTiming(target, SETTLE_CONFIG);
    })(resolvedBottomClearance, hasLaidOutRef.current);
  }, [
    activeTabValue,
    bottomEdgeClearance,
    getStops,
    resolvedBottomClearance,
    topHeightValue,
  ]);

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

  const handleTopChromeLayout = useCallback(
    (height: number) => {
      if (height <= 0) return;

      // Layout measurements and their resulting snap target must be read
      // together on the UI thread; a JS write can still expose the old height.
      runOnUI((nextHeight: number, laidOut: boolean) => {
        if (Math.abs(topChromeHeight.value - nextHeight) <= 0.5) return;
        topChromeHeight.value = nextHeight;
        if (!laidOut) return;
        const { bottomOpenStop, defaultStop, topOpenStop } = getStops();
        const target = activeTabValue.value === 1 ? bottomOpenStop
          : activeTabValue.value === 2 ? topOpenStop : defaultStop;
        cancelAnimation(topHeightValue);
        topHeightValue.value = withTiming(target, SETTLE_CONFIG);
      })(Math.max(1, height), hasLaidOutRef.current);
    },
    [activeTabValue, getStops, topChromeHeight, topHeightValue],
  );

  const handleRootLayout = useCallback(
    (height: number) => {
      if (height <= 0) return; // ignore spurious/zero measurements entirely
      if (suspendLayout) {
        pendingScreenHeightRef.current = height;
        return;
      }
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
        topHeightValue.value = withTiming(target, SETTLE_CONFIG);
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
      suspendLayout,
      topHeightValue,
    ],
  );

  useEffect(() => {
    if (suspendLayout || pendingScreenHeightRef.current === null) return;

    const nextHeight = pendingScreenHeightRef.current;
    pendingScreenHeightRef.current = null;
    const previousHeight = screenHeight.value;
    if (Math.abs(previousHeight - nextHeight) <= 0.5) return;

    screenHeight.value = nextHeight;
    const { bottomOpenStop, defaultStop, topOpenStop } = getStops();
    const target =
      activeTabValue.value === 1
        ? bottomOpenStop
        : activeTabValue.value === 2
          ? topOpenStop
          : defaultStop;
    cancelAnimation(topHeightValue);
    topHeightValue.value = withTiming(target, SETTLE_CONFIG);
  }, [
    activeTabValue,
    getStops,
    screenHeight,
    suspendLayout,
    topHeightValue,
  ]);

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
      if (nextTab !== "default") {
        closeSearch(false);
      }

      cancelAnimation(topHeightValue);
      const target =
        nextTab === "left"
          ? bottomOpenStop
          : nextTab === "right"
            ? topOpenStop
            : defaultStop;
      topHeightValue.value = withTiming(target, SETTLE_CONFIG);
    },
    [activeTabValue, closeSearch, getStops, reportTab, topHeightValue],
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
      .onStart(() => {
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
        if (!topDragging.value) return;
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
        if (nextTab !== "default") {
          runOnJS(closeSearch)(false);
        }

        topHeightValue.value = withTiming(target, SETTLE_CONFIG);
        topDragging.value = 0;
      });
  }

  function createBottomGesture(fullRange = false) {
    return Gesture.Pan()
      .activeOffsetY([-10, 10])
      .failOffsetX([-18, 18])
      .onStart(() => {
        cancelAnimation(topHeightValue);
        dragStartHeight.value = topHeightValue.value;
        bottomDragging.value = 1;
      })
      .onUpdate((event) => {
        const { bottomOpenStop, defaultStop, topOpenStop } = getStops();

        // Mirrors the Math.min guard in createTopGesture above. If this
        // drag begins while a previous settle animation is still easing
        // down from above defaultStop (e.g. the top handle was dragged
        // toward Insights and released without crossing the commit
        // threshold), dragStartHeight.value can be > defaultStop on the
        // very first frame of this gesture. Clamping to a hardcoded
        // `defaultStop` ceiling in that case would snap the split down to
        // defaultStop instantly — a visible jump the moment the drag
        // starts, before the finger has even moved. Using
        // Math.max(defaultStop, dragStartHeight.value) keeps the ceiling
        // wherever the split actually was, so the drag continues smoothly
        // from there instead of teleporting.
        const maxStop = fullRange
          ? topOpenStop
          : Math.max(defaultStop, dragStartHeight.value);

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
        if (!bottomDragging.value) return;
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
        if (nextTab !== "default") {
          runOnJS(closeSearch)(false);
        }

        topHeightValue.value = withTiming(target, SETTLE_CONFIG);
        bottomDragging.value = 0;
      });
  }

  // Collapsed top content can be dragged to open Insights. The bottom card
  // keeps its tab drag on the handle so the transaction list owns vertical
  // scrolling in both directions.
  const topContentGesture = useMemo(
    () => createTopGesture().enabled(!topCardOpen && !suspendLayout),
    [suspendLayout, topCardOpen],
  );
  const bottomCardOnMainTab = activeTab === "transactions";
  const bottomContentGesture = useMemo(
    () => createBottomGesture().enabled(bottomCardOnMainTab && !suspendLayout),
    [bottomCardOnMainTab, suspendLayout],
  );
  const bottomHandleGesture = useMemo(
    () =>
      createBottomGesture(true)
        .enabled(!suspendLayout)
        .hitSlop(bottomCardOpen ? HANDLE_HIT_SLOP : {}),
    [bottomCardOpen, suspendLayout],
  );

  const topAreaAnimatedStyle = useAnimatedStyle(() => {
    const { bottomOpenStop, defaultStop, topOpenStop } = getStops();
    const topHeight = topHeightValue.value;
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

  const insightsExpansion = useDerivedValue(() => {
    const { defaultStop, topOpenStop } = getStops();
    return interpolate(topHeightValue.value, [defaultStop, topOpenStop], [0, 1], "clamp");
  });

  const topContentFrameStyle = useAnimatedStyle(() => {
    const topHeight = topHeightValue.value;

    return {
      // Expanded Insights scrolls behind the floating pills. The collapsed
      // Home summary keeps its original height above the transaction controls.
      height: topHeight + CONTROL_BAR_HEIGHT * insightsExpansion.value,
    };
  });

  // The bottom card stays pinned to full screen width in every tab. It
  // only animates height and mount translation, so the main tab no
  // longer gets a special horizontal inset.
  const bottomCardAnimatedStyle = useAnimatedStyle(() => {
    const { bottomOpenStop, defaultStop, topOpenStop } = getStops();
    const topHeight = topHeightValue.value;
    const controlBarSpace = getControlBarSpace(
      topHeight,
      bottomOpenStop,
      defaultStop,
      topOpenStop,
    );
    const h = Math.max(0, screenHeight.value - topHeight - controlBarSpace);
    return {
      bottom: 0,
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
    const { bottomOpenStop, defaultStop } = getStops();
    const topHeight = topHeightValue.value;

    return {
      opacity: interpolate(
        topHeight,
        [bottomOpenStop, defaultStop],
        [0, 1],
        "clamp",
      ),
    };
  });

  // The bottom card still fades out as the top card opens, rather than
  // squashing its list rows into an illegible strip.
  const bottomContentStyle = useAnimatedStyle(() => {
    const { defaultStop, topOpenStop } = getStops();
    const topHeight = topHeightValue.value;
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
    const topHeight = topHeightValue.value;
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

  const effectiveSearchProgress = useDerivedValue(() => {
    return searchProgress.value;
  });
  const showSearchInput = hasSearchControl && searchOpen;

  const dockMountStyle = useAnimatedStyle(() => ({
    opacity:
      leftButtonMountProgress.value *
      rightButtonMountProgress.value *
      controlBarDragOpacity.value,
  }));

  const expandedDockStyle = useAnimatedStyle(() => ({
    opacity: leftButtonMountProgress.value * rightButtonMountProgress.value *
      interpolate(insightsExpansion.value, [0.25, 1], [0, 1], "clamp"),
  }));

  const addControlWidth = hideLabels ? 52 : 88;
  const collapsedDockItemWidth = Math.max(44, Math.min(64,
    (windowWidth - CONTROL_BAR_SIDE_PADDING * 2 - 16 - addControlWidth) / 4,
  ));
  const collapsedSearchWidth = hideLabels ? 52 : collapsedDockItemWidth;
  const expandedSearchWidth = Math.max(
    56,
    windowWidth - CONTROL_BAR_SIDE_PADDING * 2,
  );

  const collapsingDockItemStyle = useAnimatedStyle(() => ({
    width: interpolate(
      effectiveSearchProgress.value,
      [0, 1],
      [collapsedDockItemWidth * 3, 0],
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
      [collapsedSearchWidth, expandedSearchWidth],
      "clamp",
    ),
  }));

  const searchIconSlotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          effectiveSearchProgress.value,
          [0, 1],
          [(collapsedSearchWidth - 34) / 2 - 14, 0],
          "clamp",
        ),
      },
    ],
  }));

  const searchInputAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      effectiveSearchProgress.value,
      [0, 0.62, 1],
      [0, 0, 1],
      "clamp",
    ),
    transform: [
      {
        translateX: interpolate(
          effectiveSearchProgress.value,
          [0, 1],
          [-8, 0],
          "clamp",
        ),
      },
    ],
  }));

  const collapsingAddStyle = useAnimatedStyle(() => ({
    width: interpolate(effectiveSearchProgress.value, [0, 1], [addControlWidth, 0], "clamp"),
    opacity: 1 - effectiveSearchProgress.value,
  }));
  const groupedDockStyle = useAnimatedStyle(() => ({
    gap: interpolate(effectiveSearchProgress.value, [0, 1], [8, 0], "clamp"),
  }));

  // Pin the controls to the bottom of the top area. In expanded Insights
  // the scroll viewport extends underneath this transparent overlay.
  const controlBarAnimatedStyle = useAnimatedStyle(() => {
    const { bottomOpenStop, defaultStop, topOpenStop } = getStops();
    const topHeight = topHeightValue.value;
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
              <View
                style={styles.appHeader}
                onLayout={(event) => {
                  handleTopChromeLayout(event.nativeEvent.layout.height);
                }}
              >
                <Text
                  numberOfLines={1}
                  style={[styles.appName, { color: theme.colors.primary, flex: 1 }]}
                >
                  {appHeaderTitle}
                </Text>
                {headingControl ? <Pressable accessibilityRole="button"
                  accessibilityLabel={`${headingControl.label}. Choose month`}
                  onPress={headingControl.onPress} hitSlop={8}
                  style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 4,
                    minHeight: 44, paddingHorizontal: 6, opacity: pressed ? 0.68 : 1 })}>
                  <Text numberOfLines={1} style={{ ...typography.body, fontSize: 13, color: theme.colors.onSurfaceVariant }}>{headingControl.label}</Text>
                  <MaterialCommunityIcons name="chevron-down" size={16} color={theme.colors.onSurfaceVariant} />
                </Pressable> : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open settings"
                  onPress={handleOpenSettings}
                  hitSlop={10}
                  style={({ pressed }) => [
                    styles.settingsButton,
                    {
                      opacity: pressed ? 0.68 : 1,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="cog-outline"
                    size={22}
                    color={theme.colors.primary}
                  />
                </Pressable>
              </View>
              <InsightsExpansionContext.Provider value={insightsExpansion}>
                <ExpandedControlsContext.Provider value={setExpandedControls}>
                  <InsightsHeadingContext.Provider value={setHeadingControl}>
                    {topContent}
                  </InsightsHeadingContext.Provider>
                </ExpandedControlsContext.Provider>
              </InsightsExpansionContext.Provider>
            </Animated.View>
          </GestureDetector>
          <Animated.View
            pointerEvents="box-none"
            style={[
              styles.controlBar,
              { backgroundColor: "transparent" },
              controlBarAnimatedStyle,
            ]}
          >
            <Animated.View
              pointerEvents={topCardOpen ? "none" : "box-none"}
              accessibilityElementsHidden={topCardOpen}
              importantForAccessibility={topCardOpen ? "no-hide-descendants" : "auto"}
              ref={entryControlsRef}
              collapsable={false}
              style={[styles.groupedDock, groupedDockStyle, dockMountStyle]}
            >
              <Animated.View pointerEvents={searchOpen ? "none" : "auto"}
                accessibilityElementsHidden={searchOpen} importantForAccessibility={searchOpen ? "no-hide-descendants" : "auto"}
                style={[styles.actionPill, { backgroundColor: palette.dock, borderColor: theme.colors.outlineVariant }, collapsingDockItemStyle]}>
                <ControlButton {...resolvedControlButtons.left} hideLabel={hideLabels} />
                <ControlButton {...resolvedControlButtons.leftMiddle} hideLabel={hideLabels} />
                <ControlButton {...resolvedControlButtons.right} hideLabel={hideLabels} />
              </Animated.View>
              <Animated.View style={[styles.actionPill, { backgroundColor: palette.dock, borderColor: theme.colors.outlineVariant }, searchDockItemStyle]}>
                {resolvedControlButtons.rightMiddle.search &&
                showSearchInput ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      resolvedControlButtons.rightMiddle.accessibilityLabel ??
                      "Search transactions"
                    }
                    onPress={() => {
                      resolvedControlButtons.rightMiddle.onPress?.();
                      setSearchOpen(true);
                    }}
                    style={({ pressed }) => [
                      styles.searchControl,
                      { backgroundColor: theme.colors.surface },
                      pressed && { opacity: 0.72 },
                    ]}
                  >
                    <Animated.View
                      style={[
                        styles.searchIconSlot,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.outlineVariant,
                        },
                        searchIconSlotAnimatedStyle,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={resolvedControlButtons.rightMiddle.icon}
                        size={22}
                        color={
                          resolvedControlButtons.rightMiddle.iconColor ??
                          theme.colors.onSurfaceVariant
                        }
                      />
                    </Animated.View>
                    <Animated.View
                      pointerEvents={searchOpen ? "auto" : "none"}
                      style={[styles.searchInputWrap, searchInputAnimatedStyle]}
                    >
                      <TextInput
                        ref={searchInputRef}
                        value={resolvedControlButtons.rightMiddle.search.value}
                        onChangeText={
                          resolvedControlButtons.rightMiddle.search.onChangeText
                        }
                        placeholder={
                          resolvedControlButtons.rightMiddle.search
                            .placeholder ?? "Search transactions"
                        }
                        placeholderTextColor={theme.colors.onSurfaceVariant}
                        underlineColorAndroid="transparent"
                        onBlur={() => setSearchOpen(false)}
                        style={[
                          styles.searchInput,
                          { color: theme.colors.onSurface },
                        ]}
                      />
                    </Animated.View>
                  </Pressable>
                ) : (
                  <ControlButton
                    {...resolvedControlButtons.rightMiddle}
                    hideLabel={hideLabels}
                    onPress={() => {
                      resolvedControlButtons.rightMiddle.onPress?.();
                      setSearchOpen(true);
                    }}
                  />
                )}
              </Animated.View>
              <Animated.View pointerEvents={searchOpen ? "none" : "auto"}
                accessibilityElementsHidden={searchOpen} importantForAccessibility={searchOpen ? "no-hide-descendants" : "auto"}
                style={[{ height: 52, borderRadius: 26, overflow: "hidden" }, collapsingAddStyle]}>
                <Pressable accessibilityRole="button"
                  accessibilityLabel={resolvedControlButtons.middle.accessibilityLabel ?? "Add transaction"}
                  disabled={resolvedControlButtons.middle.disabled}
                  onPress={resolvedControlButtons.middle.onPress}
                  style={({ pressed }) => ({ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
                    gap: 6, paddingHorizontal: 12, borderRadius: 26, backgroundColor: theme.colors.primary,
                    opacity: resolvedControlButtons.middle.disabled ? 0.45 : pressed ? 0.72 : 1 })}>
                  <MaterialCommunityIcons name={resolvedControlButtons.middle.icon} size={20} color={theme.colors.onPrimary} />
                  {!hideLabels ? <Text numberOfLines={1} style={{ ...typography.editorial.sectionLabel, fontSize: 18, lineHeight: 22, color: theme.colors.onPrimary }}>
                    {resolvedControlButtons.middle.label ?? "Add"}
                  </Text> : null}
                </Pressable>
              </Animated.View>
            </Animated.View>
            <Animated.View
              pointerEvents={topCardOpen ? "box-none" : "none"}
              accessibilityElementsHidden={!topCardOpen}
              importantForAccessibility={topCardOpen ? "auto" : "no-hide-descendants"}
              ref={insightsControlsRef}
              collapsable={false}
              style={[styles.expandedDock, { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, height: 52 }, expandedDockStyle]}
            >
              {[...new Set(expandedControls.map(control => control.group ?? "default"))].map(group =>
                <View key={group} style={{ flexDirection: "row", alignItems: "center", height: 48,
                  borderRadius: 24, padding: 2, backgroundColor: palette.dock,
                  borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.outlineVariant }}>
                  {expandedControls.filter(control => (control.group ?? "default") === group).map(control =>
                    <ExpandedPillButton key={control.label} control={control}
                      expandedWidth={Math.min(132, Math.max(80, windowWidth - CONTROL_BAR_SIDE_PADDING * 2 - 66 - (expandedControls.length - 2) * 44))} />)}
                </View>)}
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
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
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
  groupedDock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 52,
  },
  actionPill: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  controlDock: {
    alignItems: "center",
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    height: 52,
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  expandedDock: {
    position: "absolute",
    left: CONTROL_BAR_SIDE_PADDING,
    right: CONTROL_BAR_SIDE_PADDING,
    width: undefined,
  },
  controlDockDivider: {
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
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    height: 44,
    borderRadius: 100,
    paddingLeft: 14,
    paddingRight: 8,
    width: "100%",
  },
  searchIconSlot: {
    alignItems: "center",
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
  },
  searchInputWrap: {
    flex: 1,
    minWidth: 0,
  },
  topContentFrame: {
    minHeight: 0,
  },
  appHeader: {
    // Preserve the full header even while the Transactions tab clips it.
    minHeight: 62,
    flexShrink: 0,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  appName: {
    ...typography.editorial.hero,
    fontSize: 24,
    lineHeight: 30,
  },
  settingsButton: {
    alignItems: "center",
    borderRadius: 14,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  bottomCard: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
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
    width: 42,
    height: 4,
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
