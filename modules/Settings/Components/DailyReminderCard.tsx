import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { Switch, Text, useTheme } from "react-native-paper";
import { SettingsStyles } from "../Styles";

type DailyReminderRowsProps = {
  enabled: boolean;
  formattedTime: string;
  onToggle: (enabled: boolean) => void | Promise<void>;
  onTimeChange: (time: {
    hour: number;
    minute: number;
  }) => void | Promise<void>;
  selectedTime: Date;
};

export function DailyReminderRows({
  enabled,
  formattedTime,
  onToggle,
  onTimeChange,
  selectedTime,
}: DailyReminderRowsProps) {
  const theme = useTheme();
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const openTimePicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        is24Hour: false,
        mode: "time",
        value: selectedTime,
        onChange: async (event, date) => {
          if (event.type !== "set" || !date) return;
          await onTimeChange({
            hour: date.getHours(),
            minute: date.getMinutes(),
          });
        },
      });
      return;
    }
    setIsPickerVisible(true);
  };

  const handleIosChange = async (
    event: DateTimePickerEvent,
    nextDate?: Date,
  ) => {
    setIsPickerVisible(false);
    if (event.type !== "set" || !nextDate) return;
    await onTimeChange({
      hour: nextDate.getHours(),
      minute: nextDate.getMinutes(),
    });
  };

  return (
    <>
      {/* Row 1 — toggle */}
      <View style={SettingsStyles.row}>
        <View style={SettingsStyles.rowLeft}>
          <View
            style={[
              SettingsStyles.rowIcon,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <MaterialCommunityIcons
              name="bell-outline"
              size={17}
              color={theme.colors.primary}
            />
          </View>
          <View>
            <Text
              style={[
                SettingsStyles.rowTitle,
                {
                  color: theme.colors.onSurface,
                  fontSize: 14,
                  fontWeight: "700",
                },
              ]}
            >
              Daily reminder
            </Text>
            <Text
              style={[
                SettingsStyles.rowSub,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Nudge to log expenses
            </Text>
          </View>
        </View>
        <Switch value={enabled} onValueChange={(v) => void onToggle(v)} />
      </View>

      {/* Divider */}
      <View
        style={[
          SettingsStyles.rowDivider,
          { backgroundColor: theme.colors.outlineVariant },
        ]}
      />

      {/* Row 2 — time (always visible, dimmed when disabled) */}
      <Pressable
        onPress={enabled ? openTimePicker : undefined}
        style={({ pressed }) => [
          SettingsStyles.row,
          { opacity: !enabled ? 0.4 : pressed ? 0.6 : 1 },
        ]}
      >
        <View style={SettingsStyles.rowLeft}>
          <View
            style={[
              SettingsStyles.rowIcon,
              {
                backgroundColor: theme.colors.surfaceVariant,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="clock-outline"
              size={17}
              color={theme.colors.primary}
            />
          </View>
          <Text
            style={[
              SettingsStyles.rowTitle,
              {
                color: theme.colors.onSurface,
                fontSize: 14,
                fontWeight: "700",
              },
            ]}
          >
            Reminder time
          </Text>
        </View>
        <View style={SettingsStyles.rowRight}>
          <Text
            style={[
              SettingsStyles.badge,
              {
                color: theme.colors.onSurface,
                backgroundColor: theme.colors.surfaceVariant,
                borderColor: theme.colors.primary,
              },
            ]}
          >
            {formattedTime}
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={16}
            color={theme.colors.onSurfaceVariant}
          />
        </View>
      </Pressable>

      {/* iOS inline picker */}
      {Platform.OS !== "android" && isPickerVisible && (
        <DateTimePicker
          display="spinner"
          mode="time"
          onChange={(event, date) => {
            void handleIosChange(event, date);
          }}
          value={selectedTime}
        />
      )}
    </>
  );
}
