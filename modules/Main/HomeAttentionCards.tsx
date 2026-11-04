import { tonalButtonSurface } from "@/theme/surfaceTreatment";
import { typography } from "@/theme/typography";
import { TransactionRow } from "@/modules/Management/Transaction/Components/TransactionRow";
import { homeQuickFacts } from "./homeQuickFacts";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { HomeText as Text } from "./HomeText";
import type { Transaction } from "@/utils/Types";
import { useClassicHome, useHomeCardShape } from "./HomeCardContext";

export function HomeAttention({
  raw,
  month,
  currency,
  onTransaction,
}: {
  raw: Transaction[];
  month: string;
  currency: string;
  onTransaction: (id: string) => void;
}) {
  const theme = useTheme();
  const { colors: c } = theme;
  const classic = useClassicHome();
  const homeCardShape = useHomeCardShape();
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const recent = React.useMemo(
    () => homeQuickFacts(raw, month, currency, today).recent,
    [raw, month, currency, today],
  );
  return (
    <View>
      {recent.length ? (
        <View
          style={{
            ...(classic
              ? {
                  borderRadius: 20,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: c.outlineVariant,
                }
              : homeCardShape("greeting")),
            padding: 8,
            gap: 2,
            backgroundColor: classic ? c.surface : tonalButtonSurface(theme),
          }}
        >
          <Text
            style={{
              padding: 10,
              fontSize: 18,
              fontWeight: "800",
              ...(classic ? typography.editorial.sectionLabel : {}),
              color: c.onSurface,
            }}
          >
            Recent transactions
          </Text>
          {recent.map((row, index) => (
            <View
              key={row.id}
              style={
                classic
                  ? {
                      borderTopWidth: index > 0 ? StyleSheet.hairlineWidth : 0,
                      borderColor: c.outlineVariant,
                      paddingHorizontal: 2,
                      paddingVertical: 4,
                    }
                  : undefined
              }
            >
              <TransactionRow
                transaction={row}
                homeReveal
                grouped
                groupPosition={
                  index === recent.length - 1 ? "last" : "middle"
                }
                showDivider={false}
                disableLongPress
                secondaryLabelMode="date"
                onPressTransaction={onTransaction}
              />
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
