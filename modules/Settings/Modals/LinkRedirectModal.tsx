import { AnimatedPaperModal } from "@/components/modal/modal";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { SettingsHeader } from "../Components/SettingsHeader";

export type LinkRedirectModalProps = {
  visible: boolean;
  url: string;
  onConfirm: () => void;
  onDismiss: () => void;
  confirming?: boolean;
};

/** Confirmation shown before the app hands navigation to an external link. */
export function LinkRedirectModal({
  visible,
  url,
  onConfirm,
  onDismiss,
  confirming = false,
}: LinkRedirectModalProps) {
  const theme = useTheme();

  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onDismiss}
      presentation="sheet"
      zIndex={1200}
      contentContainerStyle={[
        styles.modal,
        {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <View style={styles.handleWrap}>
        <View
          style={[styles.handle, { backgroundColor: theme.colors.outlineVariant }]}
        />
      </View>

      <SettingsHeader title="Open external link" onBack={onDismiss} modal />

      <View style={styles.content}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: theme.colors.primaryContainer,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="open-in-new"
            size={28}
            color={theme.colors.onPrimaryContainer}
          />
        </View>

        <View style={styles.copyBlock}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}> 
            Continue to this link?
          </Text>
          <Text style={[styles.body, { color: theme.colors.onSurfaceVariant }]}> 
            Tally is about to open this link outside the app. Make sure you
            recognize the destination before continuing.
          </Text>
        </View>

        <View
          style={[
            styles.urlCard,
            {
              backgroundColor: theme.colors.surfaceVariant,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="link-variant"
            size={18}
            color={theme.colors.primary}
          />
          <Text
            selectable
            numberOfLines={3}
            style={[styles.url, { color: theme.colors.onSurface }]}
          >
            {url}
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={onDismiss}
            disabled={confirming}
            style={styles.actionButton}
            contentStyle={styles.actionContent}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={onConfirm}
            loading={confirming}
            disabled={confirming}
            style={styles.actionButton}
            contentStyle={styles.actionContent}
          >
            Continue
          </Button>
        </View>
      </View>
    </AnimatedPaperModal>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    borderRadius: 14,
    flex: 1,
  },
  actionContent: {
    minHeight: 48,
  },
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
    gap: 8,
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
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  modal: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    maxHeight: "92%",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 23,
  },
  url: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  urlCard: {
    alignItems: "flex-start",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
