import { WorkspaceEditScreen } from "@/modules/Settings/Screens/WorkspaceEditScreen";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { Button, useTheme } from "react-native-paper";
import { useOnboarding } from "../OnboardingContext";
import type { OnboardingStackParamList } from "../OnboardingScreen";
import { getNextRoute } from "./OnboardingLayout";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Workspace">;

export function WorkspaceScreen({ navigation }: Props) {
  const theme = useTheme();
  const onboarding = useOnboarding();
  const nextRoute = getNextRoute("Workspace");

  return (
    <WorkspaceEditScreen
      background={theme.colors.background}
      canSubmit={onboarding.workspaceName.trim().length > 0}
      footer={
        <Button
          mode="contained"
          onPress={() => nextRoute && navigation.navigate(nextRoute as never)}
        >
          Continue
        </Button>
      }
      headerSubtitle="Onboarding"
      isEditing
      onBack={() => navigation.goBack()}
      onChangeColor={onboarding.setWorkspaceColor}
      onChangeIcon={onboarding.setWorkspaceIcon}
      onChangeName={onboarding.setWorkspaceName}
      onSubmit={() => nextRoute && navigation.navigate(nextRoute as never)}
      showHeader
      theme={theme}
      workspaceColor={onboarding.workspaceColor}
      workspaceIcon={onboarding.workspaceIcon}
      workspaceName={onboarding.workspaceName}
    />
  );
}
