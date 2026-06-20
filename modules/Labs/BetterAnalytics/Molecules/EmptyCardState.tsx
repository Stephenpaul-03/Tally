import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";

export function EmptyCardState({
  icon = "chart-line",
  title,
  muted,
}: {
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  title: string;
  muted: string;
}) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 18, gap: 10 }}>
      <MaterialCommunityIcons name={icon} size={22} color={muted} />
      <Text
        style={{
          fontSize: 13,
          lineHeight: 20,
          color: muted,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
    </View>
  );
}
