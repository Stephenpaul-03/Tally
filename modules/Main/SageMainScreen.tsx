import { MonthEmptyState } from "@/components/MonthEmptyState";
import { tonalButtonSurface } from "@/theme/surfaceTreatment";
import { FlowDisclosure } from "@/components/animations/FlowDisclosure";
import { TransactionRowsPresence, TransactionPresenceItem, useTransactionPresence, type PresenceRecord } from "@/modules/Management/Transaction/Components/TransactionMutation";
import { MainEntrance } from "@/components/animations/MainEntrance";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { HomePage } from "./HomePage";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import {
  useMotionEnabled,
  MotionEntranceScope,
} from "@/components/animations/Motion";
import { ExpressiveTabBar } from "./ExpressiveTabBar";
import {
  clampSwipePosition,
  snapSwipeIndex,
  snapTabIndex,
} from "./pagerGeometry";
import React from "react";
import {
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useAnimatedReaction,
  withTiming,
  cancelAnimation,
  Easing,
  useSharedValue,
  runOnJS,
} from "react-native-reanimated";
import { DesignText as Text } from "@/components/DesignText";
import { useAppShell } from "@/components/AppShellContext";
import { useSetTabBarHeight } from "@/components/tabbar/TabBarContext";
import { InsightsScreen } from "@/modules/Insights/InsightsScreen";

import { SpotlightTarget } from "@/modules/Onboarding/SpotlightTour";
import { TransactionRow } from "@/modules/Management/Transaction/Components/TransactionRow";
import { monthLabel } from "@/modules/Insights/calculations";
import type { RootParamList } from "@/navigation/types";
import type { Transaction, TransactionDraft } from "@/utils/Types";
import { MonthPickerSheet } from "./MonthPickerSheet";
import { EXPRESSIVE_TABS, separateLedgerTotals } from "./presentation";

type Row = Transaction | TransactionDraft;
type Section = {
  key: string;
  title: string;
  total: number;
  totalLabel?: string;
  metric?: "spent" | "earned";
  transactions: Row[];
};
type LedgerItem = PresenceRecord<Section> | "tools";
type Props = {
  sections: Section[];
  raw: Transaction[];
  month: string;
  currency: string;
  symbol: string;
  onMonth: (month: string) => void;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onSort: () => void;
  onFilter: () => void;
  filterCount: number;
  query: string;
  onQuery: (query: string) => void;
  collapsed: Record<string, boolean>;
  onCollapse: (key: string) => void;
  onFold: () => void;
};
function LedgerPage(p: Props & { active: boolean }) {
  const theme = useTheme<ExtendedMD3Theme>();
  const { colors: c } = theme;
  const { bottom } = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const list = React.useRef<FlatList<LedgerItem>>(null);
  React.useEffect(() => {
    list.current?.scrollToOffset({ offset: 0, animated: false });
  }, [p.month]);
  const [monthPicker, setMonthPicker] = React.useState(false);
  const sections = React.useMemo(() => p.sections.filter((section) => section.transactions.length), [p.sections]);
  const presence = useTransactionPresence(sections, (section) => section.key);
  const shownRows = sections
    .flatMap((section) => section.transactions)
    .filter((row) => !("isDraft" in row));
  const button = (
    icon: React.ComponentProps<typeof Icon>["name"],
    name: string,
    onPress: () => void,
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        { backgroundColor: tonalButtonSurface(theme), opacity: pressed ? 0.65 : 1 },
      ]}
    >
      <Icon name={icon} size={21} color={c.onSurface} />
    </Pressable>
  );
  const transactionTools = (
    <View style={[s.stickyTools, { backgroundColor: c.background }]}>
      <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
        {button("sort-variant", "Sort transactions", p.onSort)}
        {button(
          "filter-outline",
          `Filter transactions${p.filterCount ? `, ${p.filterCount} active` : ""}`,
          p.onFilter,
        )}
        {button("unfold-less-horizontal", "Fold or unfold all days", p.onFold)}
        <View
          style={{
            flex: 1,
            minWidth: 0,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: tonalButtonSurface(theme),
            borderRadius: 20,
            paddingHorizontal: 10,
          }}
        >
          <Icon name="magnify" size={21} color={c.onSurfaceVariant} />
          <TextInput
            accessibilityLabel="Search transactions"
            placeholder="Search"
            placeholderTextColor={c.onSurfaceVariant}
            value={p.query}
            onChangeText={p.onQuery}
            style={{
              flex: 1,
              minWidth: 0,
              height: 48,
              paddingHorizontal: 6,
              color: c.onSurface,
              fontFamily: "Figtree-600",
              fontSize: 14,
            }}
          />
          {p.query.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear transaction search"
              onPress={() => p.onQuery("")}
              style={{
                width: 36,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="close" size={18} color={c.onSurfaceVariant} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
  const header = (
    <View style={[s.header, { gap: 0, paddingBottom: 0 }]}>
      <SpotlightTarget id="transaction-heading" enabled={p.active}>
        <View style={s.between}>
          <Text
            style={[s.headline, { color: c.onSurface, flex: 1 }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            Transactions
          </Text>
          {button("cog-outline", "Settings", () =>
            navigation.navigate("Settings"),
          )}
        </View>
      </SpotlightTarget>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Choose transaction month, ${monthLabel(p.month)}`}
        onPress={() => setMonthPicker(true)}
        hitSlop={{ top: 8, bottom: 8 }}
        style={{ minHeight: 28, justifyContent: "center" }}
      >
        <Text
          style={{
            fontSize: 14,
            lineHeight: 20,
            includeFontPadding: false,
            color: c.onSurfaceVariant,
            fontWeight: "600",
          }}
        >
          {monthLabel(p.month)} · {shownRows.length}{" "}
          {shownRows.length === 1 ? "entry" : "entries"}
        </Text>
      </Pressable>
    </View>
  );
  const emptyState = <MonthEmptyState active={p.active} filtered={Boolean(p.query.trim() || p.filterCount)} onAdd={p.onAdd} onChooseMonth={() => setMonthPicker(true)} />;
  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={list}
        data={["tools", ...presence.records] as LedgerItem[]}
        stickyHeaderIndices={[1]}
        removeClippedSubviews={false}
        keyExtractor={(item) =>
          item === "tools" ? "transaction-tools" : item.key
        }
        ListHeaderComponent={header}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 92 + 56 + 8 + bottom, // Nav/FAB top plus one small row clearance.
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={emptyState}
        ListFooterComponent={!presence.records.length ? <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 16, paddingVertical: 24 }}>{emptyState}</View> : null}
        ListFooterComponentStyle={!presence.records.length ? { flexGrow: 1 } : undefined}
        renderItem={({ item: record }) => {
          if (record === "tools") return transactionTools;
          const item = record.item;
          const totals = separateLedgerTotals(
            item.transactions,
            p.currency,
            p.symbol,
          );
          const date = new Date(`${item.key}T12:00:00`),
            valid = !Number.isNaN(date.getTime());
          return (
            <TransactionPresenceItem record={record} complete={presence.complete} register={presence.register}>
            <View style={[s.day, { backgroundColor: c.surface }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${p.collapsed[item.key] ? "Expand" : "Collapse"} ${item.title}`}
                accessibilityState={{ expanded: !p.collapsed[item.key] }}
                onPress={() => p.onCollapse(item.key)}
                style={s.dayHeader}
              >
                <Text
                  style={{
                    color: c.primary,
                    fontSize: 32,
                    fontWeight: "800",
                    letterSpacing: -1,
                  }}
                >
                  {valid ? date.getDate() : "—"}
                </Text>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: c.onSurfaceVariant,
                    }}
                  >
                    {valid
                      ? date.toLocaleDateString(undefined, { weekday: "long" })
                      : item.title}
                  </Text>
                  {valid ? (
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: c.onSurfaceVariant,
                      }}
                    >
                      {date.toLocaleDateString(undefined, { month: "long" })}
                    </Text>
                  ) : null}
                </View>

                <View style={{ alignItems: "flex-end", gap: 3, flexShrink: 1 }}>
                  {totals.income !== null ? (
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: theme.semantic.income,
                        textAlign: "right",
                      }}
                    >
                      Income {totals.income}
                    </Text>
                  ) : null}
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: theme.semantic.expense,
                      textAlign: "right",
                    }}
                  >
                    Spent {totals.expense}
                  </Text>
                </View>

                {
                  <View style={[s.collapse, { backgroundColor: tonalButtonSurface(theme) }]}>
                    <Icon
                      name={
                        p.collapsed[item.key] ? "chevron-down" : "chevron-up"
                      }
                      size={22}
                      color={c.onSurface}
                    />
                  </View>
                }
              </Pressable>
              <FlowDisclosure open={!p.collapsed[item.key]}>
                <TransactionRowsPresence rows={item.transactions} renderRow={(row, index, count) => (
                  <View style={{ paddingTop: index > 0 ? 4 : 0 }}>
                    <TransactionRow
                      transaction={row}
                      onPressTransaction={p.onEdit}
                      grouped
                      groupPosition={
                        index === count - 1
                          ? "last"
                          : "middle"
                      }
                      secondaryLabelMode="time"
                    />
                  </View>
                )} />
              </FlowDisclosure>
            </View>
            </TransactionPresenceItem>
          );
        }}
      />
      <MonthPickerSheet
        visible={monthPicker && p.active}
        month={p.month}
        onChange={p.onMonth}
        onDismiss={() => setMonthPicker(false)}
      />
    </View>
  );
}
export function SageMainScreen(p: Props) {
  const { colors: c } = useTheme();
  const { activeTab, reportTab } = useAppShell();
  const { bottom } = useSafeAreaInsets();
  const reduceMotion = !useMotionEnabled();
  const position = useSharedValue(EXPRESSIVE_TABS.indexOf(activeTab));
  const navigationTarget = useSharedValue(EXPRESSIVE_TABS.indexOf(activeTab));
  const driving = useSharedValue(false);
  const fabProgress = useSharedValue(activeTab === "calendar" ? 1 : 0);
  useAnimatedReaction(
    () => position.value < 0.02,
    (shown, previous) => {
      if (shown === previous) return;
      fabProgress.value = withTiming(shown ? 1 : 0, {
        duration: reduceMotion ? 0 : shown ? 220 : 180,
        easing: shown ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      });
    },
    [reduceMotion],
  );
  const fabMotion = useAnimatedStyle(() => ({
    opacity: fabProgress.value,
    transform: [{ translateY: (1 - fabProgress.value) * 28 }],
  }));
  const start = useSharedValue(0);
  const origin = useSharedValue(0);
  const dragging = useSharedValue(false);
  const dimensions = useWindowDimensions();
  const [width, setWidth] = React.useState(dimensions.width);
  const settle = React.useCallback(
    (index: number) => reportTab(EXPRESSIVE_TABS[snapTabIndex(index)]),
    [reportTab],
  );
  const dismissKeyboard = React.useCallback(() => Keyboard.dismiss(), []);
  const finish = (index: number) => {
    "worklet";
    navigationTarget.value = index;
    position.value = withTiming(
      index,
      { duration: reduceMotion ? 0 : 220, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (!finished || navigationTarget.value !== index) return;
        driving.value = false;
        runOnJS(settle)(index);
      },
    );
  };
  const pan = Gesture.Pan()
    .activeOffsetX([-18, 18])
    .failOffsetY([-12, 12])
    .onStart(() => {
      cancelAnimation(position);
      navigationTarget.value = -1;
      start.value = position.value;
      origin.value = EXPRESSIVE_TABS.indexOf(activeTab);
      dragging.value = true;
      driving.value = true;
      runOnJS(dismissKeyboard)();
    })
    .onUpdate((event) => {
      position.value = clampSwipePosition(
        start.value - event.translationX / Math.max(1, width),
        origin.value,
      );
    })
    .onEnd((event, success) => {
      dragging.value = false;
      finish(
        snapSwipeIndex(
          position.value,
          success ? -event.velocityX / Math.max(1, width) : 0,
          origin.value,
        ),
      );
    })
    .onFinalize(() => {
      if (!dragging.value) return;
      dragging.value = false;
      finish(snapSwipeIndex(position.value, 0, origin.value));
    });
  const rail = useAnimatedStyle(() => ({
    transform: [{ translateX: -position.value * width }],
  }));
  const selectTab = React.useCallback(
    (tab: (typeof EXPRESSIVE_TABS)[number]) => {
      const index = EXPRESSIVE_TABS.indexOf(tab);
      Keyboard.dismiss();
      cancelAnimation(position);
      navigationTarget.value = index;
      driving.value = true;
      position.value = withTiming(
        index,
        { duration: reduceMotion ? 0 : 220, easing: Easing.out(Easing.cubic) },
        (finished) => {
          if (!finished || navigationTarget.value !== index) return;
          driving.value = false;
          runOnJS(settle)(index);
        },
      );
    },
    [reduceMotion, position, navigationTarget, driving, settle],
  );
  const setTabBarHeight = useSetTabBarHeight();
  React.useLayoutEffect(() => {
    setTabBarHeight(76);
    return () => setTabBarHeight(0);
  }, [setTabBarHeight]);
  React.useLayoutEffect(() => {
    const target = EXPRESSIVE_TABS.indexOf(activeTab);
    if (navigationTarget.value !== target) selectTab(activeTab);
  }, [activeTab, selectTab, navigationTarget]);
  return (
    <MotionEntranceScope>
      <View
        style={{ flex: 1, backgroundColor: c.background }}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      >
        <GestureDetector gesture={pan}>
          <View style={{ flex: 1, overflow: "hidden" }} collapsable={false}>
            <Animated.View
              style={[
                {
                  flex: 1,
                  flexDirection: "row",
                  width: width * 3,
                  alignItems: "stretch",
                },
                rail,
              ]}
            >
              {width
                ? EXPRESSIVE_TABS.map((tab) => (
                    <View
                      key={tab}
                      style={{ width, flexGrow: 0, flexShrink: 0 }}
                      pointerEvents={tab === activeTab ? "auto" : "none"}
                      accessibilityElementsHidden={tab !== activeTab}
                      importantForAccessibility={
                        tab === activeTab ? "auto" : "no-hide-descendants"
                      }
                    >
                      {tab === "insights" ? (
                        <MainEntrance style={{ flex: 1 }}>
                          <InsightsScreen
                            pagePan={pan}
                            expressive
                            month={p.month}
                            onMonthChange={p.onMonth}
                          />
                        </MainEntrance>
                      ) : tab === "transactions" ? (
                        <HomePage
                          pagePan={pan}
                          active={tab === activeTab}
                          raw={p.raw}
                          month={p.month}
                          currency={p.currency}
                          symbol={p.symbol}
                          onMonth={p.onMonth}
                          onEdit={p.onEdit}
                        />
                      ) : (
                        <MainEntrance style={{ flex: 1 }}>
                          <LedgerPage {...p} active={tab === activeTab} />
                        </MainEntrance>
                      )}
                    </View>
                  ))
                : null}
            </Animated.View>
          </View>
        </GestureDetector>
        <Animated.View
          pointerEvents={activeTab === "calendar" ? "box-none" : "none"}
          accessibilityElementsHidden={activeTab !== "calendar"}
          importantForAccessibility={
            activeTab === "calendar" ? "auto" : "no-hide-descendants"
          }
          style={[
            { position: "absolute", right: 16, bottom: 92 + bottom },
            fabMotion,
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add transaction"
            onPress={p.onAdd}
            style={[
              {
                flexDirection: "row",
                gap: 10,
                alignItems: "center",
                justifyContent: "center",
              },
              {
                backgroundColor: c.primary,
                height: 56,
                borderRadius: 28,
                paddingHorizontal: 20,
              },
            ]}
          >
            <Icon name="plus" size={24} color={c.onPrimary} />
            <Text
              style={{ fontSize: 16, fontWeight: "800", color: c.onPrimary }}
            >
              Add
            </Text>
          </Pressable>
        </Animated.View>
        <MainEntrance
          distance={32}
          index={1}
          style={[
            s.nav,
            {
              paddingBottom: bottom,
              height: 76 + bottom,
              backgroundColor: c.surfaceVariant,
            },
          ]}
        >
          <ExpressiveTabBar
            position={position}
            driving={driving}
            navigationTarget={navigationTarget}
            activeTab={activeTab}
            onSelect={selectTab}
            onSettle={settle}
            reduceMotion={reduceMotion}
          />
        </MainEntrance>
      </View>
    </MotionEntranceScope>
  );
}
const s = StyleSheet.create({
  headline: {
    fontSize: 36,
    lineHeight: 40,
    includeFontPadding: false,
    fontWeight: "800",
    letterSpacing: -1,
  },
  header: { padding: 16, gap: 14 },
  stickyTools: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14 },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  button: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  stepper: { flexDirection: "row", alignItems: "center", borderRadius: 24 },
  monthLabel: { minHeight: 44, justifyContent: "center", paddingHorizontal: 2 },
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
  connected: { flex: 1, flexDirection: "row", gap: 2 },
  chip: {
    minHeight: 44,
    borderRadius: 24,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  search: {
    fontFamily: "Figtree-400",
    borderRadius: 20,
    padding: 14,
    minHeight: 48,
  },
  day: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 8,
    borderRadius: 32,
    gap: 2,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 60,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  collapse: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  nav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  navItem: {
    minHeight: 48,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});
