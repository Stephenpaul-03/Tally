import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text, type MD3Theme } from "react-native-paper";
import type { StarterPill } from "../Types";

type Props = {
  pill: StarterPill;
  selected: boolean;
  onPress: () => void;
  theme: MD3Theme;
  cardWidth?: number; // passed when selected, forces 3-per-row
};

export function StarterPillChip({
  pill,
  selected,
  onPress,
  theme,
  cardWidth,
}: Props) {
  if (selected) {
    return (
      <Pressable
        disabled={pill.protected}
        onPress={onPress}
        style={[
          s.selectedCard,
          cardWidth != null && { width: cardWidth },
          {
            backgroundColor: `${pill.color}12`,
            borderColor: `${pill.color}40`,
          },
        ]}
      >
        <View
          style={[s.selectedIconWrap, { backgroundColor: `${pill.color}20` }]}
        >
          <MaterialCommunityIcons
            color={pill.color}
            name={pill.icon as any}
            size={18}
          />
        </View>
        <Text
          style={[s.selectedLabel, { color: theme.colors.onSurface }]}
          numberOfLines={1}
        >
          {pill.name}
        </Text>
        <View style={s.selectedAction}>
          {pill.protected ? (
            <MaterialCommunityIcons
              color={theme.colors.onSurfaceVariant}
              name="lock-outline"
              size={14}
            />
          ) : (
            <MaterialCommunityIcons
              color={theme.colors.onSurfaceVariant}
              name="close"
              size={16}
            />
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={[
        s.availableRow,
        {
          backgroundColor: theme.colors.elevation.level1,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <View
        style={[s.availableIconWrap, { backgroundColor: `${pill.color}18` }]}
      >
        <MaterialCommunityIcons
          color={pill.color}
          name={pill.icon as any}
          size={18}
        />
      </View>
      <Text
        style={[s.availableLabel, { color: theme.colors.onSurface }]}
        numberOfLines={1}
      >
        {pill.name}
      </Text>
      <View
        style={[s.plusWrap, { backgroundColor: theme.colors.surfaceVariant }]}
      >
        <MaterialCommunityIcons
          color={theme.colors.onSurfaceVariant}
          name="plus"
          size={16}
        />
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  selectedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
  },
  selectedIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  selectedLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
  },
  selectedAction: {
    flexShrink: 0,
  },
  availableRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  availableIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  availableLabel: {
    flex: 1,
    fontSize: 14,
  },
  plusWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
