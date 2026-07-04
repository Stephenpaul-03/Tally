import { useStagger } from "@/components/animations/UseStagger";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { useAppSelector } from "@/hooks/Redux";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import { typography } from "@/theme/typography";
import { withOpacity } from "@/utils/Helpers";
import type { Transaction } from "@/utils/Types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Animated, Pressable, ScrollView, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { formatAmount } from "../../Utils";

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
  const activeWorkspace = useAppSelector(selectActiveWorkspace);
  const currencyCode = activeWorkspace?.currencyCode ?? "INR";
  const currencySymbol = activeWorkspace?.currencySymbol ?? "";

  // FIX: Cap total stagger spread to 280ms regardless of list length.
  // Previously, item[100] had a delay of 100 × 30ms = 3s → blank screen while scrolling fast.
  // Now: 10 items → 28ms/item, 100 items → 2.8ms/item — list always finishes in ≤280ms total.
  const MAX_STAGGER_SPREAD_MS = 280;
  const dynamicStagger =
    transactions.length > 1
      ? Math.min(25, MAX_STAGGER_SPREAD_MS / transactions.length)
      : 0;

  const { getAnimStyle } = useStagger({
    count: transactions.length,
    stagger: dynamicStagger,
    distance: 6,
    duration: 220,
    dataKey: `${visible}:${transactions.map((txn) => txn.id ?? txn.date).join("|")}`,
  });

  const accentColor = categoryColor ?? "#A99BDE";
  const iconAccentColor = minimalIconsEnabled
    ? theme.colors.primary
    : accentColor;

  const incomeGreen = "#5DB887";
  const amountColor = mode === "income" ? incomeGreen : textColor;

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
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderColor: outline,
        borderTopWidth: 0.5,
        maxHeight: "88%",
        flexShrink: 1,
        overflow: "hidden",
      }}
    >
      {/* Drag handle */}
      <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 2 }}>
        <View
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: withOpacity(muted, "40"),
          }}
        />
      </View>

      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 0 }}>
        {/* Icon row + close */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Icon + label */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {/* Icon bubble */}
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                backgroundColor: minimalIconsEnabled
                  ? theme.colors.surfaceVariant
                  : withOpacity(iconAccentColor, "20"),
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: minimalIconsEnabled
                  ? outline
                  : withOpacity(iconAccentColor, "30"),
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

            <View style={{ gap: 2 }}>
              <Text
                style={{
                  color: textColor,
                  ...typography.editorial.sectionLabel,
                  fontSize: 16,
                  fontWeight: "700",
                  letterSpacing: -0.2,
                }}
              >
                {categoryLabel}
              </Text>
              <Text style={{ fontSize: 12, color: muted, lineHeight: 17 }}>
                {monthLabel}
              </Text>
            </View>
          </View>

          {/* Close */}
          <Pressable
            onPress={onDismiss}
            hitSlop={12}
            style={{
              width: 30,
              height: 30,
              borderRadius: 99,
              backgroundColor: withOpacity(muted, "14"),
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialCommunityIcons name="close" size={16} color={muted} />
          </Pressable>
        </View>

        {/* Summary stats */}
        <View
          style={{
            flexDirection: "row",
            marginTop: 18,
            marginBottom: 16,
            gap: 10,
          }}
        >
          {/* Total */}
          <View
            style={{
              flex: 1,
              backgroundColor: withOpacity(iconAccentColor, "10"),
              borderRadius: 14,
              borderWidth: 0.5,
              borderColor: withOpacity(iconAccentColor, "25"),
              paddingHorizontal: 14,
              paddingVertical: 11,
              gap: 4,
            }}
          >
            <Text
              style={{
                color: muted,
                textTransform: "uppercase",
                fontSize: 10,
                letterSpacing: 0.7,
                fontWeight: "600",
              }}
            >
              {mode === "income" ? "Total earned" : "Total spent"}
            </Text>
            <Text
              style={{
                fontSize: 22,
                fontWeight: "800",
                color: amountColor,
                letterSpacing: -0.6,
              }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatAmount(total, currencyCode, currencySymbol)}
            </Text>
          </View>

          {/* Count */}
          <View
            style={{
              width: 90,
              backgroundColor: withOpacity(muted, "08"),
              borderRadius: 14,
              borderWidth: 0.5,
              borderColor: outline,
              paddingHorizontal: 14,
              paddingVertical: 11,
              gap: 4,
            }}
          >
            <Text
              style={{
                color: muted,
                textTransform: "uppercase",
                fontSize: 10,
                letterSpacing: 0.7,
                fontWeight: "600",
              }}
            >
              Entries
            </Text>
            <Text
              style={{
                fontSize: 22,
                fontWeight: "800",
                color: textColor,
                letterSpacing: -0.6,
              }}
            >
              {transactions.length}
            </Text>
          </View>
        </View>
      </View>

      {/* Section label above list */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: 10,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <View style={{ height: 0.5, flex: 1, backgroundColor: outline }} />
        <Text
          style={{
            fontSize: 10,
            color: muted,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            fontWeight: "600",
          }}
        >
          All transactions
        </Text>
        <View style={{ height: 0.5, flex: 1, backgroundColor: outline }} />
      </View>

      {/* Transaction list */}
      <ScrollView
        style={{ flexShrink: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 24,
        }}
      >
        {transactions.length > 0 ? (
          transactions.map((txn, index) => (
            <Animated.View key={txn.id ?? index} style={getAnimStyle(index)}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 12,
                  borderBottomWidth: index < transactions.length - 1 ? 0.5 : 0,
                  borderBottomColor: outline,
                  gap: 12,
                }}
              >
                {/* Left accent dot */}
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 99,
                    backgroundColor: withOpacity(iconAccentColor, "70"),
                    flexShrink: 0,
                  }}
                />

                {/* Title + meta */}
                <View style={{ gap: 3, flex: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: textColor,
                      letterSpacing: -0.1,
                    }}
                  >
                    {txn.title}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: muted }}>
                      {formatDate(txn.date)}
                    </Text>
                    <View
                      style={{
                        width: 2.5,
                        height: 2.5,
                        borderRadius: 99,
                        backgroundColor: muted,
                        opacity: 0.35,
                      }}
                    />
                    <Text
                      numberOfLines={1}
                      style={{ fontSize: 12, color: muted, flexShrink: 1 }}
                    >
                      {txn.account}
                    </Text>
                  </View>
                </View>

                {/* Amount */}
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: amountColor,
                    letterSpacing: -0.2,
                    flexShrink: 0,
                  }}
                >
                  {mode === "income" ? "+" : ""}
                  {formatAmount(txn.amount, currencyCode, currencySymbol)}
                </Text>
              </View>
            </Animated.View>
          ))
        ) : (
          /* Empty state */
          <View
            style={{
              alignItems: "center",
              paddingVertical: 48,
              gap: 10,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: withOpacity(muted, "10"),
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 4,
              }}
            >
              <MaterialCommunityIcons
                name="receipt-outline"
                size={24}
                color={muted}
              />
            </View>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: textColor,
                opacity: 0.6,
              }}
            >
              No transactions
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: muted,
                textAlign: "center",
                lineHeight: 18,
                maxWidth: 200,
              }}
            >
              Nothing recorded under {categoryLabel} this month.
            </Text>
          </View>
        )}
      </ScrollView>
    </AnimatedPaperModal>
  );
}
