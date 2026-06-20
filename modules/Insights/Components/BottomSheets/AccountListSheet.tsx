import { useStagger } from "@/components/animations/UseStagger";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { typography } from "@/theme/typography";
import { withOpacity } from "@/utils/Helpers";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Animated, Pressable, ScrollView, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import type { PaymentItem } from "../../Types";
import { formatInr } from "../../Utils";
import type { PaymentMethodVisual } from "../Cards/AccountBreakdownCard";

type AccountBreakdownSheetProps = {
  visible: boolean;
  onDismiss: () => void;
  items: { item: PaymentItem; visual: PaymentMethodVisual }[];
  bg: string;
  outline: string;
  textColor: string;
  muted: string;
  trackColor: string;
  onRowPress: (item: PaymentItem, visual: PaymentMethodVisual) => void;
};

const ICON_SIZE = 40;
const BAR_HEIGHT = 8;
const BAR_RADIUS = 4;

function ProgressBar({
  percentage,
  color,
  track,
}: {
  percentage: number;
  color: string;
  track: string;
}) {
  const clamped = Math.min(Math.max(percentage, 0), 100);

  return (
    <View
      style={{
        height: BAR_HEIGHT,
        borderRadius: BAR_RADIUS,
        backgroundColor: track,
        overflow: "hidden",
        width: "100%",
      }}
    >
      <View
        style={{
          height: "100%",
          width: `${clamped}%`,
          borderRadius: BAR_RADIUS,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

function AccountRow({
  item,
  visual,
  textColor,
  muted,
  trackColor,
  onPress,
  minimalIconsEnabled,
  primaryColor,
  surfaceVariant,
}: {
  item: PaymentItem;
  visual: PaymentMethodVisual;
  textColor: string;
  muted: string;
  trackColor: string;
  onPress: () => void;
  minimalIconsEnabled: boolean;
  primaryColor: string;
  surfaceVariant: string;
}) {
  const accent = minimalIconsEnabled ? primaryColor : visual.accent;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: 14,
        backgroundColor: withOpacity(textColor, pressed ? "0A" : "00"),
        paddingVertical: 10,
        paddingHorizontal: 6,
        gap: 10,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {/* Top row: icon, name, amount */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: ICON_SIZE,
            height: ICON_SIZE,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: minimalIconsEnabled
              ? surfaceVariant
              : withOpacity(accent, "18"),
          }}
        >
          <MaterialCommunityIcons name={visual.icon} size={20} color={accent} />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{ fontSize: 15, fontWeight: "600", color: textColor }}
          >
            {visual.label}
          </Text>
        </View>

        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: textColor }}>
            {formatInr(Math.round(item.amount as number))}
          </Text>
          <Text style={{ fontSize: 12, color: muted }}>
            {Math.round(item.percentage)}%
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <ProgressBar
        percentage={item.percentage}
        color={accent}
        track={trackColor}
      />
    </Pressable>
  );
}

export function AccountBreakdownSheet({
  visible,
  onDismiss,
  items,
  bg,
  outline,
  textColor,
  muted,
  trackColor,
  onRowPress,
}: AccountBreakdownSheetProps) {
  const theme = useTheme();
  const { minimalIconsEnabled } = useAddonPrefs();
  const { getAnimStyle } = useStagger({
    count: items.length,
    stagger: 100,
    distance: 20,
    duration: 750,
    dataKey: `${visible}:${items.map(({ item }) => item.method).join("|")}`,
  });

  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onDismiss}
      presentation="sheet"
      contentContainerStyle={{
        backgroundColor: bg,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderColor: outline,
        borderTopWidth: 0.5,
        maxHeight: "85%",
        flexShrink: 1,
      }}
    >
      <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
        <View
          style={{
            width: 32,
            height: 3,
            borderRadius: 2,
            backgroundColor: outline,
          }}
        />
      </View>

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: 14,
          borderBottomWidth: 0.5,
          borderBottomColor: outline,
          gap: 14,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              ...typography.editorial.sectionLabel,
              fontSize: 20,
              color: textColor,
            }}
          >
            Payment Methods
          </Text>
          <Pressable onPress={onDismiss} hitSlop={10}>
            <MaterialCommunityIcons name="close" size={20} color={muted} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 14,
          paddingTop: 8,
          paddingBottom: 28,
          gap: 4,
        }}
      >
        {items.length > 0 ? (
          items.map(({ item, visual }, index) => (
            <Animated.View key={item.method} style={getAnimStyle(index)}>
              <AccountRow
                item={item}
                visual={visual}
                textColor={textColor}
                muted={muted}
                trackColor={trackColor}
                onPress={() => onRowPress(item, visual)}
                minimalIconsEnabled={minimalIconsEnabled}
                primaryColor={theme.colors.primary}
                surfaceVariant={theme.colors.surfaceVariant}
              />
            </Animated.View>
          ))
        ) : (
          <Text
            style={{
              fontSize: 13,
              color: muted,
              textAlign: "center",
              paddingVertical: 32,
            }}
          >
            No data available.
          </Text>
        )}
      </ScrollView>
    </AnimatedPaperModal>
  );
}
