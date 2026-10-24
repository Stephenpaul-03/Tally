import React from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { DesignText as Text } from "@/components/DesignText";
import {
  clampTabPosition,
  snapTabIndex,
  tabBarGeometry,
  tabWeight,
} from "./pagerGeometry";
import { EXPRESSIVE_TABS } from "./presentation";
import type { ShellTab } from "@/components/AppShellContext";
const DESTINATIONS = [
  { tab: "calendar", icon: "calendar-blank-outline", label: "Transactions" },
  { tab: "transactions", icon: "home-outline", label: "Home" },
  { tab: "insights", icon: "chart-line", label: "Insights" },
] as const;
export function ExpressiveTabBar({
  position,
  driving,
  navigationTarget,
  activeTab,
  onSelect,
  onSettle,
  reduceMotion,
}: {
  position: SharedValue<number>;
  driving: SharedValue<boolean>;
  navigationTarget: SharedValue<number>;
  activeTab: ShellTab;
  onSelect: (tab: ShellTab) => void;
  onSettle: (index: number) => void;
  reduceMotion: boolean;
}) {
  const { colors: c } = useTheme();
  const [width, setWidth] = React.useState(0);
  const start = useSharedValue(0);
  const dragging = useSharedValue(false);
  const indicator = useAnimatedStyle(() => {
    const geometry = tabBarGeometry(width, position.value);
    return {
      width: geometry.pillWidth,
      opacity: width > 0 ? 1 : 0,
      transform: [{ translateX: geometry.pillLeft }],
    };
  });
  const finish = (target: number) => {
    "worklet";
    navigationTarget.value = target;
    position.value = withTiming(
      target,
      { duration: reduceMotion ? 0 : 180, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (!finished) return;
        driving.value = false;
        runOnJS(onSettle)(target);
      },
    );
  };
  const pan = Gesture.Pan()
    .enabled(width > 0)
    .activeOffsetX([-4, 4])
    .failOffsetY([-18, 18])
    .onStart(() => {
      cancelAnimation(position);
      navigationTarget.value = -1;
      start.value = position.value;
      dragging.value = true;
      driving.value = true;
    })
    .onUpdate((event) => {
      const geometry = tabBarGeometry(width, start.value);
      position.value = clampTabPosition(
        start.value + event.translationX / Math.max(1, geometry.step),
      );
    })
    .onEnd((event, success) => {
      const geometry = tabBarGeometry(width, position.value);
      dragging.value = false;
      finish(
        snapTabIndex(
          position.value,
          success ? event.velocityX / Math.max(1, geometry.step) : 0,
        ),
      );
    })
    .onFinalize(() => {
      if (!dragging.value) return;
      dragging.value = false;
      finish(snapTabIndex(position.value, 0));
    });
  return (
    <GestureDetector gesture={pan}>
      <View
        collapsable={false}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={{
          height: 48,
          flexDirection: "row",
          gap: 8,
          alignSelf: "stretch",
        }}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              borderRadius: 28,
              backgroundColor: c.surface,
            },
            indicator,
          ]}
        />
        {DESTINATIONS.map((destination, index) => (
          <TabItem
            key={destination.tab}
            {...destination}
            index={index}
            position={position}
            width={width}
            selected={activeTab === destination.tab}
            onPress={() => onSelect(EXPRESSIVE_TABS[index])}
          />
        ))}
      </View>
    </GestureDetector>
  );
}
function TabItem({
  icon,
  label,
  index,
  position,
  width,
  selected,
  onPress,
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  label: string;
  index: number;
  position: SharedValue<number>;
  width: number;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors: c } = useTheme();
  const slot = tabBarGeometry(width, 0).base;
  const captionWidth = Math.max(
    0,
    Math.min(label === "Home" ? 38 : label === "Insights" ? 48 : 76, slot - 38),
  );
  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          -((captionWidth + 6) / 2) * tabWeight(position.value, index),
      },
    ],
  }));
  const activeIcon = useAnimatedStyle(() => ({
    opacity: tabWeight(position.value, index),
  }));
  const inactiveIcon = useAnimatedStyle(() => ({
    opacity: 1 - tabWeight(position.value, index),
  }));
  const caption = useAnimatedStyle(() => ({
    opacity: width > 0 ? tabWeight(position.value, index) : 0,
    transform: [{ translateX: (1 - tabWeight(position.value, index)) * 6 }],
  }));
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        flex: 1,
        minWidth: 0,
        height: 48,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 28,
      }}
    >
      <Animated.View style={iconStyle}>
        <Animated.View style={inactiveIcon}>
          <Icon name={icon} size={24} color={c.onSurfaceVariant} />
        </Animated.View>
        <Animated.View style={[{ position: "absolute" }, activeIcon]}>
          <Icon name={icon} size={24} color={c.onSurface} />
        </Animated.View>
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            left: slot / 2 + 15 - captionWidth / 2,
            width: captionWidth,
          },
          caption,
        ]}
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          style={{
            fontWeight: "800",
            fontSize: 12,
            color: c.onSurface,
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
