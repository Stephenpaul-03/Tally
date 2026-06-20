import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Text, type MD3Theme } from "react-native-paper";

import type { OnboardingStyles } from "../Styles";

type CheckRow = {
  icon: string;
  label: string;
};

const CHECKLIST: CheckRow[] = [
  { icon: "tag-outline", label: "Categories configured" },
  { icon: "wallet-outline", label: "Accounts set up" },
  { icon: "tune-variant", label: "Preferences saved" },
];

type Props = {
  isCompleting: boolean;
  onBegin: () => void;
  onSplashDone: () => void;
  styles: OnboardingStyles;
  theme: MD3Theme;
};

export function CompletionScreen({
  isCompleting,
  onBegin,
  onSplashDone,
  styles,
  theme,
}: Props) {
  const { width, height } = useWindowDimensions();

  const splashScale = React.useRef(new Animated.Value(0)).current;
  const splashOpacity = React.useRef(new Animated.Value(0)).current;
  const [splashVisible, setSplashVisible] = React.useState(false);
  const splashSize = Math.max(width, height) * 2.4;

  // Staggered row entrance animations
  const rowAnims = React.useRef(
    CHECKLIST.map(() => new Animated.Value(0)),
  ).current;

  React.useEffect(() => {
    Animated.stagger(
      90,
      rowAnims.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          tension: 60,
          friction: 9,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [rowAnims]);

  const playSplash = React.useCallback(
    (onDone: () => void) => {
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
    [splashOpacity, splashScale],
  );

  const handleStartTracking = React.useCallback(() => {
    // Start setup immediately — runs in parallel with the splash
    onBegin();
    playSplash(() => {
      onSplashDone();
    });
  }, [onBegin, onSplashDone, playSplash]);

  // splashSize is 2.4× the screen diagonal — centering it on screen
  // guarantees full coverage regardless of button position.
  const splashPosition = {
    left: width / 2 - splashSize / 2,
    top: height / 2 - splashSize / 2,
  };

  return (
    <View style={[s.root, styles.completeScreen]}>
      {/* ── Decorative circles ── */}
      <View
        style={[
          s.decorCircle,
          s.decorCircleTopRight,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
      />
      <View
        style={[
          s.decorCircle,
          s.decorCircleBottomLeft,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
      />

      {/* ── Content ── */}
      <View style={s.content}>
        {/* Icon */}
        <View
          style={[
            s.iconWrap,
            {
              backgroundColor: theme.colors.elevation.level2,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <MaterialCommunityIcons
            color={theme.colors.onSurface}
            name="party-popper"
            size={32}
          />
        </View>

        {/* Eyebrow + Heading */}
        <Text style={[s.eyebrow, { color: theme.colors.onSurfaceVariant }]}>
          WORKSPACE READY
        </Text>
        <Text style={[s.heading, { color: theme.colors.onSurface }]}>
          You&apos;re all set.
        </Text>
        <Text style={[s.body, { color: theme.colors.onSurfaceVariant }]}>
          Your categories, accounts, and preferences are saved. Everything can
          be changed later from Settings.
        </Text>

        {/* Checklist rows */}
        <View style={s.checklist}>
          {CHECKLIST.map((row, i) => (
            <Animated.View
              key={row.label}
              style={[
                s.checkRow,
                {
                  backgroundColor: theme.colors.elevation.level1,
                  borderColor: theme.colors.outlineVariant,
                  opacity: rowAnims[i],
                  transform: [
                    {
                      translateY: rowAnims[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [12, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <MaterialCommunityIcons
                color={theme.colors.onSurfaceVariant}
                name={row.icon as any}
                size={16}
              />
              <Text
                style={[s.checkLabel, { color: theme.colors.onSurfaceVariant }]}
              >
                {row.label}
              </Text>
              <MaterialCommunityIcons
                color={theme.colors.primary}
                name="check"
                size={15}
              />
            </Animated.View>
          ))}
        </View>

        {/* CTA button */}
        <Pressable
          disabled={isCompleting}
          onPress={handleStartTracking}
          style={({ pressed }) => [
            s.cta,
            {
              backgroundColor: theme.colors.primary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text
            style={[
              s.ctaText,
              {
                color: isCompleting
                  ? theme.colors.onSurfaceVariant
                  : theme.colors.surface,
              },
            ]}
          >
            {isCompleting ? "Setting up…" : "Start tracking"}
          </Text>
          {!isCompleting && (
            <MaterialCommunityIcons
              color={theme.colors.surface}
              name="arrow-right"
              size={17}
            />
          )}
        </Pressable>

        {/* Support note */}
        <Text style={[s.support, { color: theme.colors.onSurfaceVariant }]}>
          Enjoying the app? You can find the Buy Me a Coffee link in{" "}
          <Text style={{ color: theme.colors.onSurface }}>About</Text>.
        </Text>
      </View>

      {/* ── Splash — Modal escapes SafeAreaView/ScrollView/KeyboardAvoidingView ── */}
      <Modal
        animationType="none"
        onRequestClose={() => {}}
        statusBarTranslucent
        transparent
        visible={splashVisible}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            s.splash,
            {
              width: splashSize,
              height: splashSize,
              borderRadius: splashSize / 2,
              backgroundColor: theme.colors.primary,
              opacity: splashOpacity,
              transform: [{ scale: splashScale }],
              left: splashPosition.left,
              top: splashPosition.top,
            },
          ]}
        />
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
  },
  decorCircle: {
    position: "absolute",
    borderRadius: 9999,
    opacity: 0.5,
  },
  decorCircleTopRight: {
    width: 200,
    height: 200,
    top: -50,
    right: -50,
  },
  decorCircleBottomLeft: {
    width: 240,
    height: 240,
    bottom: -70,
    left: -60,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  heading: {
    fontSize: 28,
    fontWeight: "500",
    marginBottom: 10,
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
    marginBottom: 28,
  },
  checklist: {
    width: "100%",
    gap: 8,
    marginBottom: 28,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  checkLabel: {
    flex: 1,
    fontSize: 13,
  },
  cta: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 100,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: "500",
  },
  support: {
    marginTop: 20,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    maxWidth: 260,
  },
  splash: {
    position: "absolute",
  },
});
