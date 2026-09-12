import { AnimatedPaperModal } from "@/components/modal/modal";
import { useAppSelector } from "@/hooks/Redux";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import { budgetStyles } from "../Styles";

type Props = {
  visible: boolean;
  onDismiss: () => void;
  name: string;
  icon: string;
  color: string;
  budget: number;
  last30DaysSpent: number;
  onSaveBudget: (value: string) => Promise<void> | void;
  onRemoveBudget: () => Promise<void> | void;
  bg?: string;
  outline?: string;
  textColor?: string;
  muted?: string;
};

function getSuggestedBudgetAmount(last30DaysSpent: number) {
  if (last30DaysSpent <= 0) return 0;
  return Math.round(last30DaysSpent / 500) * 500;
}

export function BudgetDetailsSheet({
  visible,
  onDismiss,
  name,
  icon,
  color,
  budget,
  last30DaysSpent,
  onSaveBudget,
  onRemoveBudget,
  bg,
  outline,
  textColor,
  muted,
}: Props) {
  const theme = useTheme();
  const { minimalIconsEnabled } = useAddonPrefs();
  const activeWorkspace = useAppSelector(selectActiveWorkspace);
  const currencySymbol = activeWorkspace?.currencySymbol ?? "₹";
  const background = bg ?? theme.colors.background;
  const border = outline ?? theme.colors.outlineVariant;
  const text = textColor ?? theme.colors.onSurface;
  const subdued = muted ?? theme.colors.onSurfaceVariant;
  const [draft, setDraft] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [isRemoving, setIsRemoving] = React.useState(false);
  const suggestedBudget = getSuggestedBudgetAmount(last30DaysSpent);
  const usingSuggestedBudget = budget <= 0 && suggestedBudget > 0;
  const headerSubtitle =
    budget > 0
      ? "Budget details"
      : last30DaysSpent > 0
        ? `Last 30 days: ${currencySymbol}${Math.round(
            last30DaysSpent,
          ).toLocaleString("en-IN")}`
        : "No budget yet";

  React.useEffect(() => {
    if (visible) {
      setDraft(
        budget > 0
          ? String(budget)
          : suggestedBudget > 0
            ? String(suggestedBudget)
            : "",
      );
      setIsSaving(false);
      setIsRemoving(false);
    }
  }, [budget, suggestedBudget, visible]);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onSaveBudget(draft);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (isRemoving) return;
    setIsRemoving(true);
    try {
      await onRemoveBudget();
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onDismiss}
      presentation="sheet"
      keyboardAware
      includeBottomInset
      contentContainerStyle={{
        backgroundColor: background,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        borderColor: border,
        borderTopWidth: 0.5,
        maxHeight: "88%",
      }}
    >
      <View style={budgetStyles.sheetHandleWrap}>
        <View style={[budgetStyles.sheetHandle, { backgroundColor: border }]} />
      </View>

      <View style={budgetStyles.sheetHeader}>
        <View style={budgetStyles.sheetTitleRow}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              flex: 1,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: minimalIconsEnabled
                  ? theme.colors.background
                  : `${color}22`,
                borderColor: minimalIconsEnabled
                  ? theme.colors.elevation.level1
                  : "transparent",
                borderWidth: minimalIconsEnabled ? 1 : 0,
              }}
            >
              <MaterialCommunityIcons
                name={icon as any}
                size={22}
                color={minimalIconsEnabled ? theme.colors.primary : color}
              />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                style={[budgetStyles.sheetTitle, { color: text }]}
                numberOfLines={1}
              >
                {name}
              </Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.78}
                style={{ color: subdued, fontSize: 12 }}
              >
                {headerSubtitle}
              </Text>
            </View>
          </View>
          <View style={budgetStyles.sheetHeaderActions}>
            {budget > 0 ? (
              <Pressable
                onPress={handleRemove}
                disabled={isSaving || isRemoving}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Clear budget"
                style={({ pressed }) => [
                  budgetStyles.sheetIconButton,
                  {
                    backgroundColor: theme.colors.elevation.level1,
                    borderColor: border,
                    opacity: pressed || isRemoving ? 0.65 : 1,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="close-circle-outline"
                  size={18}
                  color={theme.colors.error}
                />
              </Pressable>
            ) : null}
            <Pressable
              onPress={onDismiss}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close budget details"
              style={({ pressed }) => [
                budgetStyles.sheetIconButton,
                budgetStyles.sheetCloseButton,
                {
                  backgroundColor: theme.colors.elevation.level1,
                  borderColor: border,
                  opacity: pressed ? 0.65 : 1,
                },
              ]}
            >
              <MaterialCommunityIcons name="close" size={18} color={subdued} />
            </Pressable>
          </View>
        </View>
      </View>

      <View
        style={[
          budgetStyles.sheetBody,
          {
            borderTopWidth: 0.5,
            borderTopColor: border,
            paddingBottom: 32,
          },
        ]}
      >
        <View style={budgetStyles.sheetFieldLabelRow}>
          <Text style={[budgetStyles.sheetFieldLabel, { color: subdued }]}>
            Budget amount
          </Text>
          {usingSuggestedBudget ? (
            <Text
              numberOfLines={1}
              style={[
                budgetStyles.sheetFieldHint,
                { color: theme.colors.primary },
              ]}
            >
              Amount calculated based on last 30 days
            </Text>
          ) : null}
        </View>
        <TextInput
          mode="outlined"
          value={draft}
          onChangeText={setDraft}
          keyboardType="numeric"
          placeholder="0"
          left={
            <TextInput.Icon
              icon={() => (
                <Text
                  style={{ color: subdued, fontSize: 16, fontWeight: "700" }}
                >
                  {currencySymbol}
                </Text>
              )}
              forceTextInputFocus={false}
            />
          }
          style={budgetStyles.editField}
          contentStyle={{ paddingVertical: 14 }}
        />
        <Button
          mode="contained"
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving || isRemoving}
          buttonColor={theme.colors.primary}
        >
          Save
        </Button>
      </View>
    </AnimatedPaperModal>
  );
}
