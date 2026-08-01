import { ActionRow } from "@/components/ActionRow";
import { SheetCard } from "@/components/SheetCard";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { Switch, useTheme } from "react-native-paper";
import { useOnboarding } from "../OnboardingContext";
import type { OnboardingStackParamList } from "../OnboardingScreen";
import { OnboardingLayout, StepIntro } from "./OnboardingLayout";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Privacy">;

export function PrivacyScreen({ navigation }: Props) {
  const theme = useTheme();
  const onboarding = useOnboarding();

  return (
    <OnboardingLayout
      loading={onboarding.saving}
      nextLabel="Finish"
      onNext={() => void onboarding.finish()}
      routeName="Privacy"
      navigation={navigation}
    >
      <StepIntro
        icon="shield-lock-outline"
        title="Privacy and reminders"
        text="Tally works fully offline. These controls are only here to make the habit easier and the app more private."
      />
      <SheetCard theme={theme}>
        <ActionRow
          icon="shield-lock-outline"
          label={
            onboarding.biometricAvailable
              ? "Biometric lock"
              : "Biometric lock unavailable"
          }
          description="Require Face ID, fingerprint, or device fallback"
          onPress={() =>
            onboarding.biometricAvailable &&
            onboarding.setPrivacyEnabled(!onboarding.privacyEnabled)
          }
          showChevron={false}
          theme={theme}
          rightElement={
            <Switch
              disabled={!onboarding.biometricAvailable}
              value={onboarding.privacyEnabled}
              onValueChange={onboarding.setPrivacyEnabled}
            />
          }
        />
        <ActionRow
          icon="bell-outline"
          label="Daily reminder"
          description="Get a nudge to log expenses"
          onPress={() =>
            onboarding.setRemindersEnabled(!onboarding.remindersEnabled)
          }
          showChevron={false}
          theme={theme}
          rightElement={
            <Switch
              value={onboarding.remindersEnabled}
              onValueChange={onboarding.setRemindersEnabled}
            />
          }
        />
      </SheetCard>
    </OnboardingLayout>
  );
}
