import { sortCategories } from "@/utils/category-order";
import { useAppShell } from "@/components/AppShellContext";
import { DEFAULT_WORKSPACE_CURRENCY, type WorkspaceCurrency } from "@/components/CurrencyPickerField";
import { WorkspaceSetup } from "./WorkspaceSetup";
import { MANAGEMENT_NAME_LIMIT } from "@/components/ManagementOptions";
import { APP_THEME_STORAGE_KEY, TRUE_BLACK_STORAGE_KEY, useAppTheme } from "@/hooks/use-app-theme";
import { THEME_MODE_STORAGE_KEY, useThemeMode, type ThemePreference } from "@/hooks/use-theme-mode";
import { getPaperTheme } from "@/theme";
import { THEME_PRESETS, type ThemeId } from "@/theme/presets";
import { AppearanceSection } from "@/modules/Settings/Modals/AppearanceModal";
import { StatusBar } from "expo-status-bar";
import { useAppDispatch } from "@/hooks/Redux";
import { workspaceRepository } from "@/modules/Core/Repository/Index";
import { fetchAccounts, fetchBudget, fetchCategories, fetchTransactions } from "@/modules/Core/Slices/TransactionSlice";
import { fetchWorkspaces, setActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import { flushPendingNavigationTargets } from "@/navigation/RootNavigation";
import type { RootParamList } from "@/navigation/types";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { AccessibilityInfo, Animated, BackHandler, Easing, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, useColorScheme, View } from "react-native";
import { ActivityIndicator, Button, PaperProvider, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { OnboardingIntro } from "./Intro";
import { restoreSetupStep, SETUP_DRAFT_VERSION, SETUP_STEP as STEP } from "./steps";
import { SetupChoices, SetupItemEditor } from "./SetupChoices";
import { makeDefaultSetup, makePresets, restoreChoices, SETUP_COLORS, SETUP_ICONS, type ChoiceKind, type SetupChoice } from "./presets";
import { useOnboardingTour } from "./SpotlightTour";
import { ONBOARDING_DRAFT_KEY, type SetupItem } from "./storage";

type Props = NativeStackScreenProps<RootParamList, "Onboarding">;
const LAST_STEP = STEP.review;
const COPY = [
  ["", ""],
  ["Set the mood.", "Pick your accent and theme. Try them here—what you see is what you’ll get."],
  ["Make it yours.", "Give your workspace a name, currency and an icon that feels right."],
  ["What comes in?", "Keep the income categories you use. Add more from the suggestions, or create your own."],
  ["Where does it go?", "Start with your everyday spending. Add any extras you need from the suggestions below."],
  ["How do you pay?", "Pick your payment methods so you can see where money comes from and goes."],
  ["Here’s your setup.", "Check your choices below. Create your workspace when you’re happy, then take a quick tour."],
];

type Editor = { kind: ChoiceKind; original: SetupChoice | null; session: number };
type Appearance = { themeId: ThemeId; mode: ThemePreference; trueBlack: boolean };
const THEME_OPTIONS = Object.entries(THEME_PRESETS) as [ThemeId, (typeof THEME_PRESETS)[ThemeId]][];
export function OnboardingScreen(props: Props) {
  const appTheme = useAppTheme();
  const mode = useThemeMode();
  const theme = useTheme();
  if (!appTheme.isHydrated || !mode.isHydrated) return <View style={[s.root, { backgroundColor: theme.colors.background, justifyContent: "center" }]}><ActivityIndicator /></View>;
  return <OnboardingSession {...props} initialAppearance={{ themeId: appTheme.themeId, trueBlack: appTheme.trueBlack, mode: mode.isFollowingSystem ? "system" : mode.mode }} />;
}
function OnboardingSession({ initialAppearance, ...props }: Props & { initialAppearance: Appearance }) {
  const [appearance, setAppearance] = React.useState(initialAppearance);
  const system = useColorScheme();
  const appTheme = useAppTheme();
  const mode = useThemeMode();
  const theme = React.useMemo(() => getPaperTheme({ ...appearance, mode: appearance.mode === "system" ? system === "dark" ? "dark" : "light" : appearance.mode }), [appearance, system]);
  const persistAppearance = async () => {
    await AsyncStorage.multiSet([[APP_THEME_STORAGE_KEY, appearance.themeId], [TRUE_BLACK_STORAGE_KEY, String(appearance.trueBlack)], [THEME_MODE_STORAGE_KEY, appearance.mode]]);
    appTheme.setThemeId(appearance.themeId);
    appTheme.setTrueBlack(appearance.trueBlack);
    if (appearance.mode === "system") mode.resetToSystem(); else mode.setMode(appearance.mode);
  };
  return <PaperProvider theme={theme}><StatusBar style={theme.dark ? "light" : "dark"} /><OnboardingFlow {...props} appearance={appearance} setAppearance={setAppearance} persistAppearance={persistAppearance} /></PaperProvider>;
}
function OnboardingFlow({ navigation, route, appearance, setAppearance, persistAppearance }: Props & {
  appearance: Appearance; setAppearance: React.Dispatch<React.SetStateAction<Appearance>>; persistAppearance: () => Promise<void>;
}) {
  const theme = useTheme<ExtendedMD3Theme>();
  const dispatch = useAppDispatch();
  const { requestTab } = useAppShell();
  const { start: startTour } = useOnboardingTour();
  const preview = route.params?.preview === true;
  const [step, setStep] = React.useState(0);
  const [name, setName] = React.useState("Personal");
  const [icon, setIcon] = React.useState("account-outline");
  const [color, setColor] = React.useState(SETUP_COLORS[0]);
  const [currency, setCurrency] = React.useState<WorkspaceCurrency>(DEFAULT_WORKSPACE_CURRENCY);
  const [choices, setChoices] = React.useState<Record<ChoiceKind, SetupChoice[]>>(() => ({
    income: makePresets("income"), expense: makePresets("expense"), accounts: makePresets("accounts"),
  }));
  const [editor, setEditor] = React.useState<Editor | null>(null);
  const [editorOpen, setEditorOpen] = React.useState(false);
  const editorSession = React.useRef(0);
  const [draftLoaded, setDraftLoaded] = React.useState(preview);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const scroll = React.useRef<ScrollView>(null);
  const saving = React.useRef(false);
  const progress = React.useRef(new Animated.Value(1)).current;
  const transitioning = React.useRef(false);
  const reducedMotion = React.useRef(false);
  React.useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { reducedMotion.current = value; });
    const listener = AccessibilityInfo.addEventListener("reduceMotionChanged", value => { reducedMotion.current = value; });
    return () => listener.remove();
  }, []);
  const moveToStep = React.useCallback((next: number) => {
    if (transitioning.current || saving.current) return;
    Keyboard.dismiss();
    if (reducedMotion.current) { setStep(next); return; }
    transitioning.current = true;
    Animated.timing(progress, { toValue: 0, duration: 130, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(({ finished }) => {
      if (!finished) { transitioning.current = false; return; }
      setStep(next);
    });
  }, [progress]);
  React.useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: reducedMotion.current ? 0 : 320, easing: Easing.out(Easing.cubic), useNativeDriver: true })
      .start(() => { transitioning.current = false; });
    return () => progress.stopAnimation();
  }, [progress, step]);
  const revealNewItem = React.useRef(false);
  const saved = React.useRef(false);
  const nameInvalid = !name.trim();
  const locked = busy || saved.current || !draftLoaded;
  const kind: ChoiceKind | null = step === STEP.income ? "income" : step === STEP.expense ? "expense" : step === STEP.accounts ? "accounts" : null;
  const selected = (key: ChoiceKind) => sortCategories(choices[key].filter(item => item.selected), item => item.name);
  const valid = !nameInvalid && selected("income").length > 0 && selected("expense").length > 0 && selected("accounts").length > 0;
  const canContinue = step === STEP.workspace ? !nameInvalid : kind ? selected(kind).length > 0 : step === LAST_STEP ? valid : true;

  React.useEffect(() => {
    if (preview) return;
    let current = true;
    AsyncStorage.getItem(ONBOARDING_DRAFT_KEY).then(raw => {
      if (!current || !raw) return;
      const draft = JSON.parse(raw);
      if (typeof draft.name === "string") setName(draft.name.slice(0, MANAGEMENT_NAME_LIMIT));
      if (SETUP_ICONS.includes(draft.icon)) setIcon(draft.icon);
      if (SETUP_COLORS.includes(draft.color)) setColor(draft.color);
      if (typeof draft.currency?.code === "string" && /^[A-Z]{3}$/.test(draft.currency.code)
        && typeof draft.currency.name === "string" && typeof draft.currency.symbol === "string") setCurrency(draft.currency);
      setChoices({ income: restoreChoices(draft.choices?.income, "income"), expense: restoreChoices(draft.choices?.expense, "expense"), accounts: restoreChoices(draft.choices?.accounts, "accounts") });
      if (draft.appearance && Object.prototype.hasOwnProperty.call(THEME_PRESETS, draft.appearance.themeId)
        && ["system", "light", "dark"].includes(draft.appearance.mode) && typeof draft.appearance.trueBlack === "boolean") setAppearance(draft.appearance);
      setStep(restoreSetupStep(draft.step, draft.version));
    }).catch(() => { /* Defaults remain usable if an optional draft is unavailable. */ })
      .finally(() => { if (current) setDraftLoaded(true); });
    return () => { current = false; };
  }, [preview, setAppearance]);
  React.useEffect(() => {
    if (preview || !draftLoaded || saved.current || busy) return;
    const timer = setTimeout(() => {
      void AsyncStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify({ version: SETUP_DRAFT_VERSION, step, name, icon, color, currency, choices, appearance })).catch(() => {});
    }, 200);
    return () => clearTimeout(timer);
  }, [appearance, busy, choices, color, currency, draftLoaded, icon, name, preview, step]);
  React.useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); setError(null); }, [step]);

  const back = React.useCallback(() => {
    if (saving.current) return;
    Keyboard.dismiss();
    if (step > 0) moveToStep(step - 1);
    else if (preview) { navigation.goBack(); requestAnimationFrame(flushPendingNavigationTargets); }
  }, [moveToStep, navigation, preview, step]);
  React.useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (saving.current) return true;
      if (editorOpen) { setEditorOpen(false); return true; }
      if (step > 0 || preview) { back(); return true; }
      return false;
    });
    return () => subscription.remove();
  }, [back, editorOpen, preview, step]);

  const startAppTour = () => {
    startTour({ preview });
    requestTab("transactions");
    navigation.reset({ index: 0, routes: [{ name: "Transactions" }] });
  };
  const finish = async (useDefaults = false) => {
    if (saving.current || (!useDefaults && !valid)) return;
    Keyboard.dismiss();
    if (preview) { startAppTour(); return; }
    saving.current = true; setBusy(true); setError(null);
    try {
      if (!saved.current) {
        if (!useDefaults) await persistAppearance();
        await workspaceRepository.completeOnboarding(useDefaults ? makeDefaultSetup(DEFAULT_WORKSPACE_CURRENCY) : {
          name, icon, color, currencyCode: currency.code, currencySymbol: currency.symbol, currencyName: currency.name,
          incomeCategories: selected("income"), expenseCategories: selected("expense"), accounts: selected("accounts"),
        });
        saved.current = true;
      }
      dispatch(setActiveWorkspace("personal"));
      await dispatch(fetchWorkspaces()).unwrap();
      await Promise.all([dispatch(fetchTransactions()).unwrap(), dispatch(fetchCategories("income")).unwrap(),
        dispatch(fetchCategories("expense")).unwrap(), dispatch(fetchAccounts()).unwrap(), dispatch(fetchBudget()).unwrap()]);
      await AsyncStorage.removeItem(ONBOARDING_DRAFT_KEY).catch(() => {});
      startAppTour();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Couldn’t finish setup. Please try again.");
    } finally { saving.current = false; setBusy(false); }
  };
  const toggle = (key: ChoiceKind, itemName: string) => setChoices(current => ({ ...current,
    [key]: current[key].map(item => item.name === itemName ? { ...item, selected: !item.selected } : item) }));
  const openEditor = (key: ChoiceKind, original: SetupChoice | null) => {
    Keyboard.dismiss();
    editorSession.current += 1;
    setEditor({ kind: key, original, session: editorSession.current });
    setEditorOpen(true);
  };
  const saveItem = (item: SetupItem) => {
    if (!editor) return;
    const { kind: key, original } = editor;
    revealNewItem.current = !original;
    setChoices(current => ({ ...current, [key]: original
      ? current[key].map(existing => existing.name === original.name ? { ...item, custom: true, selected: existing.selected } : existing)
      : [...current[key], { ...item, custom: true, selected: true }] }));
    setEditorOpen(false);
  };
  const colors = theme.colors;
  return <SafeAreaView style={[s.root, { backgroundColor: colors.background }]}>
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={s.header}>
        {step > 0 || preview ? <Pressable accessibilityRole="button" accessibilityLabel={step > 0 ? "Previous setup step" : "Close preview"}
          onPress={back} disabled={busy} hitSlop={8} style={s.back}>
          <MaterialCommunityIcons name={step > 0 ? "arrow-left" : "close"} size={22} color={colors.onSurface} />
        </Pressable> : null}
        <Text style={[s.brand, { color: colors.primary, flex: 1 }]}>Tally</Text>
        <Text style={[s.step, { color: colors.onSurfaceVariant }]}>{preview ? "Preview · " : ""}{step === 0 ? "Welcome" : `${step} / ${LAST_STEP}`}</Text>
      </View>
      <Animated.View style={{ flex: 1, opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
      <ScrollView ref={scroll} scrollEnabled={step !== STEP.workspace} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          if (revealNewItem.current) { revealNewItem.current = false; scroll.current?.scrollToEnd({ animated: true }); }
        }}
        contentContainerStyle={[s.scroll, step === 0 && s.welcome, step === STEP.workspace && { flex: 1, gap: 20 }, step === STEP.appearance && { paddingHorizontal: 0 }]}>
        {step === STEP.intro ? <OnboardingIntro /> : <View style={[s.intro, step === STEP.appearance && { paddingHorizontal: 24 }]}>
          <Text accessibilityRole="header" style={[s.title, { color: colors.onSurface }]}>{COPY[step][0]}</Text>
          <Text style={[s.description, { color: colors.onSurfaceVariant }]}>{COPY[step][1]}</Text>
        </View>}
        {step === STEP.workspace ? <WorkspaceSetup name={name} icon={icon} color={color} currency={currency}
          onName={setName} onIcon={setIcon} onColor={setColor} onCurrency={setCurrency} disabled={locked} /> : null}
        {step === STEP.appearance ? <AppearanceSection compact activeModeId={appearance.mode} onModeSelect={mode => setAppearance(current => ({ ...current, mode }))}
          themeId={appearance.themeId} onThemeSelect={themeId => setAppearance(current => ({ ...current, themeId }))}
          themeOptions={THEME_OPTIONS} trueBlack={appearance.trueBlack} onTrueBlackChange={trueBlack => setAppearance(current => ({ ...current, trueBlack }))} disabled={locked} /> : null}
        {kind ? <SetupChoices choices={choices[kind]} disabled={locked} onToggle={itemName => toggle(kind, itemName)}
          onCreate={() => openEditor(kind, null)} onEdit={item => openEditor(kind, item)} /> : null}
        {step === LAST_STEP ? <View style={{ gap: 24 }}>
          <View style={[s.reviewWorkspace, s.reviewCard, { backgroundColor: colors.elevation.level1, borderColor: colors.outlineVariant }]}>
            <View style={[s.workspaceIcon, { backgroundColor: color }]}><MaterialCommunityIcons name={icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]} size={28} color="#FFFFFF" /></View>
            <View style={{ flex: 1, gap: 4 }}><Text style={[s.fieldValue, { color: colors.onSurface }]}>Workspace · {name.trim()}</Text>
              <Text style={[s.caption, { color: colors.onSurfaceVariant }]}>Currency: {currency.code} · {currency.name}</Text></View>
            <Button onPress={() => moveToStep(STEP.workspace)} disabled={busy}>Edit</Button>
          </View>
          {([['income', 'Income categories', STEP.income], ['expense', 'Expense categories', STEP.expense], ['accounts', 'Payment methods', STEP.accounts]] as const).map(([key, title, editStep]) => <View key={key} style={[s.reviewCard, { backgroundColor: colors.elevation.level1, borderColor: colors.outlineVariant }]}>
            <View style={s.reviewHeader}><Text style={[s.sectionTitle, { color: colors.onSurface }]}>{title} · {selected(key).length}</Text>
              <Button onPress={() => moveToStep(editStep)} disabled={busy}>Edit</Button></View>
            <View style={s.chips}>{selected(key).map(item => <View key={item.name} style={[s.chip, { backgroundColor: colors.background }]}>
              <MaterialCommunityIcons name={item.icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]} size={16} color={item.color} />
              <Text style={[s.caption, { color: colors.onSurface }]}>{item.name}</Text></View>)}</View>
          </View>)}
        </View> : null}
      </ScrollView>
      </Animated.View>
      <View style={s.footer}>
        {error ? <Text accessibilityRole="alert" style={[s.error, { color: colors.error }]}>{error}</Text> : null}
        {step === 0 ? <Button mode="text" textColor={colors.onSurfaceVariant} disabled={locked} loading={busy} onPress={() => finish(true)} contentStyle={{ minHeight: 44 }} labelStyle={s.skipLabel}>
          {preview ? "Preview with defaults" : "Skip setup · use defaults"}
        </Button> : null}
        <Button mode="contained" onPress={step < LAST_STEP ? () => moveToStep(step + 1) : () => finish()}
          disabled={busy || !draftLoaded || !canContinue} loading={busy} contentStyle={s.button} labelStyle={s.buttonLabel}>
          {step === 0 ? "Make Tally mine" : step < LAST_STEP ? "Continue" : preview ? "Preview app & tour" : error ? "Try again" : "Create workspace"}
        </Button>
        <Text style={[s.footerNote, { color: colors.onSurfaceVariant }]}>
          {step === 0 ? "A minute to set up. Yours from here." : step === LAST_STEP ? preview ? "Preview only. Your workspace and saved appearance stay unchanged." : "Your workspace opens next, followed by a tour you can skip." : "You can change these later in Settings."}
        </Text>
      </View>
    </KeyboardAvoidingView>
    {editor ? <SetupItemEditor key={editor.session} visible={editorOpen} item={editor.original}
      existingNames={choices[editor.kind].map(item => item.name)} noun={editor.kind === "accounts" ? "payment method" : `${editor.kind} category`}
      onSave={saveItem} onClose={() => setEditorOpen(false)} onRemove={editor.original ? () => {
        setChoices(current => ({ ...current, [editor.kind]: current[editor.kind].filter(item => item.name !== editor.original?.name) }));
        setEditorOpen(false);
      } : undefined} /> : null}
  </SafeAreaView>;
}
const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8, gap: 12 },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginLeft: -10 },
  brand: { ...typography.editorial.sectionLabel, fontSize: 26, lineHeight: 32 },
  step: { ...typography.body, fontSize: 12 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 4, paddingBottom: 20, gap: 24 },
  welcome: { justifyContent: "center", gap: 24 },
  intro: { gap: 14 },
  title: { ...typography.editorial.sectionLabel, fontSize: 32, lineHeight: 38 },
  description: { ...typography.body, fontSize: 15, lineHeight: 23 },
  caption: { ...typography.body, fontSize: 13, lineHeight: 19 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 12 },
  fieldValue: { ...typography.bodyMedium, fontSize: 14, lineHeight: 21 },
  sectionTitle: { ...typography.editorial.sectionLabel, fontSize: 18, lineHeight: 24 },
  workspaceIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  reviewCard: { padding: 16, borderRadius: 22, borderWidth: 0.5, gap: 10 },
  reviewWorkspace: { flexDirection: "row", alignItems: "center", gap: 12 },
  reviewHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  footer: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 0, gap: 8 },
  button: { minHeight: 52 },
  buttonLabel: { ...typography.editorial.sectionLabel, fontSize: 18, lineHeight: 24 },
  skipLabel: { ...typography.body, fontSize: 13, lineHeight: 19 },
  footerNote: { ...typography.body, fontSize: 12, lineHeight: 18, textAlign: "center" },
  error: { ...typography.body, fontSize: 13, lineHeight: 20 },
});
