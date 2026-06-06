import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  Animated,
  Easing,
  Pressable,
  useWindowDimensions,
  View,
} from "react-native";
import { Text, type MD3Theme } from "react-native-paper";

import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import type { OnboardingStyles } from "../Styles";

type Props = {
  isCompleting: boolean;
  onStartTracking: () => void;
  styles: OnboardingStyles;
  theme: MD3Theme;
};

export function CompletionScreen({
  isCompleting,
  onStartTracking,
  styles,
  theme,
}: Props) {
  const { animationsEnabled } = useAddonPrefs();
  const { width, height } = useWindowDimensions();
  const [buttonLayout, setButtonLayout] = React.useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const splashScale = React.useRef(new Animated.Value(0)).current;
  const splashOpacity = React.useRef(new Animated.Value(0)).current;
  const [splashVisible, setSplashVisible] = React.useState(false);
  const splashSize = Math.max(width, height) * 2.4;

  const playSplash = React.useCallback(
    (onDone: () => void) => {
      if (!animationsEnabled) {
        onDone();
        return;
      }

      setSplashVisible(true);
      splashScale.setValue(0);
      splashOpacity.setValue(1);

      Animated.timing(splashScale, {
        toValue: 1,
        duration: 750,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onDone();
        Animated.timing(splashOpacity, {
          toValue: 0,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start(() => setSplashVisible(false));
      });
    },
    [animationsEnabled, splashOpacity, splashScale],
  );

  const handleStartTracking = React.useCallback(() => {
    playSplash(() => {
      void onStartTracking();
    });
  }, [onStartTracking, playSplash]);

  const splashPosition = buttonLayout
    ? {
        left: buttonLayout.x + buttonLayout.width / 2 - splashSize / 2,
        top: buttonLayout.y + buttonLayout.height / 2 - splashSize / 2,
      }
    : { left: "50%" as const, top: "58%" as const };

  return (
    <View style={styles.completeScreen}>
      <View style={styles.heroStack}>
        <View style={styles.completeIconWrap}>
          <MaterialCommunityIcons
            color={theme.colors.primary}
            name="check-decagram"
            size={60}
            style={styles.completeIcon}
          />
        </View>
        <Text style={styles.title}>{"You're all set!"}</Text>
        <Text style={styles.description}>
          Your workspace is ready. You can change any of these settings later.
        </Text>
        <View style={styles.buttonShell}>
          <Pressable
            disabled={isCompleting}
            onLayout={(event) => setButtonLayout(event.nativeEvent.layout)}
            onPress={handleStartTracking}
            style={[
              styles.ghostButton,
              isCompleting && styles.disabledGhostButton,
            ]}
          >
            <Text style={styles.ghostButtonText}>
              {isCompleting ? "Setting up..." : "Start Tracking"}
            </Text>
            <MaterialCommunityIcons
              color={theme.colors.primary}
              name="arrow-right"
              size={18}
            />
          </Pressable>
        </View>
        <Text style={styles.supportText}>
          {
            "If you'd like to support development, you can find my Buy Me a Coffee link in About."
          }
        </Text>
      </View>

      {splashVisible ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.splash,
            {
              height: splashSize,
              width: splashSize,
              borderRadius: splashSize / 2,
              opacity: splashOpacity,
              transform: [{ scale: splashScale }],
              backgroundColor: theme.colors.primary,
              ...splashPosition,
            },
          ]}
        />
      ) : null}
    </View>
  );
}
