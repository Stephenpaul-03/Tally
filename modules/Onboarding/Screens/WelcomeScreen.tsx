import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useOnboarding } from "../OnboardingContext";
import type { OnboardingStackParamList } from "../OnboardingScreen";
import { OnboardingLayout } from "./OnboardingLayout";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Welcome">;

export function WelcomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { isFirstRun } = useOnboarding();
  const intro = React.useRef(new Animated.Value(0)).current;
  const cardProgress = React.useRef(new Animated.Value(0)).current;
  const shimmer = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(intro, {
        duration: 680,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(220),
        Animated.timing(cardProgress, {
          duration: 760,
          easing: Easing.out(Easing.cubic),
          toValue: 1,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          duration: 1900,
          easing: Easing.inOut(Easing.quad),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          duration: 1900,
          easing: Easing.inOut(Easing.quad),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [cardProgress, intro, shimmer]);

  const introStyle = {
    opacity: intro,
    transform: [
      {
        translateY: intro.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
      {
        scale: intro.interpolate({
          inputRange: [0, 1],
          outputRange: [0.96, 1],
        }),
      },
    ],
  };

  const cardStyle = {
    opacity: cardProgress,
    transform: [
      {
        translateY: cardProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [26, 0],
        }),
      },
    ],
  };

  const shimmerStyle = {
    transform: [
      {
        translateX: shimmer.interpolate({
          inputRange: [0, 1],
          outputRange: [-width * 0.18, width * 0.18],
        }),
      },
    ],
  };

  return (
    <OnboardingLayout routeName="Welcome" navigation={navigation}>
      <Animated.View style={[styles.hero, introStyle]}>
        <View
          style={[
            styles.logoHalo,
            {
              backgroundColor: theme.colors.elevation.level1,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <Image
            source={require("../../../assets/images/icon-foreground-Gold.png")}
            style={styles.logo}
          />
        </View>
        <Text
          style={{
            color: theme.colors.onSurface,
            fontSize: 36,
            fontWeight: "900",
            lineHeight: 41,
            textAlign: "center",
          }}
        >
          {isFirstRun
            ? "Private money tracking, ready in a minute."
            : "Set up this workspace your way."}
        </Text>
        <Text
          style={{
            color: theme.colors.onSurfaceVariant,
            fontSize: 15,
            lineHeight: 22,
            textAlign: "center",
          }}
        >
          No account. No cloud dependency. Just a fast local workspace for the
          money you actually want to track.
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.previewCard,
          {
            backgroundColor: theme.colors.elevation.level1,
            borderColor: theme.colors.outlineVariant,
          },
          cardStyle,
        ]}
      >
        <View style={styles.previewHeader}>
          <View>
            <Text
              style={[styles.previewEyebrow, { color: theme.colors.primary }]}
            >
              LOCAL WORKSPACE
            </Text>
            <Text
              style={[styles.previewTitle, { color: theme.colors.onSurface }]}
            >
              Personal
            </Text>
          </View>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: `${theme.colors.primary}18` },
            ]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: theme.colors.primary }]}
            />
            <Text style={[styles.statusText, { color: theme.colors.primary }]}>
              Offline
            </Text>
          </View>
        </View>

        <View style={styles.amountRow}>
          <Text style={[styles.amountLabel, { color: theme.colors.onSurfaceVariant }]}>
            This month
          </Text>
          <Text style={[styles.amount, { color: theme.colors.onSurface }]}>
            ₹42,860
          </Text>
        </View>

        <View
          style={[
            styles.progressTrack,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: theme.colors.primary },
              shimmerStyle,
            ]}
          />
        </View>

        <View style={styles.miniGrid}>
          <Metric
            label="Accounts"
            value="4"
            icon="wallet-outline"
            color="#0EA5E9"
          />
          <Metric
            label="Categories"
            value="18"
            icon="tag-multiple-outline"
            color="#22C55E"
          />
          <Metric
            label="Budget"
            value="Set"
            icon="wallet-plus-outline"
            color="#F59E0B"
          />
        </View>
      </Animated.View>

      <View style={styles.promiseGrid}>
        <Promise
          icon="database-lock-outline"
          title="Private by default"
          text="Your finance data starts and stays on this device."
        />
        <Promise
          icon="briefcase-outline"
          title="Workspace ready"
          text="Separate personal, family, work, or travel money."
        />
        <Promise
          icon="flash-outline"
          title="Fast capture"
          text="Defaults make the first transaction feel already prepared."
        />
      </View>
    </OnboardingLayout>
  );
}

function Metric({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.metric,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <Text style={[styles.metricValue, { color: theme.colors.onSurface }]}>
        {value}
      </Text>
      <View style={styles.metricFooter}>
        <ImageIcon name={icon} color={color} />
        <Text
          numberOfLines={1}
          style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

function Promise({
  icon,
  title,
  text,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  title: string;
  text: string;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.promise,
        {
          backgroundColor: theme.colors.elevation.level1,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <ImageIcon name={icon} color={theme.colors.primary} />
      <View style={styles.promiseText}>
        <Text style={[styles.promiseTitle, { color: theme.colors.onSurface }]}>
          {title}
        </Text>
        <Text
          style={[styles.promiseBody, { color: theme.colors.onSurfaceVariant }]}
        >
          {text}
        </Text>
      </View>
    </View>
  );
}

function ImageIcon({
  name,
  color,
}: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
}) {
  return <MaterialCommunityIcons name={name} size={18} color={color} />;
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    gap: 14,
    paddingTop: 20,
  },
  logoHalo: {
    alignItems: "center",
    borderRadius: 30,
    borderWidth: 0.5,
    height: 92,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    width: 92,
  },
  logo: {
    height: 74,
    resizeMode: "contain",
    width: 74,
  },
  previewCard: {
    borderRadius: 24,
    borderWidth: 0.5,
    gap: 18,
    marginTop: 12,
    overflow: "hidden",
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { height: 14, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 26,
  },
  previewHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  previewEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    lineHeight: 14,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24,
  },
  statusPill: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusDot: {
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
  },
  amountRow: {
    gap: 4,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  amount: {
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 38,
  },
  progressTrack: {
    borderRadius: 999,
    height: 9,
    overflow: "hidden",
  },
  progressFill: {
    borderRadius: 999,
    height: 9,
    width: "68%",
  },
  miniGrid: {
    flexDirection: "row",
    gap: 10,
  },
  metric: {
    borderRadius: 16,
    borderWidth: 0.5,
    flex: 1,
    gap: 10,
    minHeight: 82,
    padding: 12,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 22,
  },
  metricFooter: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },
  metricLabel: {
    flex: 1,
    fontSize: 10,
    fontWeight: "700",
  },
  promiseGrid: {
    gap: 10,
  },
  promise: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 0.5,
    flexDirection: "row",
    gap: 12,
    minHeight: 76,
    padding: 14,
  },
  promiseText: {
    flex: 1,
    gap: 3,
  },
  promiseTitle: {
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 18,
  },
  promiseBody: {
    fontSize: 12,
    lineHeight: 17,
  },
});
