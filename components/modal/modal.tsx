import React, { type ReactNode, useEffect, useRef, useState } from "react";
import {
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Portal, useTheme } from "react-native-paper";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { useEscapeToClose } from "@/hooks/use-escape-to-close";
import { InlineSettingsModalContext, SettingsDetailContext } from "@/modules/Settings/Layouts/SettingsDetailContext";
import { SettingsCardEntranceProvider } from "@/components/animations/SettingsCardEntrance";

type Presentation = "modal" | "sheet";
type Props = {
  visible: boolean;
  onDismiss: () => void;
  /** Called after the panel has fully exited, including reduced-motion closes. */
  onHidden?: () => void;
  /** Called once the opening animation completes. */
  onShown?: () => void;
  children: ReactNode;
  presentation?: Presentation;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  contentWrapperStyle?: StyleProp<ViewStyle>;
  zIndex?: number;
  escapeEnabled?: boolean;
  dismissable?: boolean;
  keyboardAware?: boolean;
  includeBottomInset?: boolean;
  animationDuration?: number;
  dismissDuration?: number;
  reduceMotion?: boolean;
};

/** One UI-thread timeline owns the panel, backdrop and drag. No nested Paper fade. */
export function AnimatedPaperModal(props: Props) {
  const inline = React.useContext(InlineSettingsModalContext);
  const { width, height } = useWindowDimensions();
  const tablet = Math.min(width, height) >= 600 && width >= 768;
  if (inline) {
    return props.visible ? (
      <InlineSettingsModalContext.Provider value={false}>
        <View style={{ flex: 1, minHeight: 0 }}>{props.children}</View>
      </InlineSettingsModalContext.Provider>
    ) : null;
  }
  return <SettingsDetailContext.Provider value={false}>
    <AnimatedPaperModalPresentation {...props}
      presentation={tablet ? "modal" : props.presentation}
      style={[props.style, tablet && { justifyContent: "center", paddingHorizontal: 24 }]}
      contentContainerStyle={[
        props.contentContainerStyle,
        tablet && { width: "100%", maxWidth: Math.min(width - 48, Number(StyleSheet.flatten(props.contentContainerStyle)?.maxWidth) || 640), alignSelf: "center", borderRadius: 28,
          maxHeight: height - 96, overflow: "hidden", paddingBottom: 16 },
      ]}
    />
  </SettingsDetailContext.Provider>;
}

function AnimatedPaperModalPresentation({
  visible,
  onDismiss,
  onHidden,
  onShown,
  children,
  presentation = "modal",
  style,
  contentContainerStyle,
  contentWrapperStyle,
  zIndex = 1000,
  escapeEnabled = true,
  dismissable = true,
  keyboardAware = false,
  includeBottomInset = true,
  animationDuration = 280,
  dismissDuration = 220,
  reduceMotion: requestedReducedMotion = false,
}: Props) {
  const { animationsEnabled } = useAddonPrefs();
  const systemReducedMotion = useReducedMotion();
  const reduceMotion =
    requestedReducedMotion || systemReducedMotion || !animationsEnabled;
  const { height } = useWindowDimensions();
  const { top, bottom } = useSafeAreaInsets();
  const theme = useTheme();
  const [rendered, setRendered] = useState(visible);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const renderedRef = useRef(rendered);
  const visibleRef = useRef(visible);
  const dismissRef = useRef(onDismiss);
  const hiddenRef = useRef(onHidden);
  const shownRef = useRef(onShown);
  const generation = useRef(0);
  const completedExit = useRef<number | null>(null);
  const processedVisibility = useRef<boolean | null>(null);
  const openingPending = useRef(visible);
  const measured = useRef(0);
  const lastChildren = useRef(children);
  renderedRef.current = rendered;
  visibleRef.current = visible;
  dismissRef.current = onDismiss;
  hiddenRef.current = onHidden;
  shownRef.current = onShown;
  if (visible) lastChildren.current = children;

  const progress = useSharedValue(0);
  const panelHeight = useSharedValue(height);
  const travelDistance = useSharedValue(height);
  const exitHeight = useSharedValue(height);
  const closing = useSharedValue(false);
  const gestureStart = useSharedValue(1);
  const gestureX = useSharedValue(0);
  const gestureY = useSharedValue(0);
  const dragging = useSharedValue(false);

  const requestDismiss = React.useCallback(() => {
    if (!visibleRef.current || !dismissable) return;
    if (keyboardAware) Keyboard.dismiss();
    dismissRef.current();
  }, [dismissable, keyboardAware]);
  useEscapeToClose(visible && escapeEnabled, requestDismiss);

  const completeClose = React.useCallback((token: number) => {
    if (generation.current !== token || visibleRef.current) return;
    openingPending.current = false;
    completedExit.current = token;
    setRendered(false);
  }, []);
  // Handoffs must wait for the closed render to commit. Reopening from the
  // animation callback can reuse the old panel/layout and restart its entrance.
  useEffect(() => {
    if (rendered || completedExit.current === null) return;
    const token = completedExit.current;
    completedExit.current = null;
    if (generation.current === token && !visibleRef.current)
      hiddenRef.current?.();
  }, [rendered]);

  const completeOpen = React.useCallback((token: number) => {
    if (generation.current === token && visibleRef.current) shownRef.current?.();
  }, []);

  const open = React.useCallback(() => {
    if (!openingPending.current) return;
    openingPending.current = false;
    closing.value = false;
    const token = generation.current;
    progress.value = withTiming(1, {
      duration: reduceMotion ? 0 : animationDuration,
      easing: Easing.bezier(0.2, 0, 0, 1),
    }, (finished) => {
      if (finished) runOnJS(completeOpen)(token);
    });
  }, [animationDuration, reduceMotion, progress, closing, completeOpen]);

  useEffect(() => {
    if (processedVisibility.current === visible) return;
    const previous = processedVisibility.current;
    processedVisibility.current = visible;
    const token = ++generation.current;
    if (visible) {
      // A quick reopen continues from the current pixel offset.
      if (renderedRef.current && previous === false) {
        const offset =
          (1 - progress.value) *
          (closing.value ? exitHeight.value : travelDistance.value);
        progress.value = Math.max(
          0,
          Math.min(1, 1 - offset / Math.max(1, height)),
        );
      }
      travelDistance.value = height;
      closing.value = false;
      if (!renderedRef.current) {
        measured.current = 0;
        openingPending.current = true;
        progress.value = 0;
        setRendered(true);
      } else {
        if (previous === false) openingPending.current = true;
        if (measured.current > 0) open();
      }
      return;
    }
    if (!renderedRef.current) return;
    if (keyboardAware) Keyboard.dismiss();
    openingPending.current = false;
    exitHeight.value =
      progress.value < 1 ? travelDistance.value : panelHeight.value;
    closing.value = true;
    progress.value = withTiming(
      0,
      {
        duration: reduceMotion ? 0 : dismissDuration,
        easing: Easing.bezier(0.4, 0, 1, 1),
      },
      (finished) => {
        if (finished) runOnJS(completeClose)(token);
      },
    );
  }, [
    visible,
    height,
    travelDistance,
    animationDuration,
    dismissDuration,
    reduceMotion,
    open,
    progress,
    panelHeight,
    exitHeight,
    closing,
    keyboardAware,
    completeClose,
  ]);

  useEffect(() => {
    if (!rendered) return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        requestDismiss();
        return true;
      },
    );
    return () => subscription.remove();
  }, [rendered, requestDismiss]);

  useEffect(() => {
    if (!rendered) {
      setKeyboardHeight(0);
      return;
    }
    if (!keyboardAware || presentation !== "sheet") return;
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (event) => {
        if (visibleRef.current) setKeyboardHeight(event.endCoordinates.height);
      },
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        if (visibleRef.current) setKeyboardHeight(0);
      },
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, [keyboardAware, presentation, rendered]);

  const pan = Gesture.Pan()
    .enabled(presentation === "sheet" && dismissable && visible)
    .manualActivation(true)
    .onTouchesDown((event, manager) => {
      const touch = event.changedTouches[0];
      if (!touch || touch.y > 72) {
        manager.fail();
        return;
      }
      gestureX.value = touch.absoluteX;
      gestureY.value = touch.absoluteY;
    })
    .onTouchesMove((event, manager) => {
      const touch = event.changedTouches[0];
      if (!touch) return;
      const dy = touch.absoluteY - gestureY.value;
      const dx = touch.absoluteX - gestureX.value;
      if (dy > 8 && dy > Math.abs(dx)) manager.activate();
      else if (dy < -8 || Math.abs(dx) > 18) manager.fail();
    })
    .onStart(() => {
      cancelAnimation(progress);
      const offset = (1 - progress.value) * travelDistance.value;
      travelDistance.value = panelHeight.value;
      progress.value = Math.max(0, 1 - offset / Math.max(1, panelHeight.value));
      gestureStart.value = progress.value;
      dragging.value = true;
    })
    .onUpdate((event) => {
      progress.value = Math.max(
        0,
        Math.min(
          1,
          gestureStart.value -
            event.translationY / Math.max(1, panelHeight.value),
        ),
      );
    })
    .onEnd((event, success) => {
      dragging.value = false;
      const threshold = Math.min(140, Math.max(48, panelHeight.value * 0.3));
      if (
        success &&
        (event.translationY > threshold ||
          (event.translationY > 0 && event.velocityY > 1200))
      ) {
        runOnJS(requestDismiss)();
      } else
        progress.value = withTiming(1, {
          duration: reduceMotion ? 0 : 180,
          easing: Easing.out(Easing.cubic),
        });
    })
    .onFinalize(() => {
      if (!dragging.value) return;
      dragging.value = false;
      progress.value = withTiming(1, {
        duration: reduceMotion ? 0 : 180,
        easing: Easing.out(Easing.cubic),
      });
    });
  const backdropMotion = useAnimatedStyle(() => ({ opacity: progress.value }));
  const panelMotion = useAnimatedStyle(() =>
    presentation === "sheet"
      ? {
          transform: [
            {
              translateY:
                (1 - progress.value) *
                (closing.value ? exitHeight.value : travelDistance.value),
            },
          ],
        }
      : {
          opacity: progress.value,
          transform: [
            { translateY: (1 - progress.value) * 16 },
            { scale: 0.94 + progress.value * 0.06 },
          ],
        },
  );

  if (!rendered) return null;
  const presentedChildren = <SettingsCardEntranceProvider>
    {visible ? children : lastChildren.current}
  </SettingsCardEntranceProvider>;
  return (
    <Portal>
      <View
        accessibilityViewIsModal
        onAccessibilityEscape={requestDismiss}
        style={[StyleSheet.absoluteFillObject, { zIndex, elevation: zIndex }]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: theme.colors.backdrop },
            backdropMotion,
          ]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close modal"
          importantForAccessibility="no"
          onPress={requestDismiss}
          style={StyleSheet.absoluteFillObject}
        />
        <View
          pointerEvents="box-none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              justifyContent: presentation === "sheet" ? "flex-end" : "center",
              marginTop: presentation === "sheet" ? 0 : top,
              marginBottom: presentation === "sheet" ? 0 : bottom,
            },
            style,
          ]}
        >
          <GestureDetector gesture={pan}>
            <Animated.View
              collapsable={false}
              onLayout={(event) => {
                const nextHeight = event.nativeEvent.layout.height;
                if (nextHeight <= 0) return;
                measured.current = nextHeight;
                panelHeight.value = nextHeight;
                if (visibleRef.current && openingPending.current) open();
              }}
              style={[
                { flexShrink: 1 },
                presentation === "sheet" && {
                  alignSelf: "stretch",
                  width: "100%",
                  borderTopLeftRadius: 40,
                  borderTopRightRadius: 40,
                  maxHeight: height - top,
                  paddingBottom:
                    keyboardAware && keyboardHeight > 0
                      ? Math.max(bottom, keyboardHeight + 20)
                      : includeBottomInset
                        ? bottom
                        : 0,
                },
                contentContainerStyle,
                panelMotion,
              ]}
            >
              <View
                style={[
                  { alignSelf: "stretch", flexShrink: 1 },
                  contentWrapperStyle,
                ]}
              >
                {keyboardAware && presentation !== "sheet" ? (
                  <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 24}
                  >
                    {presentedChildren}
                  </KeyboardAvoidingView>
                ) : (
                  presentedChildren
                )}
              </View>
            </Animated.View>
          </GestureDetector>
        </View>
      </View>
    </Portal>
  );
}
