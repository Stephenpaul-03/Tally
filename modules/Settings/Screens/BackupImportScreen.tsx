/* eslint-disable react/no-unescaped-entities */
import { AlertModal } from "@/components/alert/AlertModal";
import { toast } from "@/components/toast/toast";
import { usePasswordPrompt } from "@/modules/Common/Components/PasswordPrompt";
import { useDataTransferControls } from "@/modules/Common/Hooks/UseDataTransferControls";
import type { ImportPreview } from "@/modules/Common/Hooks/UseImportExport";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { SettingsHeader } from "../Components/SettingsHeader";
import type { SettingsStackParamList } from "../Navigation";
import { SettingsStyles } from "../Styles";

// ─── Types ────────────────────────────────────────────────────────────────────

type Transaction = { date: string; amount: number; type?: string };

// ─── Summary helpers ──────────────────────────────────────────────────────────

function buildSummary(transactions: Transaction[]) {
  let totalIncome = 0;
  let totalExpense = 0;
  const monthSet = new Set<string>();

  for (const tx of transactions) {
    if (tx.date) {
      const d = new Date(tx.date);
      if (!isNaN(d.getTime())) {
        monthSet.add(
          d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        );
      }
    }
    const amt = typeof tx.amount === "number" ? Math.abs(tx.amount) : 0;
    const txType = tx.type?.toLowerCase();
    const isExpense =
      txType === "expense" ||
      txType === "debit" ||
      (txType == null && tx.amount < 0);
    if (isExpense) totalExpense += amt;
    else totalIncome += amt;
  }

  const months = Array.from(monthSet).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );

  return { totalIncome, totalExpense, months };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Animated stat box ────────────────────────────────────────────────────────

function StatBox({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}) {
  const theme = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(8)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.statBox,
        {
          backgroundColor: theme.colors.elevation.level2,
          borderColor: theme.colors.outlineVariant,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.statIconWrap, { backgroundColor: `${color}18` }]}>
        <MaterialCommunityIcons name={icon} size={16} color={color} />
      </View>
      <Text
        style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}
      >
        {label}
      </Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </Animated.View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  onPress,
  isLoading,
}: {
  onPress: () => void;
  isLoading: boolean;
}) {
  const theme = useTheme();
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (!isLoading) {
      pulseAnim.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.5,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isLoading, pulseAnim]);

  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      style={({ pressed }) => [
        styles.dropZone,
        {
          borderColor: isLoading
            ? theme.colors.primary
            : theme.colors.outlineVariant,
          backgroundColor: theme.colors.elevation.level1,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.dropIconCircle,
          {
            backgroundColor: isLoading
              ? theme.colors.primaryContainer
              : theme.colors.elevation.level2,
            opacity: pulseAnim,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={isLoading ? "cloud-sync-outline" : "tray-arrow-up"}
          size={28}
          color={
            isLoading ? theme.colors.primary : theme.colors.onSurfaceVariant
          }
        />
      </Animated.View>

      <Text style={[styles.dropTitle, { color: theme.colors.onSurface }]}>
        {isLoading ? "Reading file…" : "Choose a backup file"}
      </Text>
      <Text
        style={[styles.dropSubtitle, { color: theme.colors.onSurfaceVariant }]}
      >
        {isLoading ? "Checking contents" : "JSON backups exported from Nest"}
      </Text>

      {!isLoading ? (
        <View
          style={[
            styles.browseChip,
            {
              backgroundColor: theme.colors.primaryContainer,
              borderColor: theme.colors.primary,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="folder-open-outline"
            size={14}
            color={theme.colors.primary}
          />
          <Text
            style={[styles.browseChipText, { color: theme.colors.primary }]}
          >
            Browse files
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

// ─── File preview card ────────────────────────────────────────────────────────

function FilePreviewCard({
  preview,
  onSwap,
  isLoading,
}: {
  preview: ImportPreview;
  onSwap: () => void;
  isLoading: boolean;
}) {
  const theme = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const fileSizeText =
    typeof preview.fileSize === "number"
      ? `${Math.max(1, Math.round(preview.fileSize / 1024))} KB`
      : null;

  return (
    <Animated.View
      style={[
        styles.fileCard,
        {
          backgroundColor: theme.colors.elevation.level1,
          borderColor: theme.colors.primary,
          opacity: fadeAnim,
        },
      ]}
    >
      {/* Top row: icon + name + swap */}
      <View style={styles.fileCardTop}>
        <View
          style={[
            styles.fileCardIconWrap,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <MaterialCommunityIcons
            name="file-check-outline"
            size={22}
            color={theme.colors.primary}
          />
        </View>

        <View style={styles.fileCardMeta}>
          <Text
            style={[styles.fileCardName, { color: theme.colors.onSurface }]}
            numberOfLines={1}
          >
            {preview.fileName}
          </Text>
          <View style={styles.fileCardPills}>
            <View
              style={[
                styles.metaPill,
                { backgroundColor: theme.colors.elevation.level3 },
              ]}
            >
              <Text
                style={[
                  styles.metaPillText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {preview.transactionCount} transactions
              </Text>
            </View>
            {fileSizeText ? (
              <View
                style={[
                  styles.metaPill,
                  { backgroundColor: theme.colors.elevation.level3 },
                ]}
              >
                <Text
                  style={[
                    styles.metaPillText,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {fileSizeText}
                </Text>
              </View>
            ) : null}
            {preview.wasEncrypted ? (
              <View
                style={[
                  styles.metaPill,
                  { backgroundColor: theme.colors.secondaryContainer },
                ]}
              >
                <MaterialCommunityIcons
                  name="lock"
                  size={10}
                  color={theme.colors.onSecondaryContainer}
                />
                <Text
                  style={[
                    styles.metaPillText,
                    { color: theme.colors.onSecondaryContainer },
                  ]}
                >
                  Encrypted
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={onSwap}
          disabled={isLoading}
          hitSlop={8}
          style={({ pressed }) => [
            styles.swapBtn,
            {
              backgroundColor: theme.colors.elevation.level3,
              opacity: pressed || isLoading ? 0.6 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="swap-horizontal"
            size={16}
            color={theme.colors.onSurfaceVariant}
          />
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ─── Summary card ─────────────────────────────────────────────────────────────

function SummaryCard({ preview }: { preview: ImportPreview }) {
  const theme = useTheme();
  const summary = React.useMemo(
    () => buildSummary(preview.normalizedTransactions as Transaction[]),
    [preview],
  );

  return (
    <View
      style={[
        styles.summaryCard,
        {
          backgroundColor: theme.colors.elevation.level1,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <Text
        style={[styles.summaryCardTitle, { color: theme.colors.onSurface }]}
      >
        What's inside
      </Text>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatBox
          label="Income"
          value={`+${formatCurrency(summary.totalIncome)}`}
          color="#4ADE80"
          icon="trending-up"
        />
        <StatBox
          label="Expenses"
          value={`-${formatCurrency(summary.totalExpense)}`}
          color="#F87171"
          icon="trending-down"
        />
      </View>

      {/* Months */}
      {summary.months.length > 0 ? (
        <View style={styles.monthsSection}>
          <View style={styles.monthsHeader}>
            <MaterialCommunityIcons
              name="calendar-month-outline"
              size={13}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              style={[
                styles.monthsSectionLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {summary.months.length}{" "}
              {summary.months.length === 1 ? "month" : "months"} covered
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.monthChips}
          >
            {summary.months.map((m) => (
              <View
                key={m}
                style={[
                  styles.monthChip,
                  {
                    backgroundColor: theme.colors.elevation.level2,
                    borderColor: theme.colors.outlineVariant,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.monthChipText,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  {m}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Safe-to-import notice */}
      <View
        style={[
          styles.safeNotice,
          {
            backgroundColor: theme.colors.elevation.level2,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="shield-check-outline"
          size={14}
          color={theme.colors.onSurfaceVariant}
        />
        <Text
          style={[
            styles.safeNoticeText,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          Importing adds data — nothing in your account will be removed
        </Text>
      </View>
    </View>
  );
}

// ─── BackupImportScreen ───────────────────────────────────────────────────────

export function BackupImportScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();

  const { promptPassword, PasswordPromptModal } = usePasswordPrompt();
  const dataTransfer = useDataTransferControls(undefined, { promptPassword });

  const [preview, setPreview] = React.useState<ImportPreview | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [isPickingFile, setIsPickingFile] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);

  const handleSelectFile = React.useCallback(async () => {
    if (isPickingFile) return;
    try {
      setIsPickingFile(true);
      setPreview(null);

      const result = await dataTransfer.buildImportPreview();

      if ("canceled" in result) return;
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setPreview(result.preview);
    } finally {
      setIsPickingFile(false);
    }
  }, [dataTransfer, isPickingFile]);
  const handleConfirmImport = React.useCallback(async () => {
    if (!preview || isImporting) return false;
    try {
      setIsImporting(true);
      await dataTransfer.confirmImportPreview(preview.normalizedTransactions);
      setConfirmOpen(false);
      setPreview(null);
      navigation.goBack();
      return true;
    } catch (e) {
      console.error("Import failed:", e);
      toast.error("Couldn't import that backup");
      return false;
    } finally {
      setIsImporting(false);
    }
  }, [dataTransfer, isImporting, navigation, preview]);

  return (
    <SafeAreaView
      style={[
        SettingsStyles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
      edges={["top", "left", "right"]}
    >
      <SettingsHeader
        title="Restore Backup"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 80 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* File zone */}
        {!preview ? (
          <EmptyState onPress={handleSelectFile} isLoading={isPickingFile} />
        ) : (
          <FilePreviewCard
            preview={preview}
            onSwap={handleSelectFile}
            isLoading={isPickingFile}
          />
        )}

        {/* Summary or hints */}
        {preview ? (
          <SummaryCard preview={preview} />
        ) : (
          <View
            style={[
              styles.hintsCard,
              {
                backgroundColor: theme.colors.elevation.level1,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            {[
              {
                icon: "eye-outline" as const,
                text: "We'll preview contents before importing",
              },
              {
                icon: "plus-circle-outline" as const,
                text: "Importing adds to your account",
              },
              {
                icon: "shield-outline" as const,
                text: "Existing data is never deleted",
              },
            ].map(({ icon, text }) => (
              <View key={text} style={styles.hintRow}>
                <MaterialCommunityIcons
                  name={icon}
                  size={16}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.hintText,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {text}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Sticky CTA ── */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: Math.max(insets.bottom, 16),
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <Button
          mode="contained"
          onPress={preview ? () => setConfirmOpen(true) : handleSelectFile}
          disabled={isPickingFile || isImporting}
          loading={isPickingFile || isImporting}
          style={styles.ctaBtn}
          contentStyle={styles.ctaBtnContent}
          labelStyle={styles.ctaBtnLabel}
        >
          {preview
            ? "Import backup"
            : isPickingFile
              ? "Opening…"
              : "Choose file"}
        </Button>
      </View>

      {PasswordPromptModal}

      <AlertModal
        isOpen={confirmOpen}
        title="Import this backup?"
        message={
          preview
            ? `You're about to add ${preview.transactionCount} transactions from "${preview.fileName}" to your account.`
            : "You're about to import the selected backup file."
        }
        confirmLabel="Slide to import"
        cancelLabel="Go back"
        onConfirm={handleConfirmImport}
        onCancel={() => setConfirmOpen(false)}
        confirmMode="slide"
        confirmDisabled={!preview || isImporting}
        icon="file-import-outline"
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },

  // Step indicator
  stepDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingTop: 4,
  },
  stepDot: {
    height: 6,
    borderRadius: 3,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
    marginBottom: 4,
  },

  // Drop zone (empty state)
  dropZone: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: "dashed",
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 8,
  },
  dropIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  dropTitle: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.2,
  },
  dropSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  browseChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 6,
  },
  browseChipText: {
    fontSize: 14,
    fontWeight: "700",
  },

  // File preview card
  fileCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
  },
  fileCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fileCardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  fileCardMeta: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  fileCardName: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  fileCardPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  metaPillText: {
    fontSize: 11,
    fontWeight: "600",
  },
  swapBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  // Summary card
  summaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  summaryCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statBox: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },

  // Months
  monthsSection: {
    gap: 8,
  },
  monthsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  monthsSectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  monthChips: {
    flexDirection: "row",
    gap: 6,
    paddingBottom: 2,
  },
  monthChip: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  monthChipText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Safe notice
  safeNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  safeNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },

  // Hints card (empty state)
  hintsCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  hintText: {
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },

  // Password modal
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // Bottom bar
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ctaBtn: {
    borderRadius: 14,
  },
  ctaBtnContent: {
    minHeight: 52,
  },
  ctaBtnLabel: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0,
  },
});
