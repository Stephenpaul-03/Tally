import { SheetCard } from "@/components/SheetCard";
import { ActionRow } from "@/components/ActionRow";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { TextInput, Switch, useTheme } from "react-native-paper";
import { useOnboarding } from "../OnboardingContext";
import type { OnboardingStackParamList } from "../OnboardingScreen";
import { OnboardingLayout, StepIntro } from "./OnboardingLayout";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Budget">;

export function BudgetScreen({ navigation }: Props) {
  const theme = useTheme();
  const onboarding = useOnboarding();

  return (
    <OnboardingLayout routeName="Budget" navigation={navigation}>
      <StepIntro
        icon="wallet-plus-outline"
        title="Set a monthly limit"
        text="Optional, but useful if you already know the ceiling you want for this workspace."
      />
      <SheetCard theme={theme}>
        <ActionRow
          icon="wallet-plus-outline"
          label="Monthly budget"
          description="Track spending against a workspace-level limit"
          onPress={() => onboarding.setBudgetEnabled(!onboarding.budgetEnabled)}
          showChevron={false}
          theme={theme}
          rightElement={
            <Switch
              value={onboarding.budgetEnabled}
              onValueChange={onboarding.setBudgetEnabled}
            />
          }
        />
      </SheetCard>
      {onboarding.budgetEnabled ? (
        <TextInput
          keyboardType="numeric"
          label="Monthly budget"
          left={<TextInput.Affix text="₹" />}
          mode="outlined"
          onChangeText={onboarding.setBudgetInput}
          value={onboarding.budgetInput}
        />
      ) : null}
    </OnboardingLayout>
  );
}
