import { HomeDraftAction } from "./HomeDraftAction";
import { ClassicHomeOverview } from "./ClassicHomeOverview";
import { Gesture } from "react-native-gesture-handler";
import {
  HomePresentation,
  useClassicHome,
  useHomeCardShape,
} from "./HomeCardContext";
import { typography } from "@/theme/typography";
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
import { monthLabel } from "@/modules/Insights/calculations";
import { ledgerMoney } from "./presentation";
import { homeOverview } from "./homeOverview";
import { MonthPickerSheet } from "./MonthPickerSheet";

export function HomePage(
  props: React.ComponentProps<typeof HomePageContent> & { classic?: boolean },
) {
  const theme = useTheme<ExtendedMD3Theme>();
  return (
    <HomePresentation classic={Boolean(props.classic) && !theme.expressive}>
      <HomePageContent {...props} />
    </HomePresentation>
  );
}

function HomePageContent({
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
  const classic = useClassicHome();
  const homeCardShape = useHomeCardShape();
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
        {
          backgroundColor: classic ? "transparent" : c.surfaceVariant,
          opacity: pressed ? 0.65 : 1,
        },
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
          <Text
            style={[
              { fontSize: 22, fontWeight: "800", color: c.primary },
              classic && { ...typography.editorial.hero, color: c.primary },
            ]}
          >
            {classic ? "TALLY" : "tally"}
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <HomeDraftAction
              active={active}
              currency={currency}
              symbol={symbol}
            />
            {iconButton("cog-outline", "Settings", () =>
              navigation.navigate("Settings"),
            )}
          </View>
        </View>
        <HomeGreetingCards
          active={active}
          onChooseMonth={() => setPicker(true)}
        />
        <SpotlightTarget id="overview" enabled={active}>
          {classic ? (
            <ClassicHomeOverview
              balance={balance}
              received={received}
              spent={spent}
              money={money}
              onIncome={() =>
                setDetail({
                  title: "Income",
                  description: monthLabel(month),
                  transactions: income,
                  summary: { label: "Income", value: money(received) },
                })
              }
              onSpent={() =>
                setDetail({
                  title: "Spent",
                  description: monthLabel(month),
                  transactions: expenses,
                  summary: { label: "Spent", value: money(spent) },
                })
              }
            />
          ) : (
            <View
              style={[
                s.hero,
                homeCardShape("balance", 40),
                { backgroundColor: classic ? c.surface : c.primaryContainer },
                classic && { padding: 18, gap: 10 },
              ]}
            >
              <View style={s.between}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    ...(classic ? typography.editorial.sectionLabel : {}),
                    color: classic ? c.onSurface : c.onPrimaryContainer,
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
                style={[
                  s.balance,
                  classic && {
                    ...typography.bodyStrong,
                    fontSize: 42,
                    lineHeight: 52,
                    letterSpacing: -1.5,
                  },
                  { color: classic ? c.onSurface : c.onPrimaryContainer },
                ]}
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
                    style={[
                      s.innerPill,
                      {
                        backgroundColor: classic ? "transparent" : c.background,
                      },
                      classic && {
                        borderRadius: 0,
                        padding: 0,
                        paddingVertical: 8,
                      },
                    ]}
                  >
                    <View
                      style={[
                        s.smallIcon,
                        {
                          backgroundColor: classic
                            ? "transparent"
                            : name === "Income"
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
                          color: classic ? c.onSurface : c.onPrimaryContainer,
                        }}
                      >
                        {money(value)}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
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
