import React from "react";
import type { MaterialCommunityIcons } from "@expo/vector-icons";

import { AlertModal } from "./AlertModal";

type PermissionRequestModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
};

export function PermissionRequestModal({
  isOpen,
  title,
  message,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  icon = "bell-alert-outline",
}: PermissionRequestModalProps) {
  return (
    <AlertModal
      isOpen={isOpen}
      title={title}
      message={message}
      confirmLabel={primaryLabel}
      cancelLabel={secondaryLabel}
      onConfirm={onPrimary}
      onCancel={onSecondary}
      icon={icon}
    />
  );
}
