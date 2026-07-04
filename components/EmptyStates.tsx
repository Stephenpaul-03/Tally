import { useFadeSlide } from "@/components/animations/UseFadeSlide";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

interface Props {
  icon: string;
  title: string;
  subtitle: string;
  hint?: string;
  hintIcon?: string;
  onHintPress?: () => void;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  hint,
  hintIcon = "plus-circle-outline",
  onHintPress,
}: Props) {
  const theme = useTheme();

  // ── Entrance animations (staggered via delay) ──────────────────────────────
  const { animStyle: iconAnim, slideIn: slideIcon } = useFadeSlide({
    from: "bottom",
    distance: 16,
    duration: 600,
    delay: 0,
    autoPlay: false,
  });
  const { animStyle: textAnim, slideIn: slideText } = useFadeSlide({
    from: "bottom",
    distance: 16,
    duration: 600,
    delay: 150,
    autoPlay: false,
  });
  const { animStyle: hintAnim, slideIn: slideHint } = useFadeSlide({
    from: "bottom",
    distance: 16,
    duration: 600,
    delay: 300,
    autoPlay: false,
  });

  // ── Pulse animation ────────────────────────────────────────────────────────
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    slideIcon();
    slideText();
    slideHint();

    let cancelled = false;

    const breathe = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.92,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished && !cancelled) breathe();
      });
    };

    breathe();

    return () => {
      cancelled = true;
      pulseAnim.stopAnimation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      {/* Icon */}
      <Animated.View style={iconAnim}>
        <View style={styles.iconRingOuter}>
          <Animated.View
            style={[
              styles.iconPulse,
              {
                backgroundColor: theme.colors.primary,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
          <View
            style={[
              styles.iconBubble,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <MaterialCommunityIcons
              name={icon as any}
              size={32}
              color={theme.colors.onPrimary}
            />
          </View>
        </View>
      </Animated.View>

      {/* Text */}
      <Animated.View style={[styles.textBlock, textAnim]}>
        <Text
          variant="titleMedium"
          style={[
            typography.editorial.sectionLabel,
            { color: theme.colors.onSurface, fontSize: 20 },
          ]}
        >
          {title}
        </Text>
        <Text
          variant="bodyMedium"
          {...{ style: [styles.subtitle, { color: theme.colors.outline }] }}
        >
          {subtitle}
        </Text>
      </Animated.View>

      {/* Hint */}
      {hint && (
        <Animated.View style={[styles.hintWrapper, hintAnim]}>
          <TouchableOpacity
            onPress={onHintPress}
            disabled={!onHintPress}
            activeOpacity={onHintPress ? 0.6 : 1}
            style={[
              styles.hintCard,
              {
                borderColor: theme.colors.outlineVariant,
                backgroundColor: theme.colors.surfaceVariant,
              },
            ]}
          >
            <View style={styles.hintRow}>
              <View
                style={[
                  styles.hintIconBubble,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <MaterialCommunityIcons
                  name={hintIcon as any}
                  size={18}
                  color={theme.colors.onPrimary}
                />
              </View>
              <Text
                variant="bodySmall"
                style={[
                  styles.hintText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {hint}
              </Text>
              {onHintPress && (
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={18}
                  color={theme.colors.onSurfaceVariant}
                  style={styles.hintChevron}
                />
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 24,
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  iconRingOuter: {
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
  },
  iconPulse: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    opacity: 0.3,
  },
  iconBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    alignItems: "center",
    gap: 8,
  },
  subtitle: {
    textAlign: "center",
    lineHeight: 22,
    fontSize: 15,
  },
  hintWrapper: {
    alignSelf: "stretch",
    marginTop: 4,
  },
  hintCard: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  hintIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  hintText: {
    flex: 1,
    flexShrink: 1,
    lineHeight: 20,
  },
  hintChevron: {
    flexShrink: 0,
  },
});
