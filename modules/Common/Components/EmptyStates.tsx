import { useFadeSlide } from "@/components/animations/UseFadeSlide";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect } from "react";
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
  const { animStyle, slideIn } = useFadeSlide({
    from: "bottom",
    distance: 20,
    duration: 750,
    delay: 450,
    autoPlay: false,
  });

  useEffect(() => {
    slideIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={[styles.container, animStyle]}>
      <View style={[styles.iconWrapper, { shadowColor: theme.colors.primary }]}>
        <MaterialCommunityIcons
          name={icon as any}
          size={72}
          color={theme.colors.primary}
        />
      </View>

      <View style={styles.textBlock}>
        <Text
          variant="titleMedium"
          style={[
            typography.editorial.sectionLabel,
            { color: theme.colors.onSurface, fontSize: 22 },
          ]}
        >
          {title}
        </Text>
        <Text
          variant="bodyMedium"
          style={{
            color: theme.colors.outline,
            textAlign: "center",
            lineHeight: 22,
            fontSize: 16,
          }}
        >
          {subtitle}
        </Text>
      </View>

      {hint && (
        <TouchableOpacity
          onPress={onHintPress}
          disabled={!onHintPress}
          activeOpacity={onHintPress ? 0.6 : 1}
          style={[
            styles.hintCard,
            {
              borderColor: theme.colors.outlineVariant,
              backgroundColor: theme.colors.background,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={hintIcon as any}
            size={22}
            color={theme.colors.primary}
            style={styles.hintIcon}
          />
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.outline, flexShrink: 1 }}
          >
            {hint}
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 24,
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  iconWrapper: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 6,
  },
  textBlock: {
    alignItems: "center",
    gap: 8,
  },
  hintCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    width: "100%",
    marginTop: 4,
  },
  hintIcon: {
    flexShrink: 0,
  },
});
