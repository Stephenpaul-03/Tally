import { AnimatedPaperModal } from "@/components/modal/modal";
import { toast } from "@/components/toast/toast";
import { useAppDispatch, useAppSelector } from "@/modules/Common/Hooks/Redux";
import {
    selectActiveWorkspaceId,
    selectWorkspaces,
    switchWorkspaceAndReload,
} from "@/modules/Common/Slices/WorkspaceSlice";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { Text, type MD3Theme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  onDismiss: () => void;
  theme: MD3Theme;
};

export function WorkspaceSwitcherModal({ visible, onDismiss, theme }: Props) {
  const dispatch = useAppDispatch();
  const workspaces = useAppSelector(selectWorkspaces);
  const activeWorkspaceId = useAppSelector(selectActiveWorkspaceId);
  const { bottom } = useSafeAreaInsets();
  const [switching, setSwitching] = useState<string | null>(null);
  const c = theme.colors;

  const handleSwitch = async (id: string) => {
    if (id === activeWorkspaceId || switching) return;
    try {
      setSwitching(id);
      await dispatch(switchWorkspaceAndReload(id) as any);
      const name = workspaces.find((w) => w.id === id)?.name;
      toast.success(`Switched to ${name}`);
      onDismiss();
    } catch {
      toast.error("Couldn't switch workspace");
    } finally {
      setSwitching(null);
    }
  };

  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onDismiss}
      presentation="sheet"
      contentContainerStyle={{
        backgroundColor: c.background,
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        overflow: "hidden",
        paddingBottom: bottom + 16,
      }}
    >
      {/* Handle */}
      <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 2 }}>
        <View
          style={{
            width: 34,
            height: 4,
            borderRadius: 2,
            backgroundColor: c.outlineVariant,
          }}
        />
      </View>

      {/* Title */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: c.onSurface,
          }}
        >
          Workspaces
        </Text>
      </View>

      {/* List */}
      <View style={{ paddingHorizontal: 16, gap: 8 }}>
        {workspaces.map((workspace) => {
          const active = workspace.id === activeWorkspaceId;
          const isLoading = switching === workspace.id;
          return (
            <Pressable
              key={workspace.id}
              onPress={() => handleSwitch(workspace.id)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 14,
                borderRadius: 16,
                backgroundColor: active
                  ? `${workspace.color}18`
                  : c.surfaceVariant,
                borderWidth: 1.5,
                borderColor: active ? `${workspace.color}55` : c.outlineVariant,
                opacity: pressed || isLoading ? 0.7 : 1,
              })}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: `${workspace.color}22`,
                }}
              >
                <MaterialCommunityIcons
                  name={workspace.icon as any}
                  size={18}
                  color={workspace.color}
                />
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: 15,
                  fontWeight: active ? "700" : "500",
                  color: active ? c.onSurface : c.onSurfaceVariant,
                }}
              >
                {workspace.name}
              </Text>
              {active ? (
                <MaterialCommunityIcons
                  name="check-circle"
                  size={18}
                  color={workspace.color}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </AnimatedPaperModal>
  );
}
