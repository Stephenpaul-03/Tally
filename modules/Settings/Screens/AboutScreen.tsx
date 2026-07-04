import { ActionRow } from "@/components/ActionRow";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { SheetCard } from "@/components/SheetCard";
import { toast } from "@/components/toast/ToastProvider";
import { typography } from "@/theme/typography";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Constants from "expo-constants";
import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  DEV_TOOLS_PASSCODE,
  isDeveloperToolsUnlockedForSession,
  unlockDeveloperToolsForSession,
} from "../DeveloperToolsSession";
import { SectionLabel } from "../Components/SectionLabel";
import { SettingsHeader } from "../Components/SettingsHeader";
import type { SettingsStackParamList } from "../Navigation";
import { SettingsStyles } from "../Styles";

export function AboutScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const appVersion = Constants.expoConfig?.version ?? "0.1.0";
  const devTapCountRef = React.useRef(0);
  const [passcodeOpen, setPasscodeOpen] = React.useState(false);
  const [passcode, setPasscode] = React.useState("");

  const handleDeveloperTap = React.useCallback(() => {
    const next = devTapCountRef.current + 1;
    devTapCountRef.current = next;

    if (next >= 7) {
      devTapCountRef.current = 0;
      if (isDeveloperToolsUnlockedForSession()) {
        toast.info("Developer tools are already on for this app session");
        return;
      }
      setPasscodeOpen(true);
    }
  }, []);

  const handleUnlockDeveloperTools = React.useCallback(() => {
    if (passcode !== DEV_TOOLS_PASSCODE) {
      toast.error("Incorrect developer code");
      setPasscode("");
      return;
    }

    unlockDeveloperToolsForSession();
    setPasscode("");
    setPasscodeOpen(false);
    toast.success("Developer tools are on for this app session");
  }, [passcode]);

  const handleWebRedirectPress = React.useCallback(() => {
    toast.info("Work in progress");
  }, []);

  return (
    <SafeAreaView
      style={[
        SettingsStyles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <SettingsHeader title="About" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={SettingsStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ─────────────────────────────────────────── */}
        <View style={styles.hero}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open developer tools"
            onPress={handleDeveloperTap}
            style={[
              styles.appIcon,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderColor: theme.colors.outline,
              },
            ]}
          >
            <Image
              source={require("@/assets/images/icon-foreground-Mono-White.png")}
              style={styles.appImage}
              resizeMode="contain"
            />
          </Pressable>
          <Text
            variant="headlineMedium"
            style={[
              styles.appName,
              { ...typography.editorial.sectionLabel, fontSize: 28 },
            ]}
          >
            Tally
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Offline-first finance tracker
          </Text>
        </View>

        {/* ── Support ──────────────────────────────────────── */}
        <SectionLabel label="Support" />
        <SheetCard theme={theme}>
          <ActionRow
            icon="heart-outline"
            label="Support Development"
            description="Help fund future updates"
            onPress={handleWebRedirectPress}
            theme={theme}
            showChevron
          />
          <ActionRow
            icon="message-alert-outline"
            label="Report an Issue"
            description="Help improve Tally"
            onPress={handleWebRedirectPress}
            theme={theme}
            showChevron
          />
          <ActionRow
            icon="lightbulb-outline"
            label="Suggest a Feature"
            description="Share your ideas with us"
            onPress={handleWebRedirectPress}
            theme={theme}
            showChevron
          />
        </SheetCard>

        {/* ── Legal ────────────────────────────────────────── */}
        <SectionLabel label="Legal" />
        <SheetCard theme={theme}>
          <ActionRow
            icon="shield-check-outline"
            label="Privacy Policy"
            description="How your data is handled"
            onPress={handleWebRedirectPress}
            theme={theme}
            showChevron
          />
          <ActionRow
            icon="file-document-outline"
            label="Open Source Licenses"
            description="Third-party acknowledgements"
            onPress={handleWebRedirectPress}
            theme={theme}
            showChevron
          />
        </SheetCard>

        {/* ── Version ──────────────────────────────────────── */}
        <SectionLabel label="Version" />
        <SheetCard theme={theme}>
          <ActionRow
            icon="information-outline"
            label="Version"
            description="Installed app build"
            onPress={() => {}}
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

      <AnimatedPaperModal
        visible={passcodeOpen}
        onDismiss={() => {
          setPasscodeOpen(false);
          setPasscode("");
        }}
        presentation="sheet"
        keyboardAware
        contentContainerStyle={{
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: theme.colors.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 12,
            paddingHorizontal: 20,
            paddingBottom: 24,
          }}
        >
          <View
            style={{
              alignSelf: "center",
              width: 42,
              height: 4,
              borderRadius: 999,
              backgroundColor: theme.colors.outlineVariant,
              marginBottom: 14,
            }}
          />

          <View style={{ paddingHorizontal: 4, gap: 14 }}>
            <View style={{ gap: 4 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: theme.colors.onSurface,
                }}
              >
                Enter Developer Code
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  lineHeight: 18,
                  color: theme.colors.onSurfaceVariant,
                }}
              >
                Unlock developer tools for this app session.
              </Text>
            </View>

            <TextInput
              mode="outlined"
              label="Passcode"
              value={passcode}
              onChangeText={(value) =>
                setPasscode(value.replace(/[^0-9]/g, "").slice(0, 4))
              }
              keyboardType="number-pad"
              secureTextEntry={false}
              maxLength={4}
              autoFocus
            />

            <Button
              mode="contained"
              onPress={handleUnlockDeveloperTools}
              disabled={passcode.length !== 4}
            >
              Unlock
            </Button>
          </View>
        </View>
      </AnimatedPaperModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 8,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    overflow: "hidden",
  },
  appImage: {
    width: 120,
    height: 120,
  },
  appName: {
    fontWeight: "700",
  },
});
