import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "@/hooks/use-app-theme";
import { useThemeMode } from "@/hooks/use-theme-mode";
import { useAppDispatch } from "@/modules/Common/Hooks/Redux";
import {
  getAccountIconOptions,
  getCategoryColorOptions,
} from "@/modules/Common/Utils/Helpers";
import { THEME_PRESETS, type ThemeId } from "@/theme/presets";
import { AnimatedPage } from "./Components/AnimatedPage";
import { HintBox } from "./Components/HintBox";
import { ONBOARDING_STEPS } from "./Constants";
import {
  DEFAULT_QUICK_START_SELECTION,
  hasValidQuickStartSelection,
  MIN_STARTER_SELECTION_COUNT,
} from "./Defaults";
import { AppearanceScreen } from "./Screens/AppearanceScreen";
import { CompletionScreen } from "./Screens/CompletionScreen";
import { QuickStartScreen } from "./Screens/QuickStartScreen";
import { WelcomeScreen } from "./Screens/WelcomeScreen";
import { WorkspaceScreen } from "./Screens/WorkspaceScreen";
import { completeSimpleSetup } from "./Setup";
import { createStyles } from "./Styles";
import type {
  OnboardingDraft,
  OnboardingThemePreference,
  QuickStartSelection,
  StarterPill,
  StarterSetupTab,
} from "./Types";

type Props = {
  onComplete: () => Promise<void>;
};

function getFooterHint(stepId: (typeof ONBOARDING_STEPS)[number]["id"]) {
  if (stepId === "appearance") {
    return "You can change your theme later in Settings → Appearances.";
  }
  if (stepId === "workspace") {
    return "You can manage workspaces later in Settings → Workspaces.";
  }
  if (stepId === "quick-start") {
    return "You can manage categories and accounts later from their Settings sections.";
  }
  return null;
}

export function OnboardingScreen({ onComplete }: Props) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const dispatch = useAppDispatch();
  const { setMode, resetToSystem } = useThemeMode();
  const { themeId: currentThemeId, setThemeId } = useAppTheme();

  const workspaceIconOptions = React.useMemo(
    () =>
      [
        ...new Set([
          "briefcase-outline",
          "home-outline",
          "account-outline",
          "account-group-outline",
          "heart-outline",
          "star-outline",
          "wallet-outline",
          "piggy-bank-outline",
          ...getAccountIconOptions(),
        ]),
      ].slice(0, 24),
    [],
  );
  const colorOptions = React.useMemo(() => getCategoryColorOptions(), []);
  const accentOptions = React.useMemo(
    () =>
      Object.entries(THEME_PRESETS) as [
        ThemeId,
        (typeof THEME_PRESETS)[ThemeId],
      ][],
    [],
  );

  const [stepIndex, setStepIndex] = React.useState(0);
  const [workspaceName, setWorkspaceName] = React.useState("");
  const [workspaceIcon, setWorkspaceIcon] = React.useState("briefcase-outline");
  const [workspaceColor, setWorkspaceColor] = React.useState("#6366F1");
  const [workspaceTouched, setWorkspaceTouched] = React.useState(false);
  const [quickStart, setQuickStart] = React.useState<QuickStartSelection>(
    DEFAULT_QUICK_START_SELECTION,
  );
  const [starterTab, setStarterTab] = React.useState<StarterSetupTab>("income");
  const [themePreference, setThemePreference] =
    React.useState<OnboardingThemePreference>("system");
  const [selectedThemeId, setSelectedThemeId] =
    React.useState<ThemeId>(currentThemeId);
  const [isCompleting, setIsCompleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const completedRef = React.useRef(false);

  const step = ONBOARDING_STEPS[stepIndex];
  const isWorkspaceInvalid = workspaceTouched && !workspaceName.trim();
  const isFinalStep = step.id === "complete";
  const footerHint = getFooterHint(step.id);
  const showFooter = step.id !== "welcome" && step.id !== "complete";

  const ctaLabel = React.useMemo(() => {
    if (step.id === "welcome") return "Let's Go";
    if (step.id === "complete") return "Start Tracking";
    return "Continue";
  }, [step.id]);

  const ctaDisabled =
    isCompleting ||
    (step.id === "workspace" && workspaceTouched && !workspaceName.trim()) ||
    (step.id === "quick-start" && !hasValidQuickStartSelection(quickStart));

  const applyThemePreference = React.useCallback(
    (preference: OnboardingThemePreference) => {
      if (preference === "system") {
        resetToSystem();
        return;
      }
      setMode(preference);
    },
    [resetToSystem, setMode],
  );

  const toggleStarterPill = React.useCallback(
    (tab: StarterSetupTab, pill: StarterPill) => {
      if (pill.protected) return;
      setQuickStart((current) => {
        const selected = current[tab];
        const exists = selected.some((item) => item.name === pill.name);
        return {
          ...current,
          [tab]: exists
            ? selected.filter((item) => item.name !== pill.name)
            : [...selected, pill],
        };
      });
    },
    [],
  );

  const goBack = React.useCallback(() => {
    if (stepIndex === 0 || isCompleting) return;
    setError(null);
    setStepIndex((current) => Math.max(0, current - 1));
  }, [isCompleting, stepIndex]);

  const handleWelcomeContinue = React.useCallback(() => {
    setStepIndex((current) =>
      Math.min(ONBOARDING_STEPS.length - 1, current + 1),
    );
  }, []);

  const handleThemePreferenceSelect = React.useCallback(
    (preference: OnboardingThemePreference) => {
      setThemePreference(preference);
      applyThemePreference(preference);
    },
    [applyThemePreference],
  );

  const handleAccentSelect = React.useCallback(
    (themeId: ThemeId) => {
      setSelectedThemeId(themeId);
      setThemeId(themeId);
    },
    [setThemeId],
  );

  const completeOnboarding = React.useCallback(async () => {
    const draft: OnboardingDraft = {
      setupType: "simple",
      workspaceName: workspaceName.trim(),
      workspaceIcon,
      workspaceColor,
      quickStart,
      themePreference,
      themeId: selectedThemeId,
    };

    setIsCompleting(true);
    setError(null);

    try {
      applyThemePreference(themePreference);
      setThemeId(selectedThemeId);
      await completeSimpleSetup(dispatch, draft);
      completedRef.current = true;
      await onComplete();
    } catch (nextError) {
      const message =
        nextError instanceof Error
          ? nextError.message
          : "Something went wrong while setting up your workspace.";
      setError(message);
    } finally {
      setIsCompleting(false);
    }
  }, [
    applyThemePreference,
    dispatch,
    onComplete,
    quickStart,
    selectedThemeId,
    setThemeId,
    themePreference,
    workspaceColor,
    workspaceIcon,
    workspaceName,
  ]);

  const goNext = React.useCallback(() => {
    setError(null);

    if (step.id === "workspace" && !workspaceName.trim()) {
      setWorkspaceTouched(true);
      setError("Workspace name is required.");
      return;
    }

    if (step.id === "quick-start" && !hasValidQuickStartSelection(quickStart)) {
      setError(
        `Choose at least ${MIN_STARTER_SELECTION_COUNT} income categories, expense categories, and accounts.`,
      );
      return;
    }

    if (isFinalStep) {
      void completeOnboarding();
      return;
    }

    setStepIndex((current) =>
      Math.min(ONBOARDING_STEPS.length - 1, current + 1),
    );
  }, [completeOnboarding, isFinalStep, quickStart, step.id, workspaceName]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.topBar}>
          <Pressable
            disabled={stepIndex === 0 || isCompleting}
            onPress={goBack}
            style={[
              styles.backButton,
              (stepIndex === 0 || isCompleting) && styles.hiddenBackButton,
            ]}
          >
            <MaterialCommunityIcons
              color={theme.colors.onSurface}
              name="chevron-left"
              size={26}
            />
          </Pressable>

          <View style={styles.progressRow}>
            {ONBOARDING_STEPS.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor:
                      index <= stepIndex
                        ? theme.colors.primary
                        : theme.colors.outlineVariant,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.backButton} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AnimatedPage key={step.id}>
            {step.id === "welcome" ? (
              <WelcomeScreen
                onContinue={handleWelcomeContinue}
                styles={styles}
                theme={theme}
              />
            ) : null}
            {step.id === "appearance" ? (
              <AppearanceScreen
                accentOptions={accentOptions}
                onAccentSelect={handleAccentSelect}
                onThemePreferenceSelect={handleThemePreferenceSelect}
                selectedThemeId={selectedThemeId}
                styles={styles}
                theme={theme}
                themePreference={themePreference}
              />
            ) : null}
            {step.id === "workspace" ? (
              <WorkspaceScreen
                colorOptions={colorOptions}
                isWorkspaceInvalid={isWorkspaceInvalid}
                setWorkspaceColor={setWorkspaceColor}
                setWorkspaceIcon={setWorkspaceIcon}
                setWorkspaceName={setWorkspaceName}
                setWorkspaceTouched={setWorkspaceTouched}
                styles={styles}
                theme={theme}
                workspaceColor={workspaceColor}
                workspaceIcon={workspaceIcon}
                workspaceIconOptions={workspaceIconOptions}
                workspaceName={workspaceName}
              />
            ) : null}
            {step.id === "quick-start" ? (
              <QuickStartScreen
                quickStart={quickStart}
                setStarterTab={setStarterTab}
                starterTab={starterTab}
                styles={styles}
                theme={theme}
                toggleStarterPill={toggleStarterPill}
              />
            ) : null}
            {step.id === "complete" ? (
              <CompletionScreen
                isCompleting={isCompleting}
                onStartTracking={completeOnboarding}
                styles={styles}
                theme={theme}
              />
            ) : null}
          </AnimatedPage>
        </ScrollView>

        {showFooter ? (
          <View style={styles.footer}>
            {footerHint ? (
              <HintBox
                color={theme.colors.primary}
                label={footerHint}
                styles={styles}
              />
            ) : null}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Button
              contentStyle={styles.ctaContent}
              disabled={ctaDisabled}
              loading={isCompleting}
              mode="contained"
              onPress={goNext}
              style={styles.ctaButton}
            >
              {ctaLabel}
            </Button>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
