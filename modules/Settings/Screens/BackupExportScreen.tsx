/* eslint-disable react/no-unescaped-entities */
import { AlertModal } from "@/components/alert/AlertModal";
import { InlineDatePicker } from "@/components/datepicker/DatePickerModal";
import { usePasswordPrompt } from "@/modules/Common/Components/PasswordPrompt";
import { useDataTransferControls } from "@/modules/Common/Hooks/UseDataTransferControls";
import type { ExportResult } from "@/modules/Common/Hooks/UseImportExport";
import { isEncryptionSupported } from "@/modules/Common/Utils/CryptoUtils";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Sharing from "expo-sharing";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Button, Switch, Text, TextInput, useTheme } from "react-native-paper";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { SettingsHeader } from "../Components/SettingsHeader";
import type { SettingsStackParamList } from "../Navigation";
import { SettingsStyles } from "../Styles";

// ─── Types ────────────────────────────────────────────────────────────────────

type ScopeOption = "all" | "month" | "range";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDefaultExportFileName(
  scope: ScopeOption,
  singleMonth: string,
  rangeStartMonth: string,
  rangeEndMonth: string,
) {
  if (scope === "month" && singleMonth)
    return `nest-transactions-${singleMonth}`;
  if (scope === "range" && rangeStartMonth && rangeEndMonth) {
    const [from, to] =
      rangeStartMonth <= rangeEndMonth
        ? [rangeStartMonth, rangeEndMonth]
        : [rangeEndMonth, rangeStartMonth];
    return `nest-transactions-${from}-to-${to}`;
  }
  return `nest-transactions-${new Date().toISOString().split("T")[0]}`;
}

/** Parse a "YYYY-MM" string and return a Date set to the 1st of that month */
function parseYearMonth(ym: string): Date {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

/** Format a "YYYY-MM" string as "Jan 2024" */
function formatYearMonth(ym: string): string {
  if (!ym) return "";
  return parseYearMonth(ym).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

/** Format a "YYYY-MM-DD" iso string as "15 Jun 2025" */
function formatIsoDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Convert { label: "Jan 24", value: "2024-01" }[] → group by year */
function groupMonthsByYear(
  options: { label: string; value: string }[],
): { year: number; months: { label: string; value: string }[] }[] {
  const map = new Map<number, { label: string; value: string }[]>();
  for (const opt of options) {
    const year = Number(opt.value.split("-")[0]);
    if (!map.has(year)) map.set(year, []);
    map.get(year)!.push(opt);
  }
  // Sort months within each year Jan→Dec
  for (const [, months] of map) {
    months.sort((a, b) => a.value.localeCompare(b.value));
  }
  // Return years in ascending order
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, months]) => ({ year, months }));
}

/** Estimate KB from an item count */
function estimateFileSize(count: number): string {
  const bytes = count * 320 + 512; // rough estimate per tx
  if (bytes < 1024) return `~${bytes} B`;
  if (bytes < 1024 * 1024) return `~${Math.round(bytes / 1024)} KB`;
  return `~${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <Text
      style={[styles.sectionHeader, { color: theme.colors.onSurfaceVariant }]}
    >
      {label.toUpperCase()}
    </Text>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.elevation.level1,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      {children}
    </View>
  );
}

// ─── Scope card — with optional inline picker ─────────────────────────────────

function ScopeCard({
  icon,
  label,
  description,
  active,
  onPress,
  children,
  squareBottom,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  description: string;
  active: boolean;
  onPress: () => void;
  children?: React.ReactNode;
  isLast?: boolean;
  squareBottom?: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.scopeCard,
        {
          backgroundColor: active
            ? theme.colors.primaryContainer
            : theme.colors.elevation.level2,
          borderColor: active
            ? theme.colors.primary
            : theme.colors.outlineVariant,
          borderWidth: active ? 1.5 : 1,
          borderBottomLeftRadius: squareBottom ? 0 : 16,
          borderBottomRightRadius: squareBottom ? 0 : 16,
        },
      ]}
    >
      {/* Tappable header row */}
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.scopeCardHeader,
          { opacity: pressed ? 0.88 : 1 },
        ]}
      >
        <View
          style={[
            styles.scopeIcon,
            {
              backgroundColor: active
                ? theme.colors.primary
                : theme.colors.elevation.level3,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={
              active ? theme.colors.onPrimary : theme.colors.onSurfaceVariant
            }
          />
        </View>
        <View style={styles.scopeText}>
          <Text
            style={[
              styles.scopeLabel,
              {
                color: active
                  ? theme.colors.onPrimaryContainer
                  : theme.colors.onSurface,
                fontWeight: active ? "700" : "600",
              },
            ]}
          >
            {label}
          </Text>
          <Text
            style={[
              styles.scopeDesc,
              {
                color: active
                  ? theme.colors.onPrimaryContainer
                  : theme.colors.onSurfaceVariant,
                opacity: active ? 0.75 : 1,
              },
            ]}
          >
            {description}
          </Text>
        </View>
        {active ? (
          <MaterialCommunityIcons
            name="check-circle"
            size={22}
            color={theme.colors.primary}
          />
        ) : (
          <View
            style={[
              styles.radioRing,
              { borderColor: theme.colors.outlineVariant },
            ]}
          />
        )}
      </Pressable>

      {/* Inline picker — only shown when active and children provided */}
      {active && children ? (
        <>
          <View
            style={[
              styles.pickerDivider,
              {
                backgroundColor: active
                  ? theme.colors.primary
                  : theme.colors.outlineVariant,
                opacity: 0.2,
              },
            ]}
          />
          <View style={styles.pickerWrap}>{children}</View>
        </>
      ) : null}
    </View>
  );
}

// ─── All transactions – conjoined summary card ────────────────────────────────

function AllTransactionsSummary({
  availableMonths,
}: {
  availableMonths: { label: string; value: string }[];
}) {
  const theme = useTheme();

  if (availableMonths.length === 0) return null;

  const sorted = [...availableMonths].sort((a, b) =>
    a.value.localeCompare(b.value),
  );
  const first = sorted[0].value;
  const last = sorted[sorted.length - 1].value;

  const isSingle = first === last;

  return (
    <View
      style={[
        styles.conjoinedSummary,
        {
          backgroundColor: theme.colors.elevation.level1,
          borderColor: theme.colors.primary,
          borderTopColor: theme.colors.primary,
          borderTopWidth: 0,
        },
      ]}
    >
      <View style={styles.summaryRow}>
        <MaterialCommunityIcons
          name="calendar-range-outline"
          size={15}
          color={theme.colors.onSurfaceVariant}
        />
        <Text
          style={[styles.summaryText, { color: theme.colors.onSurfaceVariant }]}
        >
          {isSingle
            ? formatYearMonth(first)
            : `${formatYearMonth(first)} → ${formatYearMonth(last)}`}
        </Text>
        <Text style={[styles.summaryChip, { color: theme.colors.primary }]}>
          {availableMonths.length}{" "}
          {availableMonths.length === 1 ? "month" : "months"}
        </Text>
      </View>
    </View>
  );
}

// ─── One-month picker — grouped by year ──────────────────────────────────────

function MonthGridPicker({
  options,
  selected,
  onSelect,
}: {
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  const theme = useTheme();
  const grouped = groupMonthsByYear(options);

  return (
    <View style={{ gap: 16 }}>
      {grouped.map(({ year, months }) => (
        <View key={year} style={{ gap: 8 }}>
          <Text
            style={[
              styles.yearLabel,
              { color: theme.colors.onPrimaryContainer, opacity: 0.6 },
            ]}
          >
            {year}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.monthScrollRow}
          >
            {months.map((opt) => {
              const active = opt.value === selected;
              const shortLabel = opt.label.split(" ")[0]; // "Jan", "Feb" …
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => onSelect(opt.value)}
                  style={({ pressed }) => [
                    styles.monthGridPill,
                    {
                      backgroundColor: active
                        ? theme.colors.primary
                        : theme.colors.elevation.level3,
                      borderColor: active
                        ? theme.colors.primary
                        : theme.colors.outlineVariant,
                      borderWidth: active ? 0 : 1,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.monthGridPillText,
                      {
                        color: active
                          ? theme.colors.onPrimary
                          : theme.colors.onSurface,
                        fontWeight: active ? "700" : "500",
                      },
                    ]}
                  >
                    {shortLabel}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ))}
    </View>
  );
}

// ─── Date range picker using InlineDatePicker ─────────────────────────────────

function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
}: {
  startDate: string;
  endDate: string;
  onStartChange: (iso: string) => void;
  onEndChange: (iso: string) => void;
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [fromPickerVisible, setFromPickerVisible] = React.useState(false);
  const [toPickerVisible, setToPickerVisible] = React.useState(false);

  const today = new Date();
  const [fromMonth, setFromMonth] = React.useState(today.getMonth());
  const [fromYear, setFromYear] = React.useState(today.getFullYear());
  const [toMonth, setToMonth] = React.useState(today.getMonth());
  const [toYear, setToYear] = React.useState(today.getFullYear());

  const isMobile = Platform.OS !== "web" || width < 768;

  return (
    <View style={{ gap: 10 }}>
      {/* FROM and TO side-by-side */}
      <View style={styles.dateRangeRow}>
        {/* FROM */}
        <View style={[styles.dateRangeCol, { gap: 6 }]}>
          <View style={styles.dateRangeLabel}>
            <MaterialCommunityIcons
              name="calendar-start"
              size={13}
              color={theme.colors.primary}
            />
            <Text
              style={[
                styles.dateRangeLabelText,
                { color: theme.colors.onPrimaryContainer, opacity: 0.7 },
              ]}
            >
              FROM
            </Text>
          </View>
          <Pressable
            onPress={() => setFromPickerVisible(true)}
            style={({ pressed }) => [
              styles.dateButton,
              {
                backgroundColor: theme.colors.elevation.level3,
                borderColor: startDate
                  ? theme.colors.primary
                  : theme.colors.outlineVariant,
                borderWidth: startDate ? 1.5 : 1,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="calendar-blank-outline"
              size={16}
              color={
                startDate ? theme.colors.primary : theme.colors.onSurfaceVariant
              }
            />
            <Text
              style={[
                styles.dateButtonText,
                {
                  color: startDate
                    ? theme.colors.onPrimaryContainer
                    : theme.colors.onSurfaceVariant,
                  fontWeight: startDate ? "600" : "400",
                },
              ]}
              numberOfLines={1}
            >
              {startDate ? formatIsoDate(startDate) : "Start date"}
            </Text>
            {startDate ? (
              <Pressable hitSlop={8} onPress={() => onStartChange("")}>
                <MaterialCommunityIcons
                  name="close-circle"
                  size={14}
                  color={theme.colors.onSurfaceVariant}
                />
              </Pressable>
            ) : null}
          </Pressable>
        </View>

        {/* Arrow */}
        <MaterialCommunityIcons
          name="arrow-right"
          size={18}
          color={theme.colors.onSurfaceVariant}
          style={styles.dateRangeArrow}
        />

        {/* TO */}
        <View style={[styles.dateRangeCol, { gap: 6 }]}>
          <View style={styles.dateRangeLabel}>
            <MaterialCommunityIcons
              name="calendar-end"
              size={13}
              color={theme.colors.primary}
            />
            <Text
              style={[
                styles.dateRangeLabelText,
                { color: theme.colors.onPrimaryContainer, opacity: 0.7 },
              ]}
            >
              TO
            </Text>
          </View>
          <Pressable
            onPress={() => setToPickerVisible(true)}
            style={({ pressed }) => [
              styles.dateButton,
              {
                backgroundColor: theme.colors.elevation.level3,
                borderColor: endDate
                  ? theme.colors.primary
                  : theme.colors.outlineVariant,
                borderWidth: endDate ? 1.5 : 1,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="calendar-blank-outline"
              size={16}
              color={
                endDate ? theme.colors.primary : theme.colors.onSurfaceVariant
              }
            />
            <Text
              style={[
                styles.dateButtonText,
                {
                  color: endDate
                    ? theme.colors.onPrimaryContainer
                    : theme.colors.onSurfaceVariant,
                  fontWeight: endDate ? "600" : "400",
                },
              ]}
              numberOfLines={1}
            >
              {endDate ? formatIsoDate(endDate) : "End date"}
            </Text>
            {endDate ? (
              <Pressable hitSlop={8} onPress={() => onEndChange("")}>
                <MaterialCommunityIcons
                  name="close-circle"
                  size={14}
                  color={theme.colors.onSurfaceVariant}
                />
              </Pressable>
            ) : null}
          </Pressable>
        </View>
      </View>

      {/* FROM date picker */}
      <InlineDatePicker
        visible={fromPickerVisible}
        onDismiss={() => setFromPickerVisible(false)}
        date={startDate}
        onDateChange={(iso: string) => {
          onStartChange(iso);
          setFromPickerVisible(false);
        }}
        isMobileLayout={isMobile}
        width={width}
        bottom={insets.bottom}
        calendarMonth={fromMonth}
        calendarYear={fromYear}
        onMonthChange={setFromMonth}
        onYearChange={setFromYear}
        disableFuture
        showSummaryCard
      />

      {/* TO date picker */}
      <InlineDatePicker
        visible={toPickerVisible}
        onDismiss={() => setToPickerVisible(false)}
        date={endDate}
        onDateChange={(iso: string) => {
          onEndChange(iso);
          setToPickerVisible(false);
        }}
        isMobileLayout={isMobile}
        width={width}
        bottom={insets.bottom}
        calendarMonth={toMonth}
        calendarYear={toYear}
        onMonthChange={setToMonth}
        onYearChange={setToYear}
        disableFuture
        minDate={startDate || undefined}
        showSummaryCard
      />
    </View>
  );
}

// ─── Share modal ──────────────────────────────────────────────────────────────

function ShareModal({
  visible,
  exportResult,
  fileName,
  isSharing,
  onShare,
  onDismiss,
}: {
  visible: boolean;
  exportResult: ExportResult | null;
  fileName: string;
  isSharing: boolean;
  onShare: () => void;
  onDismiss: () => void;
}) {
  return (
    <AlertModal
      isOpen={visible}
      title="Backup saved"
      message={
        exportResult
          ? `"${exportResult.fileName ?? `${fileName}.json`}" — ${exportResult.exportedItemCount} items${exportResult.encrypted ? " · Encrypted" : ""}`
          : "Your backup was saved successfully."
      }
      confirmLabel={isSharing ? "Sharing…" : "Share file"}
      cancelLabel="Not now"
      onConfirm={onShare}
      onCancel={onDismiss}
      confirmDisabled={isSharing}
      icon="check-circle-outline"
    />
  );
}

// ─── Export confirmation modal ─────────────────────────────────────────────────

function ExportConfirmModal({
  visible,
  exportScope,
  singleMonth,
  rangeStartDate,
  rangeEndDate,
  availableMonths,
  encryptBackup,
  transactionCount,
  onConfirm,
  onDismiss,
}: {
  visible: boolean;
  exportScope: string;
  singleMonth: string;
  rangeStartDate: string;
  rangeEndDate: string;
  availableMonths: { label: string; value: string }[];
  encryptBackup: boolean;
  transactionCount: number;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const theme = useTheme();

  const sorted = [...availableMonths].sort((a, b) =>
    a.value.localeCompare(b.value),
  );

  let dateRangeText = "";
  if (exportScope === "all" && sorted.length > 0) {
    dateRangeText = `${formatYearMonth(sorted[0].value)} → ${formatYearMonth(sorted[sorted.length - 1].value)}`;
  } else if (exportScope === "month" && singleMonth) {
    dateRangeText = formatYearMonth(singleMonth);
  } else if (exportScope === "range" && rangeStartDate && rangeEndDate) {
    dateRangeText = `${formatIsoDate(rangeStartDate)} → ${formatIsoDate(rangeEndDate)}`;
  }

  const fileSizeText = estimateFileSize(transactionCount);

  const summaryMessage = (
    <View style={{ gap: 12, paddingTop: 4 }}>
      <Text
        style={[styles.confirmDesc, { color: theme.colors.onSurfaceVariant }]}
      >
        Review the details below before saving.
      </Text>
      <View
        style={[
          styles.confirmSummaryCard,
          {
            backgroundColor: theme.colors.elevation.level2,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        {/* Transactions */}
        <View style={styles.confirmRow}>
          <MaterialCommunityIcons
            name="swap-vertical"
            size={16}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            style={[
              styles.confirmRowLabel,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Transactions
          </Text>
          <Text
            style={[styles.confirmRowValue, { color: theme.colors.onSurface }]}
          >
            {transactionCount.toLocaleString()}
          </Text>
        </View>

        <View
          style={[
            styles.confirmRowDivider,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />

        {/* File size */}
        <View style={styles.confirmRow}>
          <MaterialCommunityIcons
            name="file-outline"
            size={16}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            style={[
              styles.confirmRowLabel,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Est. file size
          </Text>
          <Text
            style={[styles.confirmRowValue, { color: theme.colors.onSurface }]}
          >
            {fileSizeText}
          </Text>
        </View>

        <View
          style={[
            styles.confirmRowDivider,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />

        {/* Date range */}
        <View style={[styles.confirmRow, { alignItems: "flex-start" }]}>
          <MaterialCommunityIcons
            name="calendar-range-outline"
            size={16}
            color={theme.colors.onSurfaceVariant}
            style={{ marginTop: 1 }}
          />
          <Text
            style={[
              styles.confirmRowLabel,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Period
          </Text>
          <Text
            style={[
              styles.confirmRowValue,
              {
                color: theme.colors.onSurface,
                flexShrink: 1,
                textAlign: "right",
              },
            ]}
          >
            {dateRangeText || "—"}
          </Text>
        </View>

        {encryptBackup ? (
          <>
            <View
              style={[
                styles.confirmRowDivider,
                { backgroundColor: theme.colors.outlineVariant },
              ]}
            />
            <View style={styles.confirmRow}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={16}
                color={theme.colors.primary}
              />
              <Text
                style={[
                  styles.confirmRowLabel,
                  { color: theme.colors.primary },
                ]}
              >
                Encrypted
              </Text>
              <Text
                style={[
                  styles.confirmRowValue,
                  { color: theme.colors.primary },
                ]}
              >
                Yes
              </Text>
            </View>
          </>
        ) : null}
      </View>
    </View>
  );

  return (
    <AlertModal
      isOpen={visible}
      title="Save backup"
      message={summaryMessage}
      confirmLabel="Slide to save"
      cancelLabel="Go back"
      onConfirm={onConfirm}
      onCancel={onDismiss}
      icon="tray-arrow-down"
      confirmMode="slide"
      containerMaxHeight={560}
    />
  );
}

// ─── BackupExportScreen ───────────────────────────────────────────────────────

export function BackupExportScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const encryptionSupported = isEncryptionSupported();
  const { promptPassword, PasswordPromptModal } = usePasswordPrompt();

  const {
    exportTransactions,
    exportScope,
    setExportScope,
    availableMonths,
    singleMonth,
    setSingleMonth,
    rangeStartMonth,
    rangeEndMonth,
    transactionCount = 0,
  } = useDataTransferControls() as ReturnType<
    typeof useDataTransferControls
  > & {
    transactionCount?: number;
  };

  // For "range" scope we now use full ISO dates instead of month strings
  const [rangeStartDate, setRangeStartDate] = React.useState("");
  const [rangeEndDate, setRangeEndDate] = React.useState("");

  const suggestedName = buildDefaultExportFileName(
    exportScope as ScopeOption,
    singleMonth,
    rangeStartMonth,
    rangeEndMonth,
  );

  const [fileNameDraft, setFileNameDraft] = React.useState(suggestedName);
  const [fileNameTouched, setFileNameTouched] = React.useState(false);
  const [encryptBackup, setEncryptBackup] = React.useState(false);
  const [exportPassword, setExportPassword] = React.useState("");
  const [exportResult, setExportResult] = React.useState<ExportResult | null>(
    null,
  );
  const [isExporting, setIsExporting] = React.useState(false);
  const [isSharing, setIsSharing] = React.useState(false);
  const [shareVisible, setShareVisible] = React.useState(false);
  const [confirmVisible, setConfirmVisible] = React.useState(false);

  React.useEffect(() => {
    if (!fileNameTouched) setFileNameDraft(suggestedName);
  }, [suggestedName, fileNameTouched]);

  const hasMonths = availableMonths.length > 0;

  const canExport =
    fileNameDraft.trim().length > 0 &&
    (exportScope === "all" ||
      (exportScope === "month" && Boolean(singleMonth)) ||
      (exportScope === "range" &&
        Boolean(rangeStartDate) &&
        Boolean(rangeEndDate)));

  const handleExport = React.useCallback(async () => {
    setIsExporting(true);
    try {
      // For range scope, pass the full ISO date strings
      const effectiveStartMonth =
        exportScope === "range" && rangeStartDate
          ? rangeStartDate.slice(0, 7)
          : rangeStartMonth;
      const effectiveEndMonth =
        exportScope === "range" && rangeEndDate
          ? rangeEndDate.slice(0, 7)
          : rangeEndMonth;

      const result = await exportTransactions({
        scope: exportScope,
        month: exportScope === "month" ? singleMonth : undefined,
        startMonth: exportScope === "range" ? effectiveStartMonth : undefined,
        endMonth: exportScope === "range" ? effectiveEndMonth : undefined,
        fileName: fileNameDraft,
        encrypt: encryptBackup,
        exportPassword: encryptBackup ? exportPassword.trim() : undefined,
      });
      if (result) {
        setExportResult(result);
        setShareVisible(true);
      }
    } finally {
      setIsExporting(false);
    }
  }, [
    encryptBackup,
    exportPassword,
    exportScope,
    exportTransactions,
    fileNameDraft,
    rangeEndMonth,
    rangeEndDate,
    rangeStartMonth,
    rangeStartDate,
    singleMonth,
  ]);

  const handleShare = React.useCallback(async () => {
    if (!exportResult || isSharing) return;
    try {
      setIsSharing(true);
      const available = await Sharing.isAvailableAsync();
      if (!available) return;
      await Sharing.shareAsync(exportResult.shareUri, {
        mimeType: "application/json",
        dialogTitle: "Share backup file",
        UTI: "public.json",
      });
    } catch (e) {
      console.error("Share failed:", e);
    } finally {
      setIsSharing(false);
      setShareVisible(false);
      navigation.goBack();
    }
  }, [exportResult, isSharing, navigation]);

  const handleToggleEncrypt = React.useCallback(
    async (value: boolean) => {
      if (!value) {
        setEncryptBackup(false);
        setExportPassword("");
        return;
      }
      const pwd = await promptPassword(
        "Set password",
        "Enter a password to encrypt your backup.",
        "set", // ← two-input confirm mode
      );
      if (pwd) {
        setExportPassword(pwd);
        setEncryptBackup(true);
      }
    },
    [promptPassword],
  );

  const footerHeight = 52 + 16 + Math.max(insets.bottom, 16);

  return (
    <SafeAreaView
      style={[
        SettingsStyles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <SettingsHeader
        title="Export Backup"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: footerHeight + 16 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── File name — full width, no card ── */}
        <SectionHeader label="File name" />
        <TextInput
          mode="outlined"
          value={fileNameDraft}
          onChangeText={(v) => {
            setFileNameDraft(v);
            setFileNameTouched(true);
          }}
          autoCapitalize="none"
          autoCorrect={false}
          outlineColor={theme.colors.outlineVariant}
          activeOutlineColor={theme.colors.primary}
          placeholder="e.g. nest-backup-june"
          style={[styles.textInput, { backgroundColor: "transparent" }]}
          outlineStyle={{ borderRadius: 14 }}
          left={
            <TextInput.Icon
              icon="file-document-edit-outline"
              color={theme.colors.onSurfaceVariant}
            />
          }
        />

        {/* ── Security ── */}
        <SectionHeader label="Security" />
        <Card>
          <Pressable
            onPress={() => {
              if (!encryptionSupported) return;
              handleToggleEncrypt(!encryptBackup);
            }}
            style={({ pressed }) => [
              styles.toggleRow,
              { opacity: pressed ? 0.88 : 1 },
            ]}
          >
            <View
              style={[
                styles.toggleIcon,
                {
                  backgroundColor: encryptBackup
                    ? theme.colors.primaryContainer
                    : theme.colors.elevation.level2,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={encryptBackup ? "lock" : "lock-open-outline"}
                size={22}
                color={
                  encryptBackup
                    ? theme.colors.onPrimaryContainer
                    : theme.colors.onSurfaceVariant
                }
              />
            </View>
            <View style={styles.toggleText}>
              <Text
                style={[styles.toggleTitle, { color: theme.colors.onSurface }]}
              >
                Encrypt backup
              </Text>
              <Text
                style={[
                  styles.toggleDesc,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {encryptBackup
                  ? "Password-protected · tap to change"
                  : encryptionSupported
                    ? "Password-protect the file"
                    : "Not available in this build"}
              </Text>
            </View>
            <Switch
              value={encryptBackup}
              disabled={!encryptionSupported}
              onValueChange={handleToggleEncrypt}
            />
          </Pressable>
        </Card>

        {/* ── Security note — no card, just inline text ── */}
        {!encryptBackup ? (
          <View style={[styles.infoNote, { opacity: 0.7 }]}>
            <MaterialCommunityIcons
              name="alert-outline"
              size={15}
              color={theme.colors.error}
            />
            <Text
              style={[
                styles.infoText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Saved as plain JSON — readable by anyone with access to the file.
            </Text>
          </View>
        ) : (
          <View style={[styles.infoNote, { opacity: 0.85 }]}>
            <MaterialCommunityIcons
              name="lock-check-outline"
              size={15}
              color={theme.colors.primary}
            />
            <Text
              style={[
                styles.infoText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              File will be AES-encrypted and locked with your password.
            </Text>
          </View>
        )}

        {/* ── What to export — scope cards with inline pickers ── */}
        <SectionHeader label="What to export" />
        <View style={styles.scopeCards}>
          {/* All transactions + conjoined summary */}
          <View>
            <ScopeCard
              icon="layers-outline"
              label="All transactions"
              description="Export everything in your account"
              active={exportScope === "all"}
              onPress={() => setExportScope("all")}
              squareBottom={exportScope === "all" && hasMonths}
            />
            {exportScope === "all" && hasMonths ? (
              <AllTransactionsSummary availableMonths={availableMonths} />
            ) : null}
          </View>

          {hasMonths ? (
            <ScopeCard
              icon="calendar-today"
              label="One month"
              description="Pick a single month"
              active={exportScope === "month"}
              onPress={() => setExportScope("month")}
            >
              <MonthGridPicker
                options={availableMonths}
                selected={singleMonth}
                onSelect={setSingleMonth}
              />
            </ScopeCard>
          ) : null}

          {hasMonths ? (
            <ScopeCard
              icon="calendar-range"
              label="Date range"
              description="Choose a start and end date"
              active={exportScope === "range"}
              onPress={() => setExportScope("range")}
            >
              <DateRangePicker
                startDate={rangeStartDate}
                endDate={rangeEndDate}
                onStartChange={setRangeStartDate}
                onEndChange={setRangeEndDate}
              />
            </ScopeCard>
          ) : null}
        </View>

        {!hasMonths && exportScope !== "all" ? (
          <View style={styles.infoNote}>
            <MaterialCommunityIcons
              name="calendar-remove-outline"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              style={[
                styles.infoText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              No months available yet. Use "All transactions" instead.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* ── Sticky footer ── */}
      <View
        style={[
          styles.stickyFooter,
          {
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.outlineVariant,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <Button
          mode="contained"
          onPress={() => setConfirmVisible(true)}
          disabled={!canExport || isExporting}
          loading={isExporting}
          style={styles.exportBtn}
          contentStyle={styles.exportBtnContent}
        >
          {isExporting ? "Saving…" : "Save backup"}
        </Button>
      </View>

      {PasswordPromptModal}

      <ExportConfirmModal
        visible={confirmVisible}
        exportScope={exportScope}
        singleMonth={singleMonth}
        rangeStartDate={rangeStartDate}
        rangeEndDate={rangeEndDate}
        availableMonths={availableMonths}
        encryptBackup={encryptBackup}
        transactionCount={transactionCount}
        onConfirm={() => {
          setConfirmVisible(false);
          void handleExport();
        }}
        onDismiss={() => setConfirmVisible(false)}
      />

      <ShareModal
        visible={shareVisible}
        exportResult={exportResult}
        fileName={fileNameDraft}
        isSharing={isSharing}
        onShare={() => void handleShare()}
        onDismiss={() => {
          setShareVisible(false);
          navigation.goBack();
        }}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 4,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
    overflow: "hidden",
  },
  textInput: {
    fontSize: 16,
    marginBottom: 8,
  },
  // Scope cards
  scopeCards: {
    gap: 8,
    marginBottom: 8,
  },
  scopeCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  scopeCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
  },
  scopeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  scopeText: { flex: 1, minWidth: 0, gap: 2 },
  scopeLabel: { fontSize: 15, lineHeight: 20 },
  scopeDesc: { fontSize: 12, lineHeight: 17 },
  radioRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    flexShrink: 0,
  },
  // Inline picker
  pickerDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 14,
  },
  pickerWrap: {
    padding: 14,
    paddingTop: 12,
  },
  // Conjoined summary card under "all"
  conjoinedSummary: {
    borderRadius: 12,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: -4,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  summaryText: {
    fontSize: 13,
    flex: 1,
  },
  summaryChip: {
    fontSize: 12,
    fontWeight: "700",
  },
  // Year-grouped month grid
  yearLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  monthGridPill: {
    width: 52,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  monthGridPillText: {
    fontSize: 13,
    lineHeight: 18,
  },
  // Date range picker
  dateRangeLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dateRangeLabelText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  dateButtonText: {
    fontSize: 14,
    flex: 1,
  },
  dateArrow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 0,
  },
  dateArrowLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  rangeSummaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 2,
  },
  rangeSummaryText: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  // Month picker label row
  monthLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  monthLabel: { fontSize: 13, fontWeight: "600", letterSpacing: 0.1 },
  selBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginLeft: 2,
  },
  selBadgeText: { fontSize: 12, fontWeight: "700" },
  pillRow: { flexDirection: "row", gap: 8, paddingVertical: 2 },
  pill: {
    height: 34,
    borderRadius: 999,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: { fontSize: 13, lineHeight: 18 },
  // Toggle row (encrypt)
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
  },
  toggleIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  toggleText: { flex: 1, minWidth: 0, gap: 2 },
  toggleTitle: { fontSize: 15, lineHeight: 20, fontWeight: "600" },
  toggleDesc: { fontSize: 12, lineHeight: 17 },
  // Info note — no card background
  infoNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 6,
    marginBottom: 4,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 19 },
  // Footer
  stickyFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  exportBtn: { borderRadius: 14 },
  exportBtnContent: { minHeight: 52 },
  // Export confirm modal
  confirmDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  confirmSummaryCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  confirmRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  confirmRowLabel: {
    fontSize: 13,
    flex: 1,
  },
  confirmRowValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  confirmRowDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 14,
  },
  // Date range row layout
  dateRangeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  dateRangeCol: {
    flex: 1,
    minWidth: 0,
  },
  dateRangeArrow: {
    marginBottom: 11, // visually aligns with the date buttons
    flexShrink: 0,
  },

  // Month scroll row inside MonthGridPicker
  monthScrollRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
  },
});
