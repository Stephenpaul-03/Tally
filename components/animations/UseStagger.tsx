import { useAddonPrefs } from "@/hooks/use-addon-prefs";
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
}: UseStaggerOptions): UseStaggerReturn {
  const { animationsEnabled } = useAddonPrefs();
  const opacities = useRef<Animated.Value[]>([]);
  const translates = useRef<Animated.Value[]>([]);
  const previousDataKey = useRef<unknown>(dataKey);
  const previousCount = useRef(count);

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
    if (!animationsEnabled) {
      for (let i = 0; i < count; i++) {
        opacities.current[i].setValue(1);
        translates.current[i].setValue(0);
      }
      return;
    }

    for (let i = 0; i < count; i++) {
      opacities.current[i].setValue(0);
      translates.current[i].setValue(distance);
    }

    Animated.parallel(
      Array.from({ length: count }, (_, i) => {
        const delay = baseDelay + i * stagger;
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
    ).start();
  }

  // Replay whenever dataKey changes (covers same-count data changes)
  // or count changes (covers list growing/shrinking)
  useEffect(() => {
    if (animationsEnabled) {
      const dataKeyChanged = previousDataKey.current !== dataKey;
      const countChanged = previousCount.current !== count;

      if (dataKeyChanged) {
        previousDataKey.current = dataKey;
        previousCount.current = count;
        if (autoPlay) play();
        return;
      }

      previousCount.current = count;

      if (countChanged && !replayOnCountChange) {
        syncVisible();
        return;
      }

      if (autoPlay) play();
      return;
    }

    syncVisible();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationsEnabled, autoPlay, count, dataKey, replayOnCountChange]);

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
