import React from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "react-native-paper";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useMotionEnabled } from "@/components/animations/Motion";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { DesignText as Text } from "@/components/DesignText";
import { categoryTone } from "@/theme/sage";
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedIcon = Animated.createAnimatedComponent(Icon);
const SHIFT = 44;

export function ActivityTypeToggle({
  value,
  onChange,
  pagePan,
}: {
  value: "income" | "expense";
  onChange: (type: "income" | "expense") => void;
  pagePan?: ReturnType<typeof Gesture.Pan>;
}) {
  const { colors: c, dark } = useTheme();
  const enabled = useMotionEnabled();
  const progress = useSharedValue(value === "income" ? 1 : 0);
  const start = useSharedValue(0);
  const dragging = useSharedValue(false);
  const [expenseBackground, expenseForeground] = categoryTone(
    "",
    dark,
    "#BA1A1A",
  );
  const [incomeBackground, incomeForeground] = categoryTone(
    "",
    dark,
    "#226A2B",
  );
  React.useEffect(() => {
    progress.value = withTiming(value === "income" ? 1 : 0, {
      duration: enabled ? 160 : 0,
    });
  }, [value, enabled, progress]);
  const select = (next: number) => onChange(next ? "income" : "expense");
  const pan = Gesture.Pan()
    .activeOffsetX([-6, 6])
    .failOffsetY([-14, 14])
    .onStart(() => {
      cancelAnimation(progress);
      start.value = progress.value;
      dragging.value = true;
    })
    .onUpdate((event) => {
      progress.value = Math.max(
        0,
        Math.min(1, start.value + event.translationX / SHIFT),
      );
    })
    .onEnd(() => {
      dragging.value = false;
      const next = progress.value >= 0.5 ? 1 : 0;
      progress.value = withTiming(next, { duration: enabled ? 160 : 0 });
      runOnJS(select)(next);
    })
    .onFinalize(() => {
      if (!dragging.value) return;
      dragging.value = false;
      progress.value = withTiming(value === "income" ? 1 : 0, {
        duration: enabled ? 160 : 0,
      });
    });
  if (pagePan) pan.blocksExternalGesture(pagePan);
  const indicator = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * SHIFT }],
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [expenseBackground, incomeBackground],
    ),
  }));
  const expenseWidth = useAnimatedStyle(() => ({
    width: 100 - progress.value * 56,
  }));
  const incomeWidth = useAnimatedStyle(() => ({
    width: 44 + progress.value * 56,
  }));
  const expenseLabel = useAnimatedStyle(() => ({
    width: 54 * (1 - progress.value),
    opacity: 1 - progress.value,
  }));
  const incomeLabel = useAnimatedStyle(() => ({
    width: 44 * progress.value,
    opacity: progress.value,
  }));
  const expenseTint = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [expenseForeground, c.onSurfaceVariant],
    ),
  }));
  const incomeTint = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [c.onSurfaceVariant, incomeForeground],
    ),
  }));
  return (
    <GestureDetector gesture={pan}>
      <View
        style={{
          flexDirection: "row",
          padding: 3,
          borderRadius: 26,
          borderWidth: 1,
          borderColor: c.outlineVariant,
          flexShrink: 0,
        }}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              left: 3,
              top: 3,
              height: 44,
              width: 100,
              borderRadius: 22,
            },
            indicator,
          ]}
        />
        {(["expense", "income"] as const).map((type) => (
          <AnimatedPressable
            key={type}
            onPress={() => onChange(type)}
            accessibilityRole="tab"
            accessibilityLabel={type === "expense" ? "Expenses" : "Income"}
            accessibilityState={{ selected: value === type }}
            style={[
              {
                height: 44,
                borderRadius: 22,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                overflow: "hidden",
              },
              type === "expense" ? expenseWidth : incomeWidth,
            ]}
          >
            <AnimatedIcon
              name={type === "expense" ? "trending-down" : "trending-up"}
              size={18}
              style={type === "expense" ? expenseTint : incomeTint}
            />
            <Animated.View
              pointerEvents="none"
              style={[
                { overflow: "hidden" },
                type === "expense" ? expenseLabel : incomeLabel,
              ]}
            >
              <Text
                numberOfLines={1}
                style={{
                  width: type === "expense" ? 54 : 44,
                  fontSize: 11,
                  fontWeight: "700",
                  color:
                    type === "expense" ? expenseForeground : incomeForeground,
                }}
              >
                {type === "expense" ? "Expenses" : "Income"}
              </Text>
            </Animated.View>
          </AnimatedPressable>
        ))}
      </View>
    </GestureDetector>
  );
}
