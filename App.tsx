import { TabBarProvider } from "@/components/tabbar/TabBarContext";
import {
  ToastProvider,
  pushOffsetAnimValue,
} from "@/components/toast/ToastProvider";
import { AddonPrefsProvider } from "@/hooks/use-addon-prefs";
import { AppThemeProvider, useAppTheme } from "@/hooks/use-app-theme";
import {
  BiometricLockProvider,
  useBiomettricLock,
} from "@/hooks/use-biometric-lock";
import { ThemeModeProvider, useThemeMode } from "@/hooks/use-theme-mode";
import { TransactionUiPrefsProvider } from "@/hooks/use-transaction-ui-prefs";
import { useAppDispatch } from "@/modules/Common/Hooks/Redux";
import {
  fetchAccounts,
  fetchCategories,
  fetchTransactions,
} from "@/modules/Common/Slices/TransactionSlice";
import { store } from "@/modules/Common/Store";
import { OnboardingScreen } from "@/modules/Onboarding/Index";
import {
  OnboardingProvider,
  useOnboardingState,
} from "@/modules/Onboarding/States";
import { AppNavigator } from "@/navigation/AppNavigator";
import {
  flushPendingNavigationTargets,
  navigationRef,
} from "@/navigation/RootNavigation";
import { notificationService } from "@/src/services/notifications";
import { getNavigationTheme, getPaperTheme } from "@/theme";
import { useAppFonts } from "@/theme/typography";
import { NavigationContainer } from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as ReduxProvider } from "react-redux";
import { TabBarModePreferenceProvider } from "./components/tabbar/TabBarModePreference";
import "./global";
import { BiometricLockScreen } from "./modules/Addons/Biometric/BiometricLockScreen";

void SplashScreen.preventAutoHideAsync();

// Reads module-level value directly — no context, no re-renders, ever
function PushedAppContent({ children }: { children: React.ReactNode }) {
  return (
    <Animated.View
      style={{ flex: 1, transform: [{ translateY: pushOffsetAnimValue }] }}
    >
      {children}
    </Animated.View>
  );
}

function AppInner() {
  const themeMode = useThemeMode();
  const { mode } = themeMode;
  const { themeId, isHydrated: isAppThemeHydrated } = useAppTheme();
  const biometricLock = useBiomettricLock();
  const onboarding = useOnboardingState();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchTransactions());
    dispatch(fetchCategories("income"));
    dispatch(fetchCategories("expense"));
    dispatch(fetchAccounts());
  }, [dispatch]);

  useEffect(() => {
    void notificationService.initializeAsync();
    const detach = notificationService.attachListeners();
    return detach;
  }, []);

  const paperTheme = getPaperTheme({ mode, themeId });
  const navigationTheme = getNavigationTheme(paperTheme);
  const isAppReady =
    biometricLock.isHydrated &&
    onboarding.isHydrated &&
    themeMode.isHydrated &&
    isAppThemeHydrated;

  return (
    <GestureHandlerRootView style={styles.root}>
      <PaperProvider theme={paperTheme}>
        <NavigationContainer
          onReady={flushPendingNavigationTargets}
          ref={navigationRef}
          theme={navigationTheme}
        >
          <ToastProvider>
            <TabBarProvider>
              <SafeAreaProvider>
                <PushedAppContent>
                  {isAppReady ? (
                    onboarding.hasCompletedOnboarding ? (
                      <AppNavigator />
                    ) : (
                      <OnboardingScreen
                        onComplete={onboarding.markOnboardingCompleted}
                      />
                    )
                  ) : (
                    <View
                      style={[
                        styles.hydrationSurface,
                        { backgroundColor: paperTheme.colors.background },
                      ]}
                    />
                  )}
                  {biometricLock.isLocked ? (
                    <BiometricLockScreen
                      isAuthenticating={biometricLock.isAuthenticating}
                      onUnlock={() => {
                        void biometricLock.unlock();
                      }}
                    />
                  ) : null}
                  <StatusBar style="auto" />
                </PushedAppContent>
              </SafeAreaProvider>
            </TabBarProvider>
          </ToastProvider>
        </NavigationContainer>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  const [fontsLoaded, fontLoadError] = useAppFonts();

  useEffect(() => {
    if (fontsLoaded || fontLoadError) {
      void SplashScreen.hideAsync();
    }
  }, [fontLoadError, fontsLoaded]);

  if (!fontsLoaded && !fontLoadError) {
    return null;
  }

  return (
    <ReduxProvider store={store}>
      <ThemeModeProvider>
        <AppThemeProvider>
          <TabBarModePreferenceProvider>
            <TransactionUiPrefsProvider>
              <AddonPrefsProvider>
                <OnboardingProvider>
                  <BiometricLockProvider>
                    <AppInner />
                  </BiometricLockProvider>
                </OnboardingProvider>
              </AddonPrefsProvider>
            </TransactionUiPrefsProvider>
          </TabBarModePreferenceProvider>
        </AppThemeProvider>
      </ThemeModeProvider>
    </ReduxProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hydrationSurface: { flex: 1 },
});
