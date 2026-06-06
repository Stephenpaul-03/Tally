import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

type From = "top" | "bottom" | "left" | "right";

interface UseFadeSlideOptions {
  /** Which edge the element enters from. Default: "bottom" */
  from?: From;
  /** Travel distance in points. Default: 40 */
  distance?: number;
  /** Entrance duration in ms. Default: 750 */
  duration?: number;
  /** Delay before entrance starts in ms. Default: 0 */
  delay?: number;
  /** Play entrance automatically on mount. Default: true */
  autoPlay?: boolean;
}

interface UseFadeSlideReturn {
  animStyle: {
    opacity: Animated.Value;
    transform:
      | { translateY: Animated.Value }[]
      | { translateX: Animated.Value }[];
  };
  slideIn: (onDone?: () => void) => void;
  slideOut: (onDone?: () => void) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFadeSlide({
  from = "bottom",
  distance = 40,
  duration = 750,
  delay = 0,
  autoPlay = true,
}: UseFadeSlideOptions = {}): UseFadeSlideReturn {
  const { animationsEnabled } = useAddonPrefs();
  const startOffset = offsetFrom(from, distance);

  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(startOffset)).current;

  // Keep latest options accessible inside slideIn/slideOut without stale closure
  const optsRef = useRef({ from, distance, duration, delay });
  useEffect(() => {
    optsRef.current = { from, distance, duration, delay };
  });

  function slideIn(onDone?: () => void) {
    if (!animationsEnabled) {
      opacity.setValue(1);
      translate.setValue(0);
      onDone?.();
      return;
    }

    const { duration, delay } = optsRef.current;

    opacity.setValue(0);
    translate.setValue(startOffset);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      // Animated.spring ignores delay — use Animated.sequence instead
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(translate, {
          toValue: 0,
          duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start(({ finished }) => {
      if (finished) onDone?.();
    });
  }

  function slideOut(onDone?: () => void) {
    if (!animationsEnabled) {
      opacity.setValue(0);
      translate.setValue(startOffset);
      onDone?.();
      return;
    }

    const outDuration = 280;

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: outDuration,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translate, {
        toValue: startOffset,
        duration: outDuration,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onDone?.();
    });
  }

  // autoPlay — runs after first render, slideIn is stable so no stale closure
  useEffect(() => {
    if (animationsEnabled) {
      if (autoPlay) slideIn();
      return;
    }

    opacity.setValue(1);
    translate.setValue(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationsEnabled]);

  const isVertical = from === "top" || from === "bottom";

  return {
    animStyle: {
      opacity,
      transform: isVertical
        ? [{ translateY: translate }]
        : [{ translateX: translate }],
    },
    slideIn,
    slideOut,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Starting offset — element begins off in the `from` direction */
function offsetFrom(from: From, distance: number): number {
  switch (from) {
    case "bottom":
      return distance; // below → slides up
    case "top":
      return -distance; // above → slides down
    case "left":
      return -distance; // left  → slides right
    case "right":
      return distance; // right → slides left
  }
}
