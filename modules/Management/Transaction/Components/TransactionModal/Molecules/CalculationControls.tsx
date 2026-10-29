import React from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "react-native-paper";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { DesignText as Text } from "@/components/DesignText";
import { categoryTone } from "@/theme/sage";
import { useMotionEnabled } from "@/components/animations/Motion";
import type { Operation } from "../calculatorSession";
const OPERATIONS: Operation[] = ["+", "−", "×", "÷"];
const SEEDS = ["#226A2B", "#BA1A1A", "#7950B5", "#006A80"];
const LABELS = ["Add", "Subtract", "Multiply", "Divide"];
const SLOT = 44;
export function CalculationControls({
  open,
  operation,
  onToggle,
  onOperation,
  onClear,
  onEquals,
}: {
  open: boolean;
  operation: Operation | null;
  onToggle: () => void;
  onOperation: (operation: Operation) => void;
  onClear: () => void;
  onEquals: () => void;
}) {
  const { colors: c, dark } = useTheme();
  const motion = useMotionEnabled();
  const expansion = useSharedValue(open ? 1 : 0);
  React.useEffect(() => {
    expansion.value = withTiming(open ? 1 : 0, { duration: motion ? 220 : 0, easing: Easing.out(Easing.cubic) });
  }, [open, motion, expansion]);
  const frame = useAnimatedStyle(() => ({ width: 44 + 288 * expansion.value }));
  const compact = useAnimatedStyle(() => ({ opacity: Math.max(0, 1 - expansion.value * 2) }));
  const expanded = useAnimatedStyle(() => ({ opacity: expansion.value }));
  const selected = operation ? OPERATIONS.indexOf(operation) : 0;
  const position = useSharedValue(selected),
    start = useSharedValue(selected),
    dragging = useSharedValue(false);
  React.useEffect(() => {
    if (!dragging.value)
      position.value = withTiming(selected, { duration: motion ? 160 : 0 });
  }, [selected, motion, position, dragging]);
  const tones = SEEDS.map((seed) => categoryTone("", dark, seed));
  const track = useAnimatedStyle(() => ({
    transform: [{ translateX: position.value * SLOT }],
    backgroundColor: interpolateColor(
      position.value,
      [0, 1, 2, 3],
      tones.map((t) => t[0]),
    ),
  }));
  const select = (index: number) => onOperation(OPERATIONS[index]);
  const pan = Gesture.Pan()
    .activeOffsetX([-5, 5])
    .failOffsetY([-12, 12])
    .onStart(() => {
      cancelAnimation(position);
      start.value = position.value;
      dragging.value = true;
    })
    .onUpdate((e) => {
      position.value = Math.max(
        0,
        Math.min(3, start.value + e.translationX / SLOT),
      );
    })
    .onEnd(() => {
      dragging.value = false;
      const next = Math.round(position.value);
      position.value = withTiming(next, { duration: motion ? 150 : 0 });
      runOnJS(select)(next);
    })
    .onFinalize(() => {
      if (dragging.value) {
        dragging.value = false;
        position.value = withTiming(selected, { duration: motion ? 150 : 0 });
      }
    });
  const auxiliary = (
    label: string,
    content: React.ReactNode,
    onPress: () => void,
    seed: string,
  ) => {
    const [background] = categoryTone("", dark, seed);
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => ({
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: background,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        {content}
      </Pressable>
    );
  };
  return (
    <View style={{ alignItems: "center", height: 50 }}>
      <Animated.View style={[{ height: 50, borderRadius: 25, overflow: "hidden" }, frame]}>
        <Animated.View pointerEvents={open ? "none" : "auto"}
          accessibilityElementsHidden={open} importantForAccessibility={open ? "no-hide-descendants" : "auto"}
          style={[{ position: "absolute", top: 3, left: 0, width: 44 }, compact]}>
          {auxiliary("Open calculator", <Icon name="calculator-variant-outline" size={21} color={c.primary} />, onToggle, "#64748B")}
        </Animated.View>
        <Animated.View pointerEvents={open ? "auto" : "none"}
          accessibilityElementsHidden={!open} importantForAccessibility={!open ? "no-hide-descendants" : "auto"}
          style={[{ position: "absolute", top: 0, left: 0, width: 332, height: 50, flexDirection: "row", alignItems: "center", gap: 6 }, expanded]}>
          <GestureDetector gesture={pan}>
            <View
              accessibilityRole="tablist"
              style={{
                flexDirection: "row",
                padding: 3,
                borderRadius: 25,
                backgroundColor: c.surfaceVariant,
              }}
            >
              <Animated.View
                pointerEvents="none"
                style={[
                  {
                    position: "absolute",
                    left: 3,
                    top: 3,
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    opacity: operation ? 1 : 0.4,
                  },
                  track,
                ]}
              />
              {OPERATIONS.map((op, index) => (
                <Pressable
                  key={op}
                  accessibilityRole="tab"
                  accessibilityLabel={LABELS[index]}
                  accessibilityState={{ selected: operation === op }}
                  onPress={() => onOperation(op)}
                  style={{
                    width: 44,
                    height: 44,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 23,
                      fontWeight: "800",
                      color: tones[index][1],
                    }}
                  >
                    {op}
                  </Text>
                </Pressable>
              ))}
            </View>
          </GestureDetector>
          {auxiliary(
            "Clear calculation",
            <Text
              style={{
                fontSize: 16,
                fontWeight: "800",
                color: categoryTone("", dark, "#B45309")[1],
              }}
            >
              C
            </Text>,
            onClear,
            "#B45309",
          )}
          {auxiliary(
            "Use calculated amount",
            <Text
              style={{
                fontSize: 25,
                fontWeight: "800",
                color: categoryTone("", dark, "#0F766E")[1],
              }}
            >
              =
            </Text>,
            onEquals,
            "#0F766E",
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close calculator"
            onPress={onToggle}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="chevron-down" size={19} color={c.onSurfaceVariant} />
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
