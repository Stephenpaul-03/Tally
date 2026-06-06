import { useFadeSlide } from "@/components/animations/UseFadeSlide";
import { typography } from "@/theme/typography";
import React from "react";
import { Animated, Image, Text } from "react-native";
import { useTheme } from "react-native-paper";

export function ListFooter({
  height,
  monthMode,
  tabbarheight,
}: {
  height: number;
  monthMode: boolean;
  tabbarheight: number;
}) {
  const theme = useTheme();
  const { animStyle } = useFadeSlide({
    from: "bottom",
    distance: 12,
    duration: 600,
    autoPlay: true,
    delay: 200,
  });

  return (
    <Animated.View
      style={[
        animStyle,
        {
          height: height,
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          paddingBottom: 12,
          marginBottom: tabbarheight - 12,
        },
      ]}
    >
      <Image
        source={require("@/assets/images/icon-foreground.png")}
        style={{ width: 128, height: 128, opacity: 0.35 }}
        resizeMode="contain"
      />
      <Text
        style={{
          color: theme.colors.onSurfaceVariant,
          opacity: 0.4,
          ...typography.editorial.sectionLabel,
          fontSize: 26,
        }}
      >
        {monthMode ? "All Tally'd up" : "Tally'd up for Today"}
      </Text>
    </Animated.View>
  );
}
