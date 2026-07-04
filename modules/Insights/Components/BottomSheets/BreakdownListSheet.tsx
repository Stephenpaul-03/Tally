import { useStagger } from "@/components/animations/UseStagger";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { useAppSelector } from "@/hooks/Redux";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import { typography } from "@/theme/typography";
import { withOpacity } from "@/utils/Helpers";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Animated, Pressable, ScrollView, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import type { BreakdownItem, CategoryComparisonRow } from "../../Types";
import { formatAmount } from "../../Utils";

type CustomSheetRow = {
  key: string;
};

type BreakdownBottomSheetProps = {
  visible: boolean;
  onDismiss: () => void;
  breakdown: BreakdownItem[];
  mode: "expense" | "income";
  bg: string;
  outline: string;
  textColor: string;
  muted: string;
  trackColor: string;
  onModeChange: (mode: "expense" | "income") => void;
  onRowPress: (item: BreakdownItem) => void;
  categoryComparison?: CategoryComparisonRow[];
  title?: string;
  showModeToggle?: boolean;
  interactiveRows?: boolean;
  showChevron?: boolean;
  customRows?: CustomSheetRow[];
  renderCustomRow?: (props: {
    item: CustomSheetRow;
    index: number;
    textColor: string;
    muted: string;
    currencyCode: string;
    minimalIconsEnabled: boolean;
    primaryColor: string;
    surfaceVariant: string;
    onPress: () => void;
  }) => React.ReactNode;
};

const ICON_SIZE = 40;

function CategoryRow({
  item,
  textColor,
  muted,
  onPress,
  minimalIconsEnabled,
  primaryColor,
  surfaceVariant,
  currencyCode,
  currencySymbol,
  interactive,
  showChevron,
}: {
  item: BreakdownItem;
  textColor: string;
  muted: string;
  onPress: () => void;
  minimalIconsEnabled: boolean;
  primaryColor: string;
  surfaceVariant: string;
  currencyCode: string;
  interactive: boolean;
  showChevron: boolean;
  currencySymbol: string;
}) {
  const accent = item.color;
  const iconAccent = minimalIconsEnabled ? primaryColor : accent;

  return (
    <Pressable
      disabled={!interactive}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: withOpacity(
          textColor,
          interactive && pressed ? "0A" : "00",
        ),
        paddingVertical: 6,
        opacity: interactive && pressed ? 0.85 : 1,
      })}
    >
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
              : withOpacity(iconAccent, "14"),
          }}
        >
          <MaterialCommunityIcons
            name={item.icon as any}
            size={24}
            color={iconAccent}
          />
        </View>

        <View style={{ flex: 1, gap: 2 }}>
          <Text
            numberOfLines={1}
            style={{ fontSize: 14, fontWeight: "500", color: textColor }}
          >
            {item.category}
          </Text>
        </View>

        <View style={{ alignItems: "flex-end", gap: 2 }}>
          <Text style={{ fontSize: 14, fontWeight: "500", color: textColor }}>
            {formatAmount(
              Math.round(item.amount as number),
              currencyCode,
              currencySymbol,
            )}
          </Text>
        </View>
        {showChevron ? (
          <MaterialCommunityIcons
            name="chevron-right"
            size={26}
            color={withOpacity(muted, "CC")}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

export function BreakdownBottomSheet({
  visible,
  onDismiss,
  breakdown,
  mode,
  bg,
  outline,
  textColor,
  muted,
  trackColor,
  onModeChange,
  onRowPress,
  title,
  showModeToggle = true,
  interactiveRows = true,
  showChevron = true,
  customRows,
  renderCustomRow,
}: BreakdownBottomSheetProps) {
  const theme = useTheme();
  const { minimalIconsEnabled } = useAddonPrefs();
  const activeWorkspace = useAppSelector(selectActiveWorkspace);
  const currencyCode = activeWorkspace?.currencyCode ?? "INR";
  const currencySymbol = activeWorkspace?.currencySymbol ?? "";

  const rows = React.useMemo(
    () =>
      customRows?.length
        ? customRows
        : breakdown.map((item) => ({ ...item, key: item.category })),
    [breakdown, customRows],
  );

  const { getAnimStyle } = useStagger({
    count: rows.length,
    stagger: 100,
    distance: 20,
    duration: 750,
    dataKey: `${visible}:${rows.map((item) => item.key).join("|")}`,
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
        maxHeight: "88%",
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
            {title}
          </Text>
          <Pressable onPress={onDismiss} hitSlop={10}>
            <MaterialCommunityIcons name="close" size={20} color={muted} />
          </Pressable>
        </View>

        {/* Mode toggle — only shown when requested */}
        {showModeToggle && (
          <View
            style={{
              flexDirection: "row",
              backgroundColor: trackColor,
              borderRadius: 11,
              padding: 3,
              gap: 2,
            }}
          >
            {(["expense", "income"] as const).map((itemMode) => {
              const active = mode === itemMode;
              return (
                <Pressable
                  key={itemMode}
                  onPress={() => onModeChange(itemMode)}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 9,
                    alignItems: "center",
                    backgroundColor: active ? bg : "transparent",
                  }}
                >
                  <Text
                    style={{
                      ...typography.editorial.sectionLabel,
                      fontSize: 14,
                      color: active ? textColor : muted,
                    }}
                  >
                    {itemMode === "expense" ? "Expenses" : "Income"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* Row list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 14,
          paddingTop: 8,
          paddingBottom: 36,
        }}
      >
        {rows.length === 0 ? (
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
        ) : (
          rows.map((item, index) => (
            <Animated.View key={item.key} style={[getAnimStyle(index)]}>
              {renderCustomRow && customRows ? (
                renderCustomRow({
                  item,
                  index,
                  textColor,
                  muted,
                  currencyCode,
                  minimalIconsEnabled,
                  primaryColor: theme.colors.primary,
                  surfaceVariant: theme.colors.surfaceVariant,
                  onPress: () => {
                    const matchedBreakdown = breakdown.find(
                      (breakdownItem) => breakdownItem.category === item.key,
                    );
                    if (matchedBreakdown) {
                      onRowPress(matchedBreakdown);
                    }
                  },
                })
              ) : (
                <CategoryRow
                  item={item as unknown as BreakdownItem}
                  textColor={textColor}
                  muted={muted}
                  onPress={() => onRowPress(item as unknown as BreakdownItem)}
                  minimalIconsEnabled={minimalIconsEnabled}
                  primaryColor={theme.colors.primary}
                  surfaceVariant={theme.colors.surfaceVariant}
                  currencyCode={currencyCode}
                  currencySymbol={currencySymbol}
                  interactive={interactiveRows}
                  showChevron={showChevron}
                />
              )}
            </Animated.View>
          ))
        )}
      </ScrollView>
    </AnimatedPaperModal>
  );
}
