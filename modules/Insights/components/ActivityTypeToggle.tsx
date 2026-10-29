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
  type SharedValue,
} from "react-native-reanimated";
import { useMotionEnabled } from "@/components/animations/Motion";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { DesignText as Text } from "@/components/DesignText";
import { categoryTone } from "@/theme/sage";
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedIcon = Animated.createAnimatedComponent(Icon);

export function ActivityTypeToggle({
  value,
  onChange,
  pagePan,
  stylePicker = false,
  dragProgress,
}: {
  stylePicker?: boolean;
  dragProgress?: SharedValue<number>;
  value: "income" | "expense";
  onChange: (type: "income" | "expense") => void;
  pagePan?: ReturnType<typeof Gesture.Pan>;
}) {
  const controlHeight = stylePicker ? 38 : 44;
  const inactiveWidth = stylePicker ? 38 : 44;
  const [labelWidths, setLabelWidths] = React.useState({ expense: stylePicker ? 36 : 54, income: 44 });
  const expenseSelectedWidth = stylePicker ? 42 + labelWidths.expense : 100;
  const incomeSelectedWidth = stylePicker ? 42 + labelWidths.income : 100;
  const { colors: c, dark } = useTheme();
  const enabled = useMotionEnabled();
  const localProgress = useSharedValue(value === "income" ? 1 : 0);
  const progress = dragProgress ?? localProgress;
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
  const [simpleBackground, simpleForeground] = categoryTone("", dark, "#3A6EA5");
  const [detailedBackground, detailedForeground] = categoryTone("", dark, "#8B509B");
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
        Math.min(1, start.value + event.translationX / inactiveWidth),
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
    transform: [{ translateX: progress.value * inactiveWidth }],
    width: expenseSelectedWidth + (incomeSelectedWidth - expenseSelectedWidth) * progress.value,
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      stylePicker ? [simpleBackground, detailedBackground] : [expenseBackground, incomeBackground],
    ),
  }));
  const expenseWidth = useAnimatedStyle(() => ({
    width: expenseSelectedWidth - progress.value * (expenseSelectedWidth - inactiveWidth),
    gap: 4 * (1 - progress.value),
  }));
  const incomeWidth = useAnimatedStyle(() => ({
    width: inactiveWidth + progress.value * (incomeSelectedWidth - inactiveWidth),
    gap: 4 * progress.value,
  }));
  const expenseLabel = useAnimatedStyle(() => ({
    width: labelWidths.expense * (1 - progress.value),
    opacity: 1 - progress.value,
  }));
  const incomeLabel = useAnimatedStyle(() => ({
    width: labelWidths.income * progress.value,
    opacity: progress.value,
  }));
  const expenseTint = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [dark ? "#FFFFFF" : stylePicker ? simpleForeground : expenseForeground, dark ? "#FFFFFF" : c.onSurfaceVariant],
    ),
  }));
  const incomeTint = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [dark ? "#FFFFFF" : c.onSurfaceVariant, dark ? "#FFFFFF" : stylePicker ? detailedForeground : incomeForeground],
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
        {stylePicker ? <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: "absolute", opacity: 0, alignItems: "flex-start" }}>
          {(["expense", "income"] as const).map(type => <Text key={type} style={{ fontSize: 11, fontWeight: "700" }}
            onLayout={event => { const width = Math.ceil(event.nativeEvent.layout.width); setLabelWidths(old => old[type] === width ? old : { ...old, [type]: width }); }}
            >{type === "expense" ? "Simple" : "Detailed"}</Text>)}
        </View> : null}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              left: 3,
              top: 3,
              height: controlHeight,
              width: 100,
              borderRadius: 22,
            },
            indicator,
          ]}
        />
        {(["expense", "income"] as const).map((type) => (
          <AnimatedPressable
            key={type}
            hitSlop={stylePicker ? { top: 3, bottom: 3 } : undefined}
            onPress={() => onChange(type)}
            accessibilityRole="tab"
            accessibilityLabel={stylePicker ? (type === "expense" ? "Simple insights" : "Detailed insights") : type === "expense" ? "Expenses" : "Income"}
            accessibilityState={{ selected: value === type }}
            style={[
              {
                height: controlHeight,
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
              name={stylePicker ? (type === "expense" ? "shape-outline" : "view-list-outline") : type === "expense" ? "trending-down" : "trending-up"}
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
                  width: labelWidths[type],
                  fontSize: 11,
                  fontWeight: "700",
                  color:
                    stylePicker ? (type === "expense" ? simpleForeground : detailedForeground) : type === "expense" ? expenseForeground : incomeForeground,
                }}
              >
                {stylePicker ? (type === "expense" ? "Simple" : "Detailed") : type === "expense" ? "Expenses" : "Income"}
              </Text>
            </Animated.View>
          </AnimatedPressable>
        ))}
      </View>
    </GestureDetector>
  );
}
