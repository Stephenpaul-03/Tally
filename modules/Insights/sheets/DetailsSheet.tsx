import React, { useMemo, useRef, useState } from "react";
import { FlatList, ScrollView, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInRight, ReduceMotion, useReducedMotion } from "react-native-reanimated";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { TransactionRow } from "@/modules/Management/Transaction/Components/TransactionRow";
import { typography } from "@/theme/typography";
import type { Transaction } from "@/utils/Types";
import { SpendingHistory } from "../charts/Charts";
import { BudgetProgress, Disclosure, Metric, Muted, styles } from "../components/Primitives";
import { insightLayout, MotionPressable } from "../components/Motion";
import type { calculateInsights } from "../calculations";

export type Detail = {
  title: string; description: string; transactions: Transaction[];
  summary?: { label: string; value: string };
  comparison?: string;
  comparisonDescription?: string;
  budget?: { amount: number; spent: number };
  trend?: ReturnType<typeof calculateInsights>["trend"];
  metrics?: { label: string; value: string }[];
};
type Panel = { title: string; description: string; content: React.ReactNode };
export function DetailsSheet({ detail, panel = null, onBack, onClose, onTransaction, money }: {
  detail: Detail | null; panel?: Panel | null; onBack?: () => void;
  onClose: () => void; onTransaction: (id: string) => void; money: (value: number) => string;
}) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  // Keep the last page in place while the sheet animates closed.
  const retained = useRef({ detail, panel, onBack });
  if (detail || panel) retained.current = { detail, panel, onBack };
  const page = retained.current;
  const current = page.detail ?? page.panel;
  const transactions = useMemo(() => [...(page.detail?.transactions ?? [])]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)), [page.detail?.transactions]);
  return <AnimatedPaperModal visible={detail !== null || panel !== null} onDismiss={onClose} presentation="sheet"
    animationDuration={320} dismissDuration={200} reduceMotion={reduceMotion}
    includeBottomInset contentWrapperStyle={{ flex: 1 }}
    contentContainerStyle={{ backgroundColor: theme.colors.background, height: "84%", paddingTop: 12 }}>
    <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: theme.colors.outlineVariant, alignSelf: "center", marginBottom: 12 }} />
    <View style={{ paddingHorizontal: 20, paddingBottom: 20, gap: 2 }}>
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
      <Muted>{current?.description}</Muted>
    </View>
    <Animated.View key={(page.detail ? "detail:" : "panel:") + current?.title + current?.description} style={{ flex: 1 }}
      entering={(page.detail && page.onBack ? FadeInRight : FadeIn).duration(220).reduceMotion(ReduceMotion.System)}>
      {page.detail ? <FlatList data={transactions} keyExtractor={row => row.id} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListHeaderComponent={<View style={{ paddingHorizontal: 20, gap: 22, marginBottom: 12 }}>
          {page.detail.summary ? <View style={{ gap: 6 }}>
            <Muted>{page.detail.summary.label}</Muted>
            <Text style={[styles.heroValue, { fontSize: 38 }]}>{page.detail.summary.value}</Text>
          </View> : null}
          {page.detail.comparison ? <View style={{ gap: 5 }}>
            <Text style={{ ...typography.bodyMedium, fontSize: 14, lineHeight: 21 }}>{page.detail.comparison}</Text>
            {page.detail.comparisonDescription ? <Muted>{page.detail.comparisonDescription}</Muted> : null}
          </View> : null}
          {page.detail.budget ? <BudgetProgress budget={page.detail.budget.amount} spent={page.detail.budget.spent} money={money} /> : null}
          {page.detail.metrics ? <View style={styles.grid}>{page.detail.metrics.map(metric =>
            <Metric key={metric.label} label={metric.label} value={metric.value} />)}</View> : null}
          <View style={[styles.row, { marginTop: 6 }]}>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.onSurfaceVariant }]}>Recorded entries</Text>
            <Muted>{transactions.length}</Muted>
          </View>
        </View>}
        ListEmptyComponent={<View style={{ padding: 20 }}><Muted>No transactions recorded.</Muted></View>}
        ListFooterComponent={page.detail.trend ? <DetailHistory key={page.detail.title + page.detail.description}
          trend={page.detail.trend} money={money} /> : null}
        renderItem={({ item }) => <View style={{ paddingHorizontal: 20 }}><TransactionRow transaction={item} disableLongPress onPressTransaction={onTransaction} /></View>} />
        : <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
          {page.panel?.content}
        </ScrollView>}
    </Animated.View>
  </AnimatedPaperModal>;
}
function DetailHistory({ trend, money }: { trend: NonNullable<Detail["trend"]>; money: (value: number) => string }) {
  const [open, setOpen] = useState(false);
  return <Animated.View layout={insightLayout} style={{ paddingHorizontal: 20, paddingTop: 20 }}>
    <Disclosure label="Past months" open={open} onPress={() => setOpen(!open)} />
    {open ? <Animated.View entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)}>
      <SpendingHistory trend={trend} money={money} />
    </Animated.View> : null}
  </Animated.View>;
}
