import { ActionRow } from "@/components/ActionRow";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { SheetCard } from "@/components/SheetCard";
import Constants from "expo-constants";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import {
  BetaContactModal,
  type BetaContactScenario,
} from "./BetaContactModal";
import { SectionLabel } from "../Components/SectionLabel";
import { SettingsHeader } from "../Components/SettingsHeader";
import { SettingsStyles } from "../Styles";

type Props = {
  visible: boolean;
  onDismiss: () => void;
};

export function AboutModal({ visible, onDismiss }: Props) {
  const theme = useTheme();
  const appVersion = Constants.expoConfig?.version ?? "0.1.0";
  const [betaContactScenario, setBetaContactScenario] =
    React.useState<BetaContactScenario | null>(null);
  const openAboutBetaContactModal = React.useCallback(() => {
    onDismiss();
    setBetaContactScenario("about");
  }, [onDismiss]);
  const closeBetaContactModal = React.useCallback(() => {
    setBetaContactScenario(null);
  }, []);

  return (
    <>
      <AnimatedPaperModal
        visible={visible}
        onDismiss={onDismiss}
        presentation="sheet"
        contentContainerStyle={{
          backgroundColor: theme.colors.background,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          maxHeight: "92%",
        }}
      >
        <View style={styles.handleWrap}>
          <View
            style={[
              styles.handle,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />
        </View>
        <SettingsHeader title="About" onBack={onDismiss} />
        <ScrollView
          contentContainerStyle={SettingsStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <SectionLabel label="Info" />
          <SheetCard theme={theme}>
            <ActionRow
              icon="cellphone-information"
              label="About App"
              description="More details about Tally"
              onPress={openAboutBetaContactModal}
              theme={theme}
              showChevron
            />
            <ActionRow
              icon="account-hard-hat-outline"
              label="About Dev"
              description="More details about the developer"
              onPress={openAboutBetaContactModal}
              theme={theme}
              showChevron
            />
          </SheetCard>

          <SectionLabel label="Legal" />
          <SheetCard theme={theme}>
            <ActionRow
              icon="shield-check-outline"
              label="Privacy Policy"
              description="How your data is handled"
              onPress={openAboutBetaContactModal}
              theme={theme}
              showChevron
            />
            <ActionRow
              icon="file-document-outline"
              label="Open Source Licenses"
              description="Third-party acknowledgements"
              onPress={openAboutBetaContactModal}
              theme={theme}
              showChevron
            />
          </SheetCard>

          <SectionLabel label="Version" />
          <SheetCard theme={theme}>
            <ActionRow
              icon="information-outline"
              label="Version"
              description="Installed app build"
              onPress={() => undefined}
              theme={theme}
              showChevron={false}
              rightElement={
                <Text
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  {appVersion}
                </Text>
              }
            />
          </SheetCard>
        </ScrollView>
      </AnimatedPaperModal>

      <BetaContactModal
        visible={betaContactScenario !== null}
        scenario={betaContactScenario ?? "about"}
        onDismiss={closeBetaContactModal}
      />
    </>
  );
}

const styles = StyleSheet.create({
  handle: {
    borderRadius: 999,
    height: 4,
    width: 42,
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: 10,
  },
});
