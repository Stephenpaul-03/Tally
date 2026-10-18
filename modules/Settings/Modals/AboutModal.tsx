import { useOnboardingTour } from "@/modules/Onboarding/SpotlightTour";
import { navigationRef } from "@/navigation/RootNavigation";
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
import { DeveloperModal } from "./DeveloperModal";

type Props = {
  visible: boolean;
  onDismiss: () => void;
};

export function AboutModal({ visible, onDismiss }: Props) {
  const theme = useTheme();
  const { start: startTour } = useOnboardingTour();
  const versionTaps = React.useRef(0);
  const [developerVisible, setDeveloperVisible] = React.useState(false);
  React.useEffect(() => {
    if (!visible) {
      versionTaps.current = 0;
      setDeveloperVisible(false);
    }
  }, [visible]);
  const onVersionPress = () => {
    if (!__DEV__) return;
    versionTaps.current += 1;
    if (versionTaps.current === 7) {
      versionTaps.current = 0;
      setDeveloperVisible(true);
    }
  };
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
        dismissable={!developerVisible}
        escapeEnabled={!developerVisible}
        contentContainerStyle={{
          backgroundColor: theme.colors.background,
          borderTopLeftRadius: 40,
          borderTopRightRadius: 40,
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
              onPress={onVersionPress}
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

      <DeveloperModal
        visible={visible && developerVisible}
        onDismiss={() => setDeveloperVisible(false)}
        onPreviewTour={() => {
          setDeveloperVisible(false);
          onDismiss();
          startTour({ preview: true });
          if (navigationRef.isReady()) navigationRef.resetRoot({ index: 0, routes: [{ name: "Transactions" }] });
        }}
        onPreviewOnboarding={() => {
          setDeveloperVisible(false);
          onDismiss();
          if (navigationRef.isReady()) navigationRef.navigate("Onboarding", { preview: true });
        }}
      />

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
