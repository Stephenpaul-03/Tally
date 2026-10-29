import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle, type TextStyle } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { useTheme } from "react-native-paper";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { DesignText, resolveDesignTextStyle } from "@/components/DesignText";
import { MainEntrance, MainEntranceTimeScale } from "@/components/animations/MainEntrance";
import { useMotionEnabled, useMotionFocus } from "@/components/animations/Motion";
import { HOME_CONTENT_START, HOME_GLYPH_DURATION, homeTextTiming } from "./homeTextTiming";

/** Each glyph reads one shared UI-thread clock; no per-character focus/effect work. */
function Glyph({ clock, start, children, style }: {
  clock: SharedValue<number>;
  start: number;
  children: string;
  style: StyleProp<TextStyle>;
}) {
  const motion = useAnimatedStyle(() => {
    const fraction = Math.max(0, Math.min(1, (clock.value - start) / HOME_GLYPH_DURATION));
    const eased = 1 - Math.pow(1 - fraction, 3);
    return { opacity: eased, transform: [{ translateY: (1 - eased) * 6 }] };
  });
  return <Animated.Text style={[style, motion]}>{children}</Animated.Text>;
}

/** Measure first, then reveal fixed-position glyphs without resizing during motion. */
export function HomeText({ delay = 0, amount = false, characterReveal = false, whole = false, style, ...props }:
  React.ComponentProps<typeof DesignText> & { delay?: number; amount?: boolean; characterReveal?: boolean; whole?: boolean }) {
  const theme = useTheme<ExtendedMD3Theme>();
  const flat = StyleSheet.flatten(style);
  const { flex, flexShrink, minWidth, alignSelf, ...textStyle } = flat ?? {};
  const frame: StyleProp<ViewStyle> = { flex, flexShrink, minWidth, alignSelf };
  const glyphStyle: StyleProp<TextStyle> = [theme.fonts[props.variant ?? "default"], resolveDesignTextStyle(theme, textStyle, props.variant)];
  const text = React.Children.toArray(props.children).join("");
  const glyphs = !whole && (amount || characterReveal || /\d/.test(text));
  const revealAll = amount || characterReveal || /^[\s\p{Sc}0-9.,+−-]+$/u.test(text);
  const timing = React.useMemo(() => homeTextTiming(text, revealAll, delay), [text, revealAll, delay]);
  const [availableWidth, setAvailableWidth] = React.useState(0);
  const [naturalWidth, setNaturalWidth] = React.useState(0);
  const focused = useMotionFocus();
  const enabled = useMotionEnabled();
  const timeScale = React.useContext(MainEntranceTimeScale);
  const clock = useSharedValue(enabled ? 0 : timing.duration);
  const previous = React.useRef<string | null>(null);
  const initialDone = React.useRef(false);
  const markInitialDone = React.useCallback(() => { initialDone.current = true; }, []);
  const ready = availableWidth > 0 && naturalWidth > 0;
  React.useLayoutEffect(() => {
    if (!glyphs) return;
    if (!enabled || (!focused && previous.current !== null)) {
      cancelAnimation(clock);
      clock.value = timing.duration;
      previous.current = text;
      initialDone.current = true;
      return;
    }
    if (!focused || !ready || previous.current === text) return;
    const initial = !initialDone.current;
    previous.current = text;
    cancelAnimation(clock);
    clock.value = 0;
    clock.value = withDelay(
      (initial ? HOME_CONTENT_START : 0) * timeScale,
      withTiming(timing.duration, { duration: timing.duration * timeScale, easing: Easing.linear }, (finished) => {
        if (finished) runOnJS(markInitialDone)();
      }),
    );
  }, [glyphs, enabled, focused, ready, text, timing.duration, clock, timeScale, markInitialDone]);
  const scale = ready ? Math.min(1, availableWidth / naturalWidth) : 1;
  const right = textStyle.textAlign === "right";
  if (glyphs) return (
    <View accessible accessibilityRole="text" accessibilityLabel={props.accessibilityLabel ?? text}
      style={frame} onLayout={(event) => setAvailableWidth(event.nativeEvent.layout.width)}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <DesignText {...props} style={[textStyle, { opacity: 0 }]} />
      </View>
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
        onLayout={(event) => setNaturalWidth(event.nativeEvent.layout.width)}
        style={{ position: "absolute", top: 0, bottom: 0, ...(right ? { right: 0 } : { left: 0 }),
          flexDirection: "row", alignItems: "center", opacity: ready ? 1 : 0,
          transformOrigin: right ? "right center" : "left center", transform: [{ scale }] }}>
        {timing.units.map((unit, index) => (
          <Glyph key={index} clock={clock} start={unit.start} style={glyphStyle}>
            {unit.text}
          </Glyph>
        ))}
      </View>
    </View>
  );
  return (
    <MainEntrance delay={HOME_CONTENT_START + delay} duration={160} replayKey={text} distance={3} style={frame}>
      <DesignText {...props} style={textStyle} />
    </MainEntrance>
  );
}

export function HomeDateText(props: React.ComponentProps<typeof DesignText>) {
  return <HomeText {...props} whole />;
}
