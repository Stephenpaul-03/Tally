import { transactionRowSurface } from "@/theme/surfaceTreatment";
import { AlertModal } from "@/components/alert/AlertModal";
import { toast } from "@/components/toast/ToastProvider";
import { CategoryIconBadge } from "@/components/CategoryIconBadge";
import { HomeIconReveal } from "@/modules/Main/HomeIcon";
import { HomeText, HomeDateText } from "@/modules/Main/HomeText";
import { DesignText } from "@/components/DesignText";
import { ledgerMoney } from "@/modules/Main/presentation";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import { palette } from "@/theme/color_palette";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text, TouchableRipple, useTheme } from "react-native-paper";

import { useAppDispatch, useAppSelector } from "@/hooks/Redux";
import {
  deleteTransactionAsync,
  removeTransactionDraft,
  selectCategoryColors,
  selectCategoryIcons,
} from "@/modules/Core/Slices/TransactionSlice";
import {
  formatAccountLabel,
  formatCurrencyWithSymbol,
  formatDate,
  formatTransactionTime,
  getCategoryColor,
  getCategoryIconName,
} from "@/utils/Helpers";
import { Transaction, TransactionDraft } from "@/utils/Types";

type SecondaryLabelMode = "time" | "date" | "none";
export type TransactionGroupPosition = "single" | "first" | "middle" | "last";

interface TransactionRowProps {
  transaction: Transaction | TransactionDraft;
  onPressTransaction: (id: string) => void;
  onEdit?: () => void;
  isLast?: boolean;
  grouped?: boolean;
  showDivider?: boolean;
  groupPosition?: TransactionGroupPosition;
  secondaryLabelMode?: SecondaryLabelMode;
  disableLongPress?: boolean;
  homeReveal?: boolean;
  groupCount?: number;
}

function TransactionRowComponent({
  transaction,
  onPressTransaction,
  grouped = false,
  showDivider = false,
  groupPosition,
  secondaryLabelMode = "time",
  disableLongPress = false,
  homeReveal = false,
  groupCount,
}: TransactionRowProps) {
  const theme = useTheme<ExtendedMD3Theme>();
  const RowText = homeReveal ? HomeText : Text;
  const RowDesignText = homeReveal ? HomeText : DesignText;
  const RowDateText = homeReveal ? HomeDateText : DesignText;
  const RowIconReveal = homeReveal ? HomeIconReveal : React.Fragment;
  const dispatch = useAppDispatch();
  const workspace = useAppSelector(selectActiveWorkspace);
  const categoryIcons = useAppSelector(selectCategoryIcons);
  const categoryColors = useAppSelector(selectCategoryColors);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const isDraft = "isDraft" in transaction && transaction.isDraft;
  const isIncome = transaction.type === "income";
  const amountColor = theme.expressive
    ? theme.colors.onSurface
    : isIncome
      ? palette.status.success
      : palette.status.danger;
  const amountPrefix = isIncome ? "+" : "-";
  const amount =
    isDraft && !transaction.amountInput.trim()
      ? "—"
      : theme.expressive
        ? `${isIncome ? "+" : "−"}${ledgerMoney(transaction.amount, transaction.currencyCode || workspace?.currencyCode || "INR", transaction.currencySymbol || ((transaction.currencyCode || workspace?.currencyCode) === workspace?.currencyCode ? workspace?.currencySymbol : undefined))}`
        : `${amountPrefix}${formatCurrencyWithSymbol(transaction.amount, "", false)}`;
  const title =
    transaction.title?.trim() || transaction.category || "Untitled draft";
  const meta = transaction.category || "No category";
  const accountLabel = formatAccountLabel(transaction.account);
  const secondaryLabel = isDraft
    ? `${formatDate(transaction.date)} • ${formatTransactionTime(transaction.updatedAt)}`
    : secondaryLabelMode === "date"
      ? formatDate(transaction.date)
      : secondaryLabelMode === "time"
        ? formatTransactionTime(transaction.createdAt || transaction.updatedAt)
        : "";
  const secondaryMetaLabel = [accountLabel, groupCount ? `${groupCount} grouped entries` : secondaryLabel]
    .filter(Boolean)
    .join(" · ");

  const categoryIcon = useMemo(
    () =>
      getCategoryIconName(
        transaction.category,
        transaction.type,
        categoryIcons,
      ),
    [categoryIcons, transaction.category, transaction.type],
  );

  const categoryColor = useMemo(
    () =>
      getCategoryColor(transaction.category, transaction.type, categoryColors),
    [categoryColors, transaction.category, transaction.type],
  );

  const handleLongPress = useCallback(() => {
    setDeleteConfirmOpen(true);
  }, []);

  const handlePress = useCallback(() => {
    onPressTransaction(transaction.id);
  }, [onPressTransaction, transaction.id]);

  const handleConfirmDelete = useCallback(async () => {
    if (isDraft) {
      dispatch(removeTransactionDraft(transaction.id));
      toast.success("Draft deleted");
    } else {
      await dispatch(deleteTransactionAsync(transaction.id));
      toast.success("Transaction deleted");
    }
    setDeleteConfirmOpen(false);
  }, [dispatch, isDraft, transaction.id]);

  return (
    <>
      <TouchableRipple
        onPress={handlePress}
        onLongPress={disableLongPress ? undefined : handleLongPress}
        delayLongPress={350}
        rippleColor={theme.colors.surfaceVariant}
        style={[
          styles.touchable,
          theme.expressive && {
            borderRadius: 8,
            ...(groupPosition === "last" || groupPosition === "single"
              ? { borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }
              : {}),
            backgroundColor: transactionRowSurface(theme),
          },
        ]}
      >
        {theme.expressive ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              minHeight: 64,
              padding: 10,
            }}
          >
            <RowIconReveal>
            <CategoryIconBadge
              categoryName={transaction.category}
              icon={
                categoryIcon as React.ComponentProps<
                  typeof MaterialCommunityIcons
                >["name"]
              }
              color={categoryColor}
            />
            </RowIconReveal>
            <View style={{ flex: 1, minWidth: 0, opacity: isDraft ? 0.65 : 1 }}>
              <RowDesignText
                numberOfLines={1}
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: theme.colors.onSurface,
                }}
              >
                {title}
              </RowDesignText>
              <RowDateText
                numberOfLines={1}
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: theme.colors.onSurfaceVariant,
                }}
              >
                {[meta, secondaryMetaLabel].filter(Boolean).join(" · ")}
              </RowDateText>
            </View>
            <RowDesignText
              numberOfLines={1}
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: amountColor,
                flexShrink: 1,
              }}
            >
              {amount}
            </RowDesignText>
            {groupCount ? <MaterialCommunityIcons name="chevron-right" size={18} color={theme.colors.onSurfaceVariant} /> : null}
          </View>
        ) : (
          <View style={styles.row}>
            <View style={styles.left}>
              <RowIconReveal>
              <CategoryIconBadge
                icon={
                  categoryIcon as React.ComponentProps<
                    typeof MaterialCommunityIcons
                  >["name"]
                }
                color={categoryColor}
                style={isDraft ? styles.draftIconCluster : undefined}
              />
              </RowIconReveal>
              <View style={styles.info}>
                <RowText
                  style={[styles.name, { color: theme.colors.onSurface }]}
                  numberOfLines={1}
                >
                  {title}
                </RowText>
                <RowText
                  style={[
                    styles.meta,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                  numberOfLines={1}
                >
                  {groupCount ? [meta, secondaryMetaLabel].filter(Boolean).join(" · ") : meta}
                </RowText>
              </View>
            </View>
            <View style={styles.right}>
              <View style={styles.amountInfo}>
                <RowText
                  style={[styles.amount, { color: amountColor }]}
                  numberOfLines={1}
                >
                  {amount}
                </RowText>
                {secondaryMetaLabel && !groupCount ? (
                  <RowDateText
                    style={[
                      styles.time,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                    numberOfLines={1}
                  >
                    {secondaryMetaLabel}
                  </RowDateText>
                ) : null}
              </View>
              <RowIconReveal>
              <MaterialCommunityIcons
                name="chevron-right"
                size={16}
                color={theme.colors.onSurfaceDisabled}
                style={styles.chevron}
              />
              </RowIconReveal>
            </View>
          </View>
        )}
      </TouchableRipple>

      {!disableLongPress ? (
        <AlertModal
          isOpen={deleteConfirmOpen}
          title={isDraft ? "Delete Draft" : "Delete Transaction"}
          message={
            isDraft
              ? "This will remove the unsaved draft."
              : "This will remove the transaction from your list."
          }
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirmOpen(false)}
          destructive
          confirmMode="slide"
        />
      ) : null}
    </>
  );
}

function areTransactionRowPropsEqual(
  previous: TransactionRowProps,
  next: TransactionRowProps,
) {
  return (
    previous.transaction === next.transaction &&
    previous.grouped === next.grouped &&
    previous.showDivider === next.showDivider &&
    previous.groupPosition === next.groupPosition &&
    previous.secondaryLabelMode === next.secondaryLabelMode &&
    previous.disableLongPress === next.disableLongPress &&
    previous.homeReveal === next.homeReveal &&
    previous.groupCount === next.groupCount &&
    previous.onPressTransaction === next.onPressTransaction
  );
}

export const TransactionRow = React.memo(
  TransactionRowComponent,
  areTransactionRowPropsEqual,
);

const styles = StyleSheet.create({
  touchable: {
    overflow: "hidden",
  },
  singleGrouped: {
    borderWidth: 0.5,
    borderRadius: 20,
  },
  firstGrouped: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderTopWidth: 0.5,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
  },
  middleGrouped: {
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
  },
  lastGrouped: {
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 8,
    width: "100%",
  },
  left: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  draftIconCluster: {
    opacity: 0.58,
  },
  info: { flex: 1, minWidth: 0, gap: 4, paddingTop: 1, fontWeight: "600" },
  name: { fontSize: 14, fontWeight: "600", letterSpacing: 0.1 },
  meta: { fontSize: 12, opacity: 0.84 },
  note: { fontSize: 10, opacity: 0.72 },
  right: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 2,
    flexShrink: 0,
    minWidth: 50,
  },
  amountInfo: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 4,
    paddingTop: 1,
  },
  amount: { fontSize: 14, fontWeight: "600", letterSpacing: 0.2 },
  time: { fontSize: 12, opacity: 0.72 },
  chevron: { marginTop: 2 },
});
