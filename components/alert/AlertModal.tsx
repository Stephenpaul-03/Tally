import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { ReactNode } from "react";
import {
    Animated,
    PanResponder,
    Platform,
    ScrollView,
    View,
    useWindowDimensions,
} from "react-native";
import { Button, Text, TouchableRipple, useTheme } from "react-native-paper";

import { AnimatedPaperModal } from "@/components/modal/modal";
import { typography } from "@/theme/typography";
import { getContrastColor } from "@/utils/ColorHelpers";
import { styles } from "./AlertModalStyles";

type ConfirmMode = "button" | "slide";

type Props = {
  isOpen: boolean;
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tertiaryLabel?: string;
  onConfirm: () => void | boolean | Promise<void | boolean>;
  onCancel: () => void;
  onTertiary?: () => void;
  destructive?: boolean;
  confirmDisabled?: boolean;
  tertiaryDisabled?: boolean;
  confirmMode?: ConfirmMode;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  modalMaxWidth?: number;
  containerMaxHeight?: number;
  children?: ReactNode;
  forceModal?: boolean;
  backgroundColor?: string;
  iconColor?: string;
  titleColor?: string;
};

type SlideConfirmProps = {
  label: string;
  disabled?: boolean;
  buttonColor: string;
  textColor: string;
  onConfirm: () => void | boolean | Promise<void | boolean>;
};

const THUMB_SIZE = 44;
const TRACK_INSET = 4;
const CONFIRM_THRESHOLD = 0.72;

function SlideConfirmControl({
  label,
  disabled = false,
  buttonColor,
  textColor,
  onConfirm,
}: SlideConfirmProps) {
  const [trackWidth, setTrackWidth] = React.useState(0);
  const translateX = React.useRef(new Animated.Value(0)).current;
  const confirmedRef = React.useRef(false);

  const maxTranslate = Math.max(trackWidth - THUMB_SIZE - TRACK_INSET * 2, 0);

  const progress =
    maxTranslate > 0
      ? Animated.divide(translateX, maxTranslate)
      : new Animated.Value(0);

  const labelOpacity = progress.interpolate({
    inputRange: [0, 0.35],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const fillTranslateX =
    maxTranslate > 0
      ? translateX.interpolate({
          inputRange: [0, maxTranslate],
          outputRange: [-trackWidth + THUMB_SIZE + TRACK_INSET * 2, 0],
          extrapolate: "clamp",
        })
      : new Animated.Value(-9999);

  const chevron2Opacity = progress.interpolate({
    inputRange: [0, 0.2, 0.5],
    outputRange: [0.25, 0.6, 1],
    extrapolate: "clamp",
  });

  const chevron3Opacity = progress.interpolate({
    inputRange: [0, 0.4, 0.7],
    outputRange: [0, 0.3, 1],
    extrapolate: "clamp",
  });

  const resetThumb = React.useCallback(() => {
    confirmedRef.current = false;
    translateX.stopAnimation();
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 180,
      friction: 18,
    }).start();
  }, [translateX]);

  React.useEffect(() => {
    if (!disabled) return;
    resetThumb();
  }, [disabled, resetThumb]);

  React.useEffect(() => {
    translateX.setValue(0);
  }, [resetThumb, trackWidth, translateX]);

  const triggerConfirm = React.useCallback(async () => {
    if (confirmedRef.current || disabled) return;
    confirmedRef.current = true;

    Animated.timing(translateX, {
      toValue: maxTranslate,
      duration: 160,
      useNativeDriver: true,
    }).start();

    try {
      const result = await onConfirm();
      if (result === false) resetThumb();
    } catch {
      resetThumb();
    } finally {
      confirmedRef.current = false;
    }
  }, [disabled, maxTranslate, onConfirm, resetThumb, translateX]);

  const panResponder = React.useMemo(() => {
    if (disabled) return null;

    return PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_event, gesture) =>
        Math.abs(gesture.dx) > 6 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderGrant: () => {
        translateX.stopAnimation();
      },
      onPanResponderMove: (_event, gesture) => {
        translateX.setValue(Math.min(maxTranslate, Math.max(0, gesture.dx)));
      },
      onPanResponderRelease: (_event, gesture) => {
        const shouldConfirm =
          gesture.dx >= Math.max(80, maxTranslate * CONFIRM_THRESHOLD) ||
          gesture.vx > 1.2;

        if (shouldConfirm) {
          void triggerConfirm();
        } else {
          resetThumb();
        }
      },
      onPanResponderTerminate: () => resetThumb(),
    });
  }, [disabled, maxTranslate, resetThumb, triggerConfirm, translateX]);

  return (
    <View
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      style={[styles.slideWrapper, disabled && styles.slideWrapperDisabled]}
      {...(panResponder ? panResponder.panHandlers : {})}
    >
      <View
        style={[
          styles.slideTrack,
          { backgroundColor: buttonColor, opacity: disabled ? 0.4 : 0.14 },
        ]}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.slideFill,
          {
            backgroundColor: buttonColor,
            opacity: disabled ? 0.3 : 0.22,
            transform: [{ translateX: fillTranslateX }],
          },
        ]}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.slideLabelWrap,
          { opacity: disabled ? 0.4 : labelOpacity },
        ]}
      >
        <Text
          style={[
            styles.slideLabel,
            {
              ...typography.editorial.sectionLabel,
              fontSize: 16,
              color: buttonColor,
            },
          ]}
        >
          {label}
        </Text>
      </Animated.View>

      <View pointerEvents="none" style={styles.slideChevrons}>
        <MaterialCommunityIcons
          name="chevron-right"
          size={16}
          color={buttonColor}
          style={{ opacity: 0.35 }}
        />
        <Animated.View style={{ opacity: chevron2Opacity }}>
          <MaterialCommunityIcons
            name="chevron-right"
            size={16}
            color={buttonColor}
          />
        </Animated.View>
        <Animated.View style={{ opacity: chevron3Opacity }}>
          <MaterialCommunityIcons
            name="chevron-right"
            size={16}
            color={buttonColor}
          />
        </Animated.View>
      </View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.slideThumb,
          {
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            backgroundColor: disabled ? `${buttonColor}99` : buttonColor,
            transform: [{ translateX }],
          },
        ]}
      >
        <MaterialCommunityIcons
          name="chevron-double-right"
          size={20}
          color={textColor}
        />
      </Animated.View>
    </View>
  );
}

export function AlertModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel,
  tertiaryLabel,
  onConfirm,
  onCancel,
  onTertiary,
  destructive = false,
  confirmDisabled = false,
  tertiaryDisabled = false,
  confirmMode = "button",
  icon = "alert-outline",
  modalMaxWidth = 520,
  containerMaxHeight,
  children,
  forceModal,
  backgroundColor,
  iconColor,
  titleColor,
}: Props) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const [displayOpen, setDisplayOpen] = React.useState(isOpen);
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setDisplayOpen(isOpen);
  }, [isOpen]);

  React.useEffect(
    () => () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    },
    [],
  );

  // Keep the modal mounted while its closing animation runs. This matters for
  // callers that remove the AlertModal as soon as their state changes.
  const requestClose = React.useCallback(() => {
    if (!displayOpen || closeTimerRef.current) return;
    setDisplayOpen(false);
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      onCancel();
    }, 320);
  }, [displayOpen, onCancel]);

  const isMobile = !forceModal && (Platform.OS !== "web" || width < 768);

  const modalWidth = Math.min(modalMaxWidth, width - 48);
  const maxHeight =
    containerMaxHeight ?? Math.max(Math.min(height * 0.92, 760), 420);

  const tone = destructive
    ? {
        icon: theme.colors.error,
        iconBg: theme.colors.errorContainer,
        actionText: theme.colors.onError,
        actionBg: theme.colors.error,
      }
    : {
        icon: theme.colors.primary,
        iconBg: theme.colors.primaryContainer,
        actionText: theme.colors.onPrimary,
        actionBg: theme.colors.primary,
    };
  // Alerts use the same base surface as the rest of the app's sheets. Keeping
  // this as a real surface (instead of an elevation token) also makes the
  // open/close transition read consistently against the backdrop.
  const modalBackgroundColor = backgroundColor ?? theme.colors.background;
  const modalIconColor = iconColor ?? tone.icon;

  const showTertiaryRow = Boolean(tertiaryLabel && onTertiary);
  const showTopActionRow = Boolean(cancelLabel || showTertiaryRow);

  return (
    <AnimatedPaperModal
      visible={displayOpen}
      onDismiss={requestClose}
      presentation={isMobile ? "sheet" : "modal"}
      // Pass keyboardAware whenever there are children (inputs, pickers, etc.)
      // so the modal shifts up and nothing hides behind the keyboard.
      keyboardAware={Boolean(children)}
      style={isMobile ? styles.sheetOverlay : undefined}
      contentContainerStyle={[
        isMobile ? styles.sheetContainer : styles.modalContainer,
        {
          backgroundColor: modalBackgroundColor,
          width: isMobile ? undefined : modalWidth,
          maxHeight,
        },
      ]}
    >
      {isMobile ? (
        <View style={styles.dragHandleWrap}>
          <View
            style={[
              styles.dragHandle,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />
        </View>
      ) : null}

      <View
        style={[
          styles.header,
          { borderBottomColor: theme.colors.outlineVariant },
        ]}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.headerIcon, { backgroundColor: tone.iconBg }]}>
            <MaterialCommunityIcons name={icon} size={18} color={modalIconColor} />
          </View>
          <Text
            variant="titleLarge"
            numberOfLines={1}
            style={{
              ...typography.editorial.sectionLabel,
              color: titleColor ?? theme.colors.onSurface,
              fontSize: 18,
            }}
          >
            {title}
          </Text>
        </View>

          <TouchableRipple
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={requestClose}
          borderless
          style={styles.closeBtn}
        >
          <MaterialCommunityIcons
            name="close"
            size={18}
            color={theme.colors.onSurface}
          />
        </TouchableRipple>
      </View>

      {/* ScrollView lets content scroll up when the keyboard is open,
          ensuring the action buttons are always reachable. */}
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {message ? (
          typeof message === "string" ? (
            <Text
              style={[styles.message, { color: theme.colors.onSurfaceVariant }]}
            >
              {message}
            </Text>
          ) : (
            message
          )
        ) : null}

        {children}

        <View style={styles.actions}>
          {showTopActionRow ? (
            <View style={styles.actionsTopRow}>
              {cancelLabel ? (
                <Button
                  mode="outlined"
                  onPress={requestClose}
                  style={styles.actionButton}
                  contentStyle={styles.actionButtonContent}
                  textColor={getContrastColor(modalBackgroundColor)}
                >
                  {cancelLabel}
                </Button>
              ) : null}

              {showTertiaryRow && (
                <Button
                  mode="outlined"
                  onPress={onTertiary}
                  disabled={tertiaryDisabled}
                  style={[styles.actionButton, styles.tertiaryButton]}
                  contentStyle={styles.actionButtonContent}
                  textColor={getContrastColor(modalBackgroundColor)}
                >
                  {tertiaryLabel}
                </Button>
              )}
            </View>
          ) : null}

          {confirmMode === "slide" ? (
            <SlideConfirmControl
              label={confirmLabel}
              disabled={confirmDisabled}
              buttonColor={tone.actionBg}
              textColor={tone.actionText}
              onConfirm={onConfirm}
            />
          ) : (
            <Button
              mode="contained"
              onPress={onConfirm}
              disabled={confirmDisabled}
              style={styles.confirmButton}
              contentStyle={styles.actionButtonContent}
              buttonColor={tone.actionBg}
              textColor={tone.actionText}
            >
              {confirmLabel}
            </Button>
          )}
        </View>
      </ScrollView>
    </AnimatedPaperModal>
  );
}
