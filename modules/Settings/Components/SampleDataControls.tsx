import React, { useRef, useState } from "react";
import { View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { useAppDispatch, useAppSelector } from "@/hooks/Redux";
import { toast } from "@/components/toast/ToastProvider";
import { selectTransactions, setInsightsSampleDataAsync } from "@/modules/Core/Slices/TransactionSlice";
import { SAMPLE_ID_PREFIX } from "@/modules/Insights/sampleData";

export function SampleDataControls() {
  const theme = useTheme();
  const mutedStyle = { color: theme.colors.onSurfaceVariant, fontSize: 13, lineHeight: 19 };
  const dispatch = useAppDispatch();
  const hasSamples = useAppSelector(selectTransactions).some(row => row.id.startsWith(SAMPLE_ID_PREFIX));
  const busy = useRef(false);
  const [action, setAction] = useState<"load" | "remove" | null>(null);
  const update = async (enabled: boolean) => {
    if (busy.current) return;
    busy.current = true;
    setAction(enabled ? "load" : "remove");
    try {
      const count = await dispatch(setInsightsSampleDataAsync(enabled)).unwrap();
      toast.success(enabled ? `${count} sample entries loaded` : "Sample entries removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (error as { message?: string })?.message || "Couldn't update sample data");
    } finally {
      busy.current = false;
      setAction(null);
    }
  };
  return <View style={{ gap: 8, paddingVertical: 12 }}>
    <Text style={mutedStyle}>Preview insights · Development only</Text>
    <Text style={mutedStyle}>Sample income and spending for this month and the previous two months, using your categories, accounts, and currency. Your existing entries and budgets are kept.</Text>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      <Button mode="outlined" icon="database-plus-outline" loading={action === "load"}
        disabled={action !== null} onPress={() => update(true)}>
        {hasSamples ? "Reload 3 months of sample data" : "Add 3 months of sample data"}
      </Button>
      {hasSamples ? <Button mode="text" loading={action === "remove"} disabled={action !== null}
        onPress={() => update(false)}>Remove sample data</Button> : null}
    </View>
  </View>;
}
