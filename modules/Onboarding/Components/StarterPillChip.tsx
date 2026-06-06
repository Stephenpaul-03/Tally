import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";
import { Text, type MD3Theme } from "react-native-paper";

import type { OnboardingStyles } from "../Styles";
import type { StarterPill } from "../Types";

type Props = {
  pill: StarterPill;
  selected: boolean;
  onPress: () => void;
  styles: OnboardingStyles;
  theme: MD3Theme;
};

export function StarterPillChip({
  pill,
  selected,
  onPress,
  styles,
  theme,
}: Props) {
  return (
    <Pressable
      disabled={selected && pill.protected}
      onPress={onPress}
      style={[
        styles.starterPill,
        selected && {
          backgroundColor: `${pill.color}18`,
          borderColor: pill.color,
        },
        selected && pill.protected && styles.protectedPill,
      ]}
    >
      <View style={styles.starterPillIcon}>
        <MaterialCommunityIcons
          color={pill.color}
          name={pill.icon as any}
          size={16}
        />
      </View>
      <Text style={styles.starterPillText}>{pill.name}</Text>
      {selected && pill.protected ? (
        <MaterialCommunityIcons
          color={theme.colors.onSurfaceVariant}
          name="lock-outline"
          size={13}
        />
      ) : selected ? (
        <MaterialCommunityIcons
          color={theme.colors.onSurfaceVariant}
          name="close"
          size={14}
        />
      ) : (
        <MaterialCommunityIcons color={pill.color} name="plus" size={14} />
      )}
    </Pressable>
  );
}
