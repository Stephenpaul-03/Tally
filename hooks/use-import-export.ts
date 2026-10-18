import { getCategoryIconKey } from "@/utils/Helpers";
import { validateImport, ImportSavedError, ImportValidationError, type ImportProblem, type ImportRow, type ImportCatalog } from "@/modules/Core/import/validation";
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

export type ImportPreviewResult =
  | { canceled: true }
  | { error: string; problems?: ImportProblem[] }
  | { preview: ImportPreview };

export type ExportOptions = {
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

  const importFromReviewedList = async (rows: ImportRow[], workspaceId: string) => {
    if (getActiveWorkspaceId() !== workspaceId) throw new Error("Workspace changed. Choose the file again in the workspace you want to import into.");
    const repository = new SQLiteFinanceRepository(workspaceId);
    const count = await repository.importReviewedTransactions(rows);
    try {
      const [transactions, income, expense, accounts] = await Promise.all([
        repository.getTransactions(), repository.getCategories("income"), repository.getCategories("expense"), repository.getAccounts(),
      ]);
      if (getActiveWorkspaceId() === workspaceId) {
        dispatch(loadTransactions(transactions));
        dispatch(fetchCategories.fulfilled({ type: "income", categories: income }, "import", "income"));
        dispatch(fetchCategories.fulfilled({ type: "expense", categories: expense }, "import", "expense"));
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
  const buildImportPreview = async (): Promise<ImportPreviewResult> => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/json"],
      copyToCacheDirectory: true,
    });

    if (result.canceled) return { canceled: true };

    const asset = result.assets?.[0];
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

      // ── Parse & validate ───────────────────────────────────────────────
      const workspaceId = getActiveWorkspaceId();
      const repository = new SQLiteFinanceRepository(workspaceId);
      const [income, expense, accounts] = await Promise.all([
        repository.getCategories("income"), repository.getCategories("expense"), repository.getAccounts(),
      ]);
      const categories = [...income, ...expense];
      const catalog: ImportCatalog = {
        incomeCategories: income.map(c => c.name), expenseCategories: expense.map(c => c.name), accounts: accounts.map(a => a.name),
        categoryIcons: Object.fromEntries(categories.filter(c => c.icon).map(c => [getCategoryIconKey(c.type, c.name), c.icon!])),
        categoryColors: Object.fromEntries(categories.filter(c => c.color).map(c => [getCategoryIconKey(c.type, c.name), c.color!])),
        accountIcons: Object.fromEntries(accounts.filter(a => a.icon).map(a => [a.name.toLowerCase(), a.icon!])),
        accountColors: Object.fromEntries(accounts.filter(a => a.color).map(a => [a.name.toLowerCase(), a.color!])),
      };
      const rows = validateImport(dataToValidate, catalog);

      return {
        preview: {
          fileName: asset.name ?? "backup.json",
          fileSize: asset.size,
          mimeType: asset.mimeType,
          transactionCount: rows.length,
          uri: assetUri,
          normalizedTransactions: rows.map(row => row.transaction),
          rows, catalog, workspaceId,
          wasEncrypted,
        },
      };
    } catch (error) {
      if (error instanceof ImportValidationError) return { error: error.message, problems: error.problems };
      console.error("Import preview error:", error);
      return {
        error: "Failed to read that file. Please try again with a JSON backup.",
      };
    }
  };

  const handleImport = async () => {
    try {
      const previewResult = await buildImportPreview();
      if ("canceled" in previewResult) return;
      if ("error" in previewResult) {
        Alert.alert("Import Error", previewResult.error);
        return;
      }
      await importFromReviewedList(previewResult.preview.rows, previewResult.preview.workspaceId);
    } catch (error) {
      console.error("Import error:", error);
      Alert.alert("Import Error", error instanceof Error ? error.message : "Failed to import data. Please try again.");
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
      Alert.alert("Error", "Failed to export.");
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
