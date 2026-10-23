import React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { NavigationContext } from "@react-navigation/native";
import Animated, {
  LinearTransition,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";

export const motionLayout = LinearTransition.duration(260).reduceMotion(
  ReduceMotion.System,
);
const ReplayOnFocusContext = React.createContext(true);

/** Keep an entrance tied to its mounted route rather than nested navigation focus. */
export function MotionEntranceScope({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReplayOnFocusContext.Provider value={false}>
      {children}
    </ReplayOnFocusContext.Provider>
  );
}
// Paper sheets render above NavigationContainer, so navigation focus is optional.
export function useMotionFocus() {
  const navigation = React.useContext(NavigationContext);
  const subscribe = React.useCallback(
    (changed: () => void) => {
      if (!navigation) return () => {};
      const focus = navigation.addListener("focus", changed);
      const blur = navigation.addListener("blur", changed);
      return () => {
        focus();
        blur();
      };
    },
    [navigation],
  );
  return React.useSyncExternalStore(
    subscribe,
    () => navigation?.isFocused() ?? true,
    () => true,
  );
}
export function useMotionEnabled() {
  const { animationsEnabled } = useAddonPrefs();
  const reduced = useReducedMotion();
  return animationsEnabled && !reduced;
}

/** Native entrance motion; Settings scopes retain the result across nested navigation. */
export function MotionItem({
  children,
  index = 0,
  active = true,
  style,
  animateLayout = true,
  initiallyVisible = false,
}: {
  children: React.ReactNode;
  index?: number;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
  animateLayout?: boolean;
  initiallyVisible?: boolean;
}) {
  const focused = useMotionFocus();
  const enabled = useMotionEnabled();
  const replayOnFocus = React.useContext(ReplayOnFocusContext);
  const entered = React.useRef(initiallyVisible);
  const progress = useSharedValue(enabled && !initiallyVisible ? 0 : 1);
  React.useEffect(() => {
    if (!enabled) {
      progress.value = 1;
      return;
    }
    // Native route transitions own departure. Never fade a mounted Settings
    // page away underneath the push/pop animation.
    if (!focused && !replayOnFocus) return;
    const shown = active && (focused || !replayOnFocus);
    if (shown && entered.current && !replayOnFocus) return;
    entered.current = shown;
    progress.value = withDelay(
      shown ? Math.min(index, 8) * 30 : 0,
      withTiming(shown ? 1 : 0, { duration: shown ? 260 : 140 }),
    );
  }, [active, focused, replayOnFocus, enabled, index, progress]);
  const animated = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 10 }],
  }));
  return (
    <Animated.View
      collapsable={false}
      layout={
        enabled && animateLayout && replayOnFocus ? motionLayout : undefined
      }
      style={[style, animated]}
    >
      {children}
    </Animated.View>
  );
}

/** Keep rows measured while closed so both expansion and collapse animate their full height. */
export function Disclosure({
  open,
  children,
  stagger = 0,
  immediate = false,
}: {
  open: boolean;
  children: React.ReactNode;
  stagger?: number;
  immediate?: boolean;
}) {
  const enabled = useMotionEnabled();
  const [height, setHeight] = React.useState(0);
  const progress = useSharedValue(open ? 1 : 0);
  React.useEffect(() => {
    progress.value = enabled
      ? withDelay(
          immediate ? 0 : open ? stagger : Math.min(stagger + 120, 240),
          withTiming(open ? 1 : 0, { duration: immediate ? 200 : 260 }),
        )
      : open
        ? 1
        : 0;
  }, [open, enabled, progress, stagger, immediate]);
  const frame = useAnimatedStyle(() => ({
    height: height * progress.value,
    opacity: progress.value,
  }));
  return (
    <Animated.View
      style={[{ overflow: "hidden" }, frame]}
      pointerEvents={open ? "auto" : "none"}
      accessibilityElementsHidden={!open}
      importantForAccessibility={open ? "auto" : "no-hide-descendants"}
    >
      <View
        collapsable={false}
        onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
        style={{ position: "absolute", top: 0, left: 0, right: 0 }}
      >
        {React.Children.toArray(children).map((child, index) => (
          <MotionItem
            key={(child as React.ReactElement).key ?? index}
            active={open}
            index={immediate ? 0 : index}
            animateLayout={false}
            initiallyVisible={open}
          >
            {child}
          </MotionItem>
        ))}
      </View>
    </Animated.View>
  );
}
