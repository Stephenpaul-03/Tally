import React, { useRef } from "react";
import { Animated, Pressable } from "react-native";
import type { FloatingTabRoute } from "../types";
import { BAR_HEIGHT } from "../types";

type TabButtonProps = {
  route: FloatingTabRoute;
  focused: boolean;
  onPress: () => void;
  tabWidth: number;
  activeColor: string;
  inactiveColor: string;
};

export function TabButton({
  route,
  focused,
  onPress,
  tabWidth,
  activeColor,
  inactiveColor,
}: TabButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 12,
        stiffness: 200,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={route.title}
      style={{
        width: tabWidth,
        height: BAR_HEIGHT,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {route.icon({
          color: focused ? activeColor : inactiveColor,
          size: 22,
        })}
      </Animated.View>
    </Pressable>
  );
}
