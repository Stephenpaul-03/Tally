import { Gesture } from "react-native-gesture-handler";
import { homeCardShape } from "./homeCardAppearance";
import { HomeAttention } from "./HomeAttentionCards";
import { HomeGreetingCards } from "./HomeGreetingCards";
import {
  DetailsSheet,
  type Detail,
} from "@/modules/Insights/sheets/DetailsSheet";
import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import type { RootParamList } from "@/navigation/types";
import type { Transaction } from "@/utils/Types";
import { DesignText as Text } from "@/components/DesignText";
import { SpotlightTarget } from "@/modules/Onboarding/SpotlightTour";
import { monthLabel, shiftMonth } from "@/modules/Insights/calculations";
import { ledgerMoney } from "./presentation";
import { homeOverview } from "./homeOverview";
import { MonthPickerSheet } from "./MonthPickerSheet";

export function HomePage({
  active,
  pagePan,
  raw,
  month,
  currency,
  symbol,
  onMonth,
  onEdit,
}: {
  active: boolean;
  pagePan: ReturnType<typeof Gesture.Pan>;
  raw: Transaction[];
  month: string;
  currency: string;
  symbol: string;
  onMonth: (month: string) => void;
  onEdit: (id: string) => void;
}) {
  const { colors: c } = useTheme<ExtendedMD3Theme>();
  const { bottom } = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const model = React.useMemo(
    () => homeOverview(raw, month, currency),
    [raw, month, currency],
  );
  const [picker, setPicker] = React.useState(false);
  const [detail, setDetail] = React.useState<Detail | null>(null);
  const balance = model.left;
  const received = model.income;
  const spent = model.spent;
  const currencyRows = React.useMemo(
    () =>
      raw.filter(
        (row) =>
          !row.deleted &&
          row.date?.startsWith(month) &&
          (row.currencyCode || currency) === currency,
      ),
    [raw, month, currency],
  );
  const income = currencyRows.filter((row) => row.type === "income");
  const expenses = currencyRows.filter((row) => row.type === "expense");
  const money = (value: number) => ledgerMoney(value, currency, symbol);
  const monthTitle = new Date(`${month}-01T12:00:00`).toLocaleDateString(
    undefined,
    { month: "short", year: "numeric" },
  );
  const iconButton = (
    icon: React.ComponentProps<typeof Icon>["name"],
    label: string,
    onPress: () => void,
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        s.iconButton,
        { backgroundColor: c.surfaceVariant, opacity: pressed ? 0.65 : 1 },
      ]}
    >
      <Icon name={icon} size={21} color={c.onSurface} />
    </Pressable>
  );
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          padding: 16,
          gap: 14,
          paddingBottom: 104 + bottom,
        }}
      >
        <View style={s.between}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: c.primary }}>
            tally
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={[s.stepper, { backgroundColor: c.surfaceVariant }]}>
              {iconButton("chevron-left", "Previous month", () =>
                onMonth(shiftMonth(month, -1)),
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Choose month, ${monthTitle}`}
                onPress={() => setPicker(true)}
                style={{ minHeight: 44, justifyContent: "center" }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "800",
                    color: c.onSurface,
                  }}
                >
                  {monthTitle}
                </Text>
              </Pressable>
              {iconButton("chevron-right", "Next month", () =>
                onMonth(shiftMonth(month, 1)),
              )}
            </View>
            {iconButton("cog-outline", "Settings", () =>
              navigation.navigate("Settings"),
            )}
          </View>
        </View>
        <HomeGreetingCards active={active} />
        <SpotlightTarget id="overview" enabled={active}>
          <View
            style={[
              s.hero,
              homeCardShape("balance", 40),
              { backgroundColor: c.primaryContainer },
            ]}
          >
            <View style={s.between}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: c.onPrimaryContainer,
                }}
              >
                Balance
              </Text>
              {balance < 0 ? (
                <View
                  style={[s.errorChip, { backgroundColor: c.errorContainer }]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: c.onErrorContainer,
                    }}
                  >
                    Over by {money(balance)}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[s.balance, { color: c.onPrimaryContainer }]}
            >
              {balance < 0 ? "−" : ""}
              {money(balance)}
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {(
                [
                  ["Income", received, "arrow-bottom-left", income],
                  ["Spent", spent, "arrow-top-right", expenses],
                ] as const
              ).map(([name, value, icon, rows]) => (
                <Pressable
                  key={name}
                  accessibilityRole="button"
                  accessibilityLabel={`View ${name.toLowerCase()} transactions`}
                  onPress={() =>
                    setDetail({
                      title: name,
                      description: monthLabel(month),
                      transactions: rows,
                      summary: { label: name, value: money(value) },
                    })
                  }
                  style={[s.innerPill, { backgroundColor: c.background }]}
                >
                  <View
                    style={[
                      s.smallIcon,
                      {
                        backgroundColor:
                          name === "Income"
                            ? c.secondaryContainer
                            : c.errorContainer,
                      },
                    ]}
                  >
                    <Icon
                      name={icon}
                      size={22}
                      color={
                        name === "Income"
                          ? c.onSecondaryContainer
                          : c.onErrorContainer
                      }
                    />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: c.onSurfaceVariant,
                        fontWeight: "600",
                      }}
                    >
                      {name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={{
                        fontSize: 17,
                        fontWeight: "800",
                        color: c.onPrimaryContainer,
                      }}
                    >
                      {money(value)}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </SpotlightTarget>
        <HomeAttention
          onTransaction={onEdit}
          pagePan={pagePan}
          active={active}
          raw={raw}
          month={month}
          currency={currency}
          symbol={symbol}
          onBudget={() =>
            navigation.navigate("Settings", { section: "budget" })
          }
        />
      </ScrollView>
      <DetailsSheet
        detail={active ? detail : null}
        onClose={() => setDetail(null)}
        money={money}
        onTransaction={onEdit}
      />
      <MonthPickerSheet
        visible={picker}
        month={month}
        onChange={onMonth}
        onDismiss={() => setPicker(false)}
      />
    </View>
  );
}
const s = StyleSheet.create({
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  stepper: { flexDirection: "row", alignItems: "center", borderRadius: 24 },
  hero: { padding: 22, gap: 16, borderRadius: 40, borderBottomLeftRadius: 12 },
  balance: {
    fontWeight: "800",
    fontSize: 68,
    letterSpacing: -3,
    lineHeight: 80,
  },
  errorChip: { borderRadius: 20, paddingHorizontal: 11, paddingVertical: 7 },
  innerPill: {
    flex: 1,
    minWidth: 0,
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 26,
  },
  smallIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
