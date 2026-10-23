import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useTheme } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { useReducedMotion } from "react-native-reanimated";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { DesignText as Text } from "@/components/DesignText";
import { monthKey, monthLabel } from "@/modules/Insights/calculations";
export function MonthPickerSheet({
  visible,
  month,
  onChange,
  onDismiss,
  disabledMonth,
  maximumMonth,
}: {
  disabledMonth?: string;
  maximumMonth?: string;
  visible: boolean;
  month: string;
  onChange: (month: string) => void;
  onDismiss: () => void;
}) {
  const { colors: c } = useTheme();
  const reduceMotion = useReducedMotion();
  const [year, setYear] = React.useState(Number(month.slice(0, 4)));
  React.useEffect(() => {
    if (visible) setYear(Number(month.slice(0, 4)));
  }, [month, visible]);
  const unavailable = (value: string) =>
    value === disabledMonth || Boolean(maximumMonth && value > maximumMonth);
  const choose = (value: string) => {
    if (unavailable(value)) return;
    onChange(value);
    onDismiss();
  };
  const control = (
    name: "chevron-left" | "chevron-right" | "close",
    label: string,
    onPress: () => void,
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        minWidth: 44,
        minHeight: 44,
        borderRadius: 22,
        backgroundColor: c.surfaceVariant,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name={name} size={22} color={c.onSurface} />
    </Pressable>
  );
  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onDismiss}
      presentation="sheet"
      animationDuration={280}
      dismissDuration={220}
      reduceMotion={reduceMotion}
      contentContainerStyle={{
        backgroundColor: c.background,
        maxHeight: "80%",
        paddingTop: 12,
      }}
    >
      <View
        style={{
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: c.outlineVariant,
          alignSelf: "center",
          marginBottom: 12,
        }}
      />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "800", color: c.onSurface }}>
          Choose month
        </Text>
        {control("close", "Close month selector", onDismiss)}
      </View>
      <ScrollView
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ padding: 20, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {control("chevron-left", "Previous year", () =>
            setYear((y) => Math.max(1, y - 1)),
          )}
          <Text style={{ fontSize: 24, fontWeight: "800", color: c.onSurface }}>
            {year}
          </Text>
          {control("chevron-right", "Next year", () =>
            setYear((y) => Math.min(9999, y + 1)),
          )}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {Array.from({ length: 12 }, (_, index) => {
            const key = `${String(year).padStart(4, "0")}-${String(index + 1).padStart(2, "0")}`,
              selected = key === month;
            return (
              <Pressable
                key={key}
                accessibilityRole="radio"
                accessibilityLabel={monthLabel(key)}
                accessibilityState={{
                  checked: selected,
                  disabled: unavailable(key),
                }}
                disabled={unavailable(key)}
                onPress={() => choose(key)}
                style={{
                  opacity: unavailable(key) ? 0.35 : 1,
                  flexBasis: "30%",
                  flexGrow: 1,
                  minHeight: 52,
                  padding: 10,
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 18,
                  backgroundColor: selected
                    ? c.primaryContainer
                    : c.surfaceVariant,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: selected ? c.onPrimaryContainer : c.onSurface,
                  }}
                >
                  {new Date(year, index, 1).toLocaleDateString(undefined, {
                    month: "short",
                  })}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={unavailable(monthKey(new Date()))}
          accessibilityState={{ disabled: unavailable(monthKey(new Date())) }}
          onPress={() => choose(monthKey(new Date()))}
          style={{
            minHeight: 44,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: c.primary, fontWeight: "700" }}>
            Go to this month
          </Text>
        </Pressable>
      </ScrollView>
    </AnimatedPaperModal>
  );
}
