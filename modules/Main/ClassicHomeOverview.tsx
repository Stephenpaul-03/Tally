import React from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { DesignText as Text } from "@/components/DesignText";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { typography } from "@/theme/typography";
import { mixHex } from "@/theme/expressivePalette";

export function ClassicHomeOverview({
  balance,
  received,
  spent,
  money,
  onIncome,
  onSpent,
}: {
  balance: number;
  received: number;
  spent: number;
  money: (value: number) => string;
  onIncome: () => void;
  onSpent: () => void;
}) {
  const theme = useTheme<ExtendedMD3Theme>();
  const c = theme.colors;
  return (
    <View style={{ flexDirection: "row", gap: 10, minHeight: 112 }}>
      <View
        style={{
          flex: 0.7,
          minWidth: 0,
          padding: 12,
          gap: 6,
          justifyContent: "center",
          borderRadius: 16,
          borderWidth: 0.5,
          borderColor: mixHex(c.outlineVariant, c.primary, 0.2),
          backgroundColor: mixHex(c.surface, c.primary, 0.07),
          overflow: "hidden",
        }}
      >
        <View style={{ flexDirection: "row", gap: 5, alignItems: "center" }}>
          <Icon name="wallet-outline" size={16} color={c.primary} />
          <Text
            style={{
              ...typography.editorial.sectionLabel,
              color: c.onSurfaceVariant,
            }}
          >
            Balance
          </Text>
        </View>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            ...typography.bodyStrong,
            fontSize: 27,
            lineHeight: 34,
            letterSpacing: -1,
            color: c.onSurface,
          }}
        >
          {balance < 0 ? "−" : ""}
          {money(balance)}
        </Text>
        {balance < 0 && (
          <Text
            style={{ ...typography.bodyMedium, fontSize: 11, color: c.error }}
          >
            Over by {money(balance)}
          </Text>
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 10 }}>
        {(
          [
            [
              "Income",
              received,
              "arrow-bottom-left",
              theme.semantic.income,
              onIncome,
            ],
            ["Spent", spent, "arrow-top-right", c.error, onSpent],
          ] as const
        ).map(([label, value, icon, color, onPress]) => (
          <Pressable
            key={label}
            accessibilityRole="button"
            accessibilityLabel={`View ${label.toLowerCase()} transactions`}
            onPress={onPress}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 51,
              paddingHorizontal: 10,
              paddingVertical: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              justifyContent: "space-between",
              borderRadius: 14,
              borderWidth: 0.5,
              borderColor: mixHex(c.outlineVariant, color, 0.2),
              backgroundColor: mixHex(c.surface, color, 0.07),
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View
              style={{ flexDirection: "row", gap: 5, alignItems: "center" }}
            >
              <Icon name={icon} size={16} color={color} />
              <Text
                style={{
                  ...typography.editorial.sectionLabel,
                  fontSize: 14,
                  color: c.onSurfaceVariant,
                }}
              >
                {label}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{
                ...typography.bodyStrong,
                fontSize: 19,
                flex: 1,
                minWidth: 0,
                textAlign: "right",
                color: c.onSurface,
              }}
            >
              {money(value)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
