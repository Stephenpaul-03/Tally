export function backupFailure(
  error: unknown,
  action: "read" | "save" | "restore",
) {
  const reason =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "The operation could not finish";
  const recovery = /space|disk|ENOSPC/i.test(reason)
    ? "Free some storage, then retry. You can also choose another folder."
    : /permission|access|denied|EACCES/i.test(reason)
      ? "Choose a folder Tally can write to and allow folder access, then retry."
      : /password|encrypt|decrypt/i.test(reason)
        ? "Check the password or select an unencrypted copy, then try again."
        : /version/i.test(reason)
          ? "Use a backup made by this version of Tally, or update Tally before importing."
          : /conflict|different versions|mixed/i.test(reason)
            ? "Remove one of the conflicting files, or choose files from the same export batch, then retry."
            : /category|workspace|reference|section|invalid|JSON|empty|format|duplicate/i.test(
                  reason,
                )
              ? "Choose a fresh Tally backup, or correct the named field in the JSON and select the file again. Your current data has not been changed."
              : action === "save"
                ? "Check the selected contents and filename, choose a writable folder, then retry. Your app data is unchanged."
                : action === "restore"
                  ? "Keep these files selected and retry, or remove the problem file and choose a corrected copy."
                  : "Choose the file again and check that it is a complete JSON backup, not an unfinished download.";
  return { reason, recovery };
}
