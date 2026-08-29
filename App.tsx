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
import { Animated, Platform, StyleSheet } from "react-native";
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
  const { themeId, trueBlack } = useAppTheme();
  const biometricLock = useBiomettricLock();
  useEffect(() => {
    void notificationService.initializeAsync();
    const detach = notificationService.attachListeners();
    return detach;
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
    <GestureHandlerRootView style={styles.root}>
      <KeyboardProvider>
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
                    <AppNavigator />
                    {biometricLock.isLocked ? (
                      <BiometricLockOverlay
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
      </KeyboardProvider>
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
