import React from "react";
import { Text } from "react-native-paper";

export function EmptyPillCardCopy({
  text,
  muted,
}: {
  text: string;
  muted: string;
}) {
  return (
    <Text
      style={{
        fontSize: 13,
        lineHeight: 19,
        color: muted,
        textAlign: "center",
        paddingVertical: 20,
      }}
    >
      {text}
    </Text>
  );
}
