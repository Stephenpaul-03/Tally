import { AnimatedPaperModal } from "@/components/modal/modal";
import type { QuickShareInsightsMode } from "@/hooks/use-quickshare-insights";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import { Text, useTheme } from "react-native-paper";

type QuickShareInsightsModalProps = {
  visible: boolean;
  onDismiss: () => void;
  isGenerating: boolean;
  activeMode: QuickShareInsightsMode | null;
  onShare: (mode: QuickShareInsightsMode) => void | Promise<void>;
};

const ACTIONS: {
  key: QuickShareInsightsMode;
  label: string;
  description: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
}[] = [
  {
    key: "lastMonth",
    label: "Last month",
    description: "Category-by-category comparison against the previous month.",
    icon: "chart-line-variant",
  },
  {
    key: "budget",
    label: "Budget",
    description: "Spending totals lined up against this month's plan.",
    icon: "target",
  },
  {
    key: "both",
    label: "Both",
    description:
      "Monthly summary, last-month comparison, and budget — one PDF.",
    icon: "layers-triple-outline",
  },
];

export function QuickShareInsightsModal({
  visible,
  onDismiss,
  isGenerating,
  activeMode,
  onShare,
}: QuickShareInsightsModalProps) {
  const theme = useTheme();
  const { height } = useWindowDimensions();

  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onDismiss}
      presentation="sheet"
      dismissable={!isGenerating}
      contentContainerStyle={{ justifyContent: "flex-end" }}
    >
      <View
        style={{
          backgroundColor: theme.colors.background,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingTop: 12,
          paddingBottom: 28,
          gap: 14,
        }}
      >
        {/* Drag handle */}
        <View
          style={{
            alignSelf: "center",
            width: 38,
            height: 4,
            borderRadius: 999,
            backgroundColor: theme.colors.outlineVariant,
          }}
        />

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            gap: 14,
          }}
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: height * 0.75 }}
        >
          {/* Section label */}
          <Text
            style={{
              fontSize: 12,
              fontWeight: "500",
              letterSpacing: 0.6,
              textTransform: "uppercase",
              color: theme.colors.primary,
            }}
          >
            Export as PDF
          </Text>

          {/* Actions */}
          <View style={{ gap: 10 }}>
            {ACTIONS.map((action) => {
              const isActive = activeMode === action.key;
              const isDisabled = isGenerating && !isActive;

              return (
                <Pressable
                  key={action.key}
                  disabled={isGenerating}
                  onPress={() => void onShare(action.key)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                    borderRadius: 16,
                    borderWidth: 0.5,
                    borderColor: isActive
                      ? theme.colors.primary
                      : theme.colors.outlineVariant,
                    backgroundColor: isActive
                      ? theme.colors.primaryContainer
                      : theme.colors.elevation.level1,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    opacity: pressed ? 0.75 : isDisabled ? 0.4 : 1,
                  })}
                >
                  {/* Icon badge */}
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isActive
                        ? theme.colors.primary
                        : theme.colors.surfaceVariant,
                    }}
                  >
                    {isActive && isGenerating ? (
                      <ActivityIndicator
                        size={18}
                        color={theme.colors.onPrimary}
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name={action.icon}
                        size={20}
                        color={
                          isActive
                            ? theme.colors.onPrimary
                            : theme.colors.onSurfaceVariant
                        }
                      />
                    )}
                  </View>

                  {/* Labels */}
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "500",
                        color: isActive
                          ? theme.colors.primary
                          : theme.colors.onSurface,
                      }}
                    >
                      {action.label}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        lineHeight: 18,
                        color: isActive
                          ? theme.colors.primary
                          : theme.colors.onSurfaceVariant,
                      }}
                    >
                      {action.description}
                    </Text>
                  </View>

                  {/* Trailing share icon */}
                  <MaterialCommunityIcons
                    name="share-outline"
                    size={18}
                    color={
                      isActive
                        ? theme.colors.primary
                        : theme.colors.onSurfaceVariant
                    }
                  />
                </Pressable>
              );
            })}
          </View>

          {/* Generating banner */}
          {isGenerating && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                backgroundColor: theme.colors.primaryContainer,
                borderRadius: 12,
                borderWidth: 0.5,
                borderColor: theme.colors.primary,
                paddingHorizontal: 14,
                paddingVertical: 12,
              }}
            >
              <ActivityIndicator size={14} color={theme.colors.primary} />
              <Text
                style={{
                  fontSize: 13,
                  color: theme.colors.primary,
                }}
              >
                Generating your PDF…
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </AnimatedPaperModal>
  );
}
