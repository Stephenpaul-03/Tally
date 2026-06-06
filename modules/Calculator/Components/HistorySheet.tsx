import { AnimatedPaperModal } from "@/components/modal/modal";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import type { HistoryEntry } from "../Hooks";
import { CalculatorStyles } from "../Styles";

type Props = {
  visible: boolean;
  history: HistoryEntry[];
  onDismiss: () => void;
  onRestoreEntry: (entry: HistoryEntry) => void;
};

export function HistorySheet({
  visible,
  history,
  onDismiss,
  onRestoreEntry,
}: Props) {
  const theme = useTheme();

  const content = useMemo(() => {
    if (history.length === 0) {
      return (
        <View style={CalculatorStyles.historyEmpty}>
          <Text
            variant="bodyMedium"
            style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: "center",
            }}
          >
            No calculations yet.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={CalculatorStyles.historyList}
        contentContainerStyle={CalculatorStyles.historyListContent}
        showsVerticalScrollIndicator={false}
      >
        {history.map((item, index) => (
          <Pressable
            key={item.id}
            onPress={() => onRestoreEntry(item)}
            style={({ pressed }) => [
              CalculatorStyles.historyRow,
              {
                borderBottomColor: theme.colors.outlineVariant,
                borderBottomWidth:
                  index === history.length - 1 ? 0 : StyleSheet.hairlineWidth,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <Text
              variant="bodyMedium"
              numberOfLines={1}
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {item.expression}
            </Text>
            <Text
              variant="titleMedium"
              numberOfLines={1}
              style={{ color: theme.colors.onSurface, fontWeight: "700" }}
            >
              {item.result}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    );
  }, [history, theme.colors, onRestoreEntry]);

  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onDismiss}
      presentation="sheet"
      contentContainerStyle={[
        CalculatorStyles.sheet,
        {
          backgroundColor: theme.colors.elevation.level1,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <View style={CalculatorStyles.sheetHandleWrap}>
        <View
          style={[
            CalculatorStyles.sheetHandle,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />
      </View>
      <View style={CalculatorStyles.sheetHeader}>
        <Text
          variant="titleMedium"
          style={{
            ...typography.editorial.sectionLabel,
            fontSize: 18,
            color: theme.colors.onSurface,
          }}
        >
          History
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close history"
          hitSlop={8}
          onPress={onDismiss}
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.68 : 1,
          })}
        >
          <MaterialCommunityIcons
            name="close"
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
        </Pressable>
      </View>
      {content}
    </AnimatedPaperModal>
  );
}
