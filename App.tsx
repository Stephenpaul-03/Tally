import { TabBarProvider } from "@/components/tabbar/TabBarContext";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { AddonPrefsProvider } from "@/hooks/use-addon-prefs";
import { AppThemeProvider, useAppTheme } from "@/hooks/use-app-theme";
import {
  BiometricLockProvider,
  useBiomettricLock,
} from "@/hooks/use-biometric-lock";
import { ThemeModeProvider, useThemeMode } from "@/hooks/use-theme-mode";
import { TransactionUiPrefsProvider } from "@/hooks/use-transaction-ui-prefs";
import { WorkspaceDefaultsProvider } from "@/hooks/use-workspace-defaults";
import { store } from "@/modules/Core/Store";
import { AppNavigator } from "@/navigation/AppNavigator";
import {
  flushPendingNavigationTargets,
  navigationRef,
} from "@/navigation/RootNavigation";
import { notificationService } from "@/src/services/notifications";
import { getNavigationTheme, getPaperTheme } from "@/theme";
import { useAppFonts } from "@/theme/typography";
import { NavigationContainer } from "@react-navigation/native";
import * as NavigationBar from "expo-navigation-bar";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { AppState, Platform, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { PaperProvider } from "react-native-paper";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as ReduxProvider } from "react-redux";
import { TabBarModePreferenceProvider } from "./components/tabbar/TabBarModePreference";
import "./global";
import { BiometricLockOverlay } from "./overlays/BiometricLockOverlay";

void SplashScreen.preventAutoHideAsync();

function AppInner() {
  const themeMode = useThemeMode();
  const { mode } = themeMode;
  const { themeId, trueBlack } = useAppTheme();
  const biometricLock = useBiomettricLock();
  useEffect(() => {
    void notificationService.initializeAsync();
    const detach = notificationService.attachListeners();
    const subscription = AppState.addEventListener("change", state => {
      if (state === "active") void notificationService.initializeAsync();
    });
    return () => { detach(); subscription.remove(); };
  }, []);

  const paperTheme = getPaperTheme({ mode, themeId, trueBlack });
  const navigationTheme = getNavigationTheme(paperTheme);
  useEffect(() => {
    if (Platform.OS !== "android") return;
    void NavigationBar.setBackgroundColorAsync("#00000000");
    void NavigationBar.setBorderColorAsync("#00000000");
    void NavigationBar.setPositionAsync("absolute");
    void NavigationBar.setBehaviorAsync("overlay-swipe");
    void NavigationBar.setButtonStyleAsync(paperTheme.dark ? "light" : "dark");
  }, [paperTheme.dark]);

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: paperTheme.colors.background }]}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <PaperProvider theme={paperTheme}>
            <NavigationContainer
              onReady={flushPendingNavigationTargets}
              ref={navigationRef}
              theme={navigationTheme}
            >
              <ToastProvider>
                <TabBarProvider>
                  <View style={{ flex: 1, backgroundColor: paperTheme.colors.background }}>
                    <AppNavigator />
                    {biometricLock.isLocked ? (
                      <BiometricLockOverlay
                        isAuthenticating={biometricLock.isAuthenticating}
                        onUnlock={() => { void biometricLock.unlock(); }}
                      />
                    ) : null}
                    <StatusBar style={paperTheme.dark ? "light" : "dark"} translucent backgroundColor="transparent" />
                  </View>
                </TabBarProvider>
              </ToastProvider>
            </NavigationContainer>
          </PaperProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
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
                <WorkspaceDefaultsProvider>
                  <BiometricLockProvider>
                    <AppInner />
                  </BiometricLockProvider>
                </WorkspaceDefaultsProvider>
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
