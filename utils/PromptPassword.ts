/**
 * PromptPassword.ts
 *
 * Cross-platform password prompt.
 *
 * iOS  → uses Alert.prompt (native secure-text input, built into React Native).
 * Android → Alert.prompt does not exist; we fall back to a lightweight inline
 *           modal rendered imperatively via the `promptPasswordAndroid` helper.
 *           Wire up your own <PasswordModal> component and replace the stub below.
 *
 * Usage:
 *   const pwd = await promptPassword("Enter Password", "Needed to decrypt this file.");
 *   if (!pwd) { /* user cancelled *\/ }
 */

import { Alert, Platform } from "react-native";

// ─── iOS ──────────────────────────────────────────────────────────────────────

function promptPasswordIOS(
  title: string,
  message: string,
): Promise<string | null> {
  return new Promise((resolve) => {
    Alert.prompt(
      title,
      message,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => resolve(null),
        },
        {
          text: "OK",
          onPress: (value?: string) => resolve(value?.trim() || null),
        },
      ],
      "secure-text", // masks the input
    );
  });
}

// ─── Android ─────────────────────────────────────────────────────────────────
//
// Replace the body of this function with your own modal/bottom-sheet solution.
//
// Pattern A — react-native-paper Dialog (recommended if you already use it):
//
//   import { showPasswordDialog } from "../Components/PasswordDialog";
//   return showPasswordDialog(title, message);
//
// Pattern B — expo-router modal route:
//
//   router.push({ pathname: "/password-modal", params: { title, message } });
//   return waitForPasswordModalResult(); // e.g. via a shared Zustand store
//
// Until you wire up a real UI, this returns null (simulates "Cancel") so the
// rest of the import/export flow handles it gracefully.

function promptPasswordAndroid(
  _title: string,
  _message: string,
): Promise<string | null> {
  // ⚠️  STUB — replace with your modal implementation.
  // Example with react-native-paper is shown in the comments above.
  return Promise.resolve(null);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Show a secure password input prompt and resolve with the entered string,
 * or `null` if the user cancels (or if the Android stub is not yet wired up).
 *
 * @param title    Dialog title shown to the user.
 * @param message  Subtitle / instructions shown below the title.
 */
export function promptPassword(
  title: string,
  message: string,
): Promise<string | null> {
  return Platform.OS === "ios"
    ? promptPasswordIOS(title, message)
    : promptPasswordAndroid(title, message);
}
