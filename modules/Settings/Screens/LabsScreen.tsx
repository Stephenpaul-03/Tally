import { AnimatedPaperModal } from "@/components/modal/modal";
import { ActionRow } from "@/components/ActionRow";
import { SheetCard } from "@/components/SheetCard";
import type { InsightCardId } from "@/hooks/use-addon-prefs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useMemo } from "react";
import { Pressable, ScrollView, View } from "react-native";
import DraggableFlatList from "react-native-draggable-flatlist";
import {
  Checkbox,
  Switch,
  Text,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { SectionLabel } from "../Components/SectionLabel";
import { SettingsHeader } from "../Components/SettingsHeader";
import { useSettings } from "../hooks";
import type { SettingsStackParamList } from "../Navigation";
import { SettingsStyles } from "../Styles";

const INSIGHTS_CARD_LABELS: Record<InsightCardId, string> = {
  spendingByCategory: "Spending by category",
  spendingByPaymentMethod: "Spending by Payment Method",
  budgetSummary: "Budget summary",
  categoryTrends: "Category trends",
  weeklySpending: "Weekly spending",
};

export function LabsScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const {
    guidedChatEnabled,
    handleGuidedChatToggle,
    betterAnalyticsEnabled,
    handleBetterAnalyticsToggle,
    insightsCardOrder,
    setInsightsCardOrder,
    labsNoticeDismissed,
    setLabsNoticeDismissed,
  } = useSettings();
  const [layoutExpanded, setLayoutExpanded] = React.useState(true);
  const [labsNoticeVisible, setLabsNoticeVisible] = React.useState(false);
  const [doNotShowAgain, setDoNotShowAgain] = React.useState(false);
  const reorderableCards = useMemo(
    () =>
      insightsCardOrder.map((id) => ({
        id,
        label: INSIGHTS_CARD_LABELS[id],
      })),
    [insightsCardOrder],
  );

  useFocusEffect(
    React.useCallback(() => {
      if (labsNoticeDismissed) {
        setLabsNoticeVisible(false);
        return undefined;
      }

      setDoNotShowAgain(false);
      setLabsNoticeVisible(true);
      return undefined;
    }, [labsNoticeDismissed]),
  );

  const handleDismissLabsNotice = React.useCallback(() => {
    setLabsNoticeDismissed(doNotShowAgain);
    setLabsNoticeVisible(false);
  }, [doNotShowAgain, setLabsNoticeDismissed]);

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
        <SectionLabel label="Experiments" />
        <SheetCard theme={theme} style={{ marginBottom: 12 }}>
          <ActionRow
            icon="message-text-outline"
            label="Ask Tally"
            description="Guided help inside Transactions."
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
        </SheetCard>
        <SheetCard theme={theme} style={{ marginBottom: 12 }}>
          <ActionRow
            icon="chart-line"
            label="Better Analytics"
            description="Extra Insights cards and layout controls."
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

        {betterAnalyticsEnabled ? (
          <>
            <SectionLabel label="Insights Layout" />
            <SheetCard theme={theme}>
              <ActionRow
                icon="view-carousel-outline"
                label="Analytics card order"
                description="Reorder Insights cards."
                onPress={() => setLayoutExpanded((current) => !current)}
                theme={theme}
                showChevron={false}
                rightElement={
                  <MaterialCommunityIcons
                    name={layoutExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={theme.colors.onSurfaceVariant}
                  />
                }
              />

              {layoutExpanded ? (
                <>
                  <View
                    style={{
                      height: 0.5,
                      marginLeft: 16,
                      marginRight: 16,
                      backgroundColor: theme.colors.outlineVariant,
                    }}
                  />
                  <View
                    style={{
                      paddingHorizontal: 16,
                      paddingTop: 14,
                      paddingBottom: 6,
                      gap: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "700",
                        color: theme.colors.onSurface,
                      }}
                    >
                      Hold any part of a card to drag
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.colors.onSurfaceVariant,
                      }}
                    >
                      Hero stays pinned. Drag the rest to reorder.
                    </Text>
                  </View>

                  <DraggableFlatList
                    data={reorderableCards}
                    keyExtractor={(item) => item.id}
                    onDragEnd={({ data }) =>
                      setInsightsCardOrder(data.map((item) => item.id))
                    }
                    scrollEnabled={false}
                    activationDistance={0}
                    renderItem={({ item, drag, isActive }) => (
                      <Pressable
                        onLongPress={drag}
                        delayLongPress={180}
                        style={({ pressed }) => ({
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                          paddingHorizontal: 16,
                          paddingVertical: 14,
                          backgroundColor: isActive
                            ? theme.colors.elevation.level2
                            : "transparent",
                          opacity: pressed || isActive ? 0.92 : 1,
                        })}
                      >
                        <View
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: theme.colors.surfaceVariant,
                          }}
                        >
                          <MaterialCommunityIcons
                            name="drag"
                            size={17}
                            color={theme.colors.primary}
                          />
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "600",
                              color: theme.colors.onSurface,
                            }}
                          >
                            {item.label}
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              color: theme.colors.onSurfaceVariant,
                            }}
                          >
                            Long press to move.
                          </Text>
                        </View>
                        <MaterialCommunityIcons
                          name="dots-grid"
                          size={18}
                          color={theme.colors.onSurfaceVariant}
                        />
                      </Pressable>
                    )}
                    ItemSeparatorComponent={() => (
                      <View
                        style={{
                          height: 0.5,
                          marginLeft: 62,
                          backgroundColor: theme.colors.outlineVariant,
                        }}
                      />
                    )}
                  />
                </>
              ) : null}
            </SheetCard>
          </>
        ) : null}
      </ScrollView>

      <AnimatedPaperModal
        visible={labsNoticeVisible}
        onDismiss={handleDismissLabsNotice}
        presentation="sheet"
        contentContainerStyle={{
          paddingTop: 12,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: theme.colors.elevation.level2,
        }}
      >
        <View
          style={{
            paddingHorizontal: 20,
            paddingBottom: 20,
          }}
        >
          <View
            style={{
              alignSelf: "center",
              width: 42,
              height: 4,
              borderRadius: 999,
              marginBottom: 16,
              backgroundColor: theme.colors.outlineVariant,
            }}
          />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              marginBottom: 10,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: theme.colors.surfaceVariant,
              }}
            >
              <MaterialCommunityIcons
                name="flask-outline"
                size={22}
                color={theme.colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: theme.colors.onSurface,
                }}
              >
                Labs are experimental
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  lineHeight: 18,
                  color: theme.colors.onSurfaceVariant,
                }}
              >
                These features are still being tested and may change, move, or
                behave unexpectedly between updates.
              </Text>
            </View>
          </View>

          <View
            style={{
              borderRadius: 16,
              padding: 14,
              marginTop: 8,
              marginBottom: 18,
              backgroundColor: theme.colors.surfaceVariant,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                lineHeight: 18,
                color: theme.colors.onSurfaceVariant,
              }}
            >
              Enable only the experiments you want to try. If something feels
              rough, you can turn it back off here.
            </Text>
          </View>

          <Pressable
            onPress={() => setDoNotShowAgain((current) => !current)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginBottom: 18,
              opacity: pressed ? 0.74 : 1,
            })}
          >
            <Checkbox status={doNotShowAgain ? "checked" : "unchecked"} />
            <Text
              style={{
                fontSize: 13,
                color: theme.colors.onSurface,
              }}
            >
              Do not show this again
            </Text>
          </Pressable>

          <Pressable
            onPress={handleDismissLabsNotice}
            style={({ pressed }) => ({
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 14,
              backgroundColor: theme.colors.primary,
              opacity: pressed ? 0.82 : 1,
            })}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: theme.colors.onPrimary,
              }}
            >
              Continue to Labs
            </Text>
          </Pressable>
        </View>
      </AnimatedPaperModal>
    </SafeAreaView>
  );
}
