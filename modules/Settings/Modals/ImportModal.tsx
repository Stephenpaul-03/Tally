import { SettingsSheetHandle } from "../Components/SettingsSheetHandle";
import { tonalButtonSurface } from "@/theme/surfaceTreatment";
import { backupFailure } from "@/modules/Backup/errors";
import {
  combineImportPreviews,
  type ImportFileResult,
  type ImportPreview,
} from "@/hooks/use-import-export";
import { SECTION_LABELS, backupItemCount } from "@/modules/Backup/model";
import { settingsShape } from "@/theme/settingsShape";
import { ImportReviewModal } from "../import/ImportReview";
import {
  ImportSavedError,
  needsReview,
  type ImportProblem,
} from "@/modules/Core/import/validation";
import { AlertModal } from "@/components/alert/AlertModal";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { usePasswordPrompt } from "@/components/PasswordPrompt";
import { useDataTransferControls } from "@/hooks/use-datatransfer-controls";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, useTheme } from "react-native-paper";
import { DesignText as Text } from "@/components/DesignText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SettingsHeader } from "../Components/SettingsHeader";

// ─── Types ────────────────────────────────────────────────────────────────────

type Transaction = { date: string; amount: number; type?: string };

// ─── Summary helpers ──────────────────────────────────────────────────────────

function buildSummary(transactions: Transaction[]) {
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
  }

  const months = Array.from(monthSet).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );

  return { months };
}

function SummaryRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}) {
  const theme = useTheme();

  return (
    <View style={styles.summaryRow}>
      <View
        style={[
          styles.summaryRowIcon,
          { backgroundColor: theme.colors.primaryContainer },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={17}
          color={theme.colors.onPrimaryContainer}
        />
      </View>
      <Text
        style={[
          styles.summaryRowLabel,
          { color: theme.colors.onSurfaceVariant },
        ]}
      >
        {label}
      </Text>
      <Text style={[styles.summaryRowValue, { color: theme.colors.onSurface }]}>
        {value}
      </Text>
    </View>
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
          backgroundColor: theme.colors.surface,
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
              : tonalButtonSurface(theme, theme.colors.elevation.level2),
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
        {isLoading ? "Reading files…" : "Choose backup files"}
      </Text>
      <Text
        style={[styles.dropSubtitle, { color: theme.colors.onSurfaceVariant }]}
      >
        {isLoading
          ? "Checking contents"
          : "One or more JSON files or Tally backups"}
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

  return (
    <Animated.View
      style={[
        styles.fileCard,
        settingsShape(theme),
        {
          backgroundColor: theme.colors.surface,
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
              backgroundColor: tonalButtonSurface(theme, theme.colors.elevation.level3),
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
    () => buildSummary(preview.normalizedTransactions),
    [preview],
  );

  return (
    <View
      style={[
        styles.summaryCard,
        settingsShape(theme),
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <View
        style={[
          styles.summaryRows,
          { backgroundColor: tonalButtonSurface(theme) },
        ]}
      >
        <SummaryRow
          label="Transactions"
          value={preview.transactionCount.toLocaleString()}
          icon="swap-vertical"
        />
        <View
          style={[
            styles.summaryDivider,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />
        <SummaryRow
          label="File size"
          value={
            typeof preview.fileSize === "number"
              ? `${Math.max(1, Math.round(preview.fileSize / 1024))} KB`
              : "—"
          }
          icon="file-document-outline"
        />
        <View
          style={[
            styles.summaryDivider,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />
        <SummaryRow
          label="Months covered"
          value={summary.months.length ? `${summary.months.length}` : "—"}
          icon="calendar-month-outline"
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
              Dates included
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
                    backgroundColor: tonalButtonSurface(theme),
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
      <View style={[styles.safeNotice]}>
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
          Importing adds data - nothing will be removed
        </Text>
      </View>
    </View>
  );
}

type BackupImportModalProps = {
  visible: boolean;
  onDismiss: () => void;
};

export function BackupImportModal({
  visible,
  onDismiss,
}: BackupImportModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const { promptPassword, PasswordPromptModal } = usePasswordPrompt();
  const dataTransfer = useDataTransferControls(undefined, { promptPassword });

  const [validationError, setValidationError] = React.useState<{
    message: string;
    problems?: ImportProblem[];
  } | null>(null);
  const [preview, setPreview] = React.useState<ImportPreview | null>(null);
  const [files, setFiles] = React.useState<ImportFileResult[]>([]);
  const [batchIssue, setBatchIssue] = React.useState("");
  React.useEffect(() => {
    setBatchIssue("");
    setReviewOpen(false);
    if (!files.length || files.some((file) => file.error || !file.preview)) {
      setPreview(null);
      return;
    }
    try {
      setPreview(combineImportPreviews(files.map((file) => file.preview!)));
    } catch (error) {
      setPreview(null);
      const issue = backupFailure(error, "read");
      setBatchIssue(`${issue.reason} ${issue.recovery}`);
    }
  }, [files]);
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [isPickingFile, setIsPickingFile] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);

  const handleDismiss = React.useCallback(() => {
    // A preview is temporary. Closing the sheet without importing must not
    // leave the previously selected backup attached when it is reopened.
    if (isImporting) return;
    setConfirmOpen(false);
    setReviewOpen(false);
    setValidationError(null);
    setPreview(null);
    setFiles([]);
    onDismiss();
  }, [isImporting, onDismiss]);

  React.useEffect(() => {
    if (!visible) {
      setConfirmOpen(false);
      setReviewOpen(false);
      setPreview(null);
      setFiles([]);
    }
  }, [visible]);

  const handleSelectFile = React.useCallback(async () => {
    if (isPickingFile) return;
    setIsPickingFile(true);
    setValidationError(null);
    try {
      const result = await dataTransfer.buildImportPreview();
      if ("canceled" in result) return;
      const added: ImportFileResult[] =
        "files" in result
          ? result.files
          : "preview" in result
            ? [
                {
                  id: result.preview.uri,
                  fileName: result.preview.fileName,
                  preview: result.preview,
                },
              ]
            : [
                {
                  id: `error-${Date.now()}`,
                  fileName: result.fileName || "Selected file",
                  error: result.error,
                  problems: result.problems,
                },
              ];
      setFiles((previous) => [
        ...previous.filter(
          (old) =>
            !added.some(
              (next) =>
                next.id === old.id ||
                (old.error && next.fileName === old.fileName),
            ),
        ),
        ...added,
      ]);
    } catch (error) {
      const issue = backupFailure(error, "read");
      setValidationError({ message: `${issue.reason} ${issue.recovery}` });
    } finally {
      setIsPickingFile(false);
    }
  }, [dataTransfer, isPickingFile]);
  const handleConfirmImport = React.useCallback(async () => {
    if (!preview || isImporting) return false;
    try {
      setIsImporting(true);
      await dataTransfer.confirmImportPreview(
        preview.rows,
        preview.workspaceId,
        preview.appBackup,
      );
      setConfirmOpen(false);
      setReviewOpen(false);
      setPreview(null);
      onDismiss();
      return true;
    } catch (e) {
      console.error("Import failed:", e);
      setConfirmOpen(false);
      if (e instanceof ImportSavedError) setPreview(null);
      setValidationError({
        message: `${backupFailure(e, "restore").reason} ${backupFailure(e, "restore").recovery}`,
      });
      return false;
    } finally {
      setIsImporting(false);
    }
  }, [dataTransfer, onDismiss, isImporting, preview]);

  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={handleDismiss}
      presentation="sheet"
      contentContainerStyle={{
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        maxHeight: "92%",
        overflow: "hidden",
      }}
      keyboardAware
      includeBottomInset={false}
    >
      <SettingsSheetHandle />
      <SettingsHeader title="Import data" onBack={handleDismiss} modal />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 80 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {validationError ? (
          <View
            style={{
              padding: 16,
              gap: 10,
              borderRadius: 20,
              backgroundColor: theme.colors.errorContainer,
            }}
          >
            <Text
              accessibilityRole="alert"
              style={{
                color: theme.colors.onErrorContainer,
                fontWeight: "800",
              }}
            >
              Import needs attention
            </Text>
            <Text style={{ color: theme.colors.onErrorContainer }}>
              {validationError.message}
            </Text>
            {preview ? (
              <Button
                mode="outlined"
                disabled={isImporting}
                onPress={() => {
                  setValidationError(null);
                  setConfirmOpen(true);
                }}
              >
                Retry import
              </Button>
            ) : null}
            <Button onPress={handleSelectFile} disabled={isPickingFile}>
              Choose corrected files
            </Button>
          </View>
        ) : null}
        {files.length ? (
          <View style={{ gap: 10 }}>
            <Text style={{ color: theme.colors.onSurface, fontWeight: "800" }}>
              {files.filter((file) => file.preview).length} ready ·{" "}
              {files.filter((file) => file.error).length} need attention
            </Text>
            {files.map((file) => (
              <View
                key={file.id}
                style={{
                  padding: 14,
                  borderRadius: 20,
                  gap: 8,
                  backgroundColor: file.error
                    ? theme.colors.errorContainer
                    : theme.colors.surface,
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Text
                    numberOfLines={2}
                    style={{
                      flex: 1,
                      fontWeight: "700",
                      color: file.error
                        ? theme.colors.onErrorContainer
                        : theme.colors.onSurface,
                    }}
                  >
                    {file.fileName}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove file ${file.fileName}`}
                    onPress={() =>
                      setFiles((previous) =>
                        previous.filter((f) => f.id !== file.id),
                      )
                    }
                    style={{
                      width: 44,
                      height: 44,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={20}
                      color={theme.colors.onSurface}
                    />
                  </Pressable>
                </View>
                {file.error ? (
                  <>
                    <Text style={{ color: theme.colors.onErrorContainer }}>
                      {file.error}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.colors.onErrorContainer,
                      }}
                    >
                      {backupFailure(file.error, "read").recovery}
                    </Text>
                    {file.problems?.slice(0, 5).map((problem, index) => (
                      <Text
                        key={index}
                        style={{
                          color: theme.colors.onErrorContainer,
                          fontSize: 12,
                        }}
                      >
                        Row {problem.rowNumber || "?"}: {problem.message}
                      </Text>
                    ))}
                  </>
                ) : (
                  <Text
                    style={{
                      fontSize: 12,
                      color: theme.colors.onSurfaceVariant,
                    }}
                  >
                    {file.preview?.appBackup
                      ? file.preview.appBackup.sections
                          .map((section) => SECTION_LABELS[section])
                          .join(" · ")
                      : `${file.preview?.transactionCount} transactions`}
                  </Text>
                )}
              </View>
            ))}
            {!!batchIssue && (
              <Text
                accessibilityRole="alert"
                style={{ color: theme.colors.error }}
              >
                {batchIssue}
              </Text>
            )}
            <Button
              icon="file-plus-outline"
              mode="outlined"
              onPress={handleSelectFile}
              disabled={isPickingFile}
            >
              Add or retry files
            </Button>
          </View>
        ) : null}
        {/* File zone */}
        {!preview && !files.length ? (
          <EmptyState onPress={handleSelectFile} isLoading={isPickingFile} />
        ) : preview && !files.length ? (
          <FilePreviewCard
            preview={preview}
            onSwap={handleSelectFile}
            isLoading={isPickingFile}
          />
        ) : null}

        {preview && !preview.appBackup ? (
          <View style={{ paddingVertical: 12, gap: 8 }}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              {preview.rows.some((row) => needsReview(row, preview.catalog))
                ? `${preview.rows.filter((row) => needsReview(row, preview.catalog)).length} transactions need attention`
                : "All transactions are ready to import"}
            </Text>
            <Button
              mode="outlined"
              icon="clipboard-check-outline"
              onPress={() => setReviewOpen(true)}
            >
              Review transactions
            </Button>
          </View>
        ) : null}
        {/* Summary or hints */}
        {preview ? (
          preview.appBackup ? (
            <View
              style={{
                padding: 16,
                gap: 10,
                backgroundColor: theme.colors.surface,
                borderRadius: 20,
              }}
            >
              <Text
                style={{
                  color: theme.colors.onSurface,
                  fontWeight: "800",
                  fontSize: 18,
                }}
              >
                Restore backup
              </Text>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                {backupItemCount(preview.appBackup)} items ·{" "}
                {preview.appBackup.sections
                  .map((section) => SECTION_LABELS[section])
                  .join(" · ")}
              </Text>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                Merges saved workspaces and data. Matching transaction and goal
                IDs are updated; other entries are kept. Required
                workspace/category references are included.
              </Text>
              {!!Object.keys(preview.appBackup.preferences).length && (
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  Reopen Tally after restoring to apply appearance and defaults.
                </Text>
              )}
            </View>
          ) : (
            <SummaryCard preview={preview} />
          )
        ) : (
          <View style={[styles.hintsCard, settingsShape(theme)]}>
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
            paddingBottom: Math.max(insets.bottom + 12, 16),
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <Button
          mode="contained"
          onPress={
            preview
              ? () =>
                  preview.rows.some((row) => needsReview(row, preview.catalog))
                    ? setReviewOpen(true)
                    : setConfirmOpen(true)
              : handleSelectFile
          }
          disabled={isPickingFile || isImporting}
          loading={isPickingFile || isImporting}
          style={styles.ctaBtn}
          contentStyle={styles.ctaBtnContent}
          labelStyle={styles.ctaBtnLabel}
        >
          {preview
            ? preview.rows.some((row) => needsReview(row, preview.catalog))
              ? "Review transactions"
              : preview.appBackup
                ? "Restore backup"
                : "Import transactions"
            : isPickingFile
              ? "Opening…"
              : files.length
                ? "Add or retry files"
                : "Choose files"}
        </Button>
      </View>

      {preview ? (
        <ImportReviewModal
          visible={reviewOpen}
          onDismiss={() => setReviewOpen(false)}
          rows={preview.rows}
          catalog={preview.catalog}
          onChange={(rows) =>
            setPreview({
              ...preview,
              rows,
              normalizedTransactions: rows.map((row) => row.transaction),
            })
          }
        />
      ) : null}
      {PasswordPromptModal}
      <AlertModal
        isOpen={confirmOpen}
        title={
          preview?.appBackup
            ? "Restore this backup?"
            : "Import these transactions?"
        }
        message={
          preview?.appBackup
            ? "Merge the selected backup into Tally? Matching IDs and included settings will be updated. Other data is kept."
            : preview
              ? `You're about to add ${preview.transactionCount} transactions from "${preview.fileName}" to this workspace.`
              : "You're about to import the selected backup file."
        }
        confirmLabel="Slide to import"
        cancelLabel="Go back"
        onConfirm={handleConfirmImport}
        onCancel={() => setConfirmOpen(false)}
        confirmMode="slide"
        confirmDisabled={
          !preview ||
          isImporting ||
          preview.rows.some((row) => needsReview(row, preview.catalog))
        }
        icon="file-import-outline"
      />
    </AnimatedPaperModal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  handle: {
    borderRadius: 999,
    height: 4,
    width: 42,
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 10,
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
    textAlign: "center",
  },
  fileCardPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
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
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 20,
    marginBottom: 5,
  },
  summaryCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  summaryCardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  summaryHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryHeaderText: {
    flex: 1,
  },
  summaryRows: {
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  summaryRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  summaryRowIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryRowLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  summaryRowValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 38,
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
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
  },
  safeNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },

  // Hints card (empty state)
  hintsCard: {
    borderRadius: 16,
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
