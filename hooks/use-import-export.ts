import { mergeBackups } from "@/modules/Backup/merge";
import { backupFailure } from "@/modules/Backup/errors";
import {
  backupItemCount,
  selectBackupSections,
  validateBackup,
  type AppBackup,
  type BackupSection,
} from "@/modules/Backup/model";
import { getCategoryIconKey } from "@/utils/Helpers";
import {
  validateImport,
  ImportSavedError,
  ImportValidationError,
  type ImportProblem,
  type ImportRow,
  type ImportCatalog,
} from "@/modules/Core/import/validation";
import { SQLiteFinanceRepository } from "@/modules/Core/Repository/SQLiteRepo";
/** JSON transaction import/export with optional encrypted backups. */

import { toast } from "@/components/toast/ToastProvider";
import {
  getActiveWorkspaceId,
  financeRepository,
  workspaceRepository,
} from "@/modules/Core/Repository/Index";
import {
  loadTransactions,
  fetchAccounts,
  fetchCategories,
} from "@/modules/Core/Slices/TransactionSlice";
import { AppDispatch } from "@/modules/Core/Store";
import {
  decryptEnvelope,
  encryptJson,
  isEncryptedEnvelope,
} from "@/utils/CryptoUtils";
import type {
  Transaction,
  TransactionFilters,
  TransactionFormData,
} from "@/utils/Types";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Alert, Platform } from "react-native";

// ─── Public types ─────────────────────────────────────────────────────────────

export type ExportScope = "month" | "range" | "all";

export type ExportResult = {
  files?: { fileName: string; shareUri: string; savedUri?: string }[];
  fileName: string;
  exportedItemCount: number;
  shareUri: string;
  successMessage: string;
  savedUri?: string;
  includeDatabaseBackup: boolean;
  /** True when the exported file was AES-256-GCM encrypted. */
  encrypted: boolean;
};

export type ImportPreview = {
  appBackup?: AppBackup;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  transactionCount: number;
  uri: string;
  normalizedTransactions: TransactionFormData[];
  rows: ImportRow[];
  catalog: ImportCatalog;
  workspaceId: string;
  /** True when the source file was encrypted and has been decrypted. */
  wasEncrypted: boolean;
};

export type ImportFileResult = {
  id: string;
  fileName: string;
  preview?: ImportPreview;
  error?: string;
  problems?: ImportProblem[];
};
export type SingleImportPreviewResult =
  | { canceled: true }
  | { error: string; fileName?: string; problems?: ImportProblem[] }
  | { preview: ImportPreview };
export type ImportPreviewResult =
  | SingleImportPreviewResult
  | { files: ImportFileResult[] };
export function combineImportPreviews(
  previews: ImportPreview[],
): ImportPreview {
  if (!previews.length) throw Error("Choose a valid file first");
  if (previews.length === 1) return previews[0];
  const appBackups = previews.filter((p) => p.appBackup);
  if (appBackups.length && appBackups.length !== previews.length)
    throw Error(
      "Mixed backup formats. Choose complete Tally backups together, or transaction-only JSON files together.",
    );
  const first = previews[0];
  const appBackup = appBackups.length
    ? mergeBackups(appBackups.map((p) => p.appBackup!))
    : undefined;
  const rows = previews.flatMap((p) => p.rows);
  return {
    ...first,
    appBackup,
    fileName: `${previews.length} selected files`,
    fileSize: previews.reduce((sum, p) => sum + (p.fileSize || 0), 0),
    transactionCount: appBackup
      ? appBackup.database.transactions?.length || 0
      : rows.length,
    rows,
    normalizedTransactions: rows.map((r) => r.transaction),
    wasEncrypted: previews.some((p) => p.wasEncrypted),
  };
}

export type ExportOptions = {
  sections?: BackupSection[];
  separateFiles?: boolean;
  scope?: ExportScope;
  month?: string;
  startMonth?: string;
  endMonth?: string;
  fileName?: string;
  includeDatabaseBackup?: boolean;
  exportPassword?: string;
  /**
   * When true the exported JSON is AES-256-GCM encrypted with a user-supplied
   * password.  The resulting file contains an EncryptedEnvelope object instead
   * of raw transaction data.  The import path detects this automatically.
   */
  encrypt?: boolean;
};

export type PasswordPromptHandler = (
  title: string,
  message: string,
  mode?: "set" | "unlock",
) => Promise<string | null>;

export type ImportExportOptions = {
  /**
   * Supply the return value of usePasswordPrompt().promptPassword.
   * Required when importing encrypted files or exporting with encryption;
   * if omitted, those paths resolve with null (cancel / skip).
   */
  promptPassword?: PasswordPromptHandler;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useImportExport(
  dispatch: AppDispatch,
  handleApplyFilters: (filters: TransactionFilters) => void,
  nonDeletedTransactions: Transaction[],
  options?: ImportExportOptions,
) {
  const RESET_FILTERS: TransactionFilters = {
    category: "all",
    account: "all",
    datePreset: "all",
    date: undefined,
  };

  // Always a callable function — resolves to null (cancel) if no handler was
  // provided, which the existing cancel-path logic handles correctly everywhere.
  const requestPassword: PasswordPromptHandler =
    options?.promptPassword ??
    (() => {
      if (__DEV__) {
        console.warn(
          "useImportExport: no promptPassword handler provided. " +
            "Encryption/decryption will be skipped.",
        );
      }
      return Promise.resolve(null);
    });

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const sanitizeJsonText = (text: string) => text.replace(/^\uFEFF/, "").trim();

  const normalizeExportFileName = (value?: string) => {
    const raw = (value ?? "").trim();
    const fallback = `nest-transactions-${new Date().toISOString().split("T")[0]}`;
    const safeBase = (raw || fallback)
      .replace(/\.json$/i, "")
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    return `${safeBase || fallback}.json`;
  };

  const filterTransactionsForExport = (
    transactions: Transaction[],
    exportOptions?: ExportOptions,
  ) => {
    const scope = exportOptions?.scope ?? "all";
    if (scope === "all") return transactions;

    if (scope === "month") {
      const month = exportOptions?.month;
      if (!month) return transactions;
      return transactions.filter((tx) => tx.date.startsWith(month));
    }

    const startMonth = exportOptions?.startMonth;
    const endMonth = exportOptions?.endMonth;
    if (!startMonth || !endMonth) return transactions;
    const [from, to] =
      startMonth <= endMonth ? [startMonth, endMonth] : [endMonth, startMonth];
    return transactions.filter((tx) => {
      const month = tx.date.slice(0, 7);
      return month >= from && month <= to;
    });
  };

  const importFromReviewedList = async (
    rows: ImportRow[],
    workspaceId: string,
    appBackup?: AppBackup,
  ) => {
    if (appBackup) {
      const { restoreAppBackup } = await import("@/modules/Backup/service");
      await restoreAppBackup(appBackup);
      toast.success(
        Object.keys(appBackup.preferences).length
          ? "Backup restored. Reopen Tally to apply restored preferences."
          : "Backup restored",
      );
      return;
    }
    if (getActiveWorkspaceId() !== workspaceId)
      throw new Error(
        "Workspace changed. Choose the file again in the workspace you want to import into.",
      );
    const repository = new SQLiteFinanceRepository(workspaceId);
    const count = await repository.importReviewedTransactions(rows);
    try {
      const [transactions, income, expense, accounts] = await Promise.all([
        repository.getTransactions(),
        repository.getCategories("income"),
        repository.getCategories("expense"),
        repository.getAccounts(),
      ]);
      if (getActiveWorkspaceId() === workspaceId) {
        dispatch(loadTransactions(transactions));
        dispatch(
          fetchCategories.fulfilled(
            { type: "income", categories: income },
            "import",
            "income",
          ),
        );
        dispatch(
          fetchCategories.fulfilled(
            { type: "expense", categories: expense },
            "import",
            "expense",
          ),
        );
        dispatch(fetchAccounts.fulfilled(accounts, "import", undefined));
        handleApplyFilters(RESET_FILTERS);
      }
    } catch {
      throw new ImportSavedError(count);
    }
    toast.success(`Imported ${count} transactions!`);
  };

  // ─── Import ──────────────────────────────────────────────────────────────────

  /**
   * Opens the document picker, reads the file, optionally decrypts it, and
   * returns a preview without committing anything to the database yet.
   *
   * Encrypted files are detected automatically via the envelope shape —
   * no extra UI needed until the password prompt fires.
   */
  const previewImportAsset = async (
    asset: DocumentPicker.DocumentPickerAsset,
  ): Promise<SingleImportPreviewResult> => {
    const assetUri = asset?.uri;
    if (!assetUri) return { error: "No file was selected." };

    try {
      const jsonStr = await FileSystem.readAsStringAsync(assetUri);
      const sanitized = sanitizeJsonText(jsonStr);
      if (!sanitized) return { error: "The selected file is empty." };

      let rawData: any;
      try {
        rawData = JSON.parse(sanitized);
      } catch {
        return { error: "The file does not contain valid JSON." };
      }

      // ── Decrypt if needed ──────────────────────────────────────────────
      let dataToValidate = rawData;
      let wasEncrypted = false;

      if (isEncryptedEnvelope(rawData)) {
        wasEncrypted = true;

        let decrypted = "";
        let attemptCount = 0;
        let cancelled = false;

        while (true) {
          const promptMsg =
            attemptCount > 0
              ? "Incorrect password. Please try again."
              : "Enter the password you used when exporting this file.";

          const titleMsg =
            attemptCount > 0 ? "Wrong Password" : "File is Encrypted";

          const entered = await requestPassword(titleMsg, promptMsg);
          if (!entered) {
            cancelled = true;
            break;
          }

          try {
            decrypted = await decryptEnvelope(rawData, entered);
            break; // Decryption succeeded!
          } catch (decryptErr) {
            console.error(
              "Decryption failed on attempt:",
              attemptCount,
              decryptErr,
            );
            attemptCount++;
          }
        }

        if (cancelled) return { canceled: true };
        dataToValidate = JSON.parse(decrypted);
      }

      if (
        !dataToValidate?.format &&
        Array.isArray(dataToValidate?.workspaces) &&
        Array.isArray(dataToValidate?.categories) &&
        Array.isArray(dataToValidate?.accounts) &&
        Array.isArray(dataToValidate?.transactions)
      ) {
        dataToValidate = {
          format: "tally-backup",
          version: 1,
          exportedAt: dataToValidate.exportedAt || new Date().toISOString(),
          sections: ["transactions", "catalogs", "workspaces", "budgets"],
          database: dataToValidate,
          preferences: {},
        };
      }
      if (dataToValidate?.format === "tally-backup") {
        const appBackup = validateBackup(dataToValidate);
        return {
          preview: {
            appBackup,
            fileName: asset.name || "tally-backup.json",
            fileSize: asset.size,
            mimeType: asset.mimeType,
            transactionCount: appBackup.database.transactions?.length || 0,
            uri: assetUri,
            normalizedTransactions: [],
            rows: [],
            catalog: {
              incomeCategories: [],
              expenseCategories: [],
              accounts: [],
              categoryIcons: {},
              categoryColors: {},
              accountIcons: {},
              accountColors: {},
            },
            workspaceId: getActiveWorkspaceId(),
            wasEncrypted,
          },
        };
      }
      // ── Parse & validate ───────────────────────────────────────────────
      const workspaceId = getActiveWorkspaceId();
      const repository = new SQLiteFinanceRepository(workspaceId);
      const [income, expense, accounts] = await Promise.all([
        repository.getCategories("income"),
        repository.getCategories("expense"),
        repository.getAccounts(),
      ]);
      const categories = [...income, ...expense];
      const catalog: ImportCatalog = {
        incomeCategories: income.map((c) => c.name),
        expenseCategories: expense.map((c) => c.name),
        accounts: accounts.map((a) => a.name),
        categoryIcons: Object.fromEntries(
          categories
            .filter((c) => c.icon)
            .map((c) => [getCategoryIconKey(c.type, c.name), c.icon!]),
        ),
        categoryColors: Object.fromEntries(
          categories
            .filter((c) => c.color)
            .map((c) => [getCategoryIconKey(c.type, c.name), c.color!]),
        ),
        accountIcons: Object.fromEntries(
          accounts
            .filter((a) => a.icon)
            .map((a) => [a.name.toLowerCase(), a.icon!]),
        ),
        accountColors: Object.fromEntries(
          accounts
            .filter((a) => a.color)
            .map((a) => [a.name.toLowerCase(), a.color!]),
        ),
      };
      const rows = validateImport(dataToValidate, catalog);

      return {
        preview: {
          fileName: asset.name ?? "backup.json",
          fileSize: asset.size,
          mimeType: asset.mimeType,
          transactionCount: rows.length,
          uri: assetUri,
          normalizedTransactions: rows.map((row) => row.transaction),
          rows,
          catalog,
          workspaceId,
          wasEncrypted,
        },
      };
    } catch (error) {
      if (error instanceof ImportValidationError)
        return { error: error.message, problems: error.problems };
      console.error("Import preview error:", error);
      return {
        error: `${backupFailure(error, "read").reason}. ${backupFailure(error, "read").recovery}`,
      };
    }
  };

  const buildImportPreview = async (): Promise<ImportPreviewResult> => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/json"],
      copyToCacheDirectory: true,
      multiple: true,
    });
    if (result.canceled) return { canceled: true };
    if (!result.assets?.length) return { error: "No files selected" };
    if (result.assets.length === 1) {
      const single = await previewImportAsset(result.assets[0]);
      return "error" in single
        ? { ...single, fileName: result.assets[0].name }
        : single;
    }
    const files: ImportFileResult[] = [];
    for (const asset of result.assets) {
      const result = await previewImportAsset(asset);
      files.push({
        id: asset.uri,
        fileName: asset.name,
        ...("preview" in result
          ? { preview: result.preview }
          : "error" in result
            ? { error: result.error, problems: result.problems }
            : {
                error:
                  "File was not unlocked. Select this file again to enter its password.",
              }),
      });
    }
    return { files };
  };

  const handleImport = async () => {
    try {
      const previewResult = await buildImportPreview();
      if ("canceled" in previewResult) return;
      if ("error" in previewResult) {
        Alert.alert("Import Error", previewResult.error);
        return;
      }
      if ("files" in previewResult && previewResult.files.some((f) => f.error))
        throw Error(
          previewResult.files
            .filter((f) => f.error)
            .map((f) => `${f.fileName}: ${f.error}`)
            .join("\n"),
        );
      const selected =
        "files" in previewResult
          ? combineImportPreviews(previewResult.files.map((f) => f.preview!))
          : previewResult.preview;
      await importFromReviewedList(
        selected.rows,
        selected.workspaceId,
        selected.appBackup,
      );
    } catch (error) {
      console.error("Import error:", error);
      Alert.alert(
        "Import Error",
        error instanceof Error
          ? error.message
          : "Failed to import data. Please try again.",
      );
    }
  };

  // ─── Export helpers ────────────────────────────────────────────────────────

  /**
   * Android SAF export — prompts the user to pick a folder then writes there.
   * Bypasses expo-sharing to avoid the getFilePermission NoSuchMethodError on
   * some Expo SDK / expo-modules-core builds.
   */
  const exportAndroid = async (
    content: string,
    fileName: string,
  ): Promise<string | null> => {
    try {
      const permissions =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) return null;

      const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        fileName,
        "application/json",
      );

      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      return fileUri;
    } catch (err) {
      console.error("SAF export error:", err);
      Alert.alert(
        "Export Failed",
        "Could not save the file. Please try again and grant folder access when prompted.",
      );
      return null;
    }
  };

  const writeExportCacheFile = async (content: string, fileName: string) => {
    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return fileUri;
  };

  // ─── Export ───────────────────────────────────────────────────────────────

  /**
   * Export transactions (or a full database backup) to a .json file.
   *
   * Pass `encrypt: true` in options to AES-256-GCM encrypt the output.
   * The user will be prompted for a password; if they cancel, the export
   * is aborted and `false` is returned.
   */
  const handleExport = async (
    exportOptions?: ExportOptions,
  ): Promise<ExportResult | false> => {
    try {
      if (exportOptions?.sections) {
        if (!exportOptions.sections.length)
          throw Error("Choose at least one backup section");
        const { collectAppBackup } = await import("@/modules/Backup/service");
        const source = await collectAppBackup();
        if (exportOptions.scope && exportOptions.scope !== "all")
          source.database.transactions = filterTransactionsForExport(
            (source.database.transactions || []) as Transaction[],
            exportOptions,
          );
        const payloads = exportOptions.separateFiles
          ? exportOptions.sections.map((section) =>
              selectBackupSections(source, [section]),
            )
          : [selectBackupSections(source, exportOptions.sections)];
        const password = exportOptions.encrypt
          ? exportOptions.exportPassword?.trim() ||
            (await requestPassword(
              "Set backup password",
              "Enter a password to encrypt these files",
            ))
          : undefined;
        if (exportOptions.encrypt && !password) return false;
        const files: NonNullable<ExportResult["files"]> = [];
        let directory: string | undefined;
        if (Platform.OS === "android") {
          const permission =
            await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (!permission.granted) return false;
          directory = permission.directoryUri;
        }
        let count = 0;
        for (const payload of payloads) {
          validateBackup(payload);
          let content = JSON.stringify(payload, null, 2);
          if (password)
            content = JSON.stringify(
              await encryptJson(content, password),
              null,
              2,
            );
          const suffix = exportOptions.separateFiles
            ? `-${payload.sections[0]}`
            : "";
          const fileName = normalizeExportFileName(
            `${(exportOptions.fileName || "tally-backup").replace(/\.json$/i, "")}${suffix}${password ? "-encrypted" : ""}`,
          );
          const shareUri = await writeExportCacheFile(content, fileName);
          let savedUri: string | undefined;
          if (directory) {
            savedUri = await FileSystem.StorageAccessFramework.createFileAsync(
              directory,
              fileName,
              "application/json",
            );
            await FileSystem.writeAsStringAsync(savedUri, content);
          }
          files.push({ fileName, shareUri, savedUri });
          count += backupItemCount(payload);
        }
        toast.success(
          `Saved ${files.length} backup ${files.length === 1 ? "file" : "files"}`,
        );
        return {
          fileName:
            files.length > 1
              ? `${files.length} separate JSON files`
              : files[0].fileName,
          exportedItemCount: count,
          shareUri: files[0].shareUri,
          savedUri: files[0].savedUri,
          successMessage: "Backup saved",
          includeDatabaseBackup: true,
          encrypted: Boolean(password),
          files,
        };
      }
      let transactionsToExport = nonDeletedTransactions;
      let exportData: unknown;
      let exportedItemCount = 0;

      // ── Build the raw export payload ───────────────────────────────────
      if (exportOptions?.includeDatabaseBackup) {
        const backup = await workspaceRepository.getDatabaseBackup();
        exportData = backup;
        exportedItemCount =
          backup.transactions.length +
          backup.categories.length +
          backup.accounts.length +
          backup.workspaces.length +
          backup.budgets.length +
          backup.categoryBudgets.length;
      } else {
        if (financeRepository) {
          transactionsToExport = await financeRepository.getTransactions();
        }
        const scopedTransactions = filterTransactionsForExport(
          transactionsToExport,
          exportOptions,
        );
        if (scopedTransactions.length === 0) {
          Alert.alert(
            "Nothing to Export",
            "No transactions were found for the selected export range.",
          );
          return false;
        }
        exportData = { transactions: scopedTransactions };
        exportedItemCount = scopedTransactions.length;
      }

      // ── Serialise ──────────────────────────────────────────────────────
      let jsonStr = JSON.stringify(exportData, null, 2);

      // ── Optionally encrypt ─────────────────────────────────────────────
      let isEncrypted = false;
      if (exportOptions?.encrypt) {
        const password =
          exportOptions.exportPassword?.trim() ||
          (await requestPassword(
            "Set Export Password",
            "Enter a password to encrypt this file. You will need it to import later.",
          ));

        // User cancelled the password prompt — abort silently
        if (!password) return false;

        try {
          const envelope = await encryptJson(jsonStr, password);
          jsonStr = JSON.stringify(envelope, null, 2);
          isEncrypted = true;
        } catch (encErr) {
          console.error("Encryption error:", encErr);
          Alert.alert(
            "Encryption Failed",
            "Could not encrypt the file. Please try again.",
          );
          return false;
        }
      }

      // ── Build file name & success message ──────────────────────────────
      const baseFileName =
        exportOptions?.fileName ??
        (exportOptions?.includeDatabaseBackup
          ? `tally-database-backup-${new Date().toISOString().split("T")[0]}`
          : undefined);

      const fileName = normalizeExportFileName(
        isEncrypted
          ? `${baseFileName ?? "nest-transactions"}-encrypted`
          : baseFileName,
      );

      const successMessage = exportOptions?.includeDatabaseBackup
        ? `Database backup exported${isEncrypted ? " (encrypted)" : ""}!`
        : `Exported ${exportedItemCount} transaction${exportedItemCount === 1 ? "" : "s"}${isEncrypted ? " (encrypted)" : ""}!`;

      // ── Write file ─────────────────────────────────────────────────────
      if (Platform.OS === "ios") {
        const shareUri = await writeExportCacheFile(jsonStr, fileName);
        toast.success(successMessage);
        return {
          fileName,
          exportedItemCount,
          shareUri,
          successMessage,
          includeDatabaseBackup: Boolean(exportOptions?.includeDatabaseBackup),
          encrypted: isEncrypted,
        };
      } else {
        const savedFileUri = await exportAndroid(jsonStr, fileName);
        if (savedFileUri) {
          const shareFileUri = await writeExportCacheFile(jsonStr, fileName);
          toast.success(successMessage);
          return {
            fileName,
            exportedItemCount,
            shareUri: shareFileUri,
            savedUri: savedFileUri,
            successMessage,
            includeDatabaseBackup: Boolean(
              exportOptions?.includeDatabaseBackup,
            ),
            encrypted: isEncrypted,
          };
        }
        return false;
      }
    } catch (error) {
      console.error("Export error:", error);
      if (exportOptions?.sections) throw error;
      const issue = backupFailure(error, "save");
      Alert.alert(
        "Backup could not be saved",
        `${issue.reason}\n\n${issue.recovery}`,
      );
      return false;
    }
  };

  // ─── Public API ───────────────────────────────────────────────────────────

  return {
    importTransactions: handleImport,
    exportTransactions: handleExport,
    buildImportPreview,
    confirmImportPreview: importFromReviewedList,
  };
}
