import { AnimatedPaperModal } from "@/components/modal/modal";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { SettingsHeader } from "../Components/SettingsHeader";

export type BetaContactScenario = "support" | "report" | "request" | "about";

type Props = {
  visible: boolean;
  scenario: BetaContactScenario;
  onDismiss: () => void;
};

const SCENARIO_COPY: Record<
  BetaContactScenario,
  {
    title: string;
    icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
    intro: string;
  }
> = {
  support: {
    title: "Support Development",
    icon: "heart-outline",
    intro: "Support options are parked for the full release.",
  },
  report: {
    title: "Report an Issue",
    icon: "message-alert-outline",
    intro: "Issue reporting is coming with the full release.",
  },
  request: {
    title: "Suggest a Feature",
    icon: "lightbulb-outline",
    intro: "Feature requests are being saved for the full release flow.",
  },
  about: {
    title: "Coming Soon",
    icon: "information-outline",
    intro: "This page is parked for the full release.",
  },
};

export function BetaContactModal({ visible, scenario, onDismiss }: Props) {
  const theme = useTheme();
  const [lastVisibleScenario, setLastVisibleScenario] =
    React.useState<BetaContactScenario>(scenario);

  React.useEffect(() => {
    if (visible) {
      setLastVisibleScenario(scenario);
    }
  }, [scenario, visible]);

  // Keep the previous content during the dismiss animation. The parent clears
  // its scenario state on close, which otherwise falls back to "support" for
  // one frame before the modal finishes disappearing.
  const copy = SCENARIO_COPY[visible ? scenario : lastVisibleScenario];

  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onDismiss}
      presentation="sheet"
      zIndex={1200}
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

      <SettingsHeader title={copy.title} onBack={onDismiss} modal />

      <View style={styles.content}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={copy.icon}
            size={28}
            color={theme.colors.primary}
          />
        </View>

        <View style={styles.copyBlock}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            Closed beta for a reason
          </Text>
          <Text style={[styles.body, { color: theme.colors.onSurfaceVariant }]}>
            {copy.intro} Tally is still in closed beta, so this button is mostly
            here to look important until the public build lands.
          </Text>
          <Text style={[styles.body, { color: theme.colors.onSurfaceVariant }]}>
            For now, message me on WhatsApp. If you have my app at this stage,
            you should probably already have my number.
          </Text>
        </View>

        <Button mode="contained" onPress={onDismiss}>
          Got it
        </Button>
      </View>
    </AnimatedPaperModal>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 13,
    lineHeight: 19,
  },
  content: {
    gap: 18,
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 8,
  },
  copyBlock: {
    gap: 10,
  },
  handle: {
    borderRadius: 999,
    height: 4,
    width: 42,
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: 10,
  },
  iconWrap: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 23,
  },
});
