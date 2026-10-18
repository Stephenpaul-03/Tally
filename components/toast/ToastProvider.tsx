import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, StyleSheet, Text } from "react-native";
import { Portal, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastType = "success" | "error" | "info";
type Icon = keyof typeof MaterialCommunityIcons.glyphMap;
type ToastState = { message: string; type: ToastType; icon?: Icon | null };
type ShowToastFn = (message: string, type?: ToastType, icon?: Icon | null) => void;
let globalShowToast: ShowToastFn | null = null;
let globalHideToast: (() => void) | null = null;

export const toast = {
  show: (message: string, type: ToastType = "info", icon?: Icon | null) => globalShowToast?.(message, type, icon),
  success: (message: string, icon?: Icon | null) => toast.show(message, "success", icon),
  error: (message: string, icon?: Icon | null) => toast.show(message, "error", icon),
  info: (message: string, icon?: Icon | null) => toast.show(message, "info", icon),
  hide: () => globalHideToast?.(),
};

function ToastBanner() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const progress = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);
  const [content, setContent] = useState<ToastState | null>(null);
  const clearTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  const hide = useCallback(() => {
    clearTimer();
    const request = ++generation.current;
    Animated.timing(progress, { toValue: 0, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
      if (finished && request === generation.current) setContent(null);
    });
  }, [clearTimer, progress]);
  const show = useCallback<ShowToastFn>((message, type = "info", icon) => {
    clearTimer();
    generation.current++;
    progress.stopAnimation();
    setContent({ message, type, icon });
    Animated.timing(progress, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    timer.current = setTimeout(hide, type === "error" ? 5000 : 2800);
  }, [clearTimer, hide, progress]);
  useEffect(() => {
    globalShowToast = show;
    globalHideToast = hide;
    return () => {
      if (globalShowToast === show) { globalShowToast = null; globalHideToast = null; }
      clearTimer();
      progress.stopAnimation();
    };
  }, [clearTimer, hide, progress, show]);
  if (!content) return null;
  const colors = {
    success: [theme.colors.primary, theme.colors.onPrimary],
    error: [theme.colors.errorContainer, theme.colors.onErrorContainer],
    info: [theme.colors.tertiary, theme.colors.onTertiary],
  };
  const icons: Record<ToastType, Icon> = { success: "check-circle-outline", error: "alert-circle-outline", info: "information-outline" };
  const [backgroundColor, color] = colors[content.type];
  const icon = content.icon === null ? null : content.icon ?? icons[content.type];
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[styles.banner, { minHeight: insets.top + 52, paddingTop: insets.top, backgroundColor,
        transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-insets.top - 120, 0] }) }] }]}
    >
      {icon ? <MaterialCommunityIcons name={icon} size={16} color={color} /> : null}
      <Text style={[styles.label, { color }]} numberOfLines={3}>{content.message}</Text>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  return <>{children}<Portal><ToastBanner /></Portal></>;
}
const styles = StyleSheet.create({
  banner: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 99999, elevation: 99999,
    paddingHorizontal: 16, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  label: { ...typography.editorial.sectionLabel, fontSize: 18, flexShrink: 1, textAlign: "center" },
});
