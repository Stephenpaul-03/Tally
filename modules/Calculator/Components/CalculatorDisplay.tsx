import React from "react";
import { View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { CalculatorStyles } from "../Styles";

type Props = {
  display: string;
  expression: string;
};

export function CalculatorDisplay({ display, expression }: Props) {
  const theme = useTheme();

  return (
    <View style={CalculatorStyles.display}>
      <Text
        style={[
          CalculatorStyles.expression,
          { color: theme.colors.onSurfaceVariant },
        ]}
        numberOfLines={1}
      >
        {expression || " "}
      </Text>
      <View style={CalculatorStyles.resultPressable}>
        <Text
          style={[CalculatorStyles.result, { color: theme.colors.onSurface }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.4}
        >
          {display}
        </Text>
      </View>
    </View>
  );
}
