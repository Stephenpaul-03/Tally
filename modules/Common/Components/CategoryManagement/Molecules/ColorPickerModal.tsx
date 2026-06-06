import React, { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { Text, type MD3Theme } from "react-native-paper";
import ColorPicker, {
  HueSlider,
  Panel1,
  PreviewText,
} from "reanimated-color-picker";

export function CustomColorPickerModal({
  visible,
  onDismiss,
  onSelect,
  theme,
  initialColor,
}: {
  visible: boolean;
  onDismiss: () => void;
  onSelect: (color: string) => void;
  theme: MD3Theme;
  initialColor?: string;
}) {
  const c = theme.colors;
  const [pickedColor, setPickedColor] = useState(initialColor ?? c.primary);

  const onCompleteJS = ({ hex }: { hex: string }) => {
    const clean = hex.length === 9 ? hex.slice(0, 7) : hex;
    setPickedColor(clean);
  };

  const handleApply = () => {
    onSelect(pickedColor);
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.55)",
          alignItems: "center",
          justifyContent: "center",
        }}
        onPress={onDismiss}
      >
        <Pressable
          style={{
            width: 300,
            backgroundColor: c.background,
            borderRadius: 20,
            padding: 20,
            borderWidth: 0.5,
            borderColor: c.outlineVariant,
            gap: 16,
          }}
          onPress={() => {}}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: c.onSurface }}>
            Custom color
          </Text>

          <ColorPicker
            value={initialColor ?? c.primary}
            onCompleteJS={onCompleteJS}
            style={{ gap: 12 }}
          >
            {/* 2D saturation + brightness panel */}
            <Panel1
              style={{ borderRadius: 12, height: 180 }}
              thumbSize={24}
              thumbShape="circle"
            />

            {/* Hue rainbow slider */}
            <HueSlider
              style={{ borderRadius: 8, height: 22 }}
              thumbSize={26}
              thumbShape="circle"
            />

            {/* Live hex readout */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: c.elevation.level1,
                borderRadius: 12,
                borderWidth: 0.5,
                borderColor: c.outlineVariant,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            >
              <PreviewText
                colorFormat="hex"
                style={{
                  flex: 1,
                  fontSize: 14,
                  fontFamily: "monospace",
                  color: c.onSurface,
                  fontWeight: "600",
                }}
              />
            </View>
          </ColorPicker>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              onPress={onDismiss}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: c.elevation.level2,
                borderWidth: 0.5,
                borderColor: c.outlineVariant,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ fontWeight: "600", color: c.onSurfaceVariant }}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handleApply}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: c.primary,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ fontWeight: "700", color: c.onPrimary }}>
                Apply
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
