import { getContrastColor } from "@/utils/color-helpers";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";
import {
    Text,
    TouchableRipple,
    useTheme,
    type MD3Theme,
} from "react-native-paper";
import { fieldRow } from "../Styles";

interface FieldRowProps {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  children: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
  error?: string;
}

export function FieldRow({
  icon,
  label,
  children,
  onPress,
  isLast = false,
  error,
}: FieldRowProps) {
  const theme = useTheme<MD3Theme>();
  const hasError = !!error;

  const row = (
    <View
      style={[
        fieldRow.inner,
        {
          borderBottomWidth: isLast && !hasError ? 0 : 0.5,
          borderBottomColor: hasError
            ? theme.colors.error
            : theme.colors.outlineVariant,
        },
      ]}
    >
      {/* Label cell — never tappable */}
      <View
        style={[
          fieldRow.labelCell,
          { borderRightColor: theme.colors.outlineVariant },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={hasError ? theme.colors.error : theme.colors.primary}
        />
        <Text
          variant="labelMedium"
          style={[
            fieldRow.label,
            {
              color: hasError
                ? theme.colors.error
                : getContrastColor(theme.colors.elevation.level1),
            },
          ]}
        >
          {label}
        </Text>
      </View>

      <View style={[fieldRow.children, { flex: 1 }]}>{children}</View>
    </View>
  );

  return (
    <View>
      {onPress ? (
        <TouchableRipple onPress={onPress}>{row}</TouchableRipple>
      ) : (
        row
      )}

      {hasError && (
        <View
          style={[
            fieldRow.errorBanner,
            { backgroundColor: theme.colors.errorContainer },
          ]}
        >
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={13}
            color={theme.colors.error}
          />
          <Text style={[fieldRow.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
        </View>
      )}
    </View>
  );
}
