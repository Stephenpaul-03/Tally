import React from "react";
import { CategoryIconBadge } from "@/components/CategoryIconBadge";
import { View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { typography } from "@/theme/typography";

export function CardEmptyState({ message, description, icon = "notebook-outline", color }: {
  message: string; description?: string;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>["name"]; color?: string;
}) {
  const theme = useTheme();
  const accent = color ?? theme.colors.primary;
  return <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 }}>
    <CategoryIconBadge icon={icon} color={accent} />
    <View style={{ flex: 1, gap: 4 }}>
      <Text style={{ ...typography.bodyMedium, fontSize: 14, lineHeight: 20 }}>{message}</Text>
      {description ? <Text style={{ ...typography.body, fontSize: 13, lineHeight: 19, color: theme.colors.onSurfaceVariant }}>{description}</Text> : null}
    </View>
  </View>;
}
