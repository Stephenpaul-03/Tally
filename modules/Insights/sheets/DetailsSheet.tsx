import React from "react";
import { FlatList, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { TransactionRow } from "@/modules/Management/Transaction/Components/TransactionRow";
import type { Transaction } from "@/utils/Types";
import { CashFlowChart } from "../charts/Charts";
import { Chip, Metric, Muted, styles } from "../components/Primitives";
import type { calculateInsights } from "../calculations";

export type Detail = {
  title: string; description: string; transactions: Transaction[];
  trend?: ReturnType<typeof calculateInsights>["trend"];
  metrics?: { label: string; value: string }[];
};
export function DetailsSheet({ detail, onClose, onTransaction, money }: {
  detail: Detail | null; onClose: () => void; onTransaction: (id: string) => void;
  money: (value: number) => string;
}) {
  const theme = useTheme();
  return <AnimatedPaperModal visible={detail !== null} onDismiss={onClose} presentation="sheet"
    contentContainerStyle={{ backgroundColor: theme.colors.background, borderTopLeftRadius: 40,
      borderTopRightRadius: 40, height: "80%", paddingTop: 24 }}>
    <FlatList data={detail?.transactions ?? []} keyExtractor={row => row.id}
      contentContainerStyle={{ paddingBottom: 40 }}
      ListHeaderComponent={<View style={{ paddingHorizontal: 20, gap: 14, marginBottom: 18 }}>
        <View style={styles.row}><Text style={[styles.title, { flex: 1 }]}>{detail?.title}</Text>
          <Chip label="Close" onPress={onClose} /></View>
        {detail?.description ? <Muted>{detail.description}</Muted> : null}
        {detail?.metrics ? <View style={styles.grid}>{detail.metrics.map(metric =>
          <Metric key={metric.label} label={metric.label} value={metric.value} />)}</View> : null}
        {detail?.trend ? <CashFlowChart trend={detail.trend} money={money} /> : null}
        <Muted>Transactions in the selected period</Muted>
      </View>}
      ListEmptyComponent={<View style={{ padding: 20 }}><Muted>No transactions recorded.</Muted></View>}
      renderItem={({ item }) => <TransactionRow transaction={item} disableLongPress
        onPressTransaction={onTransaction} />} />
  </AnimatedPaperModal>;
}
