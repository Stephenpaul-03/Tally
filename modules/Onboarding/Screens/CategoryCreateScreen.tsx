import { EntityEditLayout } from "@/components/EntityEditLayout";
import { useCategoryManagement } from "@/hooks/use-category-manamgement";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { Button, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboarding } from "../OnboardingContext";
import type { OnboardingStackParamList } from "../OnboardingScreen";

type Props = NativeStackScreenProps<OnboardingStackParamList, "CategoryCreate">;

export function CategoryCreateScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const onboarding = useOnboarding();
  const management = useCategoryManagement(route.params.type);
  const [name, setName] = React.useState("");
  const [icon, setIcon] = React.useState(
    route.params.type === "income" ? "trending-up" : "tag-outline",
  );
  const [color, setColor] = React.useState(
    route.params.type === "income" ? "#16A34A" : "#F97316",
  );
  const canSubmit = name.trim().length > 0;
  const add = () => {
    const item = { name, icon, color };
    if (route.params.type === "income") onboarding.addIncomeCategory(item);
    else onboarding.addExpenseCategory(item);
    navigation.goBack();
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
    <EntityEditLayout
      allColors={management.colorOptions}
      allIcons={management.iconOptions}
      background={theme.colors.background}
      canSubmit={canSubmit}
      emptyPreviewLabel="Category name"
      footer={
        <Button disabled={!canSubmit} mode="contained" onPress={add}>
          Add category
        </Button>
      }
      iconGrid={{
        columns: 6,
        edgeInset: 0,
        iconSize: 18,
        itemSize: 42,
        spacing: 8,
      }}
      iconPickerVariant="category"
      isEditing={false}
      localColor={color}
      localIcon={icon}
      localName={name}
      namePlaceholder="e.g. Groceries"
      onBack={() => navigation.goBack()}
      onChangeColor={setColor}
      onChangeIcon={setIcon}
      onChangeName={setName}
      onSubmit={add}
      submitLabelCreate="Add category"
      theme={theme}
    />
    </SafeAreaView>
  );
}
