import { useAppSelector } from "@/modules/Common/Hooks/Redux";
import {
  selectActiveWorkspaceId,
  selectWorkspaces,
} from "@/modules/Common/Slices/WorkspaceSlice";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";
import { Text, type MD3Theme } from "react-native-paper";

type Props = {
  theme: MD3Theme;
  onPress?: () => void;
};

const TODAY = new Date();
const DAY_LABEL = TODAY.toLocaleDateString("en-US", { weekday: "long" });
const DATE_LABEL = TODAY.toLocaleDateString("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function WorkspaceInfoCard({ theme, onPress }: Props) {
  const workspaces = useAppSelector(selectWorkspaces);
  const activeWorkspaceId = useAppSelector(selectActiveWorkspaceId);
  const active = workspaces.find((w) => w.id === activeWorkspaceId);

  if (!active) return null;

  const c = theme.colors;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        marginHorizontal: 16,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 16,
        backgroundColor: c.surfaceVariant,
        borderWidth: 1.5,
        borderColor: c.primary,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: c.primary,
          borderWidth: 1.5,
          borderColor: `${active.color}66`,
        }}
      >
        <MaterialCommunityIcons
          name={active.icon as any}
          size={20}
          color={c.onPrimary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: c.onSurface,
            marginBottom: 2,
          }}
          numberOfLines={1}
        >
          {active.name}
        </Text>
        <Text style={{ fontSize: 12, color: c.onSurfaceVariant }}>
          {DAY_LABEL} • {DATE_LABEL}
        </Text>
      </View>
    </Pressable>
  );
}
