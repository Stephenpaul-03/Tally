import type {
  CategoryComparisonRow,
  MonthSummary,
} from "@/modules/Insights/Types";
import type { ReportSelection } from "@/modules/Insights/reportSelection";
import type { ReportOptions } from "@/modules/Insights/reportHtml";
import { buildInsightsHTML } from "@/modules/Insights/reportHtml";
import { useMainDesign } from "./use-main-design";
import { useAppTheme } from "./use-app-theme";
import { buildPaperTheme } from "@/theme/buildPaperTheme";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useCallback, useRef, useState } from "react";
import { toast } from "@/components/toast/ToastProvider";
export type QuickShareInsightsMode = "none" | "lastMonth" | "budget" | "both";
const fontCache = new Map<
  string,
  Promise<{ bodyFont: string; boldFont: string; headingFont: string }>
>();
async function reportFonts(layout: "classic" | "sage") {
  let fonts = fontCache.get(layout);
  if (!fonts) {
    fonts = (async () => {
      const modules =
        layout === "sage"
          ? [
              require("../assets/fonts/Figtree-400.ttf"),
              require("../assets/fonts/Figtree-800.ttf"),
              require("../assets/fonts/Figtree-800.ttf"),
            ]
          : [
              require("../assets/fonts/Switzer-Regular.ttf"),
              require("../assets/fonts/Switzer-Bold.ttf"),
              require("../assets/fonts/BebasNeue-Regular.ttf"),
            ];
      const data = await Promise.all(
        modules.map(async (module) => {
          const asset = Asset.fromModule(module);
          await asset.downloadAsync();
          return `data:font/ttf;base64,${await FileSystem.readAsStringAsync(asset.localUri || asset.uri, { encoding: FileSystem.EncodingType.Base64 })}`;
        }),
      );
      return { bodyFont: data[0], boldFont: data[1], headingFont: data[2] };
    })();
    fontCache.set(layout, fonts);
    fonts.catch(() => fontCache.delete(layout));
  }
  return fonts;
}
export function useQuickShareInsights(
  summary: MonthSummary | undefined,
  monthLabel: string | undefined,
  previousMonthLabel: string | undefined,
  workspaceName: string | undefined,
  currencyCode = "INR",
  currrencySymbol = "₹",
  categoryComparison?: CategoryComparisonRow[],
  incomeCategoryComparison?: CategoryComparisonRow[],
  overallBudget?: number,
  categoryBudgets?: Record<string, number>,
  logoBase64?: string,
  periodDescription?: string,
  details?: Pick<ReportOptions, "accounts" | "transactions">,
) {
  const { design } = useMainDesign();
  const { themeId } = useAppTheme();
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeMode, setActiveMode] = useState<QuickShareInsightsMode | null>(
    null,
  );
  const running = useRef(false);
  const shareInsights = useCallback(
    async (mode: QuickShareInsightsMode = "lastMonth", selection?: ReportSelection) => {
      if (running.current || !summary || !monthLabel || !previousMonthLabel)
        return;
      running.current = true;
      setIsGenerating(true);
      setActiveMode(mode);
      try {
        const layout = selection?.layout ?? design.layout;
        const fonts = await reportFonts(layout);
        const colors = buildPaperTheme({ mode: "light", themeId }).colors;
        const html = buildInsightsHTML(
          summary,
          monthLabel,
          {
            mode,
            currencyCode,
            currrencySymbol,
            overallBudget,
            categoryBudgets,
            currentMonthLabel: monthLabel,
            previousMonthLabel,
            workspaceName,
            layout,
            ...details,
            ...(selection ? { includeIncome: selection.includeIncome, includeExpenses: selection.includeExpenses, includeAccounts: selection.includeAccounts, expanded: selection.expanded } : {}),
            accent: colors.primary,
            container: colors.primaryContainer,
            onContainer: colors.onPrimaryContainer,
            periodDescription,
            ...fonts,
          },
          categoryComparison,
          incomeCategoryComparison,
          logoBase64,
        );
        const { uri } = await Print.printToFileAsync({ html, base64: false });
        const name = `${workspaceName || "Tally"}-${monthLabel}`.replace(
          /[^\p{L}\p{N} _-]/gu,
          "-",
        );
        const dest = `${FileSystem.cacheDirectory}Tally-${name}.pdf`;
        await FileSystem.copyAsync({ from: uri, to: dest });
        if (await Sharing.isAvailableAsync())
          await Sharing.shareAsync(dest, {
            mimeType: "application/pdf",
            UTI: "com.adobe.pdf",
            dialogTitle: "Share Insights PDF",
          });
        else
          toast.info(
            "PDF generated, but sharing is unavailable on this device",
          );
        return dest;
      } catch (error) {
        console.error("PDF share failed:", error);
        toast.error(`Could not create the Insights PDF: ${error instanceof Error ? error.message : String(error)}. Your selections are kept; please retry.`);
      } finally {
        running.current = false;
        setIsGenerating(false);
        setActiveMode(null);
      }
    },
    [
      summary,
      monthLabel,
      previousMonthLabel,
      workspaceName,
      currencyCode,
      currrencySymbol,
      categoryComparison,
      incomeCategoryComparison,
      overallBudget,
      categoryBudgets,
      logoBase64,
      periodDescription,
      details,
      design.layout,
      themeId,
    ],
  );
  return { shareInsights, isGenerating, activeMode };
}
