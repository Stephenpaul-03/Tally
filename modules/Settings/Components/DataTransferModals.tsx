/* eslint-disable react/no-unescaped-entities */
import { AlertModal } from "@/components/alert/AlertModal";
import { BackButton } from "@/components/backbutton/BackButton";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { toast } from "@/components/toast/toast";
import { useDataTransferControls } from "@/modules/Common/Hooks/UseDataTransferControls";
import type {
    ExportResult,
    ImportPreview,
} from "@/modules/Common/Hooks/UseImportExport";
import { isEncryptionSupported } from "@/modules/Common/Utils/CryptoUtils";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import React from "react";
import {
    Keyboard,
    KeyboardEvent,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    useWindowDimensions,
    View,
} from "react-native";
import { Button, Switch, Text, TextInput, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────

type BackupExportModalProps = {
  visible: boolean;
  onDismiss: () => void;
};

type BackupImportModalProps = {
  visible: boolean;
  onDismiss: () => void;
};

type ExportStep = 1 | 2 | 3;

type PasswordPromptState = {
  title: string;
  message: string;
  resolve: (value: string | null) => void;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildDefaultExportFileName(
  scope: "all" | "month" | "range",
  singleMonth: string,
  rangeStartMonth: string,
  rangeEndMonth: string,
) {
  if (scope === "month" && singleMonth) {
    return `nest-transactions-${singleMonth}`;
  }
  if (scope === "range" && rangeStartMonth && rangeEndMonth) {
    const [from, to] =
      rangeStartMonth <= rangeEndMonth
        ? [rangeStartMonth, rangeEndMonth]
        : [rangeEndMonth, rangeStartMonth];
    return `nest-transactions-${from}-to-${to}`;
  }
  return `nest-transactions-${new Date().toISOString().split("T")[0]}`;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useKeyboardHeight() {
  const [height, setHeight] = React.useState(0);
  React.useEffect(() => {
    const show = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hide = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const onShow = (e: KeyboardEvent) => setHeight(e.endCoordinates.height);
    const onHide = () => setHeight(0);
    const s1 = Keyboard.addListener(show, onShow);
    const s2 = Keyboard.addListener(hide, onHide);
    return () => {
      s1.remove();
      s2.remove();
    };
  }, []);
  return height;
}

function usePasswordPrompt() {
  const theme = useTheme();
  const [prompt, setPrompt] = React.useState<PasswordPromptState | null>(null);
  const [password, setPassword] = React.useState("");
  const activeResolverRef = React.useRef<PasswordPromptState["resolve"] | null>(
    null,
  );

  const promptPassword = React.useCallback((title: string, message: string) => {
    return new Promise<string | null>((resolve) => {
      setPassword("");
      setPrompt({ title, message, resolve });
    });
  }, []);

  const closePrompt = React.useCallback((value: string | null) => {
    setPrompt((current) => {
      current?.resolve(value);
      return null;
    });
    setPassword("");
  }, []);

  React.useEffect(() => {
    activeResolverRef.current = prompt?.resolve ?? null;
  }, [prompt]);

  React.useEffect(() => {
    return () => {
      activeResolverRef.current?.(null);
    };
  }, []);

  const PasswordPromptModal = prompt ? (
    <AlertModal
      isOpen
      title={prompt.title}
      message={prompt.message}
      confirmLabel="Continue"
      cancelLabel="Cancel"
      onConfirm={() => closePrompt(password.trim() || null)}
      onCancel={() => closePrompt(null)}
      confirmDisabled={!password.trim()}
      icon="lock-outline"
      containerMaxHeight={360}
    >
      <View style={{ paddingTop: 8 }}>
        <TextInput
          mode="outlined"
          value={password}
          onChangeText={setPassword}
          placeholder="Enter password"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          outlineColor={
            prompt.title === "Wrong Password"
              ? theme.colors.error
              : theme.colors.outlineVariant
          }
          activeOutlineColor={
            prompt.title === "Wrong Password"
              ? theme.colors.error
              : theme.colors.primary
          }
          style={{ backgroundColor: "transparent" }}
        />
        {prompt.title === "Wrong Password" ? (
          <Text
            style={{
              color: theme.colors.error,
              marginTop: 8,
              fontSize: 13,
              fontWeight: "600",
            }}
          >
            Incorrect password. Please try again.
          </Text>
        ) : null}
      </View>
    </AlertModal>
  ) : null;

  return { promptPassword, PasswordPromptModal };
}

// ─── Shared sheet layout ──────────────────────────────────────────────────────
//
// Every step uses this pattern:
//   <SheetLayout footer={<Button>}>
//     ... scrollable content ...
//   </SheetLayout>
//
// SheetLayout owns the handle, constrains the scroll area, and pins the footer
// above the safe-area bottom so it never hides behind the nav bar.

function SheetHandle() {
  const theme = useTheme();
  return (
    <View style={sharedS.handleWrap}>
      <View
        style={[
          sharedS.handle,
          { backgroundColor: theme.colors.outlineVariant },
        ]}
      />
    </View>
  );
}

function SheetLayout({
  children,
  footer,
  keyboardPadding = 0,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
  keyboardPadding?: number;
}) {
  const insets = useSafeAreaInsets();
  // Footer height: 52 (button) + 16 (top padding) + safe-area bottom
  const footerHeight = 52 + 16 + Math.max(insets.bottom, 16);

  return (
    <View style={sharedS.sheetBody}>
      {/* Scrollable content area — flex:1 so it fills between header and footer */}
      <ScrollView
        style={sharedS.scroll}
        contentContainerStyle={[
          sharedS.scrollContent,
          // When keyboard is up, pad the bottom so content scrolls above it
          { paddingBottom: Math.max(keyboardPadding, footerHeight) + 8 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>

      {/* Footer pinned to bottom, above safe-area */}
      <View
        style={[
          sharedS.footer,
          {
            paddingBottom: Math.max(insets.bottom, 16),
            // Rise above keyboard when it's up
            marginBottom: keyboardPadding,
          },
        ]}
      >
        {footer}
      </View>
    </View>
  );
}

const sharedS = StyleSheet.create({
  sheetBody: {
    flex: 1,
    // This is critical: constrain height so ScrollView works correctly inside
    // the bottom sheet. Without maxHeight the sheet grows unbounded.
    maxHeight: "85%",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 14,
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 999,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
  },
});

// ─── Step progress dots ───────────────────────────────────────────────────────

function StepDots({ total, current }: { total: number; current: ExportStep }) {
  const theme = useTheme();
  return (
    <View style={dotS.row}>
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const active = n === current;
        const done = n < current;
        return (
          <View
            key={n}
            style={[
              dotS.dot,
              {
                width: active ? 22 : 8,
                backgroundColor: theme.colors.primary,
                opacity: active ? 1 : done ? 0.35 : 0.15,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const dotS = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { height: 8, borderRadius: 999 },
});

// ─── Step header (icon + title + subtitle) ────────────────────────────────────

function StepHeader({
  step,
  totalSteps,
  icon,
  title,
  subtitle,
  onBack,
  onDismiss,
}: {
  step: ExportStep;
  totalSteps: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
  onBack?: () => void;
  onDismiss: () => void;
}) {
  const theme = useTheme();

  return (
    <View style={hdS.wrap}>
      {/* nav row */}
      <View style={hdS.navRow}>
        <BackButton onPress={onBack ?? (() => {})} theme={theme} size={34} />

        <StepDots total={totalSteps} current={step} />

        <Pressable
          onPress={onDismiss}
          style={({ pressed }) => [
            hdS.navBtn,
            {
              backgroundColor: theme.colors.elevation.level2,
              opacity: pressed ? 0.6 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="close"
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
        </Pressable>
      </View>

      {/* icon */}
      <View
        style={[
          hdS.iconWrap,
          { backgroundColor: theme.colors.primaryContainer },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={26}
          color={theme.colors.onPrimaryContainer}
        />
      </View>

      <Text style={[hdS.title, { color: theme.colors.onSurface }]}>
        {title}
      </Text>
      <Text style={[hdS.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        {subtitle}
      </Text>
    </View>
  );
}

const hdS = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingBottom: 4,
    gap: 10,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: -4,
  },
});

// ─── Step 1: File name ────────────────────────────────────────────────────────

function Step1FileName({
  fileName,
  onChangeName,
  suggestedName,
  onNext,
  onDismiss,
}: {
  fileName: string;
  onChangeName: (v: string) => void;
  suggestedName: string;
  onNext: () => void;
  onDismiss: () => void;
}) {
  const theme = useTheme();
  const keyboardHeight = useKeyboardHeight();

  return (
    <>
      <SheetHandle />
      <StepHeader
        step={1}
        totalSteps={3}
        icon="file-document-edit-outline"
        title="Name your backup"
        subtitle="Give this file a name you'll recognise later."
        onDismiss={onDismiss}
      />
      <SheetLayout
        keyboardPadding={keyboardHeight}
        footer={
          <Button
            mode="contained"
            onPress={onNext}
            disabled={!fileName.trim()}
            style={btnS.btn}
            contentStyle={btnS.content}
          >
            Continue
          </Button>
        }
      >
        <View style={s1.inputGroup}>
          <TextInput
            mode="outlined"
            value={fileName}
            onChangeText={onChangeName}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            outlineColor={theme.colors.outlineVariant}
            activeOutlineColor={theme.colors.primary}
            placeholder="e.g. nest-backup-june"
            style={s1.input}
            outlineStyle={{ borderRadius: 14 }}
            left={
              <TextInput.Icon
                icon="file-document-edit-outline"
                color={theme.colors.onSurfaceVariant}
              />
            }
          />
          <Text style={[s1.hint, { color: theme.colors.onSurfaceVariant }]}>
            .json will be added automatically
          </Text>
        </View>

        {suggestedName && suggestedName !== fileName.trim() ? (
          <Pressable
            onPress={() => onChangeName(suggestedName)}
            style={({ pressed }) => [
              s1.suggestionChip,
              {
                backgroundColor: theme.colors.elevation.level2,
                borderColor: theme.colors.outlineVariant,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="lightbulb-outline"
              size={14}
              color={theme.colors.primary}
            />
            <Text
              style={[
                s1.suggestionText,
                { color: theme.colors.onSurfaceVariant },
              ]}
              numberOfLines={1}
            >
              Use suggested: {suggestedName}
            </Text>
          </Pressable>
        ) : null}
      </SheetLayout>
    </>
  );
}

const s1 = StyleSheet.create({
  inputGroup: { gap: 6 },
  input: { backgroundColor: "transparent", fontSize: 16 },
  hint: { fontSize: 12, lineHeight: 16, paddingLeft: 2 },
  suggestionChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  suggestionText: { fontSize: 13, lineHeight: 18 },
});

// ─── Step 2: Scope ────────────────────────────────────────────────────────────

type ScopeOption = "all" | "month" | "range";

function ScopeCard({
  icon,
  label,
  description,
  active,
  onPress,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  description: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s2.card,
        {
          backgroundColor: active
            ? theme.colors.primaryContainer
            : theme.colors.elevation.level2,
          borderColor: active
            ? theme.colors.primary
            : theme.colors.outlineVariant,
          borderWidth: active ? 1.5 : 1,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      <View
        style={[
          s2.cardIcon,
          {
            backgroundColor: active
              ? theme.colors.primary
              : theme.colors.elevation.level3,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={
            active ? theme.colors.onPrimary : theme.colors.onSurfaceVariant
          }
        />
      </View>

      <View style={s2.cardText}>
        <Text
          style={[
            s2.cardLabel,
            {
              color: active
                ? theme.colors.onPrimaryContainer
                : theme.colors.onSurface,
              fontWeight: active ? "700" : "600",
            },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            s2.cardDesc,
            {
              color: active
                ? theme.colors.onPrimaryContainer
                : theme.colors.onSurfaceVariant,
              opacity: active ? 0.75 : 1,
            },
          ]}
        >
          {description}
        </Text>
      </View>

      {active ? (
        <MaterialCommunityIcons
          name="check-circle"
          size={22}
          color={theme.colors.primary}
        />
      ) : (
        <View
          style={[s2.radioRing, { borderColor: theme.colors.outlineVariant }]}
        />
      )}
    </Pressable>
  );
}

function MonthPillRow({
  options,
  selected,
  onSelect,
}: {
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s2.pillRow}
    >
      {options.map((opt) => {
        const active = opt.value === selected;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            style={({ pressed }) => [
              s2.pill,
              {
                backgroundColor: active
                  ? theme.colors.primaryContainer
                  : theme.colors.elevation.level2,
                borderColor: active
                  ? theme.colors.primary
                  : theme.colors.outlineVariant,
                borderWidth: active ? 1.5 : 1,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text
              style={[
                s2.pillText,
                {
                  color: active
                    ? theme.colors.onPrimaryContainer
                    : theme.colors.onSurface,
                  fontWeight: active ? "700" : "500",
                },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function MonthBox({
  label,
  icon,
  options,
  selected,
  onSelect,
}: {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  const theme = useTheme();
  const selLabel = options.find((o) => o.value === selected)?.label;

  return (
    <View style={s2.pickerWrap}>
      <View style={s2.pickerLabelRow}>
        <MaterialCommunityIcons
          name={icon}
          size={14}
          color={theme.colors.primary}
        />
        <Text
          style={[s2.pickerLabel, { color: theme.colors.onSurfaceVariant }]}
        >
          {label}
        </Text>
        {selLabel ? (
          <View
            style={[
              s2.selBadge,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <Text
              style={[
                s2.selBadgeText,
                { color: theme.colors.onPrimaryContainer },
              ]}
            >
              {selLabel}
            </Text>
          </View>
        ) : null}
      </View>
      <MonthPillRow options={options} selected={selected} onSelect={onSelect} />
    </View>
  );
}

function Step2Scope({
  exportScope,
  setExportScope,
  availableMonths,
  singleMonth,
  setSingleMonth,
  rangeStartMonth,
  setRangeStartMonth,
  rangeEndMonth,
  setRangeEndMonth,
  onBack,
  onNext,
  onDismiss,
}: {
  exportScope: ScopeOption;
  setExportScope: (s: ScopeOption) => void;
  availableMonths: { label: string; value: string }[];
  singleMonth: string;
  setSingleMonth: (v: string) => void;
  rangeStartMonth: string;
  setRangeStartMonth: (v: string) => void;
  rangeEndMonth: string;
  setRangeEndMonth: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
  onDismiss: () => void;
}) {
  const theme = useTheme();
  const hasMonths = availableMonths.length > 0;

  const canProceed =
    exportScope === "all" ||
    (exportScope === "month" && Boolean(singleMonth)) ||
    (exportScope === "range" &&
      Boolean(rangeStartMonth) &&
      Boolean(rangeEndMonth));

  return (
    <>
      <SheetHandle />
      <StepHeader
        step={2}
        totalSteps={3}
        icon="calendar-month-outline"
        title="What to export"
        subtitle="Select all transactions or narrow it to specific months."
        onBack={onBack}
        onDismiss={onDismiss}
      />
      <SheetLayout
        footer={
          <Button
            mode="contained"
            onPress={onNext}
            disabled={!canProceed}
            style={btnS.btn}
            contentStyle={btnS.content}
          >
            Continue
          </Button>
        }
      >
        {/* Scope cards */}
        <View style={s2.cards}>
          <ScopeCard
            icon="layers-outline"
            label="All transactions"
            description="Export everything in your account"
            active={exportScope === "all"}
            onPress={() => setExportScope("all")}
          />
          {hasMonths ? (
            <ScopeCard
              icon="calendar-today"
              label="One month"
              description="Pick a single month"
              active={exportScope === "month"}
              onPress={() => setExportScope("month")}
            />
          ) : null}
          {hasMonths ? (
            <ScopeCard
              icon="calendar-range"
              label="Date range"
              description="Choose a start and end month"
              active={exportScope === "range"}
              onPress={() => setExportScope("range")}
            />
          ) : null}
        </View>

        {/* Month picker — only shown when scope needs it */}
        {exportScope === "month" && hasMonths ? (
          <View
            style={[
              s2.monthBox,
              {
                backgroundColor: theme.colors.elevation.level1,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <MonthBox
              label="Month"
              icon="calendar-blank-outline"
              options={availableMonths}
              selected={singleMonth}
              onSelect={setSingleMonth}
            />
          </View>
        ) : null}

        {exportScope === "range" && hasMonths ? (
          <View
            style={[
              s2.monthBox,
              {
                backgroundColor: theme.colors.elevation.level1,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <MonthBox
              label="From"
              icon="calendar-start"
              options={availableMonths}
              selected={rangeStartMonth}
              onSelect={setRangeStartMonth}
            />
            <View
              style={[
                s2.divider,
                { backgroundColor: theme.colors.outlineVariant },
              ]}
            />
            <MonthBox
              label="To"
              icon="calendar-end"
              options={availableMonths}
              selected={rangeEndMonth}
              onSelect={setRangeEndMonth}
            />
          </View>
        ) : null}

        {!hasMonths && exportScope !== "all" ? (
          <View
            style={[
              s2.emptyNote,
              {
                backgroundColor: theme.colors.elevation.level1,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="calendar-remove-outline"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              style={[s2.emptyText, { color: theme.colors.onSurfaceVariant }]}
            >
              No months available yet. Use "All transactions" instead.
            </Text>
          </View>
        ) : null}
      </SheetLayout>
    </>
  );
}

const s2 = StyleSheet.create({
  cards: { gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardText: { flex: 1, minWidth: 0, gap: 2 },
  cardLabel: { fontSize: 15, lineHeight: 20 },
  cardDesc: { fontSize: 12, lineHeight: 17 },
  radioRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    flexShrink: 0,
  },
  monthBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  pickerWrap: { gap: 10 },
  pickerLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  pickerLabel: { fontSize: 13, fontWeight: "600", letterSpacing: 0.1 },
  selBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginLeft: 2,
  },
  selBadgeText: { fontSize: 12, fontWeight: "700" },
  pillRow: { flexDirection: "row", gap: 8, paddingVertical: 2 },
  pill: {
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: { fontSize: 13, lineHeight: 18 },
  divider: { height: StyleSheet.hairlineWidth },
  emptyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  emptyText: { flex: 1, fontSize: 13, lineHeight: 19 },
});

// ─── Step 3: Encryption ───────────────────────────────────────────────────────

function Step3Encryption({
  encryptBackup,
  setEncryptBackup,
  exportPassword,
  setExportPassword,
  exportPasswordConfirm,
  setExportPasswordConfirm,
  showPassword,
  setShowPassword,
  encryptionSupported,
  onBack,
  onExport,
  onDismiss,
  isExporting,
}: {
  encryptBackup: boolean;
  setEncryptBackup: (v: boolean) => void;
  exportPassword: string;
  setExportPassword: (v: string) => void;
  exportPasswordConfirm: string;
  setExportPasswordConfirm: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  encryptionSupported: boolean;
  onBack: () => void;
  onExport: () => void;
  onDismiss: () => void;
  isExporting: boolean;
}) {
  const theme = useTheme();
  const keyboardHeight = useKeyboardHeight();

  const passwordsMatch =
    !encryptBackup ||
    (exportPassword.trim().length > 0 &&
      exportPassword === exportPasswordConfirm);

  const canExport = !encryptBackup || passwordsMatch;

  const confirmBorderColor =
    exportPasswordConfirm && !passwordsMatch
      ? theme.colors.error
      : theme.colors.outlineVariant;

  const confirmActiveBorderColor =
    exportPasswordConfirm && !passwordsMatch
      ? theme.colors.error
      : theme.colors.primary;

  return (
    <>
      <SheetHandle />
      <StepHeader
        step={3}
        totalSteps={3}
        icon="lock-outline"
        title="Protect your backup"
        subtitle="Optionally encrypt the file with a password."
        onBack={onBack}
        onDismiss={onDismiss}
      />
      <SheetLayout
        keyboardPadding={keyboardHeight}
        footer={
          <Button
            mode="contained"
            onPress={onExport}
            disabled={!canExport || isExporting}
            loading={isExporting}
            style={btnS.btn}
            contentStyle={btnS.content}
          >
            {isExporting ? "Saving…" : "Save backup"}
          </Button>
        }
      >
        {/* Toggle card */}
        <Pressable
          onPress={() => {
            if (!encryptionSupported) return;
            const next = !encryptBackup;
            setEncryptBackup(next);
            if (!next) {
              setExportPassword("");
              setExportPasswordConfirm("");
              setShowPassword(false);
            }
          }}
          style={({ pressed }) => [
            s3.toggleCard,
            {
              backgroundColor: encryptBackup
                ? theme.colors.primaryContainer
                : theme.colors.elevation.level2,
              borderColor: encryptBackup
                ? theme.colors.primary
                : theme.colors.outlineVariant,
              borderWidth: encryptBackup ? 1.5 : 1,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
        >
          <View
            style={[
              s3.toggleIcon,
              {
                backgroundColor: encryptBackup
                  ? theme.colors.primary
                  : theme.colors.elevation.level3,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={encryptBackup ? "lock" : "lock-open-outline"}
              size={22}
              color={
                encryptBackup
                  ? theme.colors.onPrimary
                  : theme.colors.onSurfaceVariant
              }
            />
          </View>

          <View style={s3.toggleText}>
            <Text
              style={[
                s3.toggleTitle,
                {
                  color: encryptBackup
                    ? theme.colors.onPrimaryContainer
                    : theme.colors.onSurface,
                  fontWeight: encryptBackup ? "700" : "600",
                },
              ]}
            >
              {encryptBackup ? "Encryption on" : "Encrypt this backup"}
            </Text>
            <Text
              style={[
                s3.toggleDesc,
                {
                  color: encryptBackup
                    ? theme.colors.onPrimaryContainer
                    : theme.colors.onSurfaceVariant,
                  opacity: encryptBackup ? 0.75 : 1,
                },
              ]}
            >
              {encryptBackup
                ? "File will be locked with your password"
                : "Password-protect the file"}
            </Text>
            {!encryptionSupported ? (
              <Text
                style={[
                  s3.toggleDesc,
                  { color: theme.colors.onSurfaceVariant, fontStyle: "italic" },
                ]}
              >
                Not available in this build
              </Text>
            ) : null}
          </View>

          <Switch
            value={encryptBackup}
            disabled={!encryptionSupported}
            onValueChange={(v) => {
              setEncryptBackup(v);
              if (!v) {
                setExportPassword("");
                setExportPasswordConfirm("");
                setShowPassword(false);
              }
            }}
          />
        </Pressable>

        {/* No-encrypt note */}
        {!encryptBackup ? (
          <View
            style={[
              s3.infoNote,
              {
                backgroundColor: theme.colors.elevation.level1,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="information-outline"
              size={16}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              style={[s3.infoText, { color: theme.colors.onSurfaceVariant }]}
            >
              Saved as plain JSON — readable by anyone with access to the file.
            </Text>
          </View>
        ) : null}

        {/* Password fields */}
        {encryptBackup && encryptionSupported ? (
          <View
            style={[
              s3.passwordCard,
              {
                backgroundColor: theme.colors.elevation.level1,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <View style={s3.field}>
              <Text
                style={[
                  s3.fieldLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Password
              </Text>
              <TextInput
                mode="outlined"
                value={exportPassword}
                onChangeText={setExportPassword}
                placeholder="Enter password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                outlineColor={theme.colors.outlineVariant}
                activeOutlineColor={theme.colors.primary}
                style={s3.input}
                outlineStyle={{ borderRadius: 14 }}
                left={
                  <TextInput.Icon
                    icon="lock-outline"
                    color={theme.colors.onSurfaceVariant}
                  />
                }
                right={
                  <TextInput.Icon
                    icon={showPassword ? "eye-off" : "eye"}
                    color={theme.colors.onSurfaceVariant}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />
            </View>

            <View style={s3.field}>
              <Text
                style={[
                  s3.fieldLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Confirm password
              </Text>
              <TextInput
                mode="outlined"
                value={exportPasswordConfirm}
                onChangeText={setExportPasswordConfirm}
                placeholder="Re-enter password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                outlineColor={confirmBorderColor}
                activeOutlineColor={confirmActiveBorderColor}
                style={s3.input}
                outlineStyle={{ borderRadius: 14 }}
                left={
                  <TextInput.Icon
                    icon="lock-check-outline"
                    color={
                      exportPasswordConfirm && !passwordsMatch
                        ? theme.colors.error
                        : theme.colors.onSurfaceVariant
                    }
                  />
                }
                right={
                  <TextInput.Icon
                    icon={showPassword ? "eye-off" : "eye"}
                    color={theme.colors.onSurfaceVariant}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />
            </View>

            {exportPasswordConfirm ? (
              <View style={s3.statusRow}>
                <MaterialCommunityIcons
                  name={
                    passwordsMatch
                      ? "check-circle-outline"
                      : "alert-circle-outline"
                  }
                  size={15}
                  color={
                    passwordsMatch ? theme.colors.primary : theme.colors.error
                  }
                />
                <Text
                  style={[
                    s3.statusText,
                    {
                      color: passwordsMatch
                        ? theme.colors.primary
                        : theme.colors.error,
                    },
                  ]}
                >
                  {passwordsMatch ? "Passwords match" : "Passwords don't match"}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </SheetLayout>
    </>
  );
}

const s3 = StyleSheet.create({
  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  toggleIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  toggleText: { flex: 1, minWidth: 0, gap: 3 },
  toggleTitle: { fontSize: 15, lineHeight: 20 },
  toggleDesc: { fontSize: 12, lineHeight: 17 },
  infoNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 13,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 19 },
  passwordCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  field: { gap: 6 },
  fieldLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  input: { backgroundColor: "transparent" },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: -4,
  },
  statusText: { fontSize: 13, lineHeight: 18, fontWeight: "600" },
});

// ─── Shared button styles ─────────────────────────────────────────────────────

const btnS = StyleSheet.create({
  btn: { borderRadius: 14 },
  content: { minHeight: 52 },
  row: { flexDirection: "row", gap: 12 },
  secondary: { flex: 1, borderRadius: 14 },
  primary: { flex: 1.2, borderRadius: 14 },
});

// ─── Share sheet (step 4) ─────────────────────────────────────────────────────

function ShareSheet({
  visible,
  exportResult,
  fileName,
  isSharing,
  onShare,
  onDismiss,
}: {
  visible: boolean;
  exportResult: ExportResult | null;
  fileName: string;
  isSharing: boolean;
  onShare: () => void;
  onDismiss: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onDismiss}
      presentation="sheet"
      contentContainerStyle={[
        ss.sheet,
        {
          backgroundColor: theme.colors.elevation.level1,
          borderTopColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <SheetHandle />

      <View
        style={[ss.content, { paddingBottom: Math.max(insets.bottom, 20) }]}
      >
        {/* Success mark */}
        <View
          style={[
            ss.successIcon,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <MaterialCommunityIcons
            name="check"
            size={32}
            color={theme.colors.onPrimaryContainer}
          />
        </View>

        <Text style={[ss.title, { color: theme.colors.onSurface }]}>
          Backup saved
        </Text>
        <Text style={[ss.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Want to share it somewhere for safekeeping?
        </Text>

        {/* File summary */}
        <View
          style={[
            ss.summaryCard,
            {
              backgroundColor: theme.colors.elevation.level2,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <View
            style={[
              ss.fileIcon,
              { backgroundColor: theme.colors.elevation.level3 },
            ]}
          >
            <MaterialCommunityIcons
              name="file-document-outline"
              size={20}
              color={theme.colors.primary}
            />
          </View>
          <View style={ss.summaryText}>
            <Text
              style={[
                ss.summaryLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              File
            </Text>
            <Text
              style={[ss.summaryValue, { color: theme.colors.onSurface }]}
              numberOfLines={1}
            >
              {exportResult?.fileName ?? `${fileName}.json`}
            </Text>
          </View>
          <View
            style={[
              ss.countPill,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <Text
              style={[ss.countNum, { color: theme.colors.onPrimaryContainer }]}
            >
              {exportResult?.exportedItemCount ?? 0}
            </Text>
            <Text
              style={[
                ss.countLabel,
                { color: theme.colors.onPrimaryContainer },
              ]}
            >
              items
            </Text>
          </View>
        </View>

        {exportResult?.encrypted ? (
          <View
            style={[
              ss.encBadge,
              { backgroundColor: theme.colors.secondaryContainer },
            ]}
          >
            <MaterialCommunityIcons
              name="lock"
              size={14}
              color={theme.colors.onSecondaryContainer}
            />
            <Text
              style={[
                ss.encBadgeText,
                { color: theme.colors.onSecondaryContainer },
              ]}
            >
              Encrypted
            </Text>
          </View>
        ) : null}

        <View style={ss.actions}>
          <Button
            mode="outlined"
            onPress={onDismiss}
            style={btnS.secondary}
            contentStyle={btnS.content}
          >
            Not now
          </Button>
          <Button
            mode="contained"
            onPress={onShare}
            disabled={isSharing}
            loading={isSharing}
            style={btnS.primary}
            contentStyle={btnS.content}
          >
            Share file
          </Button>
        </View>
      </View>
    </AnimatedPaperModal>
  );
}

const ss = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    overflow: "hidden",
  },
  content: {
    paddingHorizontal: 20,
    gap: 12,
  },
  successIcon: {
    width: 62,
    height: 62,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: -4 },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  fileIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  summaryText: { flex: 1, minWidth: 0 },
  summaryLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  summaryValue: {
    marginTop: 2,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
  },
  countPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
    flexShrink: 0,
  },
  countNum: { fontSize: 18, lineHeight: 22, fontWeight: "800" },
  countLabel: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  encBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  encBadgeText: { fontSize: 13, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 12, marginTop: 4 },
});

// ─── BackupExportModal ────────────────────────────────────────────────────────

export function BackupExportModal({
  visible,
  onDismiss,
}: BackupExportModalProps) {
  const theme = useTheme();
  const { height } = useWindowDimensions();
  const encryptionSupported = isEncryptionSupported();

  const {
    resetExportForm,
    exportTransactions,
    exportScope,
    setExportScope,
    availableMonths,
    singleMonth,
    setSingleMonth,
    rangeStartMonth,
    setRangeStartMonth,
    rangeEndMonth,
    setRangeEndMonth,
  } = useDataTransferControls();

  const [step, setStep] = React.useState<ExportStep>(1);
  const [fileNameDraft, setFileNameDraft] = React.useState("");
  const [fileNameTouched, setFileNameTouched] = React.useState(false);
  const [encryptBackup, setEncryptBackup] = React.useState(false);
  const [exportPassword, setExportPassword] = React.useState("");
  const [exportPasswordConfirm, setExportPasswordConfirm] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [exportResult, setExportResult] = React.useState<ExportResult | null>(
    null,
  );
  const [isExporting, setIsExporting] = React.useState(false);
  const [isSharing, setIsSharing] = React.useState(false);
  const [shareVisible, setShareVisible] = React.useState(false);

  const suggestedName = buildDefaultExportFileName(
    exportScope,
    singleMonth,
    rangeStartMonth,
    rangeEndMonth,
  );

  React.useEffect(() => {
    if (!visible) return;
    resetExportForm();
    setStep(1);
    setFileNameTouched(false);
    setFileNameDraft(suggestedName);
    setEncryptBackup(false);
    setExportPassword("");
    setExportPasswordConfirm("");
    setShowPassword(false);
    setExportResult(null);
    setIsExporting(false);
    setIsSharing(false);
    setShareVisible(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  React.useEffect(() => {
    if (!visible || fileNameTouched) return;
    setFileNameDraft(suggestedName);
  }, [suggestedName, fileNameTouched, visible]);

  const handleExport = React.useCallback(async () => {
    setIsExporting(true);
    try {
      const result = await exportTransactions({
        scope: exportScope,
        month: exportScope === "month" ? singleMonth : undefined,
        startMonth: exportScope === "range" ? rangeStartMonth : undefined,
        endMonth: exportScope === "range" ? rangeEndMonth : undefined,
        fileName: fileNameDraft,
        encrypt: encryptBackup,
        exportPassword: encryptBackup ? exportPassword.trim() : undefined,
      });
      if (result) {
        setExportResult(result);
        setShareVisible(true);
      }
    } finally {
      setIsExporting(false);
    }
  }, [
    encryptBackup,
    exportPassword,
    exportScope,
    exportTransactions,
    fileNameDraft,
    rangeEndMonth,
    rangeStartMonth,
    singleMonth,
  ]);

  const handleShare = React.useCallback(async () => {
    if (!exportResult || isSharing) return;
    try {
      setIsSharing(true);
      const available = await Sharing.isAvailableAsync();
      if (!available) return;
      await Sharing.shareAsync(exportResult.shareUri, {
        mimeType: "application/json",
        dialogTitle: exportResult.includeDatabaseBackup
          ? "Share database backup"
          : "Share backup file",
        UTI: "public.json",
      });
    } catch (e) {
      console.error("Share failed:", e);
    } finally {
      setIsSharing(false);
      setShareVisible(false);
      onDismiss();
    }
  }, [exportResult, isSharing, onDismiss]);

  return (
    <>
      <AnimatedPaperModal
        visible={visible && !shareVisible}
        onDismiss={onDismiss}
        presentation="sheet"
        contentContainerStyle={[
          mainS.sheet,
          {
            backgroundColor: theme.colors.elevation.level1,
            borderTopColor: theme.colors.outlineVariant,
            height: height * 0.8,
          },
        ]}
      >
        {step === 1 ? (
          <Step1FileName
            fileName={fileNameDraft}
            onChangeName={(v) => {
              setFileNameDraft(v);
              setFileNameTouched(true);
            }}
            suggestedName={suggestedName}
            onNext={() => setStep(2)}
            onDismiss={onDismiss}
          />
        ) : null}

        {step === 2 ? (
          <Step2Scope
            exportScope={exportScope as ScopeOption}
            setExportScope={setExportScope as (s: ScopeOption) => void}
            availableMonths={availableMonths}
            singleMonth={singleMonth}
            setSingleMonth={setSingleMonth}
            rangeStartMonth={rangeStartMonth}
            setRangeStartMonth={setRangeStartMonth}
            rangeEndMonth={rangeEndMonth}
            setRangeEndMonth={setRangeEndMonth}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
            onDismiss={onDismiss}
          />
        ) : null}

        {step === 3 ? (
          <Step3Encryption
            encryptBackup={encryptBackup}
            setEncryptBackup={setEncryptBackup}
            exportPassword={exportPassword}
            setExportPassword={setExportPassword}
            exportPasswordConfirm={exportPasswordConfirm}
            setExportPasswordConfirm={setExportPasswordConfirm}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            encryptionSupported={encryptionSupported}
            onBack={() => setStep(2)}
            onExport={() => {
              void handleExport();
            }}
            onDismiss={onDismiss}
            isExporting={isExporting}
          />
        ) : null}
      </AnimatedPaperModal>

      <ShareSheet
        visible={shareVisible}
        exportResult={exportResult}
        fileName={fileNameDraft}
        isSharing={isSharing}
        onShare={() => {
          void handleShare();
        }}
        onDismiss={onDismiss}
      />
    </>
  );
}

const mainS = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    overflow: "hidden",
  },
});

// ─── BackupImportModal ────────────────────────────────────────────────────────

function ImportPreviewRow({
  label,
  value,
  icon = "file-document-outline",
}: {
  label: string;
  value: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}) {
  const theme = useTheme();
  return (
    <View style={impS.row}>
      <View
        style={[
          impS.rowIcon,
          { backgroundColor: theme.colors.elevation.level1 },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={theme.colors.primary}
        />
      </View>
      <View style={impS.rowText}>
        <Text style={[impS.rowLabel, { color: theme.colors.onSurfaceVariant }]}>
          {label}
        </Text>
        <Text
          style={[impS.rowValue, { color: theme.colors.onSurface }]}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

export function BackupImportModal({
  visible,
  onDismiss,
}: BackupImportModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { promptPassword, PasswordPromptModal } = usePasswordPrompt();
  const dataTransfer = useDataTransferControls(undefined, { promptPassword });
  const [preview, setPreview] = React.useState<ImportPreview | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [isPickingFile, setIsPickingFile] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);

  React.useEffect(() => {
    if (!visible) {
      setPreview(null);
      setConfirmOpen(false);
      setIsPickingFile(false);
      setIsImporting(false);
    }
  }, [visible]);

  const handleSelectFile = React.useCallback(async () => {
    if (isPickingFile) return;
    try {
      setIsPickingFile(true);
      const result = await dataTransfer.buildImportPreview();
      if ("canceled" in result) return;
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setPreview(result.preview);
    } finally {
      setIsPickingFile(false);
    }
  }, [dataTransfer, isPickingFile]);

  const handleConfirmImport = React.useCallback(async () => {
    if (!preview || isImporting) return false;
    try {
      setIsImporting(true);
      await dataTransfer.confirmImportPreview(preview.normalizedTransactions);
      setConfirmOpen(false);
      setPreview(null);
      onDismiss();
      return true;
    } catch (e) {
      console.error("Import failed:", e);
      toast.error("Couldn't import that backup");
      return false;
    } finally {
      setIsImporting(false);
    }
  }, [dataTransfer, isImporting, onDismiss, preview]);

  return (
    <>
      <AnimatedPaperModal
        visible={visible}
        onDismiss={onDismiss}
        presentation="sheet"
        contentContainerStyle={[
          impS.sheet,
          {
            backgroundColor: theme.colors.elevation.level1,
            borderTopColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <SheetHandle />

        <View
          style={[impS.content, { paddingBottom: Math.max(insets.bottom, 20) }]}
        >
          <View
            style={[
              impS.iconWrap,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <MaterialCommunityIcons
              name="file-import-outline"
              size={28}
              color={theme.colors.onPrimaryContainer}
            />
          </View>

          <Text style={[impS.title, { color: theme.colors.onSurface }]}>
            Restore a backup
          </Text>
          <Text
            style={[impS.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Pick a backup file. We'll show you what's inside before anything
            changes.
          </Text>

          {!preview ? (
            <Pressable
              onPress={handleSelectFile}
              disabled={isPickingFile}
              style={({ pressed }) => [
                impS.uploadZone,
                {
                  backgroundColor: theme.colors.elevation.level2,
                  borderColor: theme.colors.outlineVariant,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View
                style={[
                  impS.uploadIconWrap,
                  { backgroundColor: theme.colors.primaryContainer },
                ]}
              >
                <MaterialCommunityIcons
                  name="cloud-upload-outline"
                  size={34}
                  color={theme.colors.primary}
                />
              </View>
              <Text
                style={[impS.uploadTitle, { color: theme.colors.onSurface }]}
              >
                Tap to select a file
              </Text>
              <Text
                style={[
                  impS.uploadSubtitle,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Encrypted and unencrypted JSON supported
              </Text>
            </Pressable>
          ) : (
            <View
              style={[
                impS.previewCard,
                {
                  backgroundColor: theme.colors.elevation.level2,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
            >
              <View style={impS.previewHeader}>
                <View
                  style={[
                    impS.previewHeaderIcon,
                    { backgroundColor: theme.colors.primaryContainer },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="file-check-outline"
                    size={26}
                    color={theme.colors.onPrimaryContainer}
                  />
                </View>
                <View style={impS.previewHeaderText}>
                  <Text
                    style={[
                      impS.previewHeaderTitle,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    File ready
                  </Text>
                  <Text
                    style={[
                      impS.previewHeaderSub,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    Review before importing
                  </Text>
                </View>
              </View>

              <View
                style={[
                  impS.divider,
                  { backgroundColor: theme.colors.outlineVariant },
                ]}
              />

              <ImportPreviewRow
                label="File name"
                value={preview.fileName}
                icon="file-document-outline"
              />
              <ImportPreviewRow
                label="Transactions"
                value={`${preview.transactionCount}`}
                icon="swap-horizontal"
              />
              <ImportPreviewRow
                label="File size"
                value={
                  typeof preview.fileSize === "number"
                    ? `${Math.max(1, Math.round(preview.fileSize / 1024))} KB`
                    : "Unknown"
                }
                icon="database-outline"
              />

              {preview.wasEncrypted ? (
                <View
                  style={[
                    impS.encBadge,
                    { backgroundColor: theme.colors.secondaryContainer },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="lock"
                    size={14}
                    color={theme.colors.onSecondaryContainer}
                  />
                  <Text
                    style={[
                      impS.encBadgeText,
                      { color: theme.colors.onSecondaryContainer },
                    ]}
                  >
                    Encrypted file
                  </Text>
                </View>
              ) : null}
            </View>
          )}

          {preview ? (
            <View style={impS.actions}>
              <Button
                mode="outlined"
                onPress={handleSelectFile}
                disabled={isPickingFile}
                style={btnS.secondary}
                contentStyle={btnS.content}
              >
                Choose another
              </Button>
              <Button
                mode="contained"
                onPress={() => setConfirmOpen(true)}
                style={btnS.primary}
                contentStyle={btnS.content}
              >
                Review import
              </Button>
            </View>
          ) : null}
        </View>
      </AnimatedPaperModal>

      {PasswordPromptModal}

      <AlertModal
        isOpen={confirmOpen}
        title="Import this backup?"
        message={
          preview
            ? `You're about to import ${preview.transactionCount} transactions from "${preview.fileName}". This will add them to your account.`
            : "You're about to import the selected backup file."
        }
        confirmLabel="Slide to import"
        cancelLabel="Back"
        onConfirm={handleConfirmImport}
        onCancel={() => setConfirmOpen(false)}
        confirmMode="slide"
        confirmDisabled={!preview || isImporting}
        icon="file-import-outline"
      />
    </>
  );
}

const impS = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    overflow: "hidden",
  },
  content: {
    paddingHorizontal: 20,
    gap: 12,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: -4 },
  uploadZone: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginTop: 4,
    gap: 8,
  },
  uploadIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  uploadTitle: { fontSize: 16, lineHeight: 22, fontWeight: "700" },
  uploadSubtitle: { fontSize: 13, lineHeight: 18, textAlign: "center" },
  previewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginTop: 4,
  },
  previewHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  previewHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  previewHeaderText: { flex: 1, minWidth: 0 },
  previewHeaderTitle: { fontSize: 16, lineHeight: 22, fontWeight: "700" },
  previewHeaderSub: { fontSize: 12, lineHeight: 17 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 2 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rowText: { flex: 1, minWidth: 0 },
  rowLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  rowValue: { marginTop: 2, fontSize: 15, lineHeight: 21, fontWeight: "700" },
  encBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  encBadgeText: { fontSize: 13, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 12, marginTop: 4 },
});
