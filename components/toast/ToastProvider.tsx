import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text } from "react-native";
import { Portal, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastType = "success" | "error" | "info";

interface ToastState {
  message: string;
  type: ToastType;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap | null;
}

export const pushOffsetAnimValue = new Animated.Value(0);
export const headerInsetCollapseAnimValue = new Animated.Value(0);

type ShowToastFn = (
  message: string,
  type?: ToastType,
  icon?: keyof typeof MaterialCommunityIcons.glyphMap | null,
) => void;

let globalShowToast: ShowToastFn | null = null;

export const toast = {
  show: (
    message: string,
    type: ToastType = "info",
    icon?: keyof typeof MaterialCommunityIcons.glyphMap | null,
  ) => globalShowToast?.(message, type, icon),
  success: (
    message: string,
    icon?: keyof typeof MaterialCommunityIcons.glyphMap | null,
  ) => toast.show(message, "success", icon),
  error: (
    message: string,
    icon?: keyof typeof MaterialCommunityIcons.glyphMap | null,
  ) => toast.show(message, "error", icon),
  info: (
    message: string,
    icon?: keyof typeof MaterialCommunityIcons.glyphMap | null,
  ) => toast.show(message, "info", icon),
  hide: () => {},
};

const BANNER_HEIGHT = 52;
const HIDE_DURATION = 300;
const VISIBLE_MS = 1800;
const SPRING_CONFIG = { tension: 65, friction: 11, useNativeDriver: true };
// How long the horizontal swipe-out + swipe-in takes when already fully open
const SWAP_DURATION = 160;

type BannerPhase =
  | "hidden" // fully off-screen, nothing rendered
  | "entering" // spring sliding down into view
  | "visible" // fully open, idle
  | "leaving"; // timing slide back up

function ToastBanner() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const totalHeight = insets.top + BANNER_HEIGHT;

  // Vertical slide for the whole banner
  const slideAnim = useRef(new Animated.Value(-totalHeight)).current;
  // Horizontal swipe used only during the "visible → swap → visible" case
  const swipeAnim = useRef(new Animated.Value(0)).current;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseRef = useRef<BannerPhase>("hidden");
  const contentRef = useRef<ToastState>({ message: "", type: "success" });
  const [, setRenderTick] = useState(0);

  const bgMap: Record<ToastType, string> = {
    success: theme.colors.primary,
    error: theme.colors.errorContainer,
    info: theme.colors.tertiary,
  };
  const textMap: Record<ToastType, string> = {
    success: theme.colors.onPrimary,
    error: theme.colors.onErrorContainer,
    info: theme.colors.onTertiary,
  };
  const defaultIconMap: Record<
    ToastType,
    keyof typeof MaterialCommunityIcons.glyphMap
  > = {
    success: "check-circle-outline",
    error: "alert-circle-outline",
    info: "information-outline",
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const scheduleHide = useCallback((hide: () => void) => {
    clearTimer();
    timerRef.current = setTimeout(hide, VISIBLE_MS);
  }, []);

  const hide = useCallback(() => {
    clearTimer();
    phaseRef.current = "leaving";

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -totalHeight,
        duration: HIDE_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(pushOffsetAnimValue, {
        toValue: 0,
        duration: HIDE_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(headerInsetCollapseAnimValue, {
        toValue: 0,
        duration: HIDE_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        phaseRef.current = "hidden";
        setRenderTick((n) => n + 1);
      }
    });
  }, [slideAnim, totalHeight]);

  const show = useCallback<ShowToastFn>(
    (message, type = "info", icon) => {
      clearTimer();
      const phase = phaseRef.current;

      if (phase === "visible") {
        // ── Case A: already fully open → vertical content swap ────────────
        // Old content slides out through the bottom, new content drops in from top.
        Animated.timing(swipeAnim, {
          toValue: BANNER_HEIGHT,
          duration: SWAP_DURATION,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }).start(() => {
          // Content swap while old text is off-screen below
          contentRef.current = { message, type, icon };
          swipeAnim.setValue(-BANNER_HEIGHT);
          setRenderTick((n) => n + 1);

          // New content falls in from above
          Animated.timing(swipeAnim, {
            toValue: 0,
            duration: SWAP_DURATION,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }).start();
        });

        scheduleHide(hide);
        return;
      }

      if (phase === "entering" || phase === "leaving") {
        // ── Case B: mid-animation → stop everything, spring open from current position ──
        // We do NOT reset slideAnim — we spring from wherever it currently is.
        slideAnim.stopAnimation();
        pushOffsetAnimValue.stopAnimation();
        headerInsetCollapseAnimValue.stopAnimation();
        swipeAnim.stopAnimation();
        swipeAnim.setValue(0);
      } else {
        // ── Case C: hidden → normal open ──────────────────────────────────
        slideAnim.setValue(-totalHeight);
        pushOffsetAnimValue.setValue(0);
        headerInsetCollapseAnimValue.setValue(0);
        swipeAnim.setValue(0);
      }

      contentRef.current = { message, type, icon };
      phaseRef.current = "entering";
      setRenderTick((n) => n + 1);

      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.spring(slideAnim, { toValue: 0, ...SPRING_CONFIG }),
          Animated.spring(pushOffsetAnimValue, {
            toValue: totalHeight,
            ...SPRING_CONFIG,
          }),
          Animated.spring(headerInsetCollapseAnimValue, {
            toValue: 1,
            tension: SPRING_CONFIG.tension,
            friction: SPRING_CONFIG.friction,
            useNativeDriver: false,
          }),
        ]).start(({ finished }) => {
          if (finished) {
            phaseRef.current = "visible";
          }
        });

        scheduleHide(hide);
      });
    },
    [slideAnim, swipeAnim, totalHeight, hide, scheduleHide],
  );

  useEffect(() => {
    globalShowToast = show;
    return () => {
      globalShowToast = null;
      headerInsetCollapseAnimValue.setValue(0);
    };
  }, [show]);

  const { message, type, icon } = contentRef.current;
  const resolvedIcon = icon === null ? null : (icon ?? defaultIconMap[type]);

  if (phaseRef.current === "hidden") return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          height: totalHeight,
          backgroundColor: bgMap[type],
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.content,
          {
            paddingTop: insets.top,
            transform: [{ translateY: swipeAnim }],
          },
        ]}
      >
        {resolvedIcon !== null && (
          <MaterialCommunityIcons
            name={resolvedIcon}
            size={16}
            color={textMap[type]}
          />
        )}
        <Text
          style={[
            styles.label,
            {
              ...typography.editorial.sectionLabel,
              fontSize: 18,
              color: textMap[type],
            },
          ]}
        >
          {message}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      {/* Render through Paper's portal host so toasts sit above sheets and
          other modal portals, regardless of the caller's z-index. */}
      <Portal>
        <ToastBanner />
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    elevation: 99999,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  label: {
    flexShrink: 1,
    textAlign: "center",
  },
});
