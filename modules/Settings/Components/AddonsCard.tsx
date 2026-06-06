import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";
import { Switch, Text, useTheme } from "react-native-paper";
import { SettingsStyles } from "../Styles";

export type TabBarModeId = string;

type NavOption = {
  id: TabBarModeId;
  label: string;
  icon: string;
};

type AddonsCardProps = {
  tabBarMode: TabBarModeId;
  onTabBarModeChange: (id: TabBarModeId) => void;
  tabBarOptions: NavOption[];
  guidedChatEnabled: boolean;
  onGuidedChatToggle: (enabled: boolean) => void;
  minimalIconsEnabled: boolean;
  onMinimalIconsToggle: (enabled: boolean) => void;
};

export function AddonsCard({
  tabBarMode,
  onTabBarModeChange,
  tabBarOptions,
  guidedChatEnabled,
  onGuidedChatToggle,
  minimalIconsEnabled,
  onMinimalIconsToggle,
}: AddonsCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        SettingsStyles.addonsCard,
        {
          backgroundColor: theme.colors.elevation.level1,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      {/* Body — subcards go here */}
      <View style={SettingsStyles.addonsBody}>
        <View
          style={[
            SettingsStyles.subcard,
            {
              backgroundColor: theme.colors.elevation.level2,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <View style={SettingsStyles.row}>
            <View style={SettingsStyles.rowLeft}>
              <View
                style={[
                  SettingsStyles.rowIcon,
                  { backgroundColor: theme.colors.secondaryContainer },
                ]}
              >
                <MaterialCommunityIcons
                  name="message-text-outline"
                  size={17}
                  color={theme.colors.onSecondaryContainer}
                />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Text
                    style={[
                      SettingsStyles.rowTitle,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    Ask Tally
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      borderRadius: 999,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      backgroundColor: theme.colors.surfaceVariant,
                    }}
                  >
                    <MaterialCommunityIcons
                      name="flask-outline"
                      size={11}
                      color={theme.colors.primary}
                    />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        lineHeight: 13,
                        color: theme.colors.primary,
                      }}
                    >
                      Beta
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    SettingsStyles.rowSub,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  Guided chat on the Transactions screen
                </Text>
              </View>
            </View>
            <Switch
              value={guidedChatEnabled}
              onValueChange={onGuidedChatToggle}
            />
          </View>
        </View>

        <View
          style={[
            SettingsStyles.subcard,
            {
              backgroundColor: theme.colors.elevation.level2,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <View style={SettingsStyles.row}>
            <View style={SettingsStyles.rowLeft}>
              <View
                style={[
                  SettingsStyles.rowIcon,
                  { backgroundColor: theme.colors.secondaryContainer },
                ]}
              >
                <MaterialCommunityIcons
                  name="palette-outline"
                  size={17}
                  color={theme.colors.onSecondaryContainer}
                />
              </View>
              <View>
                <Text
                  style={[
                    SettingsStyles.rowTitle,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  Minimal Icons
                </Text>
                <Text
                  style={[
                    SettingsStyles.rowSub,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  Use primary color for category icons
                </Text>
              </View>
            </View>
            <Switch
              value={minimalIconsEnabled}
              onValueChange={onMinimalIconsToggle}
            />
          </View>
        </View>

        {/* Navigation subcard */}
        <View
          style={[
            SettingsStyles.subcard,
            {
              backgroundColor: theme.colors.elevation.level2,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <Text
            style={[
              SettingsStyles.subcardLabel,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Navigation style
          </Text>
          <View style={SettingsStyles.subSegRow}>
            {tabBarOptions.map((opt) => {
              const active = tabBarMode === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => onTabBarModeChange(opt.id)}
                  style={[
                    SettingsStyles.subSeg,
                    {
                      backgroundColor: active
                        ? theme.colors.secondaryContainer
                        : theme.colors.elevation.level1,
                      borderColor: active
                        ? theme.colors.secondary
                        : theme.colors.outlineVariant,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={opt.icon as any}
                    size={17}
                    color={
                      active
                        ? theme.colors.onSecondaryContainer
                        : theme.colors.onSurfaceVariant
                    }
                  />
                  <Text
                    style={[
                      SettingsStyles.subSegLabel,
                      {
                        color: active
                          ? theme.colors.onSecondaryContainer
                          : theme.colors.onSurfaceVariant,
                        fontWeight: active ? "600" : "400",
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}
