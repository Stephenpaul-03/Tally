import React from "react";
import { SortOptionSheet } from "@/components/SortOptionSheet";
import { TRANSACTION_GROUPINGS, type TransactionGrouping } from "../grouping";

const metadata: Record<TransactionGrouping, { icon: string; description: string }> = {
  date: { icon: "calendar-outline", description: "Keep entries under each day" },
  category: { icon: "tag-outline", description: "Group entries in the same category" },
  title: { icon: "format-title", description: "Group entries with the exact same title" },
  account: { icon: "wallet-outline", description: "Group entries using the same account" },
  type: { icon: "swap-vertical", description: "Separate income and expenses" },
  matching: { icon: "layers-triple-outline", description: "Match title, category and account together" },
};

export function TransactionGroupingSheet({ visible, value, onApply, onDismiss }: {
  visible: boolean; value: TransactionGrouping; onApply: (value: TransactionGrouping) => void; onDismiss: () => void;
}) {
  return <SortOptionSheet visible={visible} title="Group transactions" subtitle="Choose how entries appear in Transactions."
    value={value} direction="asc" showDirection={false} sectionTitle="Group types" zIndex={1100}
    options={TRANSACTION_GROUPINGS.map(option => ({ id: option.value, label: option.label, ...metadata[option.value] }))}
    onChange={() => {}} onApply={next => onApply(next as TransactionGrouping)} onDismiss={onDismiss}
    applyLabel="Use grouping" />;
}
