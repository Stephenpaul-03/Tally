import { useFadeSlide } from "@/components/animations/UseFadeSlide";
import { useStagger } from "@/components/animations/UseStagger";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { withOpacity } from "@/modules/Common/Utils/Helpers";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Animated, Pressable, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import type { PaymentItem } from "../../Types";
import { formatInr } from "../../Utils";
import { AccountBreakdownSheet } from "../BottomSheets/AccountListSheet";

export type PaymentMethodVisual = {
  accent: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
};

type PaymentMethodBreakdownCardProps = {
  bg: string;
  outline: string;
  textColor: string;
  muted: string;
  trackColor: string;
  items: PaymentItem[];
  onRowPress?: (item: PaymentItem, visual: PaymentMethodVisual) => void;
  paymentMethodVisuals: Record<string, PaymentMethodVisual>;
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

function PaymentMethodRow({
  item,
  visual,
  accent,
  textColor,
  muted,
  trackColor,
  minimalIconsEnabled,
  surfaceVariant,
  onPress,
}: {
  item: PaymentItem;
  visual: PaymentMethodVisual;
  accent: string;
  textColor: string;
  muted: string;
  trackColor: string;
  minimalIconsEnabled: boolean;
  surfaceVariant: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: 14,
        backgroundColor: withOpacity(textColor, pressed ? "0A" : "00"),
        paddingVertical: 8,
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

export function PaymentMethodBreakdownCard({
  bg,
  outline,
  textColor,
  muted,
  trackColor,
  items,
  onRowPress,
  paymentMethodVisuals,
}: PaymentMethodBreakdownCardProps) {
  const theme = useTheme();
  const { minimalIconsEnabled } = useAddonPrefs();
  const [sheetVisible, setSheetVisible] = useState(false);
  const hasData = items.length > 0;
  const { animStyle } = useFadeSlide({
    from: "bottom",
    distance: 20,
    duration: 750,
  });

  const topItems = items.slice(0, 3);

  const { getAnimStyle } = useStagger({
    count: topItems.length,
    stagger: 100,
    distance: 20,
    duration: 750,
    dataKey: topItems.map((item) => item.method).join("|"),
  });

  const sheetItems = useMemo(
    () =>
      items.map((item) => {
        const normalized = item.method.trim().toLowerCase();
        const visual = paymentMethodVisuals[normalized] || {
          accent: "#8D93A6",
          icon: "wallet-outline" as const,
          label: item.method,
        };
        return {
          item,
          visual,
        };
      }),
    [items, paymentMethodVisuals],
  );

  return (
    <>
      <Animated.View
        style={{
          backgroundColor: bg,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: outline,
          paddingHorizontal: 18,
          paddingTop: 18,
          paddingBottom: 16,
          gap: 16,
          marginBottom: 12,
          shadowColor: "#000000",
          shadowOpacity: 0.2,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 10 },
          elevation: 7,
          opacity: animStyle.opacity,
          transform: animStyle.transform,
        }}
      >
        {/* Header */}
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
              color: textColor,
              fontSize: 18,
              letterSpacing: 1,
            }}
          >
            Payment Methods
          </Text>

          {hasData && (
            <Pressable
              onPress={() => setSheetVisible(true)}
              hitSlop={8}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "500",
                  color: muted,
                }}
              >
                View All
              </Text>
              <MaterialCommunityIcons
                name="arrow-right"
                size={14}
                color={muted}
              />
            </Pressable>
          )}
        </View>

        {/* Row list */}
        {hasData ? (
          <View style={{ gap: 4 }}>
            {topItems.map((item, index) => {
              const normalized = item.method.trim().toLowerCase();
              const visual = paymentMethodVisuals[normalized] || {
                accent: "#8D93A6",
                icon: "wallet-outline" as const,
                label: item.method,
              };
              const accent = minimalIconsEnabled
                ? theme.colors.primary
                : visual.accent;

              return (
                <Animated.View key={item.method} style={getAnimStyle(index)}>
                  <PaymentMethodRow
                    item={item}
                    visual={visual}
                    accent={accent}
                    textColor={textColor}
                    muted={muted}
                    trackColor={trackColor}
                    minimalIconsEnabled={minimalIconsEnabled}
                    surfaceVariant={theme.colors.surfaceVariant}
                    onPress={() => onRowPress?.(item, visual)}
                  />
                </Animated.View>
              );
            })}
          </View>
        ) : (
          <Text
            style={{
              fontSize: 13,
              color: muted,
              textAlign: "center",
              paddingVertical: 22,
              lineHeight: 20,
            }}
          >
            No expense transactions found.
          </Text>
        )}
      </Animated.View>

      <AccountBreakdownSheet
        visible={sheetVisible}
        onDismiss={() => setSheetVisible(false)}
        items={sheetItems}
        bg={bg}
        outline={outline}
        textColor={textColor}
        muted={muted}
        trackColor={trackColor}
        onRowPress={(item, visual) => {
          setSheetVisible(false);
          onRowPress?.(item, visual);
        }}
      />
    </>
  );
}
