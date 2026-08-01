import { TransactionRow } from "@/modules/Management/Transaction/Components/TransactionRow";
import { TransactionDraft, TransactionFormData } from "@/utils/Types";
import React from "react";
import { View } from "react-native";
import { useTheme, type MD3Theme } from "react-native-paper";
import { previewStyles } from "../Styles";

interface TransactionRowPreviewProps {
  formData: TransactionFormData;
  amountString: string;
  previewTimestamp?: string;
}

export const TransactionRowPreview = React.memo(
  function TransactionRowPreview({
    formData,
    amountString,
    previewTimestamp,
  }: TransactionRowPreviewProps) {
    const theme = useTheme<MD3Theme>();
    const now = previewTimestamp ?? new Date().toISOString();
    const parsedAmount = Math.abs(parseFloat(amountString) || 0);
    const previewTransaction: TransactionDraft = {
      ...formData,
      id: "transaction-preview",
      title: formData.title?.trim() || formData.category || "New transaction",
      amount: parsedAmount,
      amountInput: amountString,
      category: formData.category || "No category",
      account: formData.account,
      isDraft: true,
      createdAt: now,
      updatedAt: now,
    };

    return (
      <View
        pointerEvents="none"
        style={[
          previewStyles.container,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <TransactionRow
          transaction={previewTransaction}
          onPressTransaction={() => {}}
          grouped
          groupPosition="single"
          secondaryLabelMode="time"
          disableLongPress
        />
      </View>
    );
  },
  (prev, next) =>
    prev.amountString === next.amountString &&
    prev.previewTimestamp === next.previewTimestamp &&
    prev.formData.title === next.formData.title &&
    prev.formData.type === next.formData.type &&
    prev.formData.category === next.formData.category &&
    prev.formData.account === next.formData.account &&
    prev.formData.date === next.formData.date &&
    prev.formData.notes === next.formData.notes,
);
