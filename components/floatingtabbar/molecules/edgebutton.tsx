import { TabBarEdgeButtonConfig } from "@/components/tabbar/TabBarContext";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { styles } from "../styles";
import { BAR_HEIGHT } from "../types";

type EdgeButtonProps = {
  side: "left" | "right";
  config: TabBarEdgeButtonConfig | null | undefined;
  show: boolean;
  bottomPad: number;
  bottomOffset?: number;
  surfaceBg: string;
  borderColor: string;
  primaryColor: string;
};

export function EdgeButton({
  side,
  config,
  show,
  bottomPad,
  bottomOffset = 0,
  surfaceBg,
  borderColor,
  primaryColor,
}: EdgeButtonProps) {
  const hiddenX = side === "left" ? -BAR_HEIGHT : BAR_HEIGHT;
  const hasLabel = Boolean(config?.label);
  const buttonWidth = hasLabel ? 112 : BAR_HEIGHT;

  const opacity = useRef(new Animated.Value(show ? 1 : 0)).current;
  const translateX = useRef(new Animated.Value(show ? 0 : hiddenX)).current;

  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: show ? 1 : 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: show ? 0 : hiddenX,
        damping: 20,
        stiffness: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateX, hiddenX, show]);

  return (
    <Animated.View
      pointerEvents={show ? "auto" : "none"}
      style={{
        position: "absolute",
        bottom: bottomPad + bottomOffset,
        ...(side === "left" ? { left: 0 } : { right: 0 }),
        width: buttonWidth,
        height: BAR_HEIGHT,
        opacity,
        transform: [{ translateX }],
      }}
    >
      {config && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={config.accessibilityLabel}
          onPress={() => configRef.current?.onPress?.()}
          style={[
            styles.edgeButton,
            {
              width: buttonWidth,
              height: BAR_HEIGHT,
              backgroundColor: surfaceBg,
              borderColor,
              paddingHorizontal: hasLabel ? 14 : 0,
              ...(side === "left"
                ? { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }
                : { borderTopRightRadius: 0, borderBottomRightRadius: 0 }),
            },
          ]}
        >
          <View
            style={[
              styles.edgeButtonContent,
              side === "right" && hasLabel
                ? styles.edgeButtonContentReverse
                : null,
            ]}
          >
            {config.label ? (
              <Text
                numberOfLines={1}
                style={[styles.edgeButtonLabel, { color: primaryColor }]}
              >
                {config.label}
              </Text>
            ) : null}
            {config.icon({ color: primaryColor, size: 24 })}
          </View>
        </Pressable>
      )}
    </Animated.View>
  );
}
