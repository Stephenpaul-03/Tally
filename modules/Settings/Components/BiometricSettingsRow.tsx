import { toast } from "@/components/toast/toast";
import { useBiomettricLock } from "@/hooks/use-biometric-lock";
import { ActionRow } from "@/modules/Common/Components/HeaderMenuModal/Molecules/ActionRow";
import React from "react";
import { View } from "react-native";
import { Switch, Text, useTheme } from "react-native-paper";

function getUnavailableCopy(
  reason: ReturnType<typeof useBiomettricLock>["availability"]["unavailableReason"],
) {
  if (reason === "no-hardware") {
    return "This device does not support biometric authentication.";
  }
  if (reason === "not-enrolled") {
    return "No Face ID or fingerprint is enrolled on this device.";
  }
  if (reason === "error") {
    return "Biometric availability could not be checked right now.";
  }
  return null;
}

export function BiometricSettingsRow() {
  const theme = useTheme();
  const {
    enabled,
    isHydrated,
    isAuthenticating,
    availability,
    setBiometricLockEnabled,
  } = useBiomettricLock();

  const unavailableCopy = getUnavailableCopy(availability.unavailableReason);
  const switchDisabled =
    !isHydrated ||
    isAuthenticating ||
    (availability.checked && Boolean(unavailableCopy));

  const handleToggle = React.useCallback(
    async (next: boolean) => {
      const result = await setBiometricLockEnabled(next);

      if (result.enabled === next) {
        toast.success(
          next ? "Biometric Lock enabled" : "Biometric Lock disabled",
        );
        return;
      }

      const copy = getUnavailableCopy(result.availability.unavailableReason);
      toast.info("Biometric Lock unavailable", copy ?? "Please try again.");
    },
    [setBiometricLockEnabled],
  );

  return (
    <>
      <ActionRow
        icon="lock-outline"
        label="Biometric Lock"
        description="Protect Tally using Face ID or fingerprint authentication."
        onPress={() => void handleToggle(!enabled)}
        theme={theme}
        showChevron={false}
        rightElement={
          <Switch
            value={enabled}
            disabled={switchDisabled}
            onValueChange={(next) => void handleToggle(next)}
          />
        }
      />
      {unavailableCopy ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
          <Text
            style={{
              fontSize: 12,
              lineHeight: 16,
              color: theme.colors.onSurfaceVariant,
            }}
          >
            {unavailableCopy}
          </Text>
        </View>
      ) : null}
    </>
  );
}
