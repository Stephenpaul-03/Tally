import { typography } from "@/theme/typography";
import React from "react";
import { Pressable, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { BUTTONS, OPERATORS } from "../Constants";
import { CalculatorStyles } from "../Styles";

type Props = {
  operator: string | null;
  waitingForOperand: boolean;
  activeFunction: "percent" | null;
  showAddTransactionPrompt: boolean;
  tabBarMode: "basic" | "floating";
  onPress: (btn: string) => void;
};

export function CalculatorButtons({
  operator,
  waitingForOperand,
  activeFunction,
  showAddTransactionPrompt,
  tabBarMode,
  onPress,
}: Props) {
  const theme = useTheme();
  const rows = React.useMemo(
    () =>
      BUTTONS.map((row) =>
        tabBarMode === "basic" ? row : row.filter((btn) => btn !== "ADD"),
      ),
    [tabBarMode],
  );

  return (
    <View style={CalculatorStyles.buttons}>
      {rows.map((row, ri) => (
        <View key={ri} style={CalculatorStyles.row}>
          {row.map((btn) => {
            const isOp = OPERATORS.includes(btn);
            const isEq = btn === "=";
            const isFunc = ["÷", "%", "⌫"].includes(btn);
            const isClear = btn === "C";
            const isAdd = btn === "ADD";
            const active = isOp && btn === operator && waitingForOperand;
            const isPercentActive = btn === "%" && activeFunction === "percent";
            const isZeroWide = btn === "0" && tabBarMode === "floating";

            let btnBg: string;
            let btnColor: string;

            if (isClear) {
              btnBg = "#E53935";
              btnColor = "#FFFFFF";
            } else if (isAdd) {
              btnBg = showAddTransactionPrompt
                ? theme.colors.primary
                : theme.colors.primaryContainer;
              btnColor = showAddTransactionPrompt
                ? theme.colors.onPrimary
                : theme.colors.primary;
            } else if (isEq || active) {
              btnBg = theme.colors.primary;
              btnColor = theme.colors.onPrimary;
            } else if (isPercentActive) {
              btnBg = theme.colors.primary;
              btnColor = theme.colors.onPrimary;
            } else if (isOp || isFunc) {
              btnBg = theme.colors.primary + "18";
              btnColor = theme.colors.primary;
            } else {
              btnBg = theme.colors.onSurface + "08";
              btnColor = theme.colors.onSurface;
            }

            return (
              <Pressable
                key={btn}
                style={({ pressed }) => [
                  CalculatorStyles.button,
                  isZeroWide && CalculatorStyles.buttonWide,
                  { backgroundColor: btnBg, opacity: pressed ? 0.72 : 1 },
                ]}
                onPress={() => onPress(btn)}
              >
                <Text
                  style={[
                    CalculatorStyles.buttonText,
                    {
                      color: btnColor,
                    },
                    isAdd && {
                      ...typography.editorial.sectionLabel,
                      fontSize: 16,
                    },
                  ]}
                >
                  {isAdd ? "Save" : btn}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
