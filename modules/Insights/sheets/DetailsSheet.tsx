import React, { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, ScrollView, useWindowDimensions, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { TransactionRow } from "@/modules/Management/Transaction/Components/TransactionRow";
import { useAppSelector } from "@/hooks/Redux";
import { selectIsModalOpen } from "@/modules/Core/Slices/TransactionSlice";
import { typography } from "@/theme/typography";
import type { Transaction } from "@/utils/Types";
import { SpendingHistory } from "../charts/Charts";
import { BudgetProgress, CardDivider, ContextNote, Metric, Muted, styles } from "../components/Primitives";
import { MotionPressable } from "../components/Motion";
import type { calculateInsights } from "../calculations";

export type Detail = {
  title: string; description: string; transactions: Transaction[];
  summary?: { label: string; value: string };
  comparison?: string;
  comparisonDescription?: string;
  budget?: { amount: number; spent: number };
  categoryType?: "income" | "expense";
  trend?: ReturnType<typeof calculateInsights>["trend"];
  metrics?: { label: string; value: string }[];
};
type Panel = { title: string; description: string; content: React.ReactNode };
export function DetailsSheet({ detail, panel = null, onBack, onClose, onTransaction, money }: {
  detail: Detail | null; panel?: Panel | null; onBack?: () => void;
  onClose: () => void; onTransaction: (id: string) => void; money: (value: number) => string;
}) {
  const transactionOpen = useAppSelector(selectIsModalOpen);
  return <>
    <DetailPageSheet detail={panel ? null : detail} panel={panel} onClose={onClose}
      suspended={transactionOpen || Boolean(panel && detail)} onTransaction={onTransaction} money={money} />
    <DetailPageSheet detail={panel ? detail : null} onBack={onBack} onClose={onBack ?? onClose}
      nested suspended={transactionOpen} onTransaction={onTransaction} money={money} />
  </>;
}

function DetailPageSheet({ detail, panel = null, onBack, onClose, onTransaction, money, nested = false, suspended = false }: {
  detail: Detail | null; panel?: Panel | null; onBack?: () => void;
  onClose: () => void; onTransaction: (id: string) => void; money: (value: number) => string;
  nested?: boolean; suspended?: boolean;
}) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const { height: screenHeight } = useWindowDimensions();
  const { bottom } = useSafeAreaInsets();
  const [historyPage, setHistoryPage] = useState<string | null>(null);
  useEffect(() => { setHistoryPage(null); }, [detail]);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [contentSize, setContentSize] = useState({ key: "", height: 0 });
  const [summarySize, setSummarySize] = useState({ key: "", height: 0 });
  // Keep the last page in place while the sheet animates closed.
  const retained = useRef({ detail, panel, onBack });
  if (detail || panel) retained.current = { detail, panel, onBack };
  const page = retained.current;
  const current = page.detail ?? page.panel;
  const pageKey = (page.detail ? "detail:" : "panel:") + current?.title + current?.description;
  const historyOpen = detail !== null && historyPage === pageKey;
  const category = page.detail?.categoryType;
  const summaryHeight = page.detail && summarySize.key === pageKey ? summarySize.height : 0;
  const maxHeight = screenHeight * 0.84;
  const sheetHeight = contentSize.key === pageKey
    ? Math.min(maxHeight, headerHeight + summaryHeight + contentSize.height + bottom + 28)
    : Math.min(maxHeight, 480);
  const measureContent = (_width: number, height: number) => setContentSize(previous =>
    previous.key === pageKey && previous.height === height ? previous : { key: pageKey, height });
  const transactions = useMemo(() => [...(page.detail?.transactions ?? [])]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)), [page.detail?.transactions]);
  const summaryContent = page.detail ? <View onLayout={event => {
      const height = event.nativeEvent.layout.height;
      setSummarySize(previous => previous.key === pageKey && previous.height === height ? previous : { key: pageKey, height });
    }} style={{ paddingHorizontal: 20, gap: category ? 14 : 22, paddingBottom: 12 }}>
          {page.detail.summary ? <View style={{ gap: 8 }}>
            {category ? <View style={{ flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", columnGap: 10, rowGap: 4 }}>
              <Text style={[styles.heroValue, { fontSize: 34 }]}>{page.detail.summary.value}</Text>
              <Muted>{category === "expense" ? "spent" : "received"}</Muted>
            </View> : <>
              <Muted>{page.detail.summary.label}</Muted>
              <Text style={[styles.heroValue, { fontSize: 38 }]}>{page.detail.summary.value}</Text>
            </>}
            {category && page.detail.comparison ? <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
              <View style={{ flexShrink: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: theme.colors.elevation.level2 }}>
                <Text style={{ ...typography.bodyMedium, fontSize: 12, lineHeight: 18 }}>{page.detail.comparison}</Text>
              </View>
              {page.detail.comparisonDescription ? <Text style={{ ...typography.body, fontSize: 12, lineHeight: 18, color: theme.colors.onSurfaceVariant }}>{page.detail.comparisonDescription}</Text> : null}
            </View> : null}
          </View> : null}
          {!category && page.detail.comparison ? <ContextNote label={page.detail.comparison}
            description={page.detail.comparisonDescription} icon="compare-horizontal" /> : null}
          {page.detail.budget ? <BudgetProgress budget={page.detail.budget.amount} spent={page.detail.budget.spent} money={money} /> : null}
          {page.detail.metrics ? <View style={styles.grid}>{page.detail.metrics.map(metric =>
            <Metric key={metric.label} label={metric.label} value={metric.value} />)}</View> : null}
          {category ? <CardDivider inset={20} /> : null}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
            <Text accessibilityRole="header" style={{ ...typography.bodyMedium, fontSize: 14, color: theme.colors.onSurfaceVariant }}>Recorded entries</Text>
            <View style={{ borderRadius: 12, paddingHorizontal: 7, paddingVertical: 2, backgroundColor: theme.colors.elevation.level2 }}>
              <Text style={{ ...typography.bodyMedium, fontSize: 12, color: theme.colors.onSurfaceVariant }}>{transactions.length}</Text>
            </View>
          </View>
        </View> : null;
  return <>
  <AnimatedPaperModal escapeEnabled={!historyOpen && !suspended} dismissable={!historyOpen && !suspended} visible={detail !== null || panel !== null} onDismiss={onClose} presentation="sheet" zIndex={nested ? 910 : 900}
    animationDuration={280} dismissDuration={220} reduceMotion={reduceMotion}
    includeBottomInset contentWrapperStyle={{ flex: 1 }}
    contentContainerStyle={{ backgroundColor: theme.colors.background, height: sheetHeight, paddingTop: 12 }}>
    <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: theme.colors.outlineVariant, alignSelf: "center", marginBottom: 12 }} />
    <View onLayout={event => setHeaderHeight(event.nativeEvent.layout.height)} style={{ paddingHorizontal: 20, paddingBottom: 20, gap: 2 }}>
      <View style={styles.row}>
        {page.onBack ? <MotionPressable onPress={page.onBack} accessibilityRole="button" accessibilityLabel={`Back to ${page.panel?.title ?? "overview"}`}
          style={{ minHeight: 44, minWidth: 44, justifyContent: "center", alignItems: "center", marginLeft: -10 }}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={theme.colors.onSurface} />
        </MotionPressable> : null}
        <Text accessibilityRole="header" style={[styles.title, { flex: 1, fontSize: 24, lineHeight: 30 }]}>{current?.title}</Text>
        <MotionPressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close insights details"
          style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center", marginRight: -8 }}>
          <MaterialCommunityIcons name="close" size={22} color={theme.colors.onSurfaceVariant} />
        </MotionPressable>
      </View>
      {category ? <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
        <View style={{ borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: theme.colors.elevation.level2 }}>
          <Text style={{ ...typography.body, fontSize: 12, color: theme.colors.onSurfaceVariant }}>{current?.description}</Text>
        </View>
        {page.detail?.trend ? <MotionPressable accessibilityRole="button" accessibilityLabel={`Past months for ${current?.title}`}
          onPress={() => setHistoryPage(pageKey)} style={{ flexDirection: "row", alignItems: "center", gap: 5, minHeight: 44, paddingHorizontal: 8 }}>
          <MaterialCommunityIcons name="history" size={16} color={theme.colors.primary} />
          <Text style={{ ...typography.bodyMedium, fontSize: 12, color: theme.colors.primary }}>Past months</Text>
        </MotionPressable> : null}
      </View> : <Muted>{current?.description}</Muted>}
    </View>
    <View key={pageKey} style={{ flex: 1 }}>
      {summaryContent}
      {page.detail ? <FlatList style={{ flex: 1 }} onContentSizeChange={measureContent} data={transactions} keyExtractor={row => row.id} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}

        ListEmptyComponent={<View style={{ padding: 20 }}><Muted>No transactions recorded.</Muted></View>}
        renderItem={({ item }) => <View style={{ paddingHorizontal: 20 }}><TransactionRow transaction={item} disableLongPress onPressTransaction={onTransaction} /></View>} />
        : <ScrollView onContentSizeChange={measureContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
          {page.panel?.content}
        </ScrollView>}
    </View>
  </AnimatedPaperModal>
  <PastMonthsSheet visible={historyOpen && !suspended} detail={page.detail} onClose={() => setHistoryPage(null)} money={money} />
  </>;
}

function PastMonthsSheet({ visible, detail, onClose, money }: {
  visible: boolean; detail: Detail | null; onClose: () => void; money: (value: number) => string;
}) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const retained = useRef(detail);
  if (visible && detail) retained.current = detail;
  const current = retained.current;
  return <AnimatedPaperModal visible={visible} onDismiss={onClose} presentation="sheet" zIndex={920}
    animationDuration={280} dismissDuration={220} reduceMotion={reduceMotion}
    contentContainerStyle={{ backgroundColor: theme.colors.background, maxHeight: "80%", paddingTop: 12 }}>
    <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: theme.colors.outlineVariant, alignSelf: "center", marginBottom: 12 }} />
    <View style={{ paddingHorizontal: 20, paddingBottom: 8, gap: 2 }}>
      <View style={styles.row}>
        <Text accessibilityRole="header" style={{ ...typography.bodyMedium, fontSize: 20, flex: 1 }}>Past months</Text>
        <MotionPressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close past months"
          style={{ minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center" }}>
          <MaterialCommunityIcons name="close" size={22} color={theme.colors.onSurfaceVariant} />
        </MotionPressable>
      </View>
      <Muted>{current?.title}</Muted>
    </View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
      {current?.trend ? <SpendingHistory trend={current.trend} type={current.categoryType} money={money} /> : null}
    </ScrollView>
  </AnimatedPaperModal>;
}
