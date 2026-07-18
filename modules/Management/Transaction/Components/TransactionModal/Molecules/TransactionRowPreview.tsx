import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { palette } from "@/theme/color_palette";
import {
  formatCurrencyWithSymbol,
  formatTransactionDateTime,
  getAccountColor,
  getAccountIconName,
  getCategoryColor,
  getCategoryIconName,
} from "@/utils/Helpers";
import { TransactionFormData } from "@/utils/Types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";
import { Text, useTheme, type MD3Theme } from "react-native-paper";
import { previewStyles } from "../Styles";

interface TransactionRowPreviewProps {
  formData: TransactionFormData;
  amountString: string;
  categoryIcons: Record<string, string>;
  categoryColors: Record<string, string>;
  accountIcons: Record<string, string>;
  accountColors: Record<string, string>;
  previewTimestamp?: string;
  monthMode?: boolean;
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

export const TransactionRowPreview = React.memo(
  function TransactionRowPreview({
    formData,
    amountString,
    categoryIcons,
    categoryColors,
    accountIcons,
    accountColors,
    previewTimestamp,
    monthMode = false,
  }: TransactionRowPreviewProps) {
    const theme = useTheme<MD3Theme>();
    const { minimalIconsEnabled } = useAddonPrefs();

    const isIncome = formData.type === "income";
    const amountColor = isIncome
      ? palette.status.success
      : palette.status.danger;
    const amountPrefix = isIncome ? "+" : "-";
    const parsedAmount = parseFloat(amountString) || 0;
    const amountDisplay =
      parsedAmount > 0
        ? `${amountPrefix}${formatCurrencyWithSymbol(parsedAmount, "", false)}`
        : "—";

    const title =
      formData.title?.trim() || formData.category || "New transaction";

    const meta = formData.category || "No category";

    const categoryIcon = formData.category
      ? getCategoryIconName(formData.category, formData.type, categoryIcons)
      : "shape-outline";

    const categoryColor = formData.category
      ? getCategoryColor(formData.category, formData.type, categoryColors)
      : theme.colors.primary;
    const previewCardColor = theme.colors.surface;
    const categoryIconBackground = minimalIconsEnabled
      ? previewCardColor
      : darkenHex(categoryColor);
    const categoryIconBorder = minimalIconsEnabled
      ? theme.colors.elevation.level1
      : undefined;

    const accountIcon = getAccountIconName(formData.account, accountIcons);
    const accountColor = getAccountColor(formData.account, accountColors);

    const dateTimeLabel = formatTransactionDateTime(
      formData.date,
      previewTimestamp ?? new Date().toISOString(),
      monthMode,
    );

    return (
      <View
        style={[previewStyles.container, { backgroundColor: previewCardColor }]}
      >
        <View style={previewStyles.row}>
          <View style={previewStyles.left}>
            <View
              style={[
                previewStyles.iconCircle,
                {
                  backgroundColor: categoryIconBackground,
                  borderColor: categoryIconBorder,
                  borderWidth: minimalIconsEnabled ? 1 : 0,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={categoryIcon as any}
                size={20}
                color={minimalIconsEnabled ? categoryColor : "#FFFFFF"}
                style={previewStyles.icon}
              />
              <View
                style={[
                  previewStyles.accountPill,
                  {
                    backgroundColor: minimalIconsEnabled
                      ? theme.colors.elevation.level1
                      : accountColor,
                    borderColor: minimalIconsEnabled
                      ? theme.colors.elevation.level1
                      : previewCardColor,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={accountIcon as any}
                  size={12}
                  color={minimalIconsEnabled ? accountColor : "#FFFFFF"}
                />
              </View>
            </View>
            <View style={previewStyles.info}>
              <Text
                style={[previewStyles.name, { color: theme.colors.onSurface }]}
                numberOfLines={1}
              >
                {title}
              </Text>
              <Text
                style={[
                  previewStyles.meta,
                  { color: theme.colors.onSurfaceVariant },
                ]}
                numberOfLines={1}
              >
                {meta}
              </Text>
            </View>
          </View>
          <View style={previewStyles.right}>
            <View style={previewStyles.amountInfo}>
              <Text
                style={[previewStyles.amount, { color: amountColor }]}
                numberOfLines={1}
              >
                {amountDisplay}
              </Text>
              <Text
                style={[
                  previewStyles.date,
                  { color: theme.colors.onSurfaceVariant },
                ]}
                numberOfLines={1}
              >
                {dateTimeLabel || "-"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  },
  (prev, next) =>
    prev.amountString === next.amountString &&
    prev.previewTimestamp === next.previewTimestamp &&
    prev.monthMode === next.monthMode &&
    prev.formData.title === next.formData.title &&
    prev.formData.type === next.formData.type &&
    prev.formData.category === next.formData.category &&
    prev.formData.account === next.formData.account &&
    prev.formData.date === next.formData.date &&
    prev.categoryIcons === next.categoryIcons &&
    prev.categoryColors === next.categoryColors &&
    prev.accountIcons === next.accountIcons &&
    prev.accountColors === next.accountColors,
);
