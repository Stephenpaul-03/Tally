import { AppearanceSection } from "@/modules/Settings/Components/AppearanceSection";
import { useSettings } from "@/modules/Settings/hooks";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import type { OnboardingStackParamList } from "../OnboardingScreen";
import { OnboardingLayout, StepIntro } from "./OnboardingLayout";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Appearance">;

export function AppearanceScreen({ navigation }: Props) {
  const settings = useSettings();

  return (
    <OnboardingLayout routeName="Appearance" navigation={navigation}>
      <StepIntro
        icon="palette-outline"
        title="Make Tally feel familiar"
        text="Choose the main theme and accent now. The full Appearance settings stay available later."
      />
      <AppearanceSection
        activeModeId={settings.activeModeId}
        onModeSelect={settings.handleModeSelect}
        onThemeSelect={settings.setThemeId}
        onTrueBlackChange={settings.setTrueBlack}
        themeId={settings.themeId}
        themeOptions={settings.themeOptions}
        trueBlack={settings.trueBlack}
      />
    </OnboardingLayout>
  );
}
