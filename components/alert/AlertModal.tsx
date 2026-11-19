import { tonalButtonSurface } from "@/theme/surfaceTreatment";
import { useMotionEnabled } from "@/components/animations/Motion";
import { LazyModalContent } from "@/components/modal/LazyModalContent";
import { DesignText } from "@/components/DesignText";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { ReactNode } from "react";
import { Platform, ScrollView, View, useWindowDimensions } from "react-native";
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Button, Text, TouchableRipple, useTheme } from "react-native-paper";

import { AnimatedPaperModal } from "@/components/modal/modal";
import { typography } from "@/theme/typography";
import { getContrastColor } from "@/utils/color-helpers";
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
  expressive?: boolean;
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
  expressive = false,
}: SlideConfirmProps) {
  const travel = useSharedValue(0);
  const trackWidth = useSharedValue(0);
  const draggingFrom = useSharedValue(0);
  const confirming = useSharedValue(false);
  const reduced = !useMotionEnabled();
  const reset = React.useCallback(() => {
    confirming.value = false;
    travel.value = withTiming(0, { duration: reduced ? 0 : 180 });
  }, [confirming, reduced, travel]);
  React.useEffect(() => {
    if (disabled) reset();
  }, [disabled, reset]);
  const confirm = React.useCallback(async () => {
    try {
      if ((await onConfirm()) === false) reset();
    } catch {
      reset();
    }
  }, [onConfirm, reset]);
  const pan = Gesture.Pan()
    .enabled(!disabled)
    .activeOffsetX([-6, 6])
    .failOffsetY([-14, 14])
    .onStart(() => {
      cancelAnimation(travel);
      draggingFrom.value = travel.value;
    })
    .onUpdate((event) => {
      if (confirming.value) return;
      travel.value = Math.max(
        0,
        Math.min(
          trackWidth.value - THUMB_SIZE - TRACK_INSET * 2,
          draggingFrom.value + event.translationX,
        ),
      );
    })
    .onEnd(() => {
      const maximum = Math.max(
        0,
        trackWidth.value - THUMB_SIZE - TRACK_INSET * 2,
      );
      if (
        !confirming.value &&
        maximum > 0 &&
        travel.value >= maximum * CONFIRM_THRESHOLD
      ) {
        confirming.value = true;
        travel.value = withTiming(maximum, { duration: reduced ? 0 : 120 });
        runOnJS(confirm)();
      } else if (!confirming.value)
        travel.value = withTiming(0, { duration: reduced ? 0 : 180 });
    })
    .onFinalize(() => {
      if (!confirming.value)
        travel.value = withTiming(0, { duration: reduced ? 0 : 180 });
    });
  const thumbMotion = useAnimatedStyle(() => ({
    transform: [{ translateX: travel.value }],
  }));
  const labelMotion = useAnimatedStyle(() => ({
    opacity: disabled
      ? 0.4
      : Math.max(0, 1 - travel.value / Math.max(1, trackWidth.value * 0.35)),
  }));
  const fillMotion = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          -trackWidth.value + THUMB_SIZE + TRACK_INSET * 2 + travel.value,
      },
    ],
  }));
  return (
    <GestureDetector gesture={pan}>
      <View
        onLayout={(event) => {
          trackWidth.value = event.nativeEvent.layout.width;
        }}
        accessibilityLabel={`${label}: slide right to confirm`}
        style={[
          styles.slideWrapper,
          expressive && { borderRadius: 28 },
          disabled && styles.slideWrapperDisabled,
        ]}
      >
        <View
          style={[
            styles.slideTrack,
            {
              borderRadius: expressive ? 28 : 14,
              backgroundColor: buttonColor,
              opacity: 0.14,
            },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.slideFill,
            {
              borderRadius: expressive ? 28 : 14,
              backgroundColor: buttonColor,
              opacity: 0.22,
            },
            fillMotion,
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[styles.slideLabelWrap, labelMotion]}
        >
          <Text
            style={[
              styles.slideLabel,
              {
                color: buttonColor,
                fontFamily: expressive ? "Figtree-700" : undefined,
              },
            ]}
          >
            {label}
          </Text>
        </Animated.View>
        <View pointerEvents="none" style={styles.slideChevrons}>
          <MaterialCommunityIcons
            name="chevron-double-right"
            size={20}
            color={buttonColor}
          />
        </View>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.slideThumb,
            {
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: expressive ? 22 : 10,
              backgroundColor: buttonColor,
            },
            thumbMotion,
          ]}
        >
          <MaterialCommunityIcons
            name="chevron-double-right"
            size={20}
            color={textColor}
          />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

export function AlertModal(props: Props) {
  return (
    <LazyModalContent visible={props.isOpen}>
      <AlertModalContent {...props} />
    </LazyModalContent>
  );
}

function AlertModalContent({
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
  const theme = useTheme<ExtendedMD3Theme>();
  const expressive = Boolean(theme.expressive);
  const { width, height } = useWindowDimensions();
  const [displayOpen, setDisplayOpen] = React.useState(isOpen);
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

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
    }, 220);
  }, [displayOpen, onCancel]);

  const tablet = Math.min(width, height) >= 600 && width >= 768;
  const isMobile = !forceModal && !tablet && (Platform.OS !== "web" || width < 768);

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
          ...(expressive
            ? {
                borderWidth: 0,
                borderRadius: isMobile ? 0 : 32,
                ...(isMobile
                  ? { borderTopLeftRadius: 40, borderTopRightRadius: 40 }
                  : {}),
              }
            : {}),
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
          {
            borderBottomColor: theme.colors.outlineVariant,
            ...(expressive
              ? {
                  borderBottomWidth: 0,
                  paddingHorizontal: 20,
                  paddingTop: 16,
                  paddingBottom: 8,
                }
              : {}),
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.headerIcon,
              { backgroundColor: tone.iconBg },
              expressive && { width: 48, height: 48, borderRadius: 18 },
            ]}
          >
            <MaterialCommunityIcons
              name={icon}
              size={expressive ? 24 : 18}
              color={modalIconColor}
            />
          </View>
          <DesignText
            variant="titleLarge"
            numberOfLines={expressive ? 2 : 1}
            style={{
              ...typography.editorial.sectionLabel,
              color: titleColor ?? theme.colors.onSurface,
              fontSize: expressive ? 24 : 18,
              ...(expressive
                ? {
                    fontFamily: "Figtree-800",
                    fontWeight: "800",
                    letterSpacing: -0.5,
                    flexShrink: 1,
                  }
                : {}),
            }}
          >
            {title}
          </DesignText>
        </View>

        <TouchableRipple
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={requestClose}
          borderless
          style={[
            styles.closeBtn,
            expressive && {
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: tonalButtonSurface(theme),
            },
          ]}
        >
          <MaterialCommunityIcons
            name="close"
            size={expressive ? 22 : 18}
            color={theme.colors.onSurface}
          />
        </TouchableRipple>
      </View>

      {/* ScrollView lets content scroll up when the keyboard is open,
          ensuring the action buttons are always reachable. */}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          expressive && {
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 20,
            gap: 20,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {message ? (
          typeof message === "string" ? (
            <DesignText
              style={[
                styles.message,
                { color: theme.colors.onSurfaceVariant },
                expressive && { fontSize: 15, lineHeight: 22 },
              ]}
            >
              {message}
            </DesignText>
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
                  style={[
                    styles.actionButton,
                    expressive && {
                      borderRadius: 28,
                      borderWidth: 0,
                      backgroundColor: tonalButtonSurface(theme),
                    },
                  ]}
                  contentStyle={[
                    styles.actionButtonContent,
                    expressive && { minHeight: 56 },
                  ]}
                  textColor={
                    expressive
                      ? theme.colors.onSurface
                      : getContrastColor(modalBackgroundColor)
                  }
                >
                  {cancelLabel}
                </Button>
              ) : null}

              {showTertiaryRow && (
                <Button
                  mode="outlined"
                  onPress={onTertiary}
                  disabled={tertiaryDisabled}
                  style={[
                    styles.actionButton,
                    styles.tertiaryButton,
                    expressive && { borderRadius: 28 },
                  ]}
                  contentStyle={[
                    styles.actionButtonContent,
                    expressive && { minHeight: 56 },
                  ]}
                  textColor={
                    expressive
                      ? theme.colors.onSurface
                      : getContrastColor(modalBackgroundColor)
                  }
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
              expressive={expressive}
            />
          ) : (
            <Button
              mode="contained"
              onPress={onConfirm}
              disabled={confirmDisabled}
              style={[styles.confirmButton, expressive && { borderRadius: 28 }]}
              contentStyle={[
                styles.actionButtonContent,
                expressive && { minHeight: 56 },
              ]}
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
