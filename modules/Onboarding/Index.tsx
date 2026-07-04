import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
    Animated,
    Easing,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    useWindowDimensions,
    View,
} from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  DEFAULT_WORKSPACE_CURRENCY,
  type WorkspaceCurrency,
} from "@/components/CurrencyPickerField";
import { useAppDispatch } from "@/hooks/Redux";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useThemeMode } from "@/hooks/use-theme-mode";
import { THEME_PRESETS, type ThemeId } from "@/theme/presets";
import {
    getAccountIconOptions,
    getCategoryColorOptions,
} from "@/utils/Helpers";
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
import { WelcomeScreen, type SplashOrigin } from "./Screens/WelcomeScreen";
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
  const { width, height } = useWindowDimensions();

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
  const [workspaceOwnerName, setWorkspaceOwnerName] = React.useState("");
  const [workspaceCurrency, setWorkspaceCurrency] =
    React.useState<WorkspaceCurrency>(DEFAULT_WORKSPACE_CURRENCY);
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

  const rippleSize = Math.max(width, height) * 2.6;
  const rippleScale = React.useRef(new Animated.Value(0)).current;
  const rippleOpacity = React.useRef(new Animated.Value(0)).current;
  const [rippleVisible, setRippleVisible] = React.useState(false);
  const [revealOrigin, setRevealOrigin] = React.useState<SplashOrigin | null>(
    null,
  );
  const [isExitingWelcome, setIsExitingWelcome] = React.useState(false);

  const expandRipple = React.useCallback(
    (origin: SplashOrigin, onFullyCovered: () => void) => {
      setRevealOrigin(origin);
      rippleScale.setValue(0);
      rippleOpacity.setValue(1);
      setRippleVisible(true);

      Animated.timing(rippleScale, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onFullyCovered();
      });
    },
    [rippleOpacity, rippleScale],
  );

  const contractRipple = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(rippleScale, {
        toValue: 0,
        duration: 650,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(rippleOpacity, {
          toValue: 0,
          duration: 1200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => setRippleVisible(false));
  }, [rippleOpacity, rippleScale]);

  const completedRef = React.useRef(false);

  const step = ONBOARDING_STEPS[stepIndex];
  const isWelcomeStep = step.id === "welcome";
  const showWelcomeScreen = isWelcomeStep && !isExitingWelcome;
  const isWorkspaceInvalid = workspaceTouched && !workspaceName.trim();
  const isFinalStep = step.id === "complete";
  const footerHint = getFooterHint(step.id);
  const showFooter = !isWelcomeStep && step.id !== "complete";

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

  const handleWelcomeContinue = React.useCallback(
    (origin: SplashOrigin) => {
      setIsExitingWelcome(true);
      expandRipple(origin, () => {
        // Switch the step while fully covered — WelcomeScreen stays mounted,
        // just hidden via display:none, so there is no unmount/remount flash.
        setStepIndex((current) =>
          Math.min(ONBOARDING_STEPS.length - 1, current + 1),
        );
        requestAnimationFrame(() => {
          requestAnimationFrame(() => contractRipple());
        });
      });
    },
    [contractRipple, expandRipple],
  );

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
      workspaceOwnerName: workspaceOwnerName.trim(),
      workspaceCurrencyCode: workspaceCurrency.code,
      workspaceCurrencySymbol: workspaceCurrency.symbol,
      workspaceCurrencyName: workspaceCurrency.name,
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
    quickStart,
    selectedThemeId,
    setThemeId,
    themePreference,
    workspaceColor,
    workspaceCurrency,
    workspaceIcon,
    workspaceName,
    workspaceOwnerName,
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

  const origin = revealOrigin ?? { x: width / 2, y: height * 0.85 };
  const rippleLeft = origin.x - rippleSize / 2;
  const rippleTop = origin.y - rippleSize / 2;

  const rippleOverlay = rippleVisible ? (
    <Modal
      visible={rippleVisible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={() => {}}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          s.ripple,
          {
            width: rippleSize,
            height: rippleSize,
            borderRadius: rippleSize / 2,
            backgroundColor: theme.colors.primary,
            opacity: rippleOpacity,
            transform: [{ scale: rippleScale }],
            left: rippleLeft,
            top: rippleTop,
          },
        ]}
      />
    </Modal>
  ) : null;

  return (
    <>
      {/*
       * Both WelcomeScreen and the main flow live in the tree at all times.
       * We toggle display:none instead of unmounting so there is zero
       * layout/paint work happening during the ripple transition.
       */}
      <View
        style={[
          StyleSheet.absoluteFill,
          showWelcomeScreen ? s.visible : s.hidden,
        ]}
      >
        <WelcomeScreen
          onContinue={handleWelcomeContinue}
          styles={styles}
          theme={theme}
        />
      </View>

      <View
        style={[
          StyleSheet.absoluteFill,
          showWelcomeScreen ? s.hidden : s.visible,
        ]}
      >
        <SafeAreaView
          style={[
            styles.safeArea,
            { backgroundColor: theme.colors.background },
          ]}
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
                    setWorkspaceCurrency={setWorkspaceCurrency}
                    setWorkspaceColor={setWorkspaceColor}
                    setWorkspaceIcon={setWorkspaceIcon}
                    setWorkspaceName={setWorkspaceName}
                    setWorkspaceOwnerName={setWorkspaceOwnerName}
                    setWorkspaceTouched={setWorkspaceTouched}
                    styles={styles}
                    theme={theme}
                    workspaceColor={workspaceColor}
                    workspaceCurrency={workspaceCurrency}
                    workspaceIcon={workspaceIcon}
                    workspaceIconOptions={workspaceIconOptions}
                    workspaceName={workspaceName}
                    workspaceOwnerName={workspaceOwnerName}
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
                    onBegin={() => {
                      void completeOnboarding();
                    }}
                    onSplashDone={onComplete} // ← pass onComplete directly
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
      </View>

      {rippleOverlay}
    </>
  );
}

const s = StyleSheet.create({
  ripple: { position: "absolute" },
  visible: { display: "flex" },
  hidden: { display: "none" },
});
