import { AlertModal } from "@/components/alert/AlertModal";
import { toast } from "@/components/toast/ToastProvider";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { palette } from "@/theme/color_palette";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Text,
  TouchableRipple,
  useTheme,
  type MD3Theme,
} from "react-native-paper";

import { useAppDispatch, useAppSelector } from "@/hooks/Redux";
import {
  deleteTransactionAsync,
  selectCategoryColors,
  selectCategoryIcons,
} from "@/modules/Data/Slices/TransactionSlice";
import {
  formatAccountLabel,
  formatCurrencyWithSymbol,
  formatDate,
  formatTransactionTime,
  getCategoryColor,
  getCategoryIconName,
} from "@/utils/Helpers";
import { Transaction } from "@/utils/Types";

type SecondaryLabelMode = "time" | "date" | "none";

interface TransactionRowProps {
  transaction: Transaction;
  onPress: () => void;
  onEdit?: () => void;
  isLast?: boolean;
  grouped?: boolean;
  showDivider?: boolean;
  secondaryLabelMode?: SecondaryLabelMode;
  disableLongPress?: boolean;
}

function accountLabel(account: Transaction["account"]) {
  return formatAccountLabel(account);
}

export function TransactionRow({
  transaction,
  onPress,
  grouped = false,
  showDivider = false,
  secondaryLabelMode = "time",
  disableLongPress = false,
}: TransactionRowProps) {
  const theme = useTheme<MD3Theme>();
  const dispatch = useAppDispatch();
  const { minimalIconsEnabled } = useAddonPrefs();
  const categoryIcons = useAppSelector(selectCategoryIcons);
  const categoryColors = useAppSelector(selectCategoryColors);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const isIncome = transaction.type === "income";
  const amountColor = isIncome ? palette.status.success : palette.status.danger;
  const amountPrefix = isIncome ? "+" : "-";
  const amount = `${amountPrefix}${formatCurrencyWithSymbol(transaction.amount, "", false)}`;
  const title = transaction.title?.trim() || transaction.category;
  const meta = `${transaction.category} • ${accountLabel(transaction.account)}`;
  const secondaryLabel =
    secondaryLabelMode === "date"
      ? formatDate(transaction.date)
      : secondaryLabelMode === "time"
        ? formatTransactionTime(transaction.createdAt || transaction.updatedAt)
        : "";

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
      minimalIconsEnabled
        ? theme.colors.primary
        : getCategoryColor(
            transaction.category,
            transaction.type,
            categoryColors,
          ),
    [
      categoryColors,
      minimalIconsEnabled,
      theme.colors.primary,
      transaction.category,
      transaction.type,
    ],
  );

  const handleLongPress = useCallback(() => {
    setDeleteConfirmOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    await dispatch(deleteTransactionAsync(transaction.id));
    toast.success("Transaction deleted");
    setDeleteConfirmOpen(false);
  }, [dispatch, transaction.id]);

  return (
    <>
      <TouchableRipple
        onPress={onPress}
        onLongPress={disableLongPress ? undefined : handleLongPress}
        delayLongPress={350}
        rippleColor={theme.colors.surfaceVariant}
        style={[
          styles.touchable,
          grouped && showDivider
            ? {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: theme.colors.outlineVariant,
              }
            : null,
        ]}
      >
        <View style={styles.row}>
          <View style={styles.left}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: theme.colors.background,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={categoryIcon as any}
                size={22}
                color={categoryColor}
                style={styles.icon}
              />
            </View>
            <View style={styles.info}>
              <Text
                style={[styles.name, { color: theme.colors.onSurface }]}
                numberOfLines={1}
              >
                {title}
              </Text>
              <Text
                style={[styles.meta, { color: theme.colors.onSurfaceVariant }]}
                numberOfLines={1}
              >
                {meta}
              </Text>
            </View>
          </View>
          <View style={styles.right}>
            <Text
              style={[styles.amount, { color: amountColor }]}
              numberOfLines={1}
            >
              {amount}
            </Text>
            {secondaryLabel ? (
              <Text
                style={[styles.time, { color: theme.colors.onSurfaceVariant }]}
                numberOfLines={1}
              >
                {secondaryLabel}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableRipple>

      <AlertModal
        isOpen={deleteConfirmOpen}
        title="Delete Transaction"
        message="This will remove the transaction from your list."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
        destructive
        confirmMode="slide"
      />
    </>
  );
}

const styles = StyleSheet.create({
  touchable: {
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 16,
    width: "100%",
  },
  left: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    flex: 1,
    minWidth: 0,
    paddingLeft: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  icon: { flexShrink: 0, width: 22, textAlign: "center" },
  info: { flex: 1, minWidth: 0, gap: 4, paddingTop: 1 },
  name: { fontSize: 14, fontWeight: "600", letterSpacing: 0.1 },
  meta: { fontSize: 12, opacity: 0.84 },
  note: { fontSize: 10, opacity: 0.72 },
  right: {
    alignItems: "flex-end",
    justifyContent: "center",
    alignSelf: "center",
    gap: 2,
    flexShrink: 0,
    paddingLeft: 12,
    paddingRight: 16,
    minWidth: 92,
  },
  amount: { fontSize: 14, fontWeight: "600", letterSpacing: 0.2 },
  time: { fontSize: 12, opacity: 0.72 },
});
