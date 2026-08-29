import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ActivityIndicator, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

type BiometricLockOverlayProps = {
  isAuthenticating: boolean;
  onUnlock: () => void;
};

export function BiometricLockOverlay({
  isAuthenticating,
  onUnlock,
}: BiometricLockOverlayProps) {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <View style={styles.content}>
        <View
          style={[
            styles.lockBadge,
            {
              backgroundColor: theme.colors.primaryContainer,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          {isAuthenticating ? (
            <ActivityIndicator color={theme.colors.primary} size="small" />
          ) : (
            <MaterialCommunityIcons
              name="fingerprint"
              size={38}
              color={theme.colors.primary}
            />
          )}
        </View>

        <View style={styles.copy}>
          <Text
            style={[styles.title, { color: theme.colors.onSurface }]}
            accessibilityRole="header"
          >
            Tally is locked
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Authenticate to continue.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Unlock with biometrics"
          disabled={isAuthenticating}
          onPress={onUnlock}
          style={({ pressed }) => [
            styles.unlockButton,
            {
              backgroundColor: theme.colors.primary,
              opacity: pressed || isAuthenticating ? 0.72 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="lock-open-outline"
            size={18}
            color={theme.colors.onPrimary}
          />
          <Text
            style={[
              styles.unlockButtonText,
              { color: theme.colors.onPrimary },
            ]}
          >
            {isAuthenticating ? "Checking..." : "Unlock"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
  content: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  copy: {
    alignItems: "center",
    gap: 8,
    marginBottom: 28,
  },
  lockBadge: {
    alignItems: "center",
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    height: 84,
    justifyContent: "center",
    marginBottom: 24,
    width: 84,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 30,
    textAlign: "center",
  },
  unlockButton: {
    alignItems: "center",
    borderRadius: 16,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minWidth: 148,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  unlockButtonText: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
});
