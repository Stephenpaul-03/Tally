import { AnimatedPaperModal } from "@/components/modal/modal";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import { Pressable, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

export type TransactionSearchScope = "day" | "month" | "all";

const OPTIONS: {
  key: TransactionSearchScope;
  label: string;
  description: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
}[] = [
  {
    key: "day",
    label: "Day",
    description: "Search only the selected date",
    icon: "calendar-today",
  },
  {
    key: "month",
    label: "Month",
    description: "Every transaction in the selected month",
    icon: "calendar-month",
  },
  {
    key: "all",
    label: "All time",
    description: "Search across your full transaction history",
    icon: "history",
  },
];

export function SearchScopeSheet({
  visible,
  selectedScope,
  onDismiss,
  onSelect,
}: {
  visible: boolean;
  selectedScope: TransactionSearchScope;
  onDismiss: () => void;
  onSelect: (scope: TransactionSearchScope) => void;
}) {
  const theme = useTheme();

  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onDismiss}
      presentation="sheet"
      contentContainerStyle={{ justifyContent: "flex-end" }}
    >
      <View
        style={{
          backgroundColor: theme.colors.background,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: 28,
          gap: 18,
        }}
      >
        {/* Drag handle */}
        <View
          style={{
            alignSelf: "center",
            width: 42,
            height: 4,
            borderRadius: 999,
            backgroundColor: theme.colors.outlineVariant,
          }}
        />

        {/* Header */}
        <View style={{ gap: 4 }}>
          <Text
            style={{
              fontSize: 17,
              fontWeight: "500",
              color: theme.colors.onSurface,
            }}
          >
            Search scope
          </Text>
          <Text
            style={{
              fontSize: 13,
              lineHeight: 19,
              color: theme.colors.onSurfaceVariant,
            }}
          >
            Pick how much transaction history the search should cover.
          </Text>
        </View>

        {/* Options */}
        <View style={{ gap: 8 }}>
          {OPTIONS.map((option) => {
            const selected = option.key === selectedScope;

            return (
              <Pressable
                key={option.key}
                onPress={() => {
                  onSelect(option.key);
                  onDismiss();
                }}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderRadius: 14,
                  borderWidth: 0.5,
                  borderColor: selected
                    ? theme.colors.primary
                    : theme.colors.outlineVariant,
                  backgroundColor: selected
                    ? theme.colors.primaryContainer
                    : theme.colors.elevation.level1,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                {/* Icon badge */}
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: selected
                      ? theme.colors.primary
                      : theme.colors.surfaceVariant,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialCommunityIcons
                    name={option.icon}
                    size={18}
                    color={
                      selected
                        ? theme.colors.onPrimary
                        : theme.colors.onSurfaceVariant
                    }
                  />
                </View>

                {/* Labels */}
                <View style={{ flex: 1, gap: 2 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: selected
                        ? theme.colors.primary
                        : theme.colors.onSurface,
                    }}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      lineHeight: 17,
                      color: selected
                        ? theme.colors.primary
                        : theme.colors.onSurfaceVariant,
                      opacity: selected ? 0.75 : 1,
                    }}
                  >
                    {option.description}
                  </Text>
                </View>

                {/* Check indicator */}
                {selected && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={theme.colors.primary}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </AnimatedPaperModal>
  );
}
