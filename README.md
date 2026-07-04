# Tally

Tally is an offline-first personal finance app built with Expo and React Native. It helps users track income and expenses, organize spending across workspaces, categories, and accounts, review monthly insights, and keep data local to the device.

## Why Tally

Most personal finance tools are either too heavy, too cloud-dependent, or too rigid for everyday tracking. Tally is designed to feel lightweight and fast while still supporting the workflows that matter:

- Quick income and expense logging
- Workspace-based organization
- Category and account management
- Monthly budgets and budget breakdowns
- Local backup and restore
- Optional biometric protection
- Daily reminder notifications

## Features

- `Offline-first`: data is stored locally with SQLite
- `Fast transaction capture`: add, edit, filter, and soft-delete transactions
- `Workspaces`: separate personal, family, or custom finance contexts
- `Budgets`: set an overall monthly budget and per-category limits
- `Insights`: review monthly totals, category breakdowns, and account trends
- `Onboarding`: guided setup for workspace, theme, starter categories, and accounts
- `Backups`: export and import app data locally
- `Privacy-friendly`: no required backend or account system
- `Biometric lock`: optional Face ID / fingerprint protection
- `Notifications`: daily reminders and notification scheduling support

## Tech Stack

- Expo SDK 54
- React 19
- React Native 0.81
- TypeScript
- Redux Toolkit
- React Navigation
- Expo SQLite
- React Native Paper
- MMKV for local preferences

## Project Structure

```text
.
├── App.tsx                    # app bootstrap and providers
├── navigation/                # root and tab navigation
├── screens/                   # top-level route screens
├── modules/
│   ├── Core/                  # store, schema, repository, slices
│   ├── Management/            # transactions, categories, accounts, budgets
│   ├── Insights/              # reporting and analytics UI
│   ├── Settings/              # app settings and data management
│   ├── Onboarding/            # first-run setup flow
│   └── Labs/                  # experimental features
├── src/services/notifications/ # notification scheduling and handling
├── hooks/                     # shared app hooks
├── theme/                     # colors, typography, theming
├── utils/                     # helpers, types, seed data
└── assets/                    # fonts and app images
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Xcode for iOS development
- Android Studio for Android development
- iOS Simulator or a physical iPhone
- Android emulator or physical Android device

### Install

```bash
npm install
```

### Run the app

```bash
npm start
```

This project uses native modules such as `react-native-mmkv`, `react-native-quick-crypto`, `expo-sqlite`, and `expo-notifications`, so it should be run as a native development build rather than plain Expo Go.

Then run:

- `npm run android` for Android

## Product Highlights

- Local-first architecture with no required sign-in
- Multi-workspace support for separate budgets or households
- Guided onboarding instead of a blank first-run experience
- Flexible category and account management with reassignment flows
- Built-in backup/export tools for safer data ownership

## Roadmap Ideas

- Expand analytics and trend reporting
- Add Tablet Layouts
- Improve backup visibility and recovery UX
- Add richer filtering, tagging, and search workflows

## License

This project is licensed under the [MIT License](LICENSE).
