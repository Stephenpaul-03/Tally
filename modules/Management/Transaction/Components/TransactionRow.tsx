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
}

function darkenHex(hex: string, amount = 0.18) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;
  const num = parseInt(clean, 16);
  const r = Math.max(0, Math.round(((num >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((num >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((num & 0xff) * (1 - amount)));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function TransactionRowComponent({
  transaction,
  onPressTransaction,
  grouped = false,
  showDivider = false,
  groupPosition,
  secondaryLabelMode = "time",
  disableLongPress = false,
}: TransactionRowProps) {
  const theme = useTheme<MD3Theme>();
  const dispatch = useAppDispatch();
  const { minimalIconsEnabled } = useAddonPrefs();
  const categoryIcons = useAppSelector(selectCategoryIcons);
  const categoryColors = useAppSelector(selectCategoryColors);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const isDraft = "isDraft" in transaction && transaction.isDraft;
  const isIncome = transaction.type === "income";
  const amountColor = isIncome ? palette.status.success : palette.status.danger;
  const amountPrefix = isIncome ? "+" : "-";
  const amount =
    isDraft && !transaction.amountInput.trim()
      ? "—"
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
  const secondaryMetaLabel = [accountLabel, secondaryLabel]
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

  const categoryIconBackground = useMemo(
    () =>
      minimalIconsEnabled ? theme.colors.background : darkenHex(categoryColor),
    [categoryColor, minimalIconsEnabled, theme.colors.background],
  );

  const categoryIconBorder = useMemo(
    () => (minimalIconsEnabled ? theme.colors.elevation.level1 : undefined),
    [minimalIconsEnabled, theme.colors.elevation.level1],
  );

  const handleLongPress = useCallback(() => {
    setDeleteConfirmOpen(true);
  }, []);

  const handlePress = useCallback(() => {
    onPressTransaction(transaction.id);
  }, [onPressTransaction, transaction.id]);

  const handleConfirmDelete = useCallback(async () => {
    await dispatch(deleteTransactionAsync(transaction.id));
    toast.success("Transaction deleted");
    setDeleteConfirmOpen(false);
  }, [dispatch, transaction.id]);

  return (
    <>
      <TouchableRipple
        onPress={handlePress}
        onLongPress={disableLongPress || isDraft ? undefined : handleLongPress}
        delayLongPress={350}
        rippleColor={theme.colors.surfaceVariant}
        style={styles.touchable}
      >
        <View style={styles.row}>
          <View style={styles.left}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: categoryIconBackground,
                  borderColor: categoryIconBorder,
                  borderWidth: minimalIconsEnabled ? 1 : 0,
                },
                isDraft ? styles.draftIconCluster : null,
              ]}
            >
              <MaterialCommunityIcons
                name={categoryIcon as any}
                size={20}
                color={minimalIconsEnabled ? categoryColor : "#FFFFFF"}
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
            <View style={styles.amountInfo}>
              <Text
                style={[styles.amount, { color: amountColor }]}
                numberOfLines={1}
              >
                {amount}
              </Text>
              {secondaryMetaLabel ? (
                <Text
                  style={[
                    styles.time,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                  numberOfLines={1}
                >
                  {secondaryMetaLabel}
                </Text>
              ) : null}
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={16}
              color={theme.colors.onSurfaceDisabled}
              style={styles.chevron}
            />
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
    previous.disableLongPress === next.disableLongPress
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  draftIconCluster: {
    opacity: 0.58,
  },
  icon: { flexShrink: 0, width: 22, textAlign: "center" },
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
