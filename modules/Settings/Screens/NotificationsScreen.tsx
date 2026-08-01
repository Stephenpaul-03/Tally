import { ActionRow } from "@/components/ActionRow";
import { PermissionRequestModal } from "@/components/alert/PermissionRequestModal";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { SheetCard } from "@/components/SheetCard";
import {
  DailyFinanceReminderTone,
  NotificationPermissionStatus,
} from "@/src/services/notifications";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Switch, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { SectionLabel } from "../Components/SectionLabel";
import { SettingsHeader } from "../Components/SettingsHeader";
import { useSettings } from "../hooks";
import type { SettingsStackParamList } from "../Navigation";
import { SettingsStyles } from "../Styles";

type NotificationsContentProps = {
  modal?: boolean;
  onBack: () => void;
};

type NotificationsModalProps = {
  visible: boolean;
  onDismiss: () => void;
};

const MAX_REMINDERS = 5;

const WEEKDAY_OPTIONS = [
  { id: 1, label: "Sun" },
  { id: 2, label: "Mon" },
  { id: 3, label: "Tue" },
  { id: 4, label: "Wed" },
  { id: 5, label: "Thu" },
  { id: 6, label: "Fri" },
  { id: 7, label: "Sat" },
] as const;

const TONE_OPTIONS = [
  { id: DailyFinanceReminderTone.Gentle, label: "Gentle" },
  { id: DailyFinanceReminderTone.Direct, label: "Direct" },
  { id: DailyFinanceReminderTone.Minimal, label: "Minimal" },
  { id: DailyFinanceReminderTone.Fun, label: "Fun" },
] as const;

function NotificationsContent({
  modal = false,
  onBack,
}: NotificationsContentProps) {
  const theme = useTheme();
  const {
    dailyReminderEnabled,
    dailyReminderTone,
    dailyReminderTimes,
    dailyReminderWeekdays,
    handleAddDailyReminderTime,
    handleRemoveDailyReminderTime,
    handleDailyReminderToggle,
    handleDailyReminderTimeChange,
    handleDailyReminderWeekdaysChange,
    handleDailyReminderToneChange,
    handleTestDailyReminder,
    handleNotificationPermissionPress,
    notificationAccessPromptOpen,
    notificationPermission,
    setNotificationAccessPromptOpen,
    handleRequestNotificationAccessAgain,
  } = useSettings();
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [activeReminderIndex, setActiveReminderIndex] = useState(0);
  const activeReminder =
    dailyReminderTimes[activeReminderIndex] ?? dailyReminderTimes[0];

  const openReminderPicker = (index: number) => {
    const reminder = dailyReminderTimes[index];
    if (!reminder) return;
    setActiveReminderIndex(index);

    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        is24Hour: false,
        mode: "time",
        value: reminder.selectedTime,
        onChange: async (event, date) => {
          if (event.type !== "set" || !date) return;
          await handleDailyReminderTimeChange(
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
    await handleDailyReminderTimeChange(
      {
        hour: nextDate.getHours(),
        minute: nextDate.getMinutes(),
      },
      activeReminderIndex,
    );
  };

  return (
    <>
      <SettingsHeader
        title="Notifications"
        onBack={onBack}
        modal={modal}
        rightAccessory={
          <HeaderNotificationActions
            status={notificationPermission.status}
            onStatusPress={handleNotificationPermissionPress}
            onTestPress={handleTestDailyReminder}
          />
        }
      />
      <ScrollView
        contentContainerStyle={SettingsStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SheetCard theme={theme}>
          <ActionRow
            icon="bell-outline"
            label="Reminders"
            description="Nudge to log expenses on selected days"
            onPress={() =>
              void handleDailyReminderToggle(!dailyReminderEnabled)
            }
            theme={theme}
            showChevron={false}
            rightElement={
              <Switch
                value={dailyReminderEnabled}
                onValueChange={handleDailyReminderToggle}
              />
            }
          />
        </SheetCard>

        <View style={{ opacity: dailyReminderEnabled ? 1 : 0.45 }}>
          <SectionLabel label="Days" />
        </View>
        <SheetCard
          theme={theme}
          style={{ opacity: dailyReminderEnabled ? 1 : 0.45 }}
        >
          <OptionBlock>
            <ConnectedDayGroup
              disabled={!dailyReminderEnabled}
              selectedIds={dailyReminderWeekdays}
              onChange={(next) => void handleDailyReminderWeekdaysChange(next)}
            />
          </OptionBlock>
        </SheetCard>

        <View style={{ opacity: dailyReminderEnabled ? 1 : 0.45 }}>
          <SectionLabel label="Tone" />
        </View>
        <SheetCard
          theme={theme}
          style={{ opacity: dailyReminderEnabled ? 1 : 0.45 }}
        >
          <OptionBlock>
            <ToneRadioGrid
              disabled={!dailyReminderEnabled}
              selectedId={dailyReminderTone}
              onSelect={(value) => void handleDailyReminderToneChange(value)}
            />
          </OptionBlock>
        </SheetCard>

        <View style={{ opacity: dailyReminderEnabled ? 1 : 0.45 }}>
          <SectionLabel label="Frequency" />
        </View>
        <SheetCard
          theme={theme}
          style={{ opacity: dailyReminderEnabled ? 1 : 0.45 }}
        >
          {dailyReminderTimes.slice(0, MAX_REMINDERS).map((reminder, index) => (
            <TimeRow
              key={`${reminder.formattedTime}-${index}`}
              disabled={!dailyReminderEnabled}
              icon={dailyReminderTimes.length > 1 ? "minus" : "clock-outline"}
              iconColor={
                dailyReminderTimes.length > 1
                  ? theme.colors.error
                  : theme.colors.primary
              }
              label={index === 0 ? "Reminder" : `Reminder ${index + 1}`}
              value={reminder.formattedTime}
              onIconPress={
                dailyReminderTimes.length > 1
                  ? () => void handleRemoveDailyReminderTime(index)
                  : undefined
              }
              onPress={() => openReminderPicker(index)}
            />
          ))}
          {dailyReminderTimes.length < MAX_REMINDERS ? (
            <Pressable
              disabled={!dailyReminderEnabled}
              onPress={() => void handleAddDailyReminderTime()}
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
                  Add reminder
                </Text>
              </View>
            </Pressable>
          ) : null}
        </SheetCard>
      </ScrollView>
      <PermissionRequestModal
        isOpen={notificationAccessPromptOpen}
        title="Allow Notifications"
        message="Tally needs notification access to schedule reminders."
        primaryLabel="Open Settings"
        secondaryLabel="Not Now"
        onPrimary={handleRequestNotificationAccessAgain}
        onSecondary={() => setNotificationAccessPromptOpen(false)}
      />
      {Platform.OS !== "android" && isPickerVisible && activeReminder ? (
        <DateTimePicker
          display="spinner"
          mode="time"
          onChange={(event, date) => {
            void handleIosChange(event, date);
          }}
          value={activeReminder.selectedTime}
        />
      ) : null}
    </>
  );
}

export function NotificationsModal({
  visible,
  onDismiss,
}: NotificationsModalProps) {
  const theme = useTheme();

  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onDismiss}
      presentation="sheet"
      contentContainerStyle={{
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: "92%",
        overflow: "hidden",
      }}
      includeBottomInset={false}
    >
      <View style={styles.handleWrap}>
        <View
          style={[
            styles.handle,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />
      </View>
      <NotificationsContent modal onBack={onDismiss} />
    </AnimatedPaperModal>
  );
}

export function NotificationsScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();

  return (
    <SafeAreaView
      style={[
        SettingsStyles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <NotificationsContent onBack={() => navigation.goBack()} />
    </SafeAreaView>
  );
}

function OptionBlock({ children }: { children: React.ReactNode }) {
  return <View style={styles.inlineBlock}>{children}</View>;
}

function HeaderNotificationActions({
  onStatusPress,
  onTestPress,
  status,
}: {
  onStatusPress: () => void;
  onTestPress: () => void;
  status: NotificationPermissionStatus;
}) {
  const theme = useTheme();
  const statusMeta =
    status === NotificationPermissionStatus.Granted
      ? {
          color: "#22c55e",
          label: "Notifications allowed",
        }
      : status === NotificationPermissionStatus.Denied
        ? {
            color: theme.colors.error,
            label: "Notifications blocked. Tap to open settings.",
          }
        : {
            color: theme.colors.tertiary,
            label: "Notifications not set. Tap to allow.",
          };

  return (
    <View style={styles.headerActions}>
      <Pressable
        accessibilityLabel={statusMeta.label}
        accessibilityRole="button"
        hitSlop={8}
        onPress={onStatusPress}
        style={({ pressed }) => [
          styles.permissionDotButton,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
            opacity: pressed ? 0.65 : 1,
          },
        ]}
      >
        <View
          style={[styles.permissionDot, { backgroundColor: statusMeta.color }]}
        />
      </Pressable>
      <Pressable
        accessibilityLabel="Send test notification"
        accessibilityRole="button"
        onPress={onTestPress}
        style={({ pressed }) => [
          styles.testNotificationPill,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
            opacity: pressed ? 0.65 : 1,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="bell-ring-outline"
          size={14}
          color={theme.colors.primary}
        />
        <Text
          numberOfLines={1}
          style={[
            styles.testNotificationPillText,
            { color: theme.colors.onSurface },
          ]}
        >
          Test
        </Text>
      </Pressable>
    </View>
  );
}

function ConnectedDayGroup({
  disabled = false,
  selectedIds,
  onChange,
}: {
  disabled?: boolean;
  selectedIds: readonly number[];
  onChange: (ids: number[]) => void;
}) {
  const theme = useTheme();
  const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);

  return (
    <View style={[styles.connectedGroup]}>
      {WEEKDAY_OPTIONS.map((option, index) => {
        const selected = selectedSet.has(option.id);

        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            disabled={disabled}
            onPress={() => {
              const next = selected
                ? selectedIds.filter((id) => id !== option.id)
                : [...selectedIds, option.id];

              if (next.length === 0) return;
              onChange([...next].sort((a, b) => a - b));
            }}
            style={({ pressed }) => [
              styles.connectedButton,
              {
                backgroundColor: selected
                  ? theme.colors.primaryContainer
                  : theme.colors.surface,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.connectedButtonText,
                {
                  color: selected
                    ? theme.colors.primary
                    : theme.colors.onSurfaceVariant,
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ToneRadioGrid({
  disabled = false,
  selectedId,
  onSelect,
}: {
  disabled?: boolean;
  selectedId: DailyFinanceReminderTone;
  onSelect: (id: DailyFinanceReminderTone) => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.radioGrid}>
      {TONE_OPTIONS.map((option) => {
        const selected = selectedId === option.id;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            disabled={disabled}
            onPress={() => onSelect(option.id)}
            style={({ pressed }) => [
              styles.radioOption,
              {
                backgroundColor: theme.colors.surface,
                borderColor: selected
                  ? theme.colors.primary
                  : theme.colors.outlineVariant,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={selected ? "radiobox-marked" : "radiobox-blank"}
              size={18}
              color={
                selected ? theme.colors.primary : theme.colors.onSurfaceVariant
              }
            />
            <Text
              numberOfLines={1}
              style={[
                styles.radioText,
                {
                  color: selected
                    ? theme.colors.primary
                    : theme.colors.onSurfaceVariant,
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TimeRow({
  disabled = false,
  icon,
  iconColor,
  label,
  onIconPress,
  value,
  onPress,
}: {
  disabled?: boolean;
  icon: string;
  iconColor?: string;
  label: string;
  onIconPress?: () => void;
  value: string;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        SettingsStyles.row,
        { opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <View style={SettingsStyles.rowLeft}>
        <Pressable
          disabled={!onIconPress || disabled}
          hitSlop={8}
          onPress={(event) => {
            event.stopPropagation();
            onIconPress?.();
          }}
          style={SettingsStyles.rowIcon}
        >
          <MaterialCommunityIcons
            name={icon as any}
            size={17}
            color={iconColor ?? theme.colors.primary}
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
          {label}
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
          {value}
        </Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={16}
          color={theme.colors.onSurfaceVariant}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  connectedButton: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: 42,
  },
  connectedButtonText: {
    fontSize: 13,
    fontWeight: "800",
  },
  connectedGroup: {
    borderRadius: 14,
    flexDirection: "row",
    overflow: "hidden",
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
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
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  inlineBlock: {
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  permissionDot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  permissionDotButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  radioGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  radioOption: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flexBasis: "48%",
    flexDirection: "row",
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  testNotificationPill: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    height: 34,
    paddingHorizontal: 10,
  },
  testNotificationPillText: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  radioText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
  },
});
