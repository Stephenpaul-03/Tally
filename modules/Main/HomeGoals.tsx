import React from "react";
import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootParamList } from "@/navigation/types";
import { useAppSelector } from "@/hooks/Redux";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import { useGoals } from "@/modules/Goals/store";
import { HomeGoalCard } from "./HomeGoalCard";
import { goalProgress } from "@/modules/Goals/model";
export function HomeGoals() {
  const workspace = useAppSelector(selectActiveWorkspace);
  const { goals, error } = useGoals(workspace?.id ?? "personal");
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const open = () => navigation.navigate("Settings", { section: "goals" });
  const goal = goals.find(goal => !goalProgress(goal).complete) ?? goals[0];
  if (error) return null;
  return <View style={{ gap: 10 }}>
    <HomeGoalCard goal={goal} onPress={open} />
  </View>;
}
