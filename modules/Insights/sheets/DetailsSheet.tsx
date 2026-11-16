import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import { groupInsightEntries, type InsightEntryGroup } from "../entryGrouping";
import { GroupedEntriesSheet } from "./GroupedEntriesSheet";
import { tonalButtonSurface } from "@/theme/surfaceTreatment";
import { useMotionEnabled } from "@/components/animations/Motion";
import { DesignText as Text } from "@/components/DesignText";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { useAppSelector } from "@/hooks/Redux";
import { selectIsModalOpen } from "@/modules/Core/Slices/TransactionSlice";
import { TransactionRow } from "@/modules/Management/Transaction/Components/TransactionRow";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { typography } from "@/theme/typography";
import type { Transaction } from "@/utils/Types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FlatList, ScrollView, useWindowDimensions, View } from "react-native";
import { useTheme } from "react-native-paper";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { calculateInsights } from "../calculations";
import { SpendingHistory } from "../charts/Charts";
import { MotionPressable } from "../components/Motion";
import {
  BudgetProgress,
  CardDivider,
  ContextNote,
  Metric,
  Muted,
  styles,
} from "../components/Primitives";

/** One shared start time keeps the initial viewport and later batches in sequence. */
function DetailRowReveal({
  id,
  index,
  seen,
  scrolling,
  revealStart,
  children,
}: {
  id: string;
  index: number;
  seen: Set<string>;
  scrolling: React.MutableRefObject<boolean>;
  revealStart: number | null;
  children: React.ReactNode;
}) {
  const enabled = useMotionEnabled();
  const [reveal] = useState(
    () => enabled && !scrolling.current && !seen.has(id),
  );
  const opacity = useSharedValue(reveal ? 0 : 1);
  useEffect(() => {
    seen.add(id);
  }, [id, seen]);
  useEffect(() => {
    if (!enabled || !reveal) {
      opacity.value = 1;
      return;
    }
    if (revealStart === null) return;
    // One uninterrupted stagger; row 5 has the same spacing as every other row.
    const offset = index * 60;
    const delay = Math.max(0, revealStart + offset - Date.now());
    opacity.value = withDelay(delay, withTiming(1, { duration: 180 }));
    return () => cancelAnimation(opacity);
  }, [enabled, reveal, revealStart, index, opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

export type Detail = {
  title: string;
  description: string;
  transactions: Transaction[];
  summary?: { label: string; value: string };
  comparison?: string;
  comparisonDescription?: string;
  budget?: { amount: number; spent: number };
  categoryType?: "income" | "expense";
  trend?: ReturnType<typeof calculateInsights>["trend"];
  metrics?: { label: string; value: string }[];
};
type Panel = { title: string; description: string; content: React.ReactNode };
export function DetailsSheet({
  detail,
  panel = null,
  onBack,
  onClose,
  onTransaction,
  money,
}: {
  detail: Detail | null;
  panel?: Panel | null;
  onBack?: () => void;
  onClose: () => void;
  onTransaction: (id: string) => void;
  money: (value: number) => string;
}) {
  const transactionOpen = useAppSelector(selectIsModalOpen);
  return (
    <>
      <DetailPageSheet
        detail={panel ? null : detail}
        panel={panel}
        onClose={onClose}
        suspended={transactionOpen || Boolean(panel && detail)}
        onTransaction={onTransaction}
        money={money}
      />
      <DetailPageSheet
        detail={panel ? detail : null}
        onBack={onBack}
        onClose={onBack ?? onClose}
        nested
        suspended={transactionOpen}
        onTransaction={onTransaction}
        money={money}
      />
    </>
  );
}

function DetailPageSheet({
  detail,
  panel = null,
  onBack,
  onClose,
  onTransaction,
  money,
  nested = false,
  suspended = false,
}: {
  detail: Detail | null;
  panel?: Panel | null;
  onBack?: () => void;
  onClose: () => void;
  onTransaction: (id: string) => void;
  money: (value: number) => string;
  nested?: boolean;
  suspended?: boolean;
}) {
  const theme = useTheme<ExtendedMD3Theme>();
  const { insightsGroupingEnabled } = useAddonPrefs();
  const workspace = useAppSelector(selectActiveWorkspace);
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
  useEffect(() => { setSelectedGroupKey(null); }, [detail, insightsGroupingEnabled]);

  const reduceMotion = useReducedMotion();
  const { height: screenHeight } = useWindowDimensions();
  const { bottom } = useSafeAreaInsets();
  const [historyPage, setHistoryPage] = useState<string | null>(null);
  useEffect(() => {
    setHistoryPage(null);
  }, [detail]);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [contentSize, setContentSize] = useState({ key: "", height: 0 });
  // Keep the last page in place while the sheet animates closed.
  const retained = useRef({ detail, panel, onBack });
  if (detail || panel) retained.current = { detail, panel, onBack };
  const page = retained.current;
  const current = page.detail ?? page.panel;
  const pageKey =
    (page.detail ? "detail:" : "panel:") +
    current?.title +
    current?.description;
  const revealPage = useMemo(
    () => ({ key: pageKey, rows: new Set<string>() }),
    [pageKey],
  );
  const revealedRows = revealPage.rows;
  const listScrolling = useRef(false);
  const [readyPage, setReadyPage] = useState<{
    key: string;
    startedAt: number;
  } | null>(null);
  const visible = detail !== null || panel !== null;
  useEffect(() => {
    if (!visible) {
      setReadyPage(null);
      revealedRows.clear();
      listScrolling.current = false;
    }
  }, [visible, revealedRows]);
  const handleShown = useCallback(
    () => setReadyPage({ key: pageKey, startedAt: Date.now() }),
    [pageKey],
  );
  const historyOpen = detail !== null && historyPage === pageKey;
  const category = page.detail?.categoryType;
  const transactions = useMemo(
    () =>
      [...(page.detail?.transactions ?? [])].sort(
        (a, b) =>
          b.date.localeCompare(a.date) ||
          b.createdAt.localeCompare(a.createdAt),
      ),
    [page.detail?.transactions],
  );
  const displayEntries = useMemo(() => groupInsightEntries(transactions, insightsGroupingEnabled, workspace?.currencyCode || "INR"),
    [transactions, insightsGroupingEnabled, workspace?.currencyCode]);
  const maxHeight = screenHeight * 0.84;
  // Virtualized batches must not resize the sheet during its entrance.
  const sheetHeight =
    displayEntries.length > 6
      ? maxHeight
      : contentSize.key === pageKey
        ? Math.min(maxHeight, headerHeight + contentSize.height + bottom + 28)
        : Math.min(maxHeight, 480);
  const longTransactionList = displayEntries.length > 6;
  const measureContent = useCallback(
    (_width: number, height: number) => {
      // Long lists have a fixed viewport: measuring every virtualized batch only
      // rerenders the sheet while its opening animation is running.
      if (longTransactionList) return;
      setContentSize((previous) =>
        previous.key === pageKey && previous.height === height
          ? previous
          : { key: pageKey, height },
      );
    },
    [longTransactionList, pageKey],
  );
  const initialRowCount = Math.max(4, Math.ceil(maxHeight / 64));
  const selectedGroup = displayEntries.find(group => group.key === selectedGroupKey && group.transactions.length > 1) ?? null;
  const renderTransaction = useCallback(
    ({ item, index }: { item: InsightEntryGroup; index: number }) => (
      <View style={{ marginHorizontal: 16, paddingHorizontal: 8, paddingTop: 2,
        paddingBottom: index === displayEntries.length - 1 ? 8 : 0,
        borderBottomLeftRadius: index === displayEntries.length - 1 ? 28 : 0,
        borderBottomRightRadius: index === displayEntries.length - 1 ? 28 : 0,
        backgroundColor: theme.colors.surface }}>
        <DetailRowReveal id={item.key} index={index} seen={revealedRows} scrolling={listScrolling}
          revealStart={readyPage?.key === pageKey ? readyPage.startedAt : null}>
          <TransactionRow grouped groupPosition={index === displayEntries.length - 1 ? "last" : "middle"}
            showDivider={false} groupCount={item.transactions.length > 1 ? item.transactions.length : undefined}
            transaction={item.transactions.length > 1 ? { ...item.transactions[0], amount: item.amount } : item.transactions[0]}
            disableLongPress secondaryLabelMode={item.transactions.length > 1 ? "none" : "time"}
            onPressTransaction={item.transactions.length > 1 ? () => setSelectedGroupKey(item.key) : onTransaction} />
        </DetailRowReveal>
      </View>
    ), [displayEntries.length, theme.colors, onTransaction, revealedRows, readyPage, pageKey],
  );
  const summaryContent = page.detail ? (
    <View style={{ paddingHorizontal: 16, gap: 14 }}>
      {page.detail.summary ? (
        <View style={{ gap: 8 }}>
          {category ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                flexWrap: "wrap",
                columnGap: 10,
                rowGap: 4,
              }}
            >
              <Text style={[styles.heroValue, { fontSize: 34 }]}>
                {page.detail.summary.value}
              </Text>
              <Muted>{category === "expense" ? "spent" : "received"}</Muted>
            </View>
          ) : (
            <>
              <Muted>{page.detail.summary.label}</Muted>
              <Text style={[styles.heroValue, { fontSize: 38 }]}>
                {page.detail.summary.value}
              </Text>
            </>
          )}
          {category && page.detail.comparison ? (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 8,
              }}
            >
              <View
                style={{
                  flexShrink: 1,
                  borderRadius: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  backgroundColor: theme.colors.elevation.level2,
                }}
              >
                <Text
                  style={{
                    ...typography.bodyMedium,
                    fontSize: 12,
                    lineHeight: 18,
                  }}
                >
                  {page.detail.comparison}
                </Text>
              </View>
              {page.detail.comparisonDescription ? (
                <Text
                  style={{
                    ...typography.body,
                    fontSize: 12,
                    lineHeight: 18,
                    color: theme.colors.onSurfaceVariant,
                  }}
                >
                  {page.detail.comparisonDescription}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}
      {!category && page.detail.comparison ? (
        <ContextNote
          label={page.detail.comparison}
          description={page.detail.comparisonDescription}
          icon="compare-horizontal"
        />
      ) : null}
      {page.detail.budget ? (
        <BudgetProgress
          budget={page.detail.budget.amount}
          spent={page.detail.budget.spent}
          money={money}
        />
      ) : null}
      {page.detail.metrics ? (
        <View style={styles.grid}>
          {page.detail.metrics.map((metric) => (
            <Metric
              key={metric.label}
              label={metric.label}
              value={metric.value}
            />
          ))}
        </View>
      ) : null}
      {category ? <CardDivider inset={20} /> : null}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginTop: 6,
          padding: 16,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          backgroundColor: theme.colors.surface,
        }}
      >
        <Text
          accessibilityRole="header"
          style={{
            ...typography.bodyMedium,
            fontSize: 14,
            color: theme.colors.onSurfaceVariant,
          }}
        >
          Recorded entries
        </Text>
        <View
          style={{
            borderRadius: 12,
            paddingHorizontal: 7,
            paddingVertical: 2,
            backgroundColor: theme.colors.elevation.level2,
          }}
        >
          <Text
            style={{
              ...typography.bodyMedium,
              fontSize: 12,
              color: theme.colors.onSurfaceVariant,
            }}
          >
            {transactions.length}
          </Text>
        </View>
      </View>
    </View>
  ) : null;
  return (
    <>
      <AnimatedPaperModal
        escapeEnabled={!historyOpen && !suspended && !selectedGroup}
        dismissable={!historyOpen && !suspended && !selectedGroup}
        visible={visible}
        onShown={handleShown}
        onDismiss={onClose}
        presentation="sheet"
        zIndex={nested ? 910 : 900}
        animationDuration={280}
        dismissDuration={220}
        reduceMotion={reduceMotion}
        includeBottomInset
        contentWrapperStyle={{ flex: 1 }}
        contentContainerStyle={{
          backgroundColor: theme.colors.background,
          height: sheetHeight,
          paddingTop: 12,
        }}
      >
        <View
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: theme.colors.outlineVariant,
            alignSelf: "center",
            marginBottom: 12,
          }}
        />
        <View
          onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
          style={{ paddingHorizontal: 20, paddingBottom: 20, gap: 2 }}
        >
          <View style={styles.row}>
            {page.onBack ? (
              <MotionPressable
                onPress={page.onBack}
                accessibilityRole="button"
                accessibilityLabel={`Back to ${page.panel?.title ?? "overview"}`}
                style={{
                  height: 44,
                  width: 44,
                  borderRadius: 22,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: tonalButtonSurface(theme),
                }}
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={22}
                  color={theme.colors.onSurface}
                />
              </MotionPressable>
            ) : null}
            <Text
              accessibilityRole="header"
              style={[styles.title, { flex: 1, fontSize: 24, lineHeight: 30 }]}
            >
              {current?.title}
            </Text>
            <MotionPressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close insights details"
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: tonalButtonSurface(theme),
              }}
            >
              <MaterialCommunityIcons
                name="close"
                size={21}
                color={theme.colors.onSurfaceVariant}
              />
            </MotionPressable>
          </View>
          {category ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 8,
              }}
            >
              <View
                style={{
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  backgroundColor: theme.colors.elevation.level2,
                }}
              >
                <Text
                  style={{
                    ...typography.body,
                    fontSize: 12,
                    color: theme.colors.onSurfaceVariant,
                  }}
                >
                  {current?.description}
                </Text>
              </View>
              {page.detail?.trend ? (
                <MotionPressable
                  accessibilityRole="button"
                  accessibilityLabel={`Past months for ${current?.title}`}
                  onPress={() => setHistoryPage(pageKey)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    minHeight: 44,
                    paddingHorizontal: 12,
                    borderRadius: 22,
                    backgroundColor: theme.colors.secondaryContainer,
                  }}
                >
                  <MaterialCommunityIcons
                    name="history"
                    size={16}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={{
                      ...typography.bodyMedium,
                      fontSize: 12,
                      color: theme.colors.primary,
                    }}
                  >
                    Past months
                  </Text>
                </MotionPressable>
              ) : null}
            </View>
          ) : (
            <Muted>{current?.description}</Muted>
          )}
        </View>
        <View key={pageKey} style={{ flex: 1 }}>
          {page.detail ? (
            <FlatList
              style={{ flex: 1 }}
              onContentSizeChange={measureContent}
              data={displayEntries}
              onScrollBeginDrag={() => {
                listScrolling.current = true;
              }}
              initialNumToRender={initialRowCount}
              maxToRenderPerBatch={3}
              updateCellsBatchingPeriod={80}
              windowSize={3}
              keyExtractor={(row) => row.key}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 32 }}
              ListHeaderComponent={summaryContent}
              removeClippedSubviews={false}
              ListEmptyComponent={
                <View
                  style={{
                    marginHorizontal: 16,
                    padding: 20,
                    borderBottomLeftRadius: 28,
                    borderBottomRightRadius: 28,
                    backgroundColor: theme.colors.surface,
                  }}
                >
                  <Muted>No transactions recorded.</Muted>
                </View>
              }
              renderItem={renderTransaction}
            />
          ) : (
            <ScrollView
              onContentSizeChange={measureContent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingBottom: 32,
              }}
            >
              {page.panel?.content}
            </ScrollView>
          )}
        </View>
      </AnimatedPaperModal>
      <GroupedEntriesSheet group={selectedGroup} suspended={suspended}
        onClose={() => setSelectedGroupKey(null)} onTransaction={onTransaction} />
      <PastMonthsSheet
        visible={historyOpen && !suspended}
        detail={page.detail}
        onClose={() => setHistoryPage(null)}
        money={money}
      />
    </>
  );
}

function PastMonthsSheet({
  visible,
  detail,
  onClose,
  money,
}: {
  visible: boolean;
  detail: Detail | null;
  onClose: () => void;
  money: (value: number) => string;
}) {
  const theme = useTheme<ExtendedMD3Theme>();
  const reduceMotion = useReducedMotion();
  const retained = useRef(detail);
  if (visible && detail) retained.current = detail;
  const current = retained.current;
  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onClose}
      presentation="sheet"
      zIndex={920}
      animationDuration={280}
      dismissDuration={220}
      reduceMotion={reduceMotion}
      contentContainerStyle={{
        backgroundColor: theme.colors.background,
        maxHeight: "80%",
        paddingTop: 12,
      }}
    >
      <View
        style={{
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: theme.colors.outlineVariant,
          alignSelf: "center",
          marginBottom: 12,
        }}
      />
      <View style={{ paddingHorizontal: 20, paddingBottom: 8, gap: 2 }}>
        <View style={styles.row}>
          <Text
            accessibilityRole="header"
            style={{ ...typography.bodyMedium, fontSize: 20, flex: 1 }}
          >
            Past months
          </Text>
          <MotionPressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close past months"
            style={{
              height: 44,
              width: 44,
              borderRadius: 22,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: tonalButtonSurface(theme),
            }}
          >
            <MaterialCommunityIcons
              name="close"
              size={21}
              color={theme.colors.onSurfaceVariant}
            />
          </MotionPressable>
        </View>
        <Muted>{current?.title}</Muted>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
      >
        {current?.trend ? (
          <SpendingHistory
            trend={current.trend}
            type={current.categoryType}
            money={money}
          />
        ) : null}
      </ScrollView>
    </AnimatedPaperModal>
  );
}
