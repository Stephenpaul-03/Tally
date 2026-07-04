import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  Pressable,
  TextInput,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";
import { Text, useTheme } from "react-native-paper";

type UniversalSearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  pillLabel?: string;
  bg: string;
  onPillPress?: () => void;
  autoFocus?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

export function UniversalSearchBar({
  value,
  bg,
  onChangeText,
  placeholder,
  pillLabel,
  onPillPress,
  autoFocus = false,
  containerStyle,
}: UniversalSearchBarProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          marginHorizontal: 20,
          borderRadius: 20,
          borderWidth: 0.5,
          borderColor: theme.colors.outlineVariant,
          backgroundColor: bg,
          paddingHorizontal: 14,
          paddingVertical: 10,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        },
        containerStyle,
      ]}
    >
      <MaterialCommunityIcons
        name="magnify"
        size={20}
        color={theme.colors.onSurfaceVariant}
      />

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        autoFocus={autoFocus}
        placeholderTextColor={theme.colors.onSurfaceVariant}
        style={{
          flex: 1,
          color: theme.colors.onSurface,
          paddingVertical: 0,
        }}
      />

      {pillLabel && onPillPress ? (
        <Pressable
          accessibilityRole="button"
          onPress={onPillPress}
          style={({ pressed }) => ({
            borderRadius: 999,
            borderWidth: 0.5,
            borderColor: theme.colors.outline,
            backgroundColor: theme.colors.surface,
            paddingHorizontal: 10,
            paddingVertical: 7,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: theme.colors.primary,
              textTransform: "uppercase",
            }}
          >
            {pillLabel}
          </Text>
          <MaterialCommunityIcons
            name="tune-variant"
            size={14}
            color={theme.colors.primary}
          />
        </Pressable>
      ) : null}
    </View>
  );
}
