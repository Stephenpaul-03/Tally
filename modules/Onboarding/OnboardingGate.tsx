import { useOnboardingTour } from "./SpotlightTour";
import { flushPendingNavigationTargets } from "@/navigation/RootNavigation";
import { workspaceRepository } from "@/modules/Core/Repository/Index";
import type { RootParamList } from "@/navigation/types";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Text, useTheme } from "react-native-paper";

type Props = NativeStackScreenProps<RootParamList, "OnboardingGate">;

export function OnboardingGate({ navigation }: Props) {
  const theme = useTheme();
  const { resume } = useOnboardingTour();
  const [error, setError] = React.useState(false);
  const [attempt, setAttempt] = React.useState(0);
  React.useEffect(() => {
    let current = true;
    setError(false);
    Promise.all([workspaceRepository.isOnboardingComplete(), workspaceRepository.getOnboardingTourProgress()]).then(([complete, progress]) => {
      if (current) {
        if (complete && progress !== null) resume(progress);
        navigation.replace(complete ? "Transactions" : "Onboarding");
        if (complete) requestAnimationFrame(flushPendingNavigationTargets);
      }
    }).catch(() => { if (current) setError(true); });
    return () => { current = false; };
  }, [navigation, attempt, resume]);
  return (
    <View style={[s.root, { backgroundColor: theme.colors.background }]}>
      {error ? <>
        <Text>Couldn’t open Tally. Try again.</Text>
        <Button onPress={() => setAttempt(value => value + 1)}>Try again</Button>
      </> : <ActivityIndicator accessibilityLabel="Opening Tally" />}
    </View>
  );
}
const s = StyleSheet.create({ root: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 } });
