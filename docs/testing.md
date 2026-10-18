# Testing Tally

Use Node 22 (`nvm use`), install dependencies with `npm ci`, then run:

```sh
npm run check:release
```

The suite currently contains **83 tests**, plus TypeScript and ESLint checks. Tests use isolated in-memory SQLite databases and fake records; they do not read your local finance data. GitHub Actions runs the same command.

| Command | Tests | What it checks |
| --- | ---: | --- |
| `npm run test:onboarding` | 16 | Setup validation, atomic saving, defaults and optional household categories, draft restoration, skip setup, and guided-tour progression |
| `npm run test:analytics` | 34 | Monthly and yearly totals, comparisons, dates, currencies, and sample-data generation with category-appropriate titles and recurring payments |
| `npm run test:import` | 14 | Invalid-file rejection, unresolved references, category creation across matching rows, required payment accounts, workspace isolation, rollback, and refresh failures |
| `npm run test:categories` | 9 | Bulk deletion and transaction reassignment, protected fallback categories, catch-all ordering, and icon search |
| `npm run test:notifications` | 6 | Permission/channel handling, immediate test delivery requests, scheduling failures, and preservation of existing reminders |
| `npm run test:release` | 4 | Signing safeguards, scanner exclusions, native template compatibility, and Expo reflection rules |

## Device checks

Automated tests do not verify touch gestures, animation quality, screen layout, or whether the operating system actually displays a notification. Check those on a device separately.

Before publishing an APK, verify both a fresh install and an upgrade with the intended signing key. Cover onboarding and skip setup; transaction entry, editing and deletion; category and account management; import review and export; insights and comparisons; theme persistence; reminders with the app backgrounded; and biometric locking when supported. Keep a backup and use fake data for destructive checks.

Current device evidence includes Android 16 emulator testing and Xiaomi 12T release-mode installation and targeted checks. The README screenshots use the Android development client with generated sample data. Neither screenshots nor passing tests substitute for the final release check.
