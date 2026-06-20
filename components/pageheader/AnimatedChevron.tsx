import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

export function AnimatedChevron({
  expanded,
  color,
}: {
  expanded: boolean;
  color: string;
}) {
  const rotation = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(rotation, {
      toValue: expanded ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [expanded, rotation]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <View style={styles.chevronWrap}>
        <View
          style={[
            styles.chevronArm,
            styles.chevronLeft,
            { backgroundColor: color },
          ]}
        />
        <View
          style={[
            styles.chevronArm,
            styles.chevronRight,
            { backgroundColor: color },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chevronWrap: {
    width: 10,
    height: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  chevronArm: { width: 6, height: 1.5, borderRadius: 1 },
  chevronLeft: { transform: [{ rotate: "35deg" }], marginRight: -0.5 },
  chevronRight: { transform: [{ rotate: "-35deg" }], marginLeft: -0.5 },
});
