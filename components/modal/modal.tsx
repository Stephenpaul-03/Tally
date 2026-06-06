import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import React, { ReactNode, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  StyleProp,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import { Modal, Portal } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEscapeToClose } from "../../hooks/useEscapeToClose";

type Presentation = "modal" | "sheet";

type Props = {
  visible: boolean;
  onDismiss: () => void;
  children: ReactNode;
  presentation?: Presentation;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  zIndex?: number;
  escapeEnabled?: boolean;
  dismissable?: boolean;
  keyboardAware?: boolean;
};

export function AnimatedPaperModal({
  visible,
  onDismiss,
  children,
  presentation = "modal",
  style,
  contentContainerStyle,
  zIndex = 1000,
  escapeEnabled = true,
  dismissable = true,
  keyboardAware = false,
}: Props) {
  const { height } = useWindowDimensions();
  const { bottom } = useSafeAreaInsets();
  const { animationsEnabled } = useAddonPrefs();
  const hiddenTranslateY = Math.max(0, Math.floor(height));
  const sheetTranslateY = useRef(new Animated.Value(hiddenTranslateY)).current;
  const gestureStartTranslateY = useRef(0);

  useEscapeToClose(visible && escapeEnabled, onDismiss);

  const combinedModalStyle = useMemo(() => {
    if (presentation !== "sheet") {
      return [{ zIndex, elevation: zIndex }, style];
    }
    return [
      {
        justifyContent: "flex-end",
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
        zIndex,
        elevation: zIndex,
      },
      style,
    ] as any;
  }, [presentation, style, zIndex]);

  useEffect(() => {
    if (presentation !== "sheet") return;
    if (!animationsEnabled) {
      sheetTranslateY.setValue(visible ? 0 : hiddenTranslateY);
      return;
    }

    Animated.timing(sheetTranslateY, {
      toValue: visible ? 0 : hiddenTranslateY,
      duration: visible ? 750 : 750,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [
    animationsEnabled,
    hiddenTranslateY,
    presentation,
    sheetTranslateY,
    visible,
  ]);

  const sheetPanResponder = useMemo(() => {
    if (presentation !== "sheet" || !dismissable) return null;

    return PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (event, gesture) => {
        const isDownwardSwipe =
          gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx);
        const startedNearHandle = event.nativeEvent.locationY <= 72;
        return isDownwardSwipe && startedNearHandle;
      },
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: () => {
        sheetTranslateY.stopAnimation((value) => {
          gestureStartTranslateY.current =
            typeof value === "number" ? Math.max(0, value) : 0;
        });
      },
      onPanResponderMove: (_event, gesture) => {
        const nextTranslate = Math.min(
          hiddenTranslateY,
          Math.max(0, gestureStartTranslateY.current + gesture.dy),
        );
        sheetTranslateY.setValue(nextTranslate);
      },
      onPanResponderRelease: (_event, gesture) => {
        const shouldDismiss =
          gesture.dy > Math.min(140, height * 0.18) || gesture.vy > 1.2;

        if (shouldDismiss) {
          onDismiss();
        }

        if (!animationsEnabled) {
          sheetTranslateY.setValue(shouldDismiss ? hiddenTranslateY : 0);
          return;
        }

        Animated.timing(sheetTranslateY, {
          toValue: shouldDismiss ? hiddenTranslateY : 0,
          duration: shouldDismiss ? 180 : 220,
          easing: shouldDismiss
            ? Easing.in(Easing.cubic)
            : Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        if (!animationsEnabled) {
          sheetTranslateY.setValue(0);
          return;
        }

        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      },
    });
  }, [
    dismissable,
    height,
    hiddenTranslateY,
    onDismiss,
    animationsEnabled,
    presentation,
    sheetTranslateY,
  ]);

  const combinedContentContainerStyle = useMemo(() => {
    if (presentation !== "sheet") return contentContainerStyle;
    return [
      { alignSelf: "stretch", width: "100%", paddingBottom: bottom },
      contentContainerStyle,
      { transform: [{ translateY: sheetTranslateY }] },
    ] as any;
  }, [bottom, contentContainerStyle, presentation, sheetTranslateY]);

  // Wrap children in KeyboardAvoidingView for both sheet and modal when
  // keyboardAware is true. For sheets, offset is 0 since the sheet is
  // bottom-anchored. For modals, a small offset accounts for the header.
  const wrappedChildren = keyboardAware ? (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={
        Platform.OS === "ios"
          ? presentation === "sheet"
            ? 0
            : 16
          : 24
      }
    >
      {children}
    </KeyboardAvoidingView>
  ) : (
    children
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        dismissable={dismissable}
        style={combinedModalStyle}
        contentContainerStyle={combinedContentContainerStyle}
      >
        {presentation === "sheet" && sheetPanResponder ? (
          <View
            style={{ alignSelf: "stretch", flexShrink: 1 }}
            {...sheetPanResponder.panHandlers}
          >
            {wrappedChildren}
          </View>
        ) : (
          wrappedChildren
        )}
      </Modal>
    </Portal>
  );
}