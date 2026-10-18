# Android APK releases

Measured during the 18 October 2026 optimization pass: the ARM64 release APK decreased from 64,883,368 bytes (61.88 MiB) to 44,737,374 bytes (42.66 MiB), a 31.05% reduction. Both measurements use ARM64; the older universal APK is not the comparison baseline. The optimized APK retains Hermes and uncompressed native libraries for direct loading.

Verified on the ARM64 Android 16 emulator: a fresh release install, all setup pages, workspace creation, tour dismissal, transaction entry and saving, Insights, Settings, and persistence of data and appearance after restarting. TypeScript, ESLint, and 83 automated tests pass. Both APKs pass the archive/alignment inspection; the test APK also passes signature verification. The test-signed release was also installed and opened on a Xiaomi 12T; import review, category deletion, toast stability, navigation, and notification delivery have received device checks. Production signing and a final full release-device pass remain separate steps.

Use Node 22, JDK 17, and an Android SDK/NDK compatible with Expo SDK 54. Install the locked dependencies with `npm ci`. Set `ANDROID_HOME` to your Android SDK directory if your shell does not already configure it.

Install Switzer from Fontshare using the [font setup guide](../assets/fonts/README.md). The release command checks for these local files before starting; they are not included in the source repository.

Native dependencies changed during this optimization. Rebuild your development client with `npm run android` before continuing development; a Metro reload alone does not update native modules.

## Build

```sh
npm run build:android:release
```

This runs TypeScript, ESLint, onboarding tests, analytics tests, import/rollback tests, notification tests, and release configuration tests; applies the Expo native configuration; then builds a minified ARM64 release APK. It does not require Metro or an Expo account. APKs, SHA-256 checksums, and the R8 mapping needed to decode crash reports are copied to `dist/releases/`.

The default APK targets ARM64 phones. Choose another target explicitly:

```sh
# Older 32-bit ARM phones
npm run build:android:release -- --abi=armeabi-v7a
# All supported phone and emulator architectures (larger download)
npm run build:android:release -- --abi=universal
# Intel/AMD emulator
npm run build:android:release -- --abi=x86_64
```

Build release and debug variants in separate Gradle invocations. The release configuration removes the unused barcode scanner dependencies pulled in by Expo's developer launcher. Debug builds retain the full development client. Release code is minified, and development-only JavaScript is removed.

## Test without a release key

```sh
npm run build:android:release -- --test-signing
adb install -r dist/releases/tally-0.1.0-arm64-v8a-test-signed.apk
```

This is a production-mode build signed with the local development key. Its application ID is `com.stephenpaul.tally.releasecheck`, so it installs separately and does not modify your existing Tally data. Do not distribute it as the public release.

## Sign for distribution

Without signing credentials the normal build produces an **unsigned** APK, which cannot be installed until signed. Configure these environment variables in your shell or CI secret store to produce a signed release:

- `TALLY_ANDROID_KEYSTORE_PATH`: absolute path to the keystore
- `TALLY_ANDROID_KEYSTORE_PASSWORD`
- `TALLY_ANDROID_KEY_ALIAS`
- `TALLY_ANDROID_KEY_PASSWORD`

Do not commit the keystore or passwords. Keep a secure backup: every future update must use the same certificate. Open source APKs still require signing. If any signing variables are present, all four must be set; the build never silently falls back to the debug key.

Before distributing, increment `expo.android.versionCode` in `app.json` for each release, update both app and package versions, and keep the signing certificate stable across architecture variants. Upload only the signed APK and its checksum. Keep the matching R8 map for crash diagnosis.

## Release verification

Before publishing, test a fresh install and an upgrade on a real ARM64 device: onboarding and skip setup; create/edit/delete a transaction; category and account management; insights and comparisons; theme preferences after restart; encrypted backup export/import; notification permission and reminders; biometric lock if available. Use a copy of data for destructive tests.

The test-signed package checks fresh installs. An upgrade test must use the actual production application ID and the same signing key as the previous release.

Inspect the APK for ZIP integrity, an embedded bundle, accidental scanner dependencies, and 16 KB alignment of its 64-bit native libraries:

```sh
python3 scripts/inspect-apk.py dist/releases/tally-0.1.0-arm64-v8a-unsigned.apk
```

This inspection does not verify signing or runtime behavior; check the signed artifact with Android SDK `apksigner verify` before distribution.

Native size optimizations are managed by `plugins/withAndroidRelease.js` and survive regeneration of the ignored `android/` directory. Hermes and directly loadable native libraries remain enabled. Assets are already small; the full category icon font is retained because users can choose icons dynamically.

The plugin also keeps Expo's reflection-based record converters, allocators, and type converters. These rules prevent a release-only SQLite startup crash with R8 optimization enabled; keep them when adjusting shrinking rules.

## Import and notification checks

Imports reject invalid descriptions, types, dates, amounts, or tags with row-specific errors before writing. Unknown categories and payment accounts require review: assign existing items or create items at confirmation. Every transaction must have a category and payment account. Review takes place in a separate sheet with category/account icons. Mappings affect only the selected transaction unless the user enables applying to matching rows. Creating a category also resolves other rows already using the same category name within that income/expense type; rows with missing payment accounts still need review. The transaction batch and newly created items commit together; a write failure rolls back the whole batch. A workspace change invalidates the preview.

In Settings → Notifications, use **Test** to request an immediate local notification. This bypasses Android alarm scheduling and does not verify scheduled-reminder timing. A successful request alone is not proof Android displayed it. Confirm it is visible in the notification shade, then separately test a scheduled reminder with the app backgrounded.

On Xiaomi devices, if permission and the channel are enabled but reminders do not arrive, check Tally’s background autostart and battery restrictions in system settings. The app links to its settings; it cannot override these device policies. See [Xiaomi’s background autostart guidance](https://www.mi.com/global/support/faq/details/KA-507608/).

Bulk category deletion is available from the selection button in the Categories header. Empty categories need no reassignment. Used categories require an unselected destination; active and trashed transactions are preserved. Fallback categories remain available. The selected categories, transaction moves, and removed category budgets update atomically.
