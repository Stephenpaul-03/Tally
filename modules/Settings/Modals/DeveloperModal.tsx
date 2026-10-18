import { ActionRow } from "@/components/ActionRow";
import { AnimatedPaperModal } from "@/components/modal/modal";
import React from "react";
import { ScrollView, View } from "react-native";
import { useTheme } from "react-native-paper";
import { SampleDataControls } from "../Components/SampleDataControls";
import { SettingsHeader } from "../Components/SettingsHeader";
import { SettingsStyles } from "../Styles";

export function DeveloperModal({
  visible,
  onDismiss,
  onPreviewOnboarding,
  onPreviewTour,
}: {
  visible: boolean;
  onDismiss: () => void;
  onPreviewOnboarding: () => void;
  onPreviewTour: () => void;
}) {
  const theme = useTheme();
  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onDismiss}
      presentation="sheet"
      contentContainerStyle={{
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        maxHeight: "92%",
      }}
    >
      <View style={{ alignItems: "center", paddingTop: 10 }}>
        <View style={{ width: 42, height: 4, borderRadius: 999, backgroundColor: theme.colors.outlineVariant }} />
      </View>
      <SettingsHeader title="Developer" onBack={onDismiss} modal />
      <ScrollView contentContainerStyle={SettingsStyles.scrollContent}>
        <SampleDataControls />
        <ActionRow icon="flag-outline" label="Preview onboarding" description="Walk through setup without changing your data"
          theme={theme} onPress={onPreviewOnboarding} />
        <ActionRow icon="map-marker-path" label="Preview app tour" description="Explore the spotlights without changing your data"
          theme={theme} onPress={onPreviewTour} />
      </ScrollView>
    </AnimatedPaperModal>
  );
}
