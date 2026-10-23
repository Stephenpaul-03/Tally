import React from "react";
import { useWindowDimensions } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { DesignText as Text } from "@/components/DesignText";
import { MotionItem } from "@/components/animations/Motion";
import { MotionPressable } from "./Motion";

export function TonalSummaryTile({
  icon,
  value,
  caption,
  background,
  foreground,
  index,
  onPress,
  note,
  noteColor,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  value: string;
  caption: string;
  background: string;
  foreground: string;
  index: number;
  onPress: () => void;
  note?: string;
  noteColor?: string;
}) {
  const { fontScale } = useWindowDimensions();
  return (
    <MotionItem
      index={index}
      style={{ width: fontScale > 1.25 ? "100%" : "48.5%", flexGrow: 1 }}
    >
      <MotionPressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${caption}, ${value}${note ? `, ${note}` : ""}. View entries.`}
        style={{
          flex: 1,
          minHeight: 132,
          padding: 16,
          gap: 10,
          borderRadius: 12,
          borderTopLeftRadius: index === 0 ? 32 : 12,
          borderTopRightRadius: index === 1 ? 32 : 12,
          borderBottomLeftRadius: index === 2 ? 32 : 12,
          borderBottomRightRadius: index === 3 ? 32 : 12,
          backgroundColor: background,
        }}
      >
        <MaterialCommunityIcons name={icon} size={24} color={foreground} />
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.65}
          style={{ fontSize: 23, fontWeight: "800", color: foreground }}
        >
          {value}
        </Text>
        <Text style={{ fontSize: 12, fontWeight: "600", color: foreground }}>
          {caption}
        </Text>
        {note ? (
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: noteColor ?? foreground,
            }}
          >
            {note}
          </Text>
        ) : null}
      </MotionPressable>
    </MotionItem>
  );
}
