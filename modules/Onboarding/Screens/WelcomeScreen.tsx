import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  useWindowDimensions,
  View,
} from "react-native";
import { Text, type MD3Theme } from "react-native-paper";

import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { StaggeredItems } from "../Components/StaggeredItems";
import { APP_NAME } from "../Constants";
import type { OnboardingStyles } from "../Styles";

const LOGO_SOURCE = require("../../../assets/images/icon.png");

const TRUST_PILLS = [
  { label: "Private", icon: "lock-outline" },
  { label: "Offline", icon: "cloud-off-outline" },
  { label: "No ads", icon: "star-outline" },
] as const;

type Props = {
  styles: OnboardingStyles;
  theme: MD3Theme;
  onContinue: () => void;
};

export function WelcomeScreen({ styles, theme, onContinue }: Props) {
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

  const handleContinue = React.useCallback(() => {
    playSplash(() => onContinue());
  }, [onContinue, playSplash]);

  const buttonCenter = buttonLayout
    ? {
        left: buttonLayout.x + buttonLayout.width / 2 - splashSize / 2,
        top: buttonLayout.y + buttonLayout.height / 2 - splashSize / 2,
      }
    : { left: "50%" as const, top: "72%" as const };

  return (
    <View style={styles.welcomeScreen}>
      <View style={styles.welcomeStack}>
        <Image
          source={LOGO_SOURCE}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.eyebrow}>Simple money tracking</Text>
        <Text style={styles.title}>Welcome to {APP_NAME}</Text>
        <Text style={styles.description}>Track your money, your way.</Text>

        <StaggeredItems
          contentContainerStyle={styles.welcomePillRow}
          dataKey="welcome-pills"
        >
          {TRUST_PILLS.map((pill) => (
            <View key={pill.label} style={styles.trustPill}>
              <MaterialCommunityIcons
                color={theme.colors.primary}
                name={pill.icon}
                size={15}
              />
              <Text style={styles.trustPillText}>{pill.label}</Text>
            </View>
          ))}
        </StaggeredItems>

        <View style={styles.buttonShell}>
          <Pressable
            onLayout={(event) => setButtonLayout(event.nativeEvent.layout)}
            onPress={handleContinue}
            style={styles.ghostButton}
          >
            <Text style={styles.ghostButtonText}>{"Let's Go"}</Text>
            <MaterialCommunityIcons
              color={theme.colors.primary}
              name="arrow-right"
              size={18}
            />
          </Pressable>
        </View>
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
              ...buttonCenter,
            },
          ]}
        />
      ) : null}
    </View>
  );
}
