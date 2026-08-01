import { MaterialCommunityIcons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import type { OnboardingStackParamList } from "../OnboardingScreen";

export const ONBOARDING_ORDER: (keyof OnboardingStackParamList)[] = [
  "Welcome",
  "Appearance",
  "Workspace",
  "Accounts",
  "IncomeCategories",
  "ExpenseCategories",
  "Budget",
  "Defaults",
  "Privacy",
];

const TITLES: Record<string, string> = {
  Welcome: "Welcome",
  Appearance: "Appearance",
  Workspace: "Workspace",
  Accounts: "Accounts",
  IncomeCategories: "Income",
  ExpenseCategories: "Expenses",
  Budget: "Budget",
  Defaults: "Defaults",
  Privacy: "Privacy",
};

type Props = {
  routeName: keyof OnboardingStackParamList;
  navigation: NativeStackNavigationProp<OnboardingStackParamList, any>;
  children: React.ReactNode;
  nextLabel?: string;
  onNext?: () => void;
  canContinue?: boolean;
  loading?: boolean;
  scroll?: boolean;
};

export function getNextRoute(routeName: keyof OnboardingStackParamList) {
  const index = ONBOARDING_ORDER.indexOf(routeName);
  return ONBOARDING_ORDER[index + 1] ?? null;
}

export function OnboardingLayout({
  routeName,
  navigation,
  children,
  nextLabel,
  onNext,
  canContinue = true,
  loading = false,
  scroll = true,
}: Props) {
  const theme = useTheme();
  const index = ONBOARDING_ORDER.indexOf(routeName);
  const nextRoute = getNextRoute(routeName);
  const title = TITLES[routeName] ?? "Onboarding";
  const handleNext = () => {
    if (onNext) {
      onNext();
      return;
    }
    if (nextRoute) navigation.navigate(nextRoute as never);
  };
  const content = (
    <View style={styles.content}>
      {children}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <Button
          compact
          disabled={index <= 0}
          mode="text"
          onPress={() => navigation.goBack()}
        >
          Back
        </Button>
        <View style={styles.headerCenter}>
          <Text style={[styles.kicker, { color: theme.colors.primary }]}>
            {Math.max(index, 0) + 1} of {ONBOARDING_ORDER.length}
          </Text>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            {title}
          </Text>
        </View>
        {nextRoute ? (
          <Button compact mode="text" onPress={() => navigation.navigate(nextRoute as never)}>
            Skip
          </Button>
        ) : (
          <View style={styles.skipPlaceholder} />
        )}
      </View>
      <View
        style={[
          styles.progressTrack,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: theme.colors.primary,
              width: `${((Math.max(index, 0) + 1) / ONBOARDING_ORDER.length) * 100}%`,
            },
          ]}
        />
      </View>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
      <View style={styles.footer}>
        <Button
          disabled={!canContinue || loading}
          loading={loading}
          mode="contained"
          onPress={handleNext}
        >
          {nextLabel ?? (nextRoute ? "Continue" : "Finish")}
        </Button>
      </View>
    </SafeAreaView>
  );
}

export function StepIntro({
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
    <View style={styles.intro}>
      <View
        style={[styles.introIcon, { backgroundColor: theme.colors.primary }]}
      >
        <MaterialCommunityIcons name={icon} size={24} color={theme.colors.onPrimary} />
      </View>
      <View style={styles.introText}>
        <Text style={[styles.introTitle, { color: theme.colors.onSurface }]}>
          {title}
        </Text>
        <Text style={[styles.introBody, { color: theme.colors.onSurfaceVariant }]}>
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  headerCenter: {
    alignItems: "center",
    flex: 1,
  },
  kicker: {
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 14,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24,
  },
  skipPlaceholder: {
    width: 64,
  },
  progressTrack: {
    borderRadius: 999,
    height: 3,
    marginHorizontal: 20,
    marginTop: 14,
    overflow: "hidden",
  },
  progressFill: {
    borderRadius: 999,
    height: 3,
  },
  scrollContent: {
    paddingBottom: 108,
  },
  content: {
    flex: 1,
    gap: 18,
    padding: 20,
  },
  footer: {
    bottom: 0,
    left: 0,
    padding: 20,
    position: "absolute",
    right: 0,
  },
  intro: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
  },
  introIcon: {
    alignItems: "center",
    borderRadius: 16,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  introText: {
    flex: 1,
    gap: 4,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 26,
  },
  introBody: {
    fontSize: 13,
    lineHeight: 18,
  },
});
