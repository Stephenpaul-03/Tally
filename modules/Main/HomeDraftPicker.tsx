import { tonalButtonSurface } from "@/theme/surfaceTreatment";
import React from "react";
import { FlatList, Pressable, View } from "react-native";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { DesignText as Text } from "@/components/DesignText";
import type { TransactionDraft } from "@/utils/Types";
import { ledgerMoney } from "./presentation";
import { homeCardTone } from "./homeCardAppearance";

export function HomeDraftPicker({
  visible,
  drafts,
  currency,
  symbol,
  onClose,
  onChoose,
}: {
  visible: boolean;
  drafts: TransactionDraft[];
  currency: string;
  symbol: string;
  onClose: () => void;
  onChoose: (id: string) => void;
}) {
  const theme = useTheme();
  const { colors: c, dark } = theme;
  const [background, foreground] = homeCardTone("drafts", dark);
  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onClose}
      presentation="sheet"
      contentContainerStyle={{
        backgroundColor: c.background,
        maxHeight: "80%",
        paddingTop: 12,
      }}
    >
      <View
        style={{
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: c.outlineVariant,
          alignSelf: "center",
          marginBottom: 12,
        }}
      />
      <View style={{ paddingHorizontal: 20, gap: 4, paddingBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text
            accessibilityRole="header"
            style={{
              flex: 1,
              fontSize: 24,
              fontWeight: "800",
              color: c.onSurface,
            }}
          >
            Continue a draft
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close draft picker"
            onPress={onClose}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: tonalButtonSurface(theme),
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="close" size={22} color={c.onSurface} />
          </Pressable>
        </View>
        <Text style={{ fontSize: 13, color: c.onSurfaceVariant }}>
          {drafts.length} unfinished entries · Choose one to continue
        </Text>
      </View>
      <FlatList
        style={{ flexGrow: 0 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 20,
          gap: 8,
        }}
        data={drafts}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Continue ${item.title || item.category}, ${ledgerMoney(item.amount, item.currencyCode || currency, item.currencySymbol || symbol)}`}
            onPress={() => onChoose(item.id)}
            style={({ pressed }) => ({
              padding: 16,
              borderRadius: 24,
              backgroundColor: background,
              opacity: pressed ? 0.7 : 1,
              gap: 6,
            })}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Text
                numberOfLines={2}
                style={{
                  flex: 1,
                  fontSize: 16,
                  fontWeight: "700",
                  color: foreground,
                }}
              >
                {item.title || item.category || "Untitled draft"}
              </Text>
              <Text
                style={{ fontSize: 16, fontWeight: "800", color: foreground }}
              >
                {ledgerMoney(
                  item.amount,
                  item.currencyCode || currency,
                  item.currencySymbol || symbol,
                )}
              </Text>
              <Icon name="chevron-right" size={20} color={foreground} />
            </View>
            <Text
              numberOfLines={2}
              style={{ fontSize: 12, color: foreground, opacity: 0.85 }}
            >
              {item.type === "income" ? "Income" : "Expense"} · {item.category}{" "}
              · {item.account}
            </Text>
            <Text style={{ fontSize: 11, color: foreground, opacity: 0.75 }}>
              Updated{" "}
              {new Date(item.updatedAt).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </Text>
          </Pressable>
        )}
      />
    </AnimatedPaperModal>
  );
}
