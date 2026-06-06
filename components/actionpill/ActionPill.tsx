// ActionPill.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Styles } from "./ActionPillStyles";
// ─── Types ────────────────────────────────────────────────────────────────────

type Variant =
  | "solid"
  | "outline"
  | "ghost"
  | "tonal"
  | "danger"
  | "success"
  | "warning";

type IconPosition = "left" | "right";

type HeaderPosition =
  | "outside-top"
  | "outside-bottom"
  | "inside-top"
  | "inside-bottom";

type Size = "xs" | "sm" | "md" | "lg";

type BadgeProps = {
  value: string | number;
  color?: string;
  backgroundColor?: string;
};

type Props = {
  // ── Content ──
  label: string;
  sublabel?: string;
  header?: string;
  headerPosition?: HeaderPosition;
  badge?: BadgeProps;

  // ── Icon ──
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  iconPosition?: IconPosition;
  iconSize?: number;
  iconColor?: string;
  trailingIcon?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];

  // ── Variant & state ──
  variant?: Variant;
  activeVariant?: Variant;
  active?: boolean;
  disabled?: boolean;

  // ── Size ──
  size?: Size;

  // ── Shape ──
  borderRadius?: number;
  borderWidth?: number;
  pill?: boolean;

  // ── Sizing ──
  fitContent?: boolean;
  fullWidth?: boolean;
  minWidth?: number;
  minHeight?: number;
  width?: number;
  height?: number;

  // ── Colors (manual overrides) ──
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  activeBackgroundColor?: string;
  activeBorderColor?: string;
  activeTextColor?: string;

  // ── Spacing ──
  paddingHorizontal?: number;
  paddingVertical?: number;
  gap?: number;

  // ── Typography ──
  labelVariant?: React.ComponentProps<typeof Text>["variant"];
  headerVariant?: React.ComponentProps<typeof Text>["variant"];
  sublabelVariant?: React.ComponentProps<typeof Text>["variant"];
  labelStyle?: TextStyle;
  headerStyle?: TextStyle;
  sublabelStyle?: TextStyle;
  uppercase?: boolean;
  letterSpacing?: number;
  noTruncate?: boolean; // disables numberOfLines + flexShrink so long text wraps freely

  // ── Press feedback ──
  pressScale?: number;
  pressOpacity?: number;

  // ── Alignment ──
  align?: "left" | "center" | "right";

  // ── Container ──
  style?: ViewStyle;
  containerStyle?: ViewStyle;

  // ── Events ──
  onPress: () => void;
  onLongPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;

  // ── Accessibility ──
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
};

// ─── Size presets ─────────────────────────────────────────────────────────────

const SIZE_PRESETS: Record<
  Size,
  {
    minWidth: number;
    minHeight: number;
    paddingHorizontal: number;
    paddingVertical: number;
    iconSize: number;
    labelVariant: React.ComponentProps<typeof Text>["variant"];
    headerVariant: React.ComponentProps<typeof Text>["variant"];
  }
> = {
  xs: {
    minWidth: 32,
    minHeight: 28,
    paddingHorizontal: 8,
    paddingVertical: 4,
    iconSize: 12,
    labelVariant: "labelSmall",
    headerVariant: "labelSmall",
  },
  sm: {
    minWidth: 40,
    minHeight: 36,
    paddingHorizontal: 10,
    paddingVertical: 6,
    iconSize: 14,
    labelVariant: "labelSmall",
    headerVariant: "labelSmall",
  },
  md: {
    minWidth: 52,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    iconSize: 16,
    labelVariant: "labelMedium",
    headerVariant: "labelSmall",
  },
  lg: {
    minWidth: 64,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 10,
    iconSize: 18,
    labelVariant: "labelLarge",
    headerVariant: "labelMedium",
  },
};

// ─── Variant resolver ─────────────────────────────────────────────────────────

function resolveVariantColors(
  theme: any,
  variant: Variant,
  active: boolean,
): { backgroundColor: string; borderColor: string; textColor: string } {
  switch (variant) {
    case "solid":
      return {
        backgroundColor: theme.colors.primary,
        borderColor: "transparent",
        textColor: theme.colors.onPrimary,
      };
    case "outline":
      return {
        backgroundColor: "transparent",
        borderColor: theme.colors.primary,
        textColor: theme.colors.primary,
      };
    case "tonal":
      return {
        backgroundColor: theme.colors.primaryContainer,
        borderColor: "transparent",
        textColor: theme.colors.onPrimaryContainer,
      };
    case "danger":
      return {
        backgroundColor: theme.colors.errorContainer ?? "#FFE4E4",
        borderColor: theme.colors.error,
        textColor: theme.colors.error,
      };
    case "success":
      return {
        backgroundColor: "rgba(34,197,94,0.12)",
        borderColor: "rgba(34,197,94,0.6)",
        textColor: "#16a34a",
      };
    case "warning":
      return {
        backgroundColor: "rgba(234,179,8,0.12)",
        borderColor: "rgba(234,179,8,0.6)",
        textColor: "#b45309",
      };
    case "ghost":
    default:
      return {
        backgroundColor: "transparent",
        borderColor: "transparent",
        textColor: active
          ? theme.colors.primary
          : theme.colors.onSurfaceVariant,
      };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ActionPill({
  label,
  sublabel,
  header,
  headerPosition = "inside-top",
  badge,

  icon,
  iconPosition = "left",
  iconSize: iconSizeProp,
  iconColor: iconColorProp,
  trailingIcon,

  variant = "ghost",
  activeVariant,
  active = false,
  disabled = false,

  size = "md",
  pill = false,
  borderRadius,
  borderWidth,
  fitContent = false,
  fullWidth = false,
  minWidth: minWidthProp,
  minHeight: minHeightProp,
  width,
  height,

  backgroundColor: backgroundColorProp,
  borderColor: borderColorProp,
  textColor: textColorProp,
  activeBackgroundColor,
  activeBorderColor,
  activeTextColor,

  paddingHorizontal: paddingHProp,
  paddingVertical: paddingVProp,
  gap: gapProp,

  labelVariant: labelVariantProp,
  headerVariant: headerVariantProp,
  sublabelVariant = "labelSmall",
  labelStyle,
  headerStyle,
  sublabelStyle,
  uppercase = false,
  letterSpacing,
  noTruncate = false,

  pressScale = 0.96,

  align = "center",

  style,
  containerStyle,

  onPress,
  onLongPress,
  onPressIn,
  onPressOut,

  accessibilityLabel,
  accessibilityHint,
  testID,
}: Props) {
  const theme = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // ── Resolve variant ───────────────────────────────────────────
  const resolvedVariant = active && activeVariant ? activeVariant : variant;
  const variantColors = resolveVariantColors(theme, resolvedVariant, active);

  // ── Merge color overrides ─────────────────────────────────────
  const finalBackgroundColor =
    active && activeBackgroundColor
      ? activeBackgroundColor
      : (backgroundColorProp ?? variantColors.backgroundColor);

  const finalBorderColor =
    active && activeBorderColor
      ? activeBorderColor
      : (borderColorProp ?? variantColors.borderColor);

  const finalTextColor =
    active && activeTextColor
      ? activeTextColor
      : (textColorProp ?? variantColors.textColor);

  const finalIconColor = iconColorProp ?? finalTextColor;

  // ── Size preset ───────────────────────────────────────────────
  const preset = SIZE_PRESETS[size];
  const finalIconSize = iconSizeProp ?? preset.iconSize;
  const finalLabelVariant = labelVariantProp ?? preset.labelVariant;
  const finalHeaderVariant = headerVariantProp ?? preset.headerVariant;
  const finalPaddingH = paddingHProp ?? preset.paddingHorizontal;
  const finalPaddingV = paddingVProp ?? preset.paddingVertical;
  const finalMinWidth = minWidthProp ?? preset.minWidth;
  const finalMinHeight = minHeightProp ?? preset.minHeight;
  const finalGap = gapProp ?? (header ? 4 : 8);

  // ── Shape ─────────────────────────────────────────────────────
  const finalBorderRadius = pill ? 999 : (borderRadius ?? 8);
  const finalBorderWidth = borderWidth ?? StyleSheet.hairlineWidth;

  // ── Press animations ──────────────────────────────────────────
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: pressScale,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
    onPressIn?.();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
    onPressOut?.();
  };

  // ── Shared text style helpers ─────────────────────────────────
  const baseTextStyle: TextStyle = {
    ...(uppercase && { textTransform: "uppercase" as const }),
    ...(letterSpacing !== undefined && { letterSpacing }),
  };

  // ── Header element ────────────────────────────────────────────
  const headerEl = (color: string) =>
    header ? (
      <Text
        variant={finalHeaderVariant}
        numberOfLines={noTruncate ? undefined : 1}
        style={[
          {
            color,
            flexShrink: noTruncate ? 1 : 0,
            flexWrap: noTruncate ? "wrap" : "nowrap",
            ...baseTextStyle,
          },
          headerStyle,
        ]}
      >
        {header}
      </Text>
    ) : null;

  // ── Label row ─────────────────────────────────────────────────
  const justifyContent =
    align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";

  const labelRow = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        justifyContent,
        flexShrink: noTruncate ? 1 : 0,
      }}
    >
      {icon && iconPosition === "left" && (
        <MaterialCommunityIcons
          name={icon}
          size={finalIconSize}
          color={finalIconColor}
        />
      )}
      <Text
        variant={finalLabelVariant}
        numberOfLines={noTruncate ? undefined : 1}
        style={[
          {
            color: finalTextColor,
            flexShrink: noTruncate ? 1 : 0,
            flexWrap: noTruncate ? "wrap" : "nowrap",
            ...baseTextStyle,
          },
          labelStyle,
        ]}
      >
        {label}
      </Text>
      {icon && iconPosition === "right" && (
        <MaterialCommunityIcons
          name={icon}
          size={finalIconSize}
          color={finalIconColor}
        />
      )}
      {trailingIcon && (
        <MaterialCommunityIcons
          name={trailingIcon}
          size={finalIconSize}
          color={finalIconColor}
        />
      )}
      {badge && (
        <View
          style={[
            Styles.badge,
            { backgroundColor: badge.backgroundColor ?? theme.colors.error },
          ]}
        >
          <Text
            variant="labelSmall"
            style={{
              color: badge.color ?? theme.colors.onError,
              fontSize: 9,
              lineHeight: 14,
            }}
          >
            {badge.value}
          </Text>
        </View>
      )}
    </View>
  );

  // ── Sublabel ──────────────────────────────────────────────────
  const sublabelEl = sublabel ? (
    <Text
      variant={sublabelVariant}
      numberOfLines={noTruncate ? undefined : 1}
      style={[
        {
          color: finalTextColor,
          opacity: 0.65,
          flexShrink: noTruncate ? 1 : 0,
          flexWrap: noTruncate ? "wrap" : "nowrap",
        },
        sublabelStyle,
      ]}
    >
      {sublabel}
    </Text>
  ) : null;

  // ── Pill inner layout ─────────────────────────────────────────
  const isVertical = header !== undefined || sublabel !== undefined;

  const alignItems =
    align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";

  const pillInner = isVertical ? (
    <View
      style={{
        flexDirection: "column",
        alignItems,
        gap: finalGap,
        flexShrink: noTruncate ? 1 : 0,
      }}
    >
      {headerPosition === "inside-top" && headerEl(finalTextColor)}
      {labelRow}
      {headerPosition === "inside-bottom" && headerEl(finalTextColor)}
      {sublabelEl}
    </View>
  ) : (
    labelRow
  );

  // ── Outside header ────────────────────────────────────────────
  const outsideTopHeader =
    header && headerPosition === "outside-top"
      ? headerEl(finalTextColor)
      : null;
  const outsideBottomHeader =
    header && headerPosition === "outside-bottom"
      ? headerEl(finalTextColor)
      : null;

  return (
    <Animated.View
      style={[
        {
          alignItems,
          opacity: disabled ? 0.4 : 1,
          transform: [{ scale: scaleAnim }],
          ...(fullWidth && { width: "100%" as any }),
        },
        containerStyle,
      ]}
    >
      {outsideTopHeader}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled, selected: active }}
        testID={testID}
        onPress={disabled ? undefined : onPress}
        onLongPress={disabled ? undefined : onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          Styles.pill,
          {
            backgroundColor: finalBackgroundColor,
            borderColor: finalBorderColor,
            borderRadius: finalBorderRadius,
            borderWidth: finalBorderWidth,
            paddingHorizontal: finalPaddingH,
            paddingVertical: finalPaddingV,
            // noTruncate: let the pill grow to fit content, no minWidth cap
            minWidth: fitContent || noTruncate ? undefined : finalMinWidth,
            minHeight: finalMinHeight,
            ...(width !== undefined && { width }),
            ...(height !== undefined && { height }),
            ...(fullWidth && { width: "100%" }),
            justifyContent,
          } as ViewStyle,
          style,
        ]}
      >
        {pillInner}
      </Pressable>
      {outsideBottomHeader}
    </Animated.View>
  );
}
