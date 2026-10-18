# Contributing to Tally

Thanks for helping make Tally better. Keep changes focused, describe what a user will notice, and include enough detail for someone else to verify the result.

## Development

Follow the [README](README.md#run-locally) to install dependencies and create a native development build. Use `npm ci` with the committed lockfile. Expo Go does not support all of Tally's native modules.

Obtain Switzer directly from Fontshare before running or building the native app; follow [font setup](assets/fonts/README.md). Keep those local files out of commits. Static checks and automated tests do not require Switzer.

Use Conventional Commits for commit messages: `feat(insights): add monthly comparison`, `fix(storage): preserve account assignments`, or `docs: clarify Android setup`. Describe the change rather than using temporary labels such as “changes” or “WIP.”

Android is the current release target. For UI changes, include the platform, device or emulator, theme, and relevant interface preferences in your testing notes.

Native project directories are generated and ignored. Put native configuration changes in Expo config plugins rather than relying on edits to generated Gradle or Xcode files. Rebuild the native client after dependency or native configuration changes.

## Before opening a pull request

Run `npm run check:release` and test the affected flow in a native build. Add tests for changes to calculations, setup persistence, or other behavior where a regression could affect recorded data. For small visual changes, before/after screenshots and a device check are usually more useful than tests that repeat the component implementation.

Changes to storage or imports must preserve existing data. Test migrations and backup compatibility with disposable data, including failure cases. Avoid unrelated dependency upgrades or formatting changes.

Describe the problem, the resulting behavior, and how you checked it. Mention anything that still needs device testing. Include screenshots or a short recording for visual changes.

## Issues

For a bug, include reproducible steps, expected and actual behavior, app version, Android/iOS version, and relevant settings. A screenshot or recording often helps explain a layout or navigation issue.

For an idea, explain the problem it would solve and the workflow you have in mind. Discuss larger changes before implementing them.

Use fake data in reports. Do not attach personal financial records, backup passwords, signing keys, access tokens, or unredacted device logs.

## Assets and licensing

By submitting code for inclusion in Tally, you agree to license your original contributions under GPL-3.0-only. Retain existing copyright notices and identify any third-party material and its license.

Keep third-party copyright notices and licenses with their assets. Do not assume that a font available at no charge can be redistributed under the project's GPLv3 license. See [third-party notices](THIRD_PARTY_NOTICES.md).
