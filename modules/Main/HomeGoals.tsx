import React from "react";
import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootParamList } from "@/navigation/types";
import { useAppSelector } from "@/hooks/Redux";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import { useGoals } from "@/modules/Goals/store";
import { GoalCard, GoalsEmptyCard } from "@/modules/Goals/GoalCard";
import { goalProgress } from "@/modules/Goals/model";
import { DesignText as Text } from "@/components/DesignText";
import { useTheme } from "react-native-paper";
export function HomeGoals() {
  const workspace = useAppSelector(selectActiveWorkspace);
  const { goals, error } = useGoals(workspace?.id ?? "personal");
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const theme = useTheme();
  const open = () => navigation.navigate("Settings", { section: "goals" });
  const goal = goals.find(goal => !goalProgress(goal).complete) ?? goals[0];
  if (error) return null;
  return <View style={{ gap: 10 }}>
    <Text style={{ fontSize: 18, fontWeight: "800", color: theme.colors.onSurface }}>Goals{goals.length > 1 ? ` · ${goals.length}` : ""}</Text>
    {goal ? <GoalCard goal={goal} compact onEdit={open} /> : <GoalsEmptyCard compact onCreate={open} />}
  </View>;
}
