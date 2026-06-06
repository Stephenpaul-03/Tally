import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";

import type { OnboardingStyles } from "../Styles";

type Props = {
  color: string;
  label: string;
  styles: OnboardingStyles;
};

export function HintBox({ color, label, styles }: Props) {
  return (
    <View style={styles.hintBox}>
      <MaterialCommunityIcons
        color={color}
        name="information-outline"
        size={16}
      />
      <Text style={styles.hintText}>{label}</Text>
    </View>
  );
}
