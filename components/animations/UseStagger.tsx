import { useMotionEnabled, useMotionFocus } from "./Motion";
import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UseStaggerOptions {
  /** Number of items to stagger */
  count: number;
  /** Pass any value that changes when the list data changes — e.g. date string
   *  or transactions.map(t => t.id).join(',')
   *  The stagger replays whenever this value changes. */
  dataKey?: unknown;
  /** ms between each item's animation start. Default: 50 */
  stagger?: number;
  /** ms delay before the first item starts. Default: 0 */
  baseDelay?: number;
  /** Distance to slide from (bottom). Default: 16 */
  distance?: number;
  /** Duration of each item's animation. Default: 350 */
  duration?: number;
  /** Play automatically on mount. Default: true */
  autoPlay?: boolean;
  /** Replay when the item count changes. Default: true */
  replayOnCountChange?: boolean;
  /** Replay when returning to a mounted route. Default: true. */
  replayOnFocus?: boolean;
  /** Keep the initial cards hidden until the surrounding route is placed. */
  ready?: boolean;
}

interface UseStaggerReturn {
  /** Spread onto each item's Animated.View by index */
  getAnimStyle: (index: number) => {
    opacity: Animated.Value;
    transform: { translateY: Animated.Value }[];
  };
  /** Manually re-trigger the stagger */
  play: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStagger({
  count,
  dataKey,
  stagger = 50,
  baseDelay = 0,
  distance = 16,
  duration = 350,
  autoPlay = true,
  replayOnCountChange = true,
  replayOnFocus = true,
  ready = true,
}: UseStaggerOptions): UseStaggerReturn {
  const enabled = useMotionEnabled();
  const focused = useMotionFocus();
  const animation = useRef<Animated.CompositeAnimation | null>(null);
  const opacities = useRef<Animated.Value[]>([]);
  const translates = useRef<Animated.Value[]>([]);
  const previousDataKey = useRef<unknown>(dataKey);
  const previousCount = useRef(count);
  const played = useRef(false);

  // Grow arrays if count increased
  while (opacities.current.length < count) {
    opacities.current.push(new Animated.Value(0));
    translates.current.push(new Animated.Value(distance));
  }

  const syncVisible = () => {
    for (let i = 0; i < count; i++) {
      opacities.current[i].setValue(1);
      translates.current[i].setValue(0);
    }
  };

  function play() {
    animation.current?.stop();
    if (!enabled) {
      syncVisible();
      return;
    }
    for (let i = 0; i < count; i++) {
      opacities.current[i].setValue(0);
      translates.current[i].setValue(distance);
    }

    animation.current = Animated.parallel(
      Array.from({ length: count }, (_, i) => {
        const delay = baseDelay + Math.min(i, 8) * stagger;
        return Animated.parallel([
          Animated.timing(opacities.current[i], {
            toValue: 1,
            duration,
            delay,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(translates.current[i], {
              toValue: 0,
              duration,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
        ]);
      }),
    );
    animation.current.start();
  }

  useEffect(() => {
    if (!enabled || !autoPlay) {
      animation.current?.stop();
      syncVisible();
      return;
    }
    // A native push must not reset or hide the screen beneath it. Returning
    // from an editor also leaves a once-only entrance intact.
    if (!focused || !ready) return;
    const dataKeyChanged = previousDataKey.current !== dataKey;
    const countChanged = previousCount.current !== count;
    previousDataKey.current = dataKey;
    previousCount.current = count;
    if (
      !played.current ||
      dataKeyChanged ||
      (countChanged && replayOnCountChange) ||
      (!countChanged && replayOnFocus)
    ) {
      played.current = true;
      play();
    } else if (countChanged) {
      // Settle the current entrance before exposing new items when count
      // changes are not an entrance trigger.
      animation.current?.stop();
      syncVisible();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    autoPlay,
    count,
    dataKey,
    replayOnCountChange,
    replayOnFocus,
    enabled,
    focused,
    ready,
  ]);

  useEffect(() => () => animation.current?.stop(), []);

  function getAnimStyle(index: number) {
    return {
      opacity: opacities.current[index] ?? new Animated.Value(1),
      transform: [
        { translateY: translates.current[index] ?? new Animated.Value(0) },
      ],
    };
  }

  return { getAnimStyle, play };
}
