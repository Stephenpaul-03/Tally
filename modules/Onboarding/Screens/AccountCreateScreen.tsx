import { EntityEditLayout } from "@/components/EntityEditLayout";
import { useAccountManagement } from "@/hooks/use-account-manangement";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { Button, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboarding } from "../OnboardingContext";
import type { OnboardingStackParamList } from "../OnboardingScreen";

type Props = NativeStackScreenProps<OnboardingStackParamList, "AccountCreate">;

export function AccountCreateScreen({ navigation }: Props) {
  const theme = useTheme();
  const onboarding = useOnboarding();
  const management = useAccountManagement();
  const [name, setName] = React.useState("");
  const [icon, setIcon] = React.useState("wallet-outline");
  const [color, setColor] = React.useState("#6366F1");
  const canSubmit = name.trim().length > 0;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
    <EntityEditLayout
      allColors={management.colorOptions}
      allIcons={management.iconOptions}
      background={theme.colors.background}
      canSubmit={canSubmit}
      emptyPreviewLabel="Account name"
      footer={
        <Button
          disabled={!canSubmit}
          mode="contained"
          onPress={() => {
            onboarding.addAccount({ name, icon, color });
            navigation.goBack();
          }}
        >
          Add account
        </Button>
      }
      iconGrid={{
        columns: 6,
        edgeInset: 0,
        iconSize: 18,
        itemSize: 42,
        spacing: 8,
      }}
      iconPickerVariant="account"
      isEditing={false}
      localColor={color}
      localIcon={icon}
      localName={name}
      namePlaceholder="e.g. HDFC Credit Card"
      onBack={() => navigation.goBack()}
      onChangeColor={setColor}
      onChangeIcon={setIcon}
      onChangeName={setName}
      onSubmit={() => {
        onboarding.addAccount({ name, icon, color });
        navigation.goBack();
      }}
      submitLabelCreate="Add account"
      theme={theme}
    />
    </SafeAreaView>
  );
}
