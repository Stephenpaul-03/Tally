import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { Switch, Text, useTheme } from "react-native-paper";
import { SettingsStyles } from "../Styles";

type ReminderRow = {
  formattedTime: string;
  selectedTime: Date;
};

type ReminderTime = {
  hour: number;
  minute: number;
};

type DailyReminderRowsProps = {
  enabled: boolean;
  reminders: ReminderRow[];
  onAddReminder: () => void | Promise<void>;
  onRemoveReminder: (index: number) => void | Promise<void>;
  onToggle: (enabled: boolean) => void | Promise<void>;
  onTimeChange: (time: ReminderTime, index: number) => void | Promise<void>;
};

const MAX_REMINDERS = 3;

export function DailyReminderRows({
  enabled,
  reminders,
  onAddReminder,
  onRemoveReminder,
  onToggle,
  onTimeChange,
}: DailyReminderRowsProps) {
  const theme = useTheme();
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [activeReminderIndex, setActiveReminderIndex] = useState(0);
  const activeReminder = reminders[activeReminderIndex] ?? reminders[0];

  const handleToggle = (nextEnabled: boolean) => {
    void onToggle(nextEnabled);
  };

  const openTimePicker = (index: number) => {
    const reminder = reminders[index];
    if (!reminder) return;

    setActiveReminderIndex(index);

    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        is24Hour: false,
        mode: "time",
        value: reminder.selectedTime,
        onChange: async (event, date) => {
          if (event.type !== "set" || !date) return;
          await onTimeChange(
            {
              hour: date.getHours(),
              minute: date.getMinutes(),
            },
            index,
          );
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
    await onTimeChange(
      {
        hour: nextDate.getHours(),
        minute: nextDate.getMinutes(),
      },
      activeReminderIndex,
    );
  };

  return (
    <>
      <View style={SettingsStyles.row}>
        <View style={SettingsStyles.rowLeft}>
          <View style={SettingsStyles.rowIcon}>
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
        <Switch value={enabled} onValueChange={handleToggle} />
      </View>

      {enabled && (
        <>
            {reminders.map((reminder, index) => (
              <Pressable
                key={`${reminder.formattedTime}-${index}`}
                onPress={() => openTimePicker(index)}
                style={({ pressed }) => [
                  SettingsStyles.row,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <View style={SettingsStyles.rowLeft}>
                  <Pressable
                    accessibilityLabel={`Remove reminder time ${index + 1}`}
                    disabled={reminders.length <= 1}
                    hitSlop={8}
                    onPress={(event) => {
                      event.stopPropagation();
                      void onRemoveReminder(index);
                    }}
                    style={SettingsStyles.rowIcon}
                  >
                    <MaterialCommunityIcons
                      name={reminders.length > 1 ? "minus" : "clock-outline"}
                      size={17}
                      color={
                        reminders.length > 1
                          ? theme.colors.error
                          : theme.colors.primary
                      }
                    />
                  </Pressable>
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
                    {index === 0
                      ? "Reminder time"
                      : `Reminder time ${index + 1}`}
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
                    {reminder.formattedTime}
                  </Text>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={16}
                    color={theme.colors.onSurfaceVariant}
                  />
                </View>
              </Pressable>
            ))}

            {reminders.length < MAX_REMINDERS && (
              <Pressable
                onPress={() => void onAddReminder()}
                style={({ pressed }) => [
                  SettingsStyles.row,
                  {
                    justifyContent: "center",
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                <View style={SettingsStyles.rowRight}>
                  <MaterialCommunityIcons
                    name="plus"
                    size={16}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[
                      SettingsStyles.rowTitle,
                      {
                        color: theme.colors.primary,
                        fontSize: 14,
                        fontWeight: "700",
                      },
                    ]}
                  >
                    Add more
                  </Text>
                </View>
              </Pressable>
            )}
        </>
      )}

      {Platform.OS !== "android" && isPickerVisible && activeReminder && (
        <DateTimePicker
          display="spinner"
          mode="time"
          onChange={(event, date) => {
            void handleIosChange(event, date);
          }}
          value={activeReminder.selectedTime}
        />
      )}
    </>
  );
}
