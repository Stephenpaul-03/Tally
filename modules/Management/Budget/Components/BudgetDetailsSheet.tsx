import { AnimatedPaperModal } from "@/components/modal/modal";
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
  onSaveBudget: (value: string) => Promise<void> | void;
  onRemoveBudget: () => Promise<void> | void;
  bg?: string;
  outline?: string;
  textColor?: string;
  muted?: string;
};

export function BudgetDetailsSheet({
  visible,
  onDismiss,
  name,
  icon,
  color,
  budget,
  onSaveBudget,
  onRemoveBudget,
  bg,
  outline,
  textColor,
  muted,
}: Props) {
  const theme = useTheme();
  const background = bg ?? theme.colors.elevation.level2;
  const border = outline ?? theme.colors.outlineVariant;
  const text = textColor ?? theme.colors.onSurface;
  const subdued = muted ?? theme.colors.onSurfaceVariant;
  const [draft, setDraft] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [isRemoving, setIsRemoving] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      setDraft(budget > 0 ? String(budget) : "");
      setIsSaving(false);
      setIsRemoving(false);
    }
  }, [budget, visible]);

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
      contentContainerStyle={{
        backgroundColor: background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${color}22`,
              }}
            >
              <MaterialCommunityIcons name={icon as any} size={22} color={color} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[budgetStyles.sheetTitle, { color: text }]} numberOfLines={1}>
                {name}
              </Text>
              <Text style={{ color: subdued, fontSize: 12 }}>
                Budget details
              </Text>
            </View>
          </View>
          <Pressable onPress={onDismiss} hitSlop={12}>
            <MaterialCommunityIcons name="close" size={22} color={subdued} />
          </Pressable>
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
        <Text style={[budgetStyles.sheetFieldLabel, { color: subdued }]}>
          Budget amount
        </Text>
        <TextInput
          mode="outlined"
          value={draft}
          onChangeText={setDraft}
          keyboardType="numeric"
          placeholder="0"
          left={<TextInput.Affix text="₹" />}
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
        <Button
          mode="text"
          onPress={handleRemove}
          loading={isRemoving}
          disabled={isSaving || isRemoving}
          textColor={theme.colors.error}
        >
          Clear budget
        </Button>
      </View>
    </AnimatedPaperModal>
  );
}
