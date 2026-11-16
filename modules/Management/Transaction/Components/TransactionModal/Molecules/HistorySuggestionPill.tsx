import React from "react";
import { Pressable, View } from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import Animated, { Easing, FadeInDown, FadeOutDown, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { useTheme } from "react-native-paper";
import { useMotionEnabled } from "@/components/animations/Motion";
import { DesignText as Text } from "@/components/DesignText";
import { categoryTone } from "@/theme/sage";

type IconName = React.ComponentProps<typeof Icon>["name"];
export function HistorySuggestionPill({ visible, applied, availableWidth, category, categoryColor, categoryIcon,
  account, accountColor, accountIcon, onApply }: {
  visible: boolean; applied: boolean; availableWidth: number; category: string; categoryColor: string; categoryIcon: IconName;
  account: string; accountColor: string; accountIcon: IconName; onApply: () => void;
}) {
  const theme = useTheme(), motion = useMotionEnabled();
  const [finished, setFinished] = React.useState(false);
  React.useEffect(() => {
    if (!applied) return;
    const timer = setTimeout(() => setFinished(true), motion ? 1200 : 900);
    return () => clearTimeout(timer);
  }, [applied, motion]);
  const shown = visible && !finished;
  const width = useSharedValue(0);
  // Reserve one stable slot for both states. Flex reflow during an entrance or
  // exit adds horizontal movement to an otherwise vertical transition.
  const targetWidth = Math.max(0, Math.min(availableWidth, 230));
  const compactFeedback = targetWidth < 170;
  const badgeSize = compactFeedback ? 28 : 32;
  const badgeSpace = badgeSize * 2 + 12;
  const pillWidth = useSharedValue(targetWidth);
  React.useEffect(() => {
    pillWidth.value = withTiming(applied ? Math.max(0, targetWidth - badgeSpace) : targetWidth,
      { duration: motion ? 200 : 0, easing: Easing.out(Easing.cubic) });
  }, [applied, targetWidth, badgeSpace, motion, pillWidth]);
  const pillFrame = useAnimatedStyle(() => ({ width: pillWidth.value }));
  React.useEffect(() => {
    width.value = withDelay(motion && !shown && finished ? 420 : 0,
      withTiming(shown ? targetWidth : 0, { duration: motion ? 240 : 0, easing: Easing.out(Easing.cubic) }));
  }, [shown, targetWidth, finished, motion, width]);
  const frame = useAnimatedStyle(() => ({ width: width.value }));
  const [background, foreground] = categoryTone(category, theme.dark, categoryColor);
  const badge = (name: IconName, color: string, label: string, delay: number, left: number) => {
    const [bg, fg] = categoryTone("", theme.dark, color);
    return <Animated.View entering={motion ? FadeInDown.duration(220).delay(220 + delay) : undefined}
      exiting={motion ? FadeOutDown.duration(240).delay(delay) : undefined}
      accessibilityLabel={label} style={{ position: "absolute", left, top: (44 - badgeSize) / 2, width: badgeSize, height: badgeSize, borderRadius: badgeSize / 2, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
      <Icon name={name} color={fg} size={18} />
    </Animated.View>;
  };
  return <Animated.View style={[{ height: 50, justifyContent: "center" }, frame]}>
    <View collapsable={false} style={{ position: "absolute", left: 0, top: 3, width: targetWidth, height: 44 }}>
      {shown ? <>
        <Animated.View key="pill" entering={motion ? FadeInDown.duration(260).delay(280) : undefined}
          exiting={motion ? FadeOutDown.duration(240) : undefined}
          style={[{ position: "absolute", left: 0, top: 0 }, pillFrame]}>
          <Pressable accessibilityRole="button" disabled={applied} onPress={onApply}
            accessibilityLabel={applied ? "Previous details applied" : `Use previous details: ${category}, ${account}`}
            style={({ pressed }) => ({ height: 44, borderRadius: 22, backgroundColor: background,
              paddingHorizontal: compactFeedback && applied ? 6 : 12, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: compactFeedback && applied ? 4 : 6, opacity: pressed ? 0.7 : 1 })}>
            <Icon name={applied ? "check-circle" : "history"} color={foreground} size={compactFeedback && applied ? 16 : 18} />
            <Text numberOfLines={1} style={{ color: foreground, fontWeight: "700", fontSize: compactFeedback && applied ? 11 : 12, flexShrink: 1 }}>{applied ? "Applied" : "Use previous"}</Text>
          </Pressable>
        </Animated.View>
        {applied ? badge(categoryIcon, categoryColor, category, 70, targetWidth - badgeSize * 2 - 6) : null}
        {applied ? badge(accountIcon, accountColor, account, 140, targetWidth - badgeSize) : null}
      </> : null}
    </View>
  </Animated.View>;
}
