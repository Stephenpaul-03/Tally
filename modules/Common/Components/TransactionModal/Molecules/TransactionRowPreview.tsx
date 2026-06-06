import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import {
  formatAccountLabel,
  formatCurrencyWithSymbol,
  formatTransactionDateTime,
  getCategoryColor,
  getCategoryIconName,
} from "@/modules/Common/Utils/Helpers";
import { TransactionFormData } from "@/modules/Common/Utils/Types";
import { palette } from "@/theme/color_palette";
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
  previewTimestamp?: string;
  monthMode?: boolean;
}

export const TransactionRowPreview = React.memo(
  function TransactionRowPreview({
    formData,
    amountString,
    categoryIcons,
    categoryColors,
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

    const meta = [formData.category, formatAccountLabel(formData.account)]
      .filter(Boolean)
      .join(" • ");

    const categoryIcon = formData.category
      ? getCategoryIconName(formData.category, formData.type, categoryIcons)
      : "shape-outline";

    const categoryColor = formData.category
      ? minimalIconsEnabled
        ? theme.colors.primary
        : getCategoryColor(formData.category, formData.type, categoryColors)
      : theme.colors.primary;

    const dateTimeLabel = formatTransactionDateTime(
      formData.date,
      previewTimestamp ?? new Date().toISOString(),
      monthMode,
    );

    return (
      <View
        style={[
          previewStyles.container,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
      >
        <View style={previewStyles.row}>
          <View style={previewStyles.left}>
            <View
              style={[
                previewStyles.iconCircle,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <MaterialCommunityIcons
                name={categoryIcon as any}
                size={22}
                color={categoryColor}
              />
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
                {meta || "No category"}
              </Text>
            </View>
          </View>
          <View style={previewStyles.right}>
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
    prev.categoryColors === next.categoryColors,
);
