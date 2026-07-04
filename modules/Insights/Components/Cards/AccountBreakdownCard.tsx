import { useAppSelector } from "@/hooks/Redux";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { useTheme } from "react-native-paper";
import type { BreakdownItem, PaymentItem } from "../../Types";
import { formatAmount } from "../../Utils";
import { BreakdownBottomSheet } from "../BottomSheets/BreakdownListSheet";
import {
  BreakdownRowItem,
  DefaultIconBox,
  GenericBreakdownCard,
} from "../BreakdownCard";

export type PaymentMethodVisual = {
  accent: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
};

type PaymentMethodBreakdownCardProps = {
  bg: string;
  outline: string;
  textColor: string;
  muted: string;
  trackColor: string;
  accentColor: string;
  items: PaymentItem[];
  onRowPress?: (item: PaymentItem, visual: PaymentMethodVisual) => void;
  paymentMethodVisuals: Record<string, PaymentMethodVisual>;
};

function toRowItem(
  item: PaymentItem,
  visual: PaymentMethodVisual,
): BreakdownRowItem {
  return {
    key: item.method,
    icon: visual.icon,
    accent: visual.accent,
    label: visual.label,
    amount: item.amount,
    percentage: item.percentage,
  };
}

export function PaymentMethodBreakdownCard({
  bg,
  outline,
  textColor,
  accentColor,
  muted,
  trackColor,
  items,
  onRowPress,
  paymentMethodVisuals,
}: PaymentMethodBreakdownCardProps) {
  const theme = useTheme();
  const { minimalIconsEnabled } = useAddonPrefs();
  const activeWorkspace = useAppSelector(selectActiveWorkspace);
  const currencyCode = activeWorkspace?.currencyCode ?? "INR";
  const currencySymbol = activeWorkspace?.currencySymbol ?? "";

  const resolved = useMemo(
    () =>
      items.map((item) => {
        const normalized = item.method.trim().toLowerCase();
        const visual: PaymentMethodVisual = paymentMethodVisuals[
          normalized
        ] ?? {
          accent: "#8D93A6",
          icon: "wallet-outline",
          label: item.method,
        };
        return { item, visual, row: toRowItem(item, visual) };
      }),
    [items, paymentMethodVisuals],
  );

  const rowItems = resolved.map(({ row }) => row);

  const breakdownItems: BreakdownItem[] = useMemo(
    () =>
      resolved.map(({ item, visual }) => ({
        category: visual.label,
        amount: item.amount,
        percentage: item.percentage,
        icon: visual.icon,
        color: visual.accent,
      })),
    [resolved],
  );

  return (
    <>
      <GenericBreakdownCard
        title="Spending by Payment Method"
        items={rowItems}
        bg={bg}
        outline={outline}
        textColor={textColor}
        accentColor={accentColor}
        muted={muted}
        formatAmount={(amount) =>
          formatAmount(amount, currencyCode, currencySymbol)
        }
        emptyMessage="No expense transactions found."
        onRowPress={(row) => {
          const found = resolved.find((r) => r.row.key === row.key);
          if (found) onRowPress?.(found.item, found.visual);
        }}
        buildIcon={(row) => (
          <DefaultIconBox
            item={row}
            resolvedAccent={
              minimalIconsEnabled ? theme.colors.primary : row.accent
            }
          />
        )}
        renderSheet={({ visible, onDismiss }) => (
          <BreakdownBottomSheet
            title="Spending by Payment Method"
            showModeToggle={false}
            visible={visible}
            onDismiss={onDismiss}
            breakdown={breakdownItems}
            mode="expense"
            bg={bg}
            outline={outline}
            textColor={textColor}
            muted={muted}
            trackColor={trackColor}
            onModeChange={() => {}}
            onRowPress={(breakdownItem: { category: string }) => {
              const found = resolved.find(
                (r) => r.visual.label === breakdownItem.category,
              );
              if (found) {
                onDismiss();
                onRowPress?.(found.item, found.visual);
              }
            }}
          />
        )}
      />
    </>
  );
}
