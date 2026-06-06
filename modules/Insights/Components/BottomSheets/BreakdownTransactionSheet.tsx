import { useStagger } from "@/components/animations/UseStagger";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { withOpacity } from "@/modules/Common/Utils/Helpers";
import type { Transaction } from "@/modules/Common/Utils/Types";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Animated, Pressable, ScrollView, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { formatInr } from "../../Utils";
type CategoryTransactionsSheetProps = {
  visible: boolean;
  onDismiss: () => void;
  categoryLabel: string;
  categoryIcon?: string;
  categoryColor?: string;
  monthLabel: string;
  total: number;
  transactions: Transaction[];
  mode: "expense" | "income";
  bg: string;
  outline: string;
  textColor: string;
  muted: string;
};

export function CategoryTransactionsSheet({
  visible,
  onDismiss,
  categoryLabel,
  categoryIcon,
  categoryColor,
  monthLabel,
  total,
  transactions,
  mode,
  bg,
  outline,
  textColor,
  muted,
}: CategoryTransactionsSheetProps) {
  const theme = useTheme();
  const { minimalIconsEnabled } = useAddonPrefs();
  const { getAnimStyle } = useStagger({
    count: transactions.length,
    stagger: 100,
    distance: 20,
    duration: 750,
    dataKey: `${visible}:${transactions.map((txn) => txn.id ?? txn.date).join("|")}`,
  });
  const accentColor = categoryColor ?? "#A99BDE";
  const iconAccentColor = minimalIconsEnabled
    ? theme.colors.primary
    : accentColor;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

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
      {/* Handle */}
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

      {/* Category header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 0 }}>
        {/* Icon + name + close row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {/* Icon box — always rendered, falls back to dot */}
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: minimalIconsEnabled
                  ? theme.colors.surfaceVariant
                  : withOpacity(iconAccentColor, "18"),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {categoryIcon ? (
                <MaterialCommunityIcons
                  name={categoryIcon as any}
                  size={22}
                  color={iconAccentColor}
                />
              ) : (
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 99,
                    backgroundColor: iconAccentColor,
                  }}
                />
              )}
            </View>

            <View style={{ gap: 3 }}>
              <Text
                style={{
                  color: textColor,
                  ...typography.editorial.sectionLabel,
                  fontSize: 16,
                }}
              >
                {categoryLabel}
              </Text>
              <Text style={{ fontSize: 12, color: muted, lineHeight: 16 }}>
                {monthLabel}
              </Text>
            </View>
          </View>

          <Pressable onPress={onDismiss} hitSlop={10}>
            <MaterialCommunityIcons name="close" size={20} color={muted} />
          </Pressable>
        </View>

        {/* Total block */}
        <View style={{ marginTop: 18, marginBottom: 18, gap: 3 }}>
          <Text
            style={{
              color: muted,
              textTransform: "uppercase",
              ...typography.editorial.sectionLabel,
              fontSize: 14,
            }}
          >
            {mode === "income" ? "Total earned" : "Total spent"}
          </Text>
          <Text
            style={{
              fontSize: 30,
              fontWeight: "800",
              color: textColor,
              letterSpacing: -0.8,
            }}
          >
            {formatInr(total)}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={{ height: 0.5, backgroundColor: outline }} />

      {/* Transaction list */}
      <ScrollView
        style={{ flexShrink: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        {transactions.length > 0 ? (
          transactions.map((txn, index) => (
            <Animated.View
              key={txn.id ?? index}
              style={getAnimStyle(index)}
            >
              <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 13,
                borderBottomWidth: index < transactions.length - 1 ? 0.5 : 0,
                borderBottomColor: outline,
              }}
            >
              {/* Left: title + date · account */}
              <View style={{ gap: 3, flex: 1, marginRight: 16 }}>
                <Text
                  numberOfLines={1}
                  style={{ fontSize: 14, fontWeight: "500", color: textColor }}
                >
                  {txn.title}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Text style={{ fontSize: 12, color: muted }}>
                    {formatDate(txn.date)}
                  </Text>
                  {/* Dot separator */}
                  <View
                    style={{
                      width: 3,
                      height: 3,
                      borderRadius: 99,
                      backgroundColor: muted,
                      opacity: 0.4,
                    }}
                  />
                  <Text style={{ fontSize: 12, color: muted }}>
                    {txn.account}
                  </Text>
                </View>
              </View>

              {/* Right: amount */}
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: mode === "income" ? "#8FC8B0" : textColor,
                }}
              >
                {mode === "income" ? "+" : ""}
                {formatInr(txn.amount)}
              </Text>
              </View>
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
            No transactions this month.
          </Text>
        )}
      </ScrollView>
    </AnimatedPaperModal>
  );
}
