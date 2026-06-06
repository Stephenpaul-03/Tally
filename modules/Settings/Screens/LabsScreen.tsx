import { ActionRow } from "@/modules/Common/Components/HeaderMenuModal/Molecules/ActionRow";
import { SheetCard } from "@/modules/Common/Components/SheetCard";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { ScrollView, View } from "react-native";
import { Switch, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { BiometricSettingsRow } from "../Components/BiometricSettingsRow";
import { SectionLabel } from "../Components/SectionLabel";
import { SettingsHeader } from "../Components/SettingsHeader";
import { useSettings } from "../hooks";
import type { SettingsStackParamList } from "../Navigation";
import { SettingsStyles } from "../Styles";

export function LabsScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const {
    guidedChatEnabled,
    handleGuidedChatToggle,
    betterAnalyticsEnabled,
    handleBetterAnalyticsToggle,
  } = useSettings();

  return (
    <SafeAreaView
      style={[
        SettingsStyles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <SettingsHeader title="Labs" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={SettingsStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel label="Analytics" />
        <SheetCard theme={theme}>
          <ActionRow
            icon="message-text-outline"
            label="Ask Tally"
            description="Guided chat on the Transactions screen"
            onPress={() => handleGuidedChatToggle(!guidedChatEnabled)}
            theme={theme}
            showChevron={false}
            rightElement={
              <Switch
                value={guidedChatEnabled}
                onValueChange={handleGuidedChatToggle}
              />
            }
          />
          <ActionRow
            icon="chart-line"
            label="Better Analytics"
            description="Adds advanced charts and spending insights to the Insights screen."
            onPress={() => handleBetterAnalyticsToggle(!betterAnalyticsEnabled)}
            theme={theme}
            showChevron={false}
            rightElement={
              <Switch
                value={betterAnalyticsEnabled}
                onValueChange={handleBetterAnalyticsToggle}
              />
            }
          />
        </SheetCard>

        <SectionLabel label="Security" />
        <SheetCard theme={theme}>
          <BiometricSettingsRow />
        </SheetCard>

        <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              borderRadius: 12,
              paddingHorizontal: 20,
              backgroundColor: theme.colors.surfaceVariant,
            }}
          >
            <MaterialCommunityIcons
              name="flask-outline"
              size={12}
              color={theme.colors.primary}
            />
            <View
              style={{
                flex: 1,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 6,
                backgroundColor: theme.colors.surfaceVariant,
              }}
            >
              <Text
                style={{ fontSize: 11, color: theme.colors.onSurfaceVariant }}
              >
                These features are experimental. Feel free to enable them, but
                expect rough edges and occasional issues.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
