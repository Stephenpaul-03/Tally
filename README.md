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

### 💰 Transaction Management
- **Quick transaction capture**: Add, edit, filter, and soft-delete transactions with a streamlined UI
- **Transaction details**: Track description, amount, date, time, and payment method
- **Multi-account support**: Assign transactions to different accounts
- **Category-based organization**: Organize expenses and income by categories
- **Search & filtering**: Find transactions by category, account, date range, or amount
- **Transaction history**: View complete transaction history with soft-delete support

### 🎯 Budgets & Goals
- **Overall monthly budget**: Set a master budget for the entire month
- **Category-specific budgets**: Create per-category spending limits
- **Budget tracking**: Monitor spending against budgets in real-time
- **Budget breakdowns**: Visual breakdown of budget allocation and spending
- **Budget alerts**: Track progress towards budget limits

### 📊 Insights & Analytics
- **Monthly analytics**: View income, expenses, and net cash flow
- **Category breakdown**: See spending distribution across categories
- **Account analytics**: Track balance and activity across accounts
- **Payment method analysis**: Break down transactions by payment type
- **Weekly trends**: Review weekly transaction patterns
- **Trend visualization**: Chart-based trend analysis and comparison
- **Month-over-month comparison**: Compare spending trends across months
- **Share insights**: Export and share insights with others via quick share feature

### 👥 Workspaces
- **Multiple workspaces**: Separate personal, family, or custom finance contexts
- **Workspace switching**: Quickly switch between different workspaces
- **Workspace customization**: Edit workspace names and settings
- **Workspace isolation**: Keep finances organized separately by context

### 📁 Categories & Accounts
- **Predefined categories**: Pre-loaded categories with icons and colors
- **Custom categories**: Create and customize your own spending categories
- **Category management**: Edit, reorder, and manage all categories
- **Category colors & icons**: Visual customization for easy identification
- **Category reassignment**: Bulk reassign transactions to different categories
- **Account management**: Create and manage multiple accounts
- **Account types**: Support for different account configurations

### 🔐 Security & Privacy
- **Offline-first architecture**: All data stored locally with SQLite—no cloud required
- **Biometric lock**: Optional Face ID (iOS) or fingerprint (Android) protection
- **Data encryption**: Crypto-based encryption support for sensitive data
- **No account required**: Full functionality without sign-up or backend
- **Local backups**: Complete control over data with export/import functionality

### 📱 Personalization
- **Appearance customization**: Dark/light theme support with automatic detection
- **Default settings**: Set preferred currency, default account, and default categories
- **Theme colors**: Customize app colors and appearance

### 💾 Data Management
- **Backup export**: Export all app data to local storage (JSON format)
- **Backup import**: Restore data from previously exported backups
- **Data privacy**: View and manage data permissions
- **Development tools**: Developer settings for debugging and testing

### 🔔 Notifications
- **Daily reminders**: Set reminders to log transactions
- **Notification scheduling**: Configure when you receive notifications
- **Permission management**: Control app notification permissions

### 🗓️ Calendar View
- **Calendar navigation**: Browse transactions by calendar date
- **Date-based filtering**: View all transactions for a specific date

### 🎨 Onboarding Experience
- **Guided setup**: Step-by-step setup for first-time users
- **Workspace initialization**: Create your initial workspace
- **Theme selection**: Choose preferred theme during setup
- **Starter categories**: Pre-loaded category templates to get started
- **Account initialization**: Set up your first accounts

## Tech Stack

### Core Frameworks
- **Expo SDK 54** – Cross-platform development framework
- **React 19** – UI framework with latest features
- **React Native 0.81** – Native mobile development
- **TypeScript** – Type-safe development

### State & Data Management
- **Redux Toolkit** – Predictable state management
- **Expo SQLite** – Local SQL database
- **MMKV** – Ultra-fast key-value storage
- **React Redux** – React bindings for Redux

### Navigation & UI
- **React Navigation** – Cross-platform navigation
- **React Native Paper** – Material Design UI components
- **Reanimated** – Smooth, 60fps animations
- **React Native Gesture Handler** – Gesture recognition
- **Expo Vector Icons** – Icon library integration

### Security & Crypto
- **Expo Local Authentication** – Biometric authentication
- **Crypto-JS** – Cryptographic utilities
- **React Native Quick Crypto** – Native crypto support
- **React Native MMKV** – Encrypted storage option

### Utilities & Enhancements
- **React Native UI Date Picker** – Date/time selection
- **React Native Calendars** – Calendar component
- **Reanimated Color Picker** – Color selection UI
- **React Native Draggable FlatList** – Reorderable lists
- **Use Debounce** – Debouncing utilities
- **Color** – Color manipulation library

## Getting Started

### Prerequisites

- **Node.js 18+** – for build tools and package management
- **npm** – JavaScript package manager
- **Xcode 15+** – for iOS development (macOS only)
- **Android Studio** – for Android development
- **iOS Simulator** or physical iPhone (iOS 14+)
- **Android Emulator** or physical Android device (API 24+)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Tally

# Install dependencies
npm install
```

### Running the App

**Note:** This project uses native modules (`react-native-mmkv`, `react-native-quick-crypto`, `expo-sqlite`, `expo-notifications`), so it must be run as a native development build rather than plain Expo Go.

Start the development server:
```bash
npm start
```

Then run on your platform:

```bash
# iOS
npm run ios

# Android
npm run android
```

This will compile the native build and launch the app on your simulator/device.

### Development Scripts

```bash
npm start          # Start Expo dev server
npm run ios        # Build and run on iOS
npm run android    # Build and run on Android
npm run lint       # Run ESLint on TypeScript/JavaScript files
```

## Architecture & Key Patterns

### Data Layer
- **Expo SQLite**: Local SQL database for persistent transaction storage
- **Redux Toolkit**: Global state management for app-wide data
- **MMKV**: Lightning-fast key-value storage for user preferences
- **Repository Pattern**: Clean data access layer separating business logic from storage

### State Management
- Redux slices for modular state (transactions, categories, accounts, budgets)
- Custom hooks for computed selectors and derived state
- Minimal UI component state—prefer Redux for shared data

### Navigation
- React Navigation with bottom tabs for main sections
- Native Stack Navigator for deep navigation flows
- Type-safe route parameters using TypeScript

### Security
- Face ID / Fingerprint authentication via `expo-local-authentication`
- Optional biometric lock with password fallback
- Crypto utilities for sensitive data encryption

### Performance
- React Compiler enabled (Expo 54 feature) for optimized re-renders
- Reanimated for smooth animations
- Debounced search and filtering

## Product Highlights

- **Local-first architecture** with no required sign-in or backend
- **Multi-workspace support** for separate budgets, households, or contexts
- **Guided onboarding** with theme selection and starter templates
- **Flexible categorization** with bulk reassignment workflows
- **Built-in backup/export** for complete data ownership
- **Offline functionality** with seamless re-sync when needed
- **Biometric security** for optional additional protection
