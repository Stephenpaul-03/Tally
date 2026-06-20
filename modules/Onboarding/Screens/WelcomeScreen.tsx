import { useThemedAsset } from "@/hooks/use-themed-insights";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
    Animated,
    Easing,
    Image,
    Pressable,
    StyleSheet,
    View,
} from "react-native";
import { Text, type MD3Theme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Defs, Pattern, Rect } from "react-native-svg";
import { StaggeredItems } from "../Components/StaggeredItems";
import type { OnboardingStyles } from "../Styles";

const TRUST_PILLS = [
  { label: "Private", icon: "lock-outline" },
  { label: "Offline", icon: "wifi-off" },
  { label: "No ads", icon: "minus-circle-off-outline" },
] as const;

export type SplashOrigin = { x: number; y: number };

type Props = {
  styles: OnboardingStyles;
  theme: MD3Theme;
  onContinue: (origin: SplashOrigin) => void;
};

export function WelcomeScreen({ styles, theme, onContinue }: Props) {
  const buttonRef = React.useRef<View>(null);
  const blobOpacity = React.useRef(new Animated.Value(0.13)).current;
  const LOGO_SOURCE = useThemedAsset("logo");
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blobOpacity, {
          toValue: 0.22,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(blobOpacity, {
          toValue: 0.13,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [blobOpacity]);

  // Measure the button center and hand it straight to the parent.
  // The parent owns the ripple — no local splash animation here.
  const handleContinue = React.useCallback(() => {
    buttonRef.current?.measureInWindow((x, y, btnWidth, btnHeight) => {
      onContinue({
        x: x + btnWidth / 2,
        y: y + btnHeight / 2,
      });
    });
  }, [onContinue]);

  const primary = theme.colors.primary;

  return (
    <View style={[s.screen, { backgroundColor: theme.colors.surface }]}>
      <Svg
        style={StyleSheet.absoluteFill}
        width="100%"
        height="100%"
        pointerEvents="none"
      >
        <Defs>
          <Pattern
            id="dots"
            x="0"
            y="0"
            width="22"
            height="22"
            patternUnits="userSpaceOnUse"
          >
            <Circle cx="2" cy="2" r="1.1" fill={primary} opacity="0.18" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#dots)" />
      </Svg>

      <Animated.View
        pointerEvents="none"
        style={[
          s.blob,
          s.blobTL,
          { backgroundColor: primary, opacity: blobOpacity },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          s.blob,
          s.blobBR,
          { backgroundColor: primary, opacity: blobOpacity },
        ]}
      />

      <SafeAreaView style={s.safeArea}>
        <View style={s.centerBlock}>
          <StaggeredItems dataKey="logo">
            <View
              style={[
                s.logoWrap,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outline,
                },
              ]}
            >
              <Image
                source={LOGO_SOURCE}
                style={s.logoImage}
                resizeMode="contain"
              />
            </View>
          </StaggeredItems>

          <StaggeredItems dataKey="copy" contentContainerStyle={s.copyBlock}>
            <Text
              style={[s.eyebrow, { color: primary }]}
              accessibilityRole="text"
            >
              Simple money tracking
            </Text>
            <Text
              style={[s.headline, { color: theme.colors.onSurface }]}
              accessibilityRole="header"
            >
              {"Your money,\nyour peace of mind."}
            </Text>
            <Text style={[s.body, { color: theme.colors.onSurfaceVariant }]}>
              Stay on top of spending without the stress. Private, offline, and
              always yours.
            </Text>
          </StaggeredItems>

          <StaggeredItems
            contentContainerStyle={s.pillRow}
            dataKey="welcome-pills"
          >
            {TRUST_PILLS.map((pill) => (
              <View
                key={pill.label}
                style={[
                  s.pill,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.outline,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  color={primary}
                  name={pill.icon}
                  size={14}
                />
                <Text
                  style={[s.pillText, { color: theme.colors.onSurfaceVariant }]}
                >
                  {pill.label}
                </Text>
              </View>
            ))}
          </StaggeredItems>
        </View>

        <View style={s.ctaBlock}>
          <Pressable
            ref={buttonRef}
            onPress={handleContinue}
            style={({ pressed }) => [
              s.ctaButton,
              { backgroundColor: primary, opacity: pressed ? 0.88 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Get started"
          >
            <Text style={s.ctaText}>{"Let's go"}</Text>
            <MaterialCommunityIcons color="#fff" name="arrow-right" size={18} />
          </Pressable>

          <Text style={[s.subtext, { color: theme.colors.onSurfaceVariant }]}>
            No sign-up · No cloud · Just you
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, overflow: "hidden" },
  blob: { position: "absolute", borderRadius: 9999 },
  blobTL: { width: 280, height: 280, top: -90, left: -90 },
  blobBR: { width: 220, height: 220, bottom: -70, right: -70 },
  safeArea: { flex: 1, paddingHorizontal: 28, paddingBottom: 24 },
  centerBlock: { flex: 1, justifyContent: "center" },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 0.5,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  logoImage: { width: 52, height: 52 },
  copyBlock: { marginBottom: 28, gap: 8 },
  eyebrow: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 1,
    textTransform: "uppercase",
    opacity: 0.85,
    marginBottom: 4,
  },
  headline: {
    fontSize: 30,
    fontWeight: "500",
    lineHeight: 37,
    marginBottom: 10,
  },
  body: { fontSize: 15, lineHeight: 24 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 13,
    borderRadius: 999,
    borderWidth: 0.5,
  },
  pillText: { fontSize: 12 },
  ctaBlock: { gap: 12 },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 100,
  },
  ctaText: { fontSize: 16, fontWeight: "500", color: "#fff" },
  subtext: { fontSize: 12, textAlign: "center", opacity: 0.6 },
});
