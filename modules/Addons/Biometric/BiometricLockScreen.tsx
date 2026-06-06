import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

type BiometricLockScreenProps = {
  isAuthenticating: boolean;
  onUnlock: () => void;
};

export function BiometricLockScreen({
  isAuthenticating,
  onUnlock,
}: BiometricLockScreenProps) {
  const theme = useTheme();

  return (
    <SafeAreaView
      accessibilityViewIsModal
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Wordmark — top */}
      <View style={styles.header}>
        <Text
          style={{
            ...typography.editorial.sectionLabel,
            fontSize: 26,
            color: theme.colors.primary,
          }}
        >
          TALLY
        </Text>
      </View>

      {/* Center zone — icon + copy */}
      <View style={styles.center}>
        <View style={styles.iconArea}>
          <View style={[styles.ring3, { borderColor: theme.colors.primary }]} />
          <View style={[styles.ring2, { borderColor: theme.colors.primary }]} />
          <View
            style={[
              styles.ring1,
              {
                borderColor: theme.colors.primary,
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="lock-outline"
              size={30}
              color={theme.colors.primary}
            />
          </View>
        </View>

        <View style={styles.copy}>
          <Text
            style={[
              typography.editorial.sectionLabel,
              { color: theme.colors.onSurface, fontSize: 20 },
            ]}
          >
            Tally is locked
          </Text>
          <Text
            style={[
              styles.description,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Authenticate to continue
          </Text>
        </View>
      </View>

      {/* Button — bottom */}
      <View style={styles.footer}>
        <Button
          mode="contained"
          icon="lock-open-outline"
          loading={isAuthenticating}
          disabled={isAuthenticating}
          onPress={onUnlock}
          style={styles.button}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          Unlock
        </Button>
      </View>
    </SafeAreaView>
  );
}

const RING1 = 72;
const RING2 = 116;
const RING3 = 160;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9000,
    elevation: 9000,
  },
  header: {
    alignItems: "center",
    paddingTop: 20,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 36,
  },
  iconArea: {
    width: RING3,
    height: RING3,
    alignItems: "center",
    justifyContent: "center",
  },
  ring3: {
    position: "absolute",
    width: RING3,
    height: RING3,
    borderRadius: RING3 / 2,
    borderWidth: 0.75,
    opacity: 0.12,
  },
  ring2: {
    position: "absolute",
    width: RING2,
    height: RING2,
    borderRadius: RING2 / 2,
    borderWidth: 0.75,
    opacity: 0.22,
  },
  ring1: {
    width: RING1,
    height: RING1,
    borderRadius: RING1 / 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 28,
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    paddingBottom: 24,
  },
  button: {
    borderRadius: 14,
    minWidth: 160,
  },
  buttonContent: {
    height: 52,
    paddingHorizontal: 8,
  },
  buttonLabel: {
    fontSize: 15,
    letterSpacing: 0.3,
    fontWeight: "600",
  },
});
