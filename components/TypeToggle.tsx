import { palette } from "@/theme/color_palette";
import { typography } from "@/theme/typography";
import { withOpacity } from "@/utils/ColorHelpers";
import { TransactionType } from "@/utils/Types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { Text, useTheme, type MD3Theme } from "react-native-paper";

export function TypeToggle({
  value,
  onChange,
  mini = false,
  progressAnim,
}: {
  value: TransactionType;
  onChange: (v: TransactionType) => void;
  mini?: boolean;
  progressAnim?: Animated.Value;
}) {
  const theme = useTheme<MD3Theme>();
  const c = theme.colors;
  const [trackWidth, setTrackWidth] = useState(0);
  const internalProgressAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = progressAnim ?? internalProgressAnim;
  const dragProgress = useRef(0);
  const hasInitialized = useRef(false);

  const trackPadding = mini ? 3 : 4;
  const tabWidth = (trackWidth - trackPadding * 2) / 2;

  const iconSize = mini ? 13 : 14;

  const options: {
    key: TransactionType;
    label: string;
    icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  }[] = [
    { key: "expense", label: "Expenses", icon: "trending-down" },
    { key: "income", label: "Income", icon: "trending-up" },
  ];

  const slideTo = (type: TransactionType) => {
    slideAnim.stopAnimation(() => {
      Animated.timing(slideAnim, {
        toValue: type === "expense" ? 0 : 1,
        useNativeDriver: true,
        duration: 200,
        easing: Easing.out(Easing.quad),
      }).start();
    });
  };

  useEffect(() => {
    if (trackWidth === 0) return;

    if (!hasInitialized.current) {
      slideAnim.setValue(value === "expense" ? 0 : 1);
      hasInitialized.current = true;
      return;
    }

    slideTo(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, trackWidth]);

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .onBegin(() => {
      dragProgress.current = value === "expense" ? 0 : 1;
      slideAnim.stopAnimation();
    })
    .onUpdate((e) => {
      if (tabWidth <= 0) return;
      const next = Math.max(
        0,
        Math.min(1, dragProgress.current + e.translationX / tabWidth),
      );
      slideAnim.setValue(next);
    })
    .onEnd((e) => {
      if (tabWidth <= 0) return;
      const currentProgress = dragProgress.current + e.translationX / tabWidth;
      const shouldBeIncome = currentProgress > 0.5;
      const newType: TransactionType = shouldBeIncome ? "income" : "expense";
      slideTo(newType);
      if (newType !== value) onChange(newType);
    });

  const tapGesture = Gesture.Tap()
    .runOnJS(true)
    .onEnd((e) => {
      if (trackWidth === 0) return;
      const newType: TransactionType =
        e.x > trackWidth / 2 ? "income" : "expense";
      slideTo(newType);
      if (newType !== value) onChange(newType);
    });

  const gesture = Gesture.Race(panGesture, tapGesture);

  const isExpense = value === "expense";
  const activeBg = isExpense
    ? withOpacity(palette.status.danger, 0.12)
    : withOpacity(palette.status.success, 0.12);
  const activeBorder = isExpense
    ? withOpacity(palette.status.danger, 0.35)
    : withOpacity(palette.status.success, 0.35);

  return (
    <GestureHandlerRootView style={styles.root}>
      <GestureDetector gesture={gesture}>
        <View
          style={[
            styles.track,
            mini && styles.trackMini,
            {
              backgroundColor: c.surface,
              padding: trackPadding,
            },
          ]}
          onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        >
          {trackWidth > 0 && (
            <Animated.View
              style={[
                styles.slider,
                mini && styles.sliderMini,
                {
                  width: tabWidth,
                  top: trackPadding,
                  bottom: trackPadding,
                  left: trackPadding,
                  backgroundColor: activeBg,
                  borderColor: activeBorder,
                  transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, tabWidth],
                      }),
                    },
                  ],
                },
              ]}
            />
          )}

          {options.map((opt) => {
            const isActive = value === opt.key;
            const isExp = opt.key === "expense";
            const color = isActive
              ? isExp
                ? palette.status.danger
                : palette.status.success
              : c.onSurfaceVariant;

            return (
              <View key={opt.key} style={[styles.tab, mini && styles.tabMini]}>
                <MaterialCommunityIcons
                  name={opt.icon}
                  size={iconSize}
                  color={color}
                />
                <Text
                  style={[styles.label, mini && styles.labelMini, { color }]}
                  numberOfLines={1}
                >
                  {opt.label}
                </Text>
              </View>
            );
          })}
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: "stretch",
    width: "100%",
  },
  track: {
    flexDirection: "row",
    alignSelf: "stretch",
    width: "100%",
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 4,
    position: "relative",
  },
  trackMini: {
    borderRadius: 12,
  },
  slider: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 10,
    borderWidth: 0.5,
  },
  sliderMini: {
    borderRadius: 9,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 38,
    zIndex: 1,
  },
  tabMini: {
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    minHeight: 32,
  },
  label: {
    ...typography.editorial.sectionLabel,
    fontSize: 15,
    lineHeight: 15,
    letterSpacing: 2,
  },
  labelMini: {
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: 0.8,
  },
});
