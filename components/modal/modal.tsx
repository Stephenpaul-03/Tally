import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Keyboard,
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
import { useEscapeToClose } from "../../hooks/use-escape-to-close";

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
  const hiddenTranslateY = Math.max(0, Math.floor(height));
  const sheetTranslateY = useRef(new Animated.Value(hiddenTranslateY)).current;
  const gestureStartTranslateY = useRef(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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
    Animated.timing(sheetTranslateY, {
      toValue: visible ? 0 : hiddenTranslateY,
      duration: visible ? 750 : 750,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [hiddenTranslateY, presentation, sheetTranslateY, visible]);

  useEffect(() => {
    if (!keyboardAware || presentation !== "sheet" || !visible) {
      setKeyboardHeight(0);
      return;
    }

    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [keyboardAware, presentation, visible]);

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
    presentation,
    sheetTranslateY,
  ]);

  const combinedContentContainerStyle = useMemo(() => {
    if (presentation !== "sheet") return contentContainerStyle;
    return [
      {
        alignSelf: "stretch",
        width: "100%",
        paddingBottom:
          keyboardAware && keyboardHeight > 0
            ? Math.max(bottom, keyboardHeight + 20)
            : bottom,
      },
      contentContainerStyle,
      { transform: [{ translateY: sheetTranslateY }] },
    ] as any;
  }, [
    bottom,
    contentContainerStyle,
    keyboardAware,
    keyboardHeight,
    presentation,
    sheetTranslateY,
  ]);

  // Sheet modals avoid the keyboard by lifting the bottom-anchored container.
  // Center modals still use KeyboardAvoidingView around their content.
  const wrappedChildren =
    keyboardAware && presentation !== "sheet" ? (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 24}
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
