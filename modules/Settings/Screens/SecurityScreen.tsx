import { ActionRow } from "@/components/ActionRow";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { SheetCard } from "@/components/SheetCard";
import {
  BIOMETRIC_LOCK_TIMEOUT_OPTIONS,
  useBiomettricLock,
} from "@/hooks/use-biometric-lock";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { BiometricSettingsRow } from "../Components/BiometricSettingsRow";
import { SectionLabel } from "../Components/SectionLabel";
import { SettingsHeader } from "../Components/SettingsHeader";
import type { SettingsStackParamList } from "../Navigation";
import { SettingsStyles } from "../Styles";

type SecurityContentProps = {
  modal?: boolean;
  onBack: () => void;
};

type SecurityModalProps = {
  visible: boolean;
  onDismiss: () => void;
};

function formatTimeout(value: number) {
  return (
    BIOMETRIC_LOCK_TIMEOUT_OPTIONS.find((option) => option.value === value)
      ?.label ?? "After 30 seconds"
  );
}

function SecurityContent({ modal = false, onBack }: SecurityContentProps) {
  const theme = useTheme();
  const { enabled, lockTimeoutMs, setLockTimeoutMs } = useBiomettricLock();

  return (
    <>
      <SettingsHeader title="Security" onBack={onBack} modal={modal} />
      <ScrollView
        contentContainerStyle={SettingsStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel label="App lock" />
        <SheetCard theme={theme}>
          <BiometricSettingsRow />
        </SheetCard>

        <View style={{ opacity: enabled ? 1 : 0.45 }}>
          <SectionLabel label="Timeout" />
        </View>
        <SheetCard theme={theme} style={{ opacity: enabled ? 1 : 0.45 }}>
          <ActionRow
            icon="timer-lock-outline"
            label="Lock timeout"
            description={formatTimeout(lockTimeoutMs)}
            onPress={() => undefined}
            theme={theme}
            showChevron={false}
            disabled={!enabled}
          />
          <View style={styles.timeoutGrid}>
            {BIOMETRIC_LOCK_TIMEOUT_OPTIONS.map((option) => {
              const selected = lockTimeoutMs === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ disabled: !enabled, selected }}
                  disabled={!enabled}
                  onPress={() => setLockTimeoutMs(option.value)}
                  style={({ pressed }) => [
                    styles.timeoutOption,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor:
                        selected && enabled
                          ? theme.colors.primary
                          : theme.colors.outlineVariant,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={selected ? "radiobox-marked" : "radiobox-blank"}
                    size={18}
                    color={
                      selected && enabled
                        ? theme.colors.primary
                        : theme.colors.onSurfaceVariant
                    }
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.timeoutOptionText,
                      {
                        color:
                          selected && enabled
                            ? theme.colors.primary
                            : theme.colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </SheetCard>

        <View style={styles.noteRow}>
          <MaterialCommunityIcons
            name="shield-check-outline"
            size={18}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            style={[styles.noteText, { color: theme.colors.onSurfaceVariant }]}
          >
            Tally uses your device authentication. Fingerprints, face data, and
            authentication data stay on your phone.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

export function SecurityModal({ visible, onDismiss }: SecurityModalProps) {
  const theme = useTheme();

  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onDismiss}
      presentation="sheet"
      contentContainerStyle={{
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: "92%",
        overflow: "hidden",
      }}
      includeBottomInset={false}
    >
      <View style={styles.handleWrap}>
        <View
          style={[
            styles.handle,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />
      </View>
      <SecurityContent modal onBack={onDismiss} />
    </AnimatedPaperModal>
  );
}

export function SecurityScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();

  return (
    <SafeAreaView
      style={[
        SettingsStyles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <SecurityContent onBack={() => navigation.goBack()} />
    </SafeAreaView>
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
  noteRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  timeoutGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    padding: 10,
    paddingTop: 0,
  },
  timeoutOption: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flexBasis: "48%",
    flexDirection: "row",
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  timeoutOptionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
});
