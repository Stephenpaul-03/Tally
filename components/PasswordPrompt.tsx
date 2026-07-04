// Hooks/UsePasswordPrompt.ts
import { AnimatedPaperModal } from "@/components/modal/modal";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";

type PromptMode = "set" | "unlock";

type PasswordPromptState = {
  title: string;
  message: string;
  mode: PromptMode;
  resolve: (value: string | null) => void;
};

export function usePasswordPrompt() {
  const theme = useTheme();
  const [prompt, setPrompt] = React.useState<PasswordPromptState | null>(null);
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const activeResolverRef = React.useRef<PasswordPromptState["resolve"] | null>(
    null,
  );

  const promptPassword = React.useCallback(
    (
      title: string,
      message: string,
      mode: PromptMode = "unlock",
    ): Promise<string | null> => {
      return new Promise((resolve) => {
        setPassword("");
        setConfirm("");
        setShowPassword(false);
        setShowConfirm(false);
        setPrompt({ title, message, mode, resolve });
      });
    },
    [],
  );

  const closePrompt = React.useCallback((value: string | null) => {
    setPrompt((current) => {
      current?.resolve(value);
      return null;
    });
    setPassword("");
    setConfirm("");
    setShowPassword(false);
    setShowConfirm(false);
  }, []);

  React.useEffect(() => {
    activeResolverRef.current = prompt?.resolve ?? null;
  }, [prompt]);

  React.useEffect(() => {
    return () => {
      activeResolverRef.current?.(null);
    };
  }, []);

  const isSetMode = prompt?.mode === "set";
  const isWrongPassword = prompt?.title === "Wrong Password";

  const mismatch = isSetMode && confirm.length > 0 && password !== confirm;
  const canConfirm = isSetMode
    ? password.trim().length > 0 && password === confirm
    : password.trim().length > 0;

  const PasswordPromptModal = prompt ? (
    <AnimatedPaperModal
      visible
      onDismiss={() => closePrompt(null)}
      presentation="sheet"
      keyboardAware
      contentContainerStyle={{
        paddingTop: 12,
        backgroundColor: theme.colors.elevation.level2,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
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
            alignItems: "flex-start",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isWrongPassword
                ? theme.colors.errorContainer
                : theme.colors.surfaceVariant,
            }}
          >
            <MaterialCommunityIcons
              name={
                isWrongPassword
                  ? "lock-alert-outline"
                  : isSetMode
                    ? "lock-plus-outline"
                    : "lock-outline"
              }
              size={22}
              color={
                isWrongPassword ? theme.colors.error : theme.colors.primary
              }
            />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: theme.colors.onSurface,
              }}
            >
              {isWrongPassword ? "Try again" : prompt.title}
            </Text>
            <Text
              style={{
                fontSize: 13,
                lineHeight: 19,
                color: theme.colors.onSurfaceVariant,
              }}
            >
              {prompt.message}
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Close"
            hitSlop={8}
            onPress={() => closePrompt(null)}
            style={({ pressed }) => ({
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.colors.surfaceVariant,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <MaterialCommunityIcons
              name="close"
              size={16}
              color={theme.colors.onSurfaceVariant}
            />
          </Pressable>
        </View>

        <View style={{ paddingTop: 8, gap: 12 }}>
          {/* Password input */}
          <TextInput
            mode="outlined"
            value={password}
            onChangeText={setPassword}
            placeholder={isSetMode ? "New password" : "Enter password"}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            outlineColor={
              isWrongPassword ? theme.colors.error : theme.colors.outlineVariant
            }
            activeOutlineColor={
              isWrongPassword ? theme.colors.error : theme.colors.primary
            }
            style={{ backgroundColor: "transparent" }}
            outlineStyle={{ borderRadius: 12 }}
            left={
              <TextInput.Icon
                icon="lock-outline"
                color={
                  isWrongPassword
                    ? theme.colors.error
                    : theme.colors.onSurfaceVariant
                }
              />
            }
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                color={theme.colors.onSurfaceVariant}
                onPress={() => setShowPassword((v) => !v)}
              />
            }
          />

          {/* Confirm input — only in set mode */}
          {isSetMode ? (
            <TextInput
              mode="outlined"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Confirm password"
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
              autoCorrect={false}
              outlineColor={
                mismatch ? theme.colors.error : theme.colors.outlineVariant
              }
              activeOutlineColor={
                mismatch ? theme.colors.error : theme.colors.primary
              }
              style={{ backgroundColor: "transparent" }}
              outlineStyle={{ borderRadius: 12 }}
              left={
                <TextInput.Icon
                  icon="lock-check-outline"
                  color={
                    mismatch
                      ? theme.colors.error
                      : theme.colors.onSurfaceVariant
                  }
                />
              }
              right={
                <TextInput.Icon
                  icon={showConfirm ? "eye-off" : "eye"}
                  color={theme.colors.onSurfaceVariant}
                  onPress={() => setShowConfirm((v) => !v)}
                />
              }
            />
          ) : null}

          {/* Error states */}
          {mismatch ? (
            <View style={styles.errorRow}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={14}
                color={theme.colors.error}
              />
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                Passwords don&apos;t match
              </Text>
            </View>
          ) : isWrongPassword ? (
            <View style={styles.errorRow}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={14}
                color={theme.colors.error}
              />
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                Incorrect password — please try again
              </Text>
            </View>
          ) : null}
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
          <Button
            mode="outlined"
            onPress={() => closePrompt(null)}
            style={{ flex: 1, borderRadius: 14 }}
            contentStyle={{ paddingVertical: 6 }}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            disabled={!canConfirm}
            onPress={() => closePrompt(password.trim() || null)}
            style={{ flex: 1, borderRadius: 14 }}
            contentStyle={{ paddingVertical: 6 }}
          >
            {isSetMode ? "Set password" : "Unlock"}
          </Button>
        </View>
      </View>
    </AnimatedPaperModal>
  ) : null;

  return { promptPassword, PasswordPromptModal };
}

const styles = StyleSheet.create({
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
