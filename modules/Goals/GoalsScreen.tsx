import { ledgerMoney } from "@/modules/Main/presentation";
import { GoalCard, GoalsEmptyCard } from "./GoalCard";
import { tonalButtonSurface } from "@/theme/surfaceTreatment";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Button, TextInput, useTheme } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { DesignText as Text } from "@/components/DesignText";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { AlertModal } from "@/components/alert/AlertModal";
import { SettingsPage } from "@/modules/Settings/Components/SettingsPage";
import { SettingsHeader } from "@/modules/Settings/Components/SettingsHeader";
import { useAppSelector } from "@/hooks/Redux";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import { EntityEditLayout } from "@/components/EntityEditLayout";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import options from "@/data/management-options.json";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { toast } from "@/components/toast/ToastProvider";
import { goalProgress, type Goal } from "./model";
import { updateGoals, useGoals } from "./store";
export function GoalsScreen() {
  const theme = useTheme<ExtendedMD3Theme>();
  const c = theme.colors;
  const navigation = useNavigation();
  const workspace = useAppSelector(selectActiveWorkspace);
  const workspaceId = workspace?.id ?? "personal";
  const { goals, error } = useGoals(workspaceId);
  const [editing, setEditing] = React.useState<Goal | "new" | null>(null);
  const [progress, setProgress] = React.useState<Goal | null>(null);
  const [deleting, setDeleting] = React.useState<Goal | null>(null);
  const [name, setName] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [icon, setIcon] = React.useState<string>("target");
  const [color, setColor] = React.useState(options.colors[0]);
  const [amount, setAmount] = React.useState("");
  const [date, setDate] = React.useState("");
  const [calendar, setCalendar] = React.useState(false);
  const [addition, setAddition] = React.useState("");
  const [formError, setFormError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const open = (goal: Goal | "new") => {
    setEditing(goal);
    setName(goal === "new" ? "" : goal.name);
    setReason(goal === "new" ? "" : goal.reason);
    setIcon(goal === "new" ? "target" : goal.icon);
    setColor(
      goal === "new"
        ? options.colors.find((c) => !goals.some((g) => g.color === c)) ||
            options.colors[0]
        : goal.color || c.primary,
    );
    setAmount(goal === "new" ? "" : String(goal.target));
    setDate(goal === "new" ? "" : goal.deadline || "");
    setFormError("");
  };
  const save = async () => {
    const target = Number(amount);
    if (
      !name.trim() ||
      !Number.isFinite(target) ||
      target <= 0 ||
      target >= 1e15
    ) {
      setFormError("Enter a name and an amount greater than zero");
      return;
    }
    if (
      date &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(new Date(`${date}T12:00:00`).getTime()) ||
        new Date(`${date}T12:00:00`).toISOString().slice(0, 10) !== date)
    ) {
      setFormError("Use a valid date in YYYY-MM-DD format");
      return;
    }
    setBusy(true);
    try {
      const now = new Date().toISOString();
      const old = editing !== "new" ? editing : null;
      const goal: Goal = {
        id:
          old?.id ||
          `goal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        workspaceId,
        name: name.trim().slice(0, 60),
        reason: reason.trim().slice(0, 300),
        icon,
        color,
        target,
        saved: old?.saved ?? 0,
        currencyCode: old?.currencyCode || workspace?.currencyCode || "INR",
        currencySymbol: old?.currencySymbol || workspace?.currencySymbol || "₹",
        deadline: date || undefined,
        createdAt: old?.createdAt || now,
        updatedAt: now,
      };
      await updateGoals((all) => [
        ...all.filter((g) => g.id !== goal.id),
        goal,
      ]);
      setEditing(null);
      toast.success("Goal saved");
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not save goal");
    } finally {
      setBusy(false);
    }
  };
  const addProgress = async () => {
    const value = Number(addition);
    if (
      !progress ||
      !Number.isFinite(value) ||
      value <= 0 ||
      progress.saved + value >= 1e15
    ) {
      setFormError("Enter a progress amount greater than zero");
      return;
    }
    setBusy(true);
    try {
      await updateGoals((all) =>
        all.map((g) =>
          g.id === progress.id
            ? {
                ...g,
                saved: Math.round((g.saved + value) * 1e10) / 1e10,
                updatedAt: new Date().toISOString(),
              }
            : g,
        ),
      );
      setProgress(null);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not save progress");
    } finally {
      setBusy(false);
    }
  };
  const activeGoals = goals.filter((g) => !goalProgress(g).complete);
  const iconGrid = {
    columns: 6,
    itemSize: 44,
    iconSize: 22,
    spacing: 10,
    edgeInset: 2,
  };
  const allIcons = [
    ...new Set([
      ...options.categoryIcons,
      ...options.accountIcons,
      ...options.fallbackCategoryIcons,
    ]),
  ];
  const closeEditor = () => {
    if (!busy) {
      setEditing(null);
      setCalendar(false);
    }
  };
  const fieldStyle = { backgroundColor: tonalButtonSurface(theme) };
  return (
    <SettingsPage style={{ backgroundColor: c.background }}>
      <SettingsHeader
        title="Goals"
        onBack={() => navigation.goBack()}
        rightIcon="plus"
        rightAccessibilityLabel="Add goal"
        onRightPress={() => open("new")}
      />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
      >
        <View style={{ gap: 6, paddingBottom: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: c.onSurface }}>
            Make room for what matters
          </Text>
          <Text style={{ fontSize: 13, color: c.onSurfaceVariant }}>
            {goals.length
              ? `${activeGoals.length} active · ${goals.length - activeGoals.length} reached`
              : "Name it. Set a target. Build it, one step at a time."}
          </Text>
        </View>
        {!!error && <Text style={{ color: c.error }}>{error}</Text>}
        {!goals.length && <GoalsEmptyCard onCreate={() => open("new")} />}
        {goals.map(goal => <GoalCard key={goal.id} goal={goal} onEdit={() => open(goal)} onProgress={() => {
          setProgress(goal); setAddition(""); setFormError("");
        }} />)}
        {!!goals.length && (
          <Text style={{ fontSize: 12, color: c.onSurfaceVariant }}>
            Progress is recorded manually. It does not move money or add
            transactions.
          </Text>
        )}
      </ScrollView>
      <EntityEditLayout
        presentation="modal"
        visible={Boolean(editing)}
        dismissable={!busy}
        disabled={busy}
        localName={name}
        localIcon={icon}
        localColor={color}
        onChangeName={setName}
        onChangeIcon={setIcon}
        onChangeColor={setColor}
        allColors={options.colors}
        allIcons={allIcons}
        iconGrid={iconGrid}
        nameLimit={60}
        nameLabel="Goal name"
        namePlaceholder="e.g. Emergency fund"
        emptyPreviewLabel="Your goal"
        headerSubtitle={
          editing === "new"
            ? "Give your goal a name and a look"
            : "Make this goal yours"
        }
        canSubmit={!busy && !!name.trim() && Number(amount) > 0}
        isEditing={editing !== "new"}
        submitLabelCreate="Create goal"
        submitLabelEdit="Save goal"
        onSubmit={save}
        onBack={closeEditor}
        theme={theme}
        background={c.background}
        deleteAccessory={
          editing && editing !== "new" ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete goal"
              onPress={() => {
                setDeleting(editing);
                setEditing(null);
              }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: c.errorContainer,
              }}
            >
              <Icon name="delete-outline" size={21} color={c.error} />
            </Pressable>
          ) : undefined
        }
        additionalFields={
          <View style={{ gap: 16, backgroundColor: c.surface, borderRadius: theme.expressive ? 24 : 16, padding: 16 }}>
            <Text style={{ color: c.onSurface, fontSize: 18, fontWeight: "800" }}>The plan</Text>
            <TextInput
              label="Why this goal matters (optional)"
              accessibilityLabel="Goal reason"
              value={reason}
              onChangeText={setReason}
              maxLength={300}
              mode="outlined"
              multiline
              style={fieldStyle}
            />
            <TextInput
              label={`Target amount (${editing && editing !== "new" ? editing.currencySymbol : workspace?.currencySymbol || "₹"})`}
              accessibilityLabel="Goal target amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              mode="outlined"
              style={fieldStyle}
            />
            <TextInput
              label="Target date (optional)"
              accessibilityLabel="Goal target date"
              placeholder="YYYY-MM-DD"
              value={date}
              onChangeText={setDate}
              mode="outlined"
              style={fieldStyle}
              right={
                <TextInput.Icon
                  icon="calendar"
                  onPress={() => setCalendar(true)}
                />
              }
            />
            {calendar && (
              <DateTimePicker
                value={
                  date &&
                  Number.isFinite(new Date(`${date}T12:00:00`).getTime())
                    ? new Date(`${date}T12:00:00`)
                    : new Date()
                }
                mode="date"
                onChange={(_, selected) => {
                  setCalendar(false);
                  if (selected)
                    setDate(
                      `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, "0")}-${String(selected.getDate()).padStart(2, "0")}`,
                    );
                }}
              />
            )}
            {!!formError && (
              <Text accessibilityRole="alert" style={{ color: c.error }}>
                {formError}
              </Text>
            )}
          </View>
        }
      />
      <AnimatedPaperModal
        visible={Boolean(progress)}
        onDismiss={() => !busy && setProgress(null)}
        presentation="sheet"
        keyboardAware
        dismissable={!busy}
        contentContainerStyle={{
          backgroundColor: c.background,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          maxHeight: "90%",
        }}
      >
        <KeyboardAwareScrollView
          bottomOffset={28}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 28 }}
        >
          <SettingsHeader
            title="Add progress"
            modal
            onBack={() => !busy && setProgress(null)}
          />
          {progress ? <GoalCard goal={progress} compact /> : null}
          <Text style={{ color: c.onSurfaceVariant, fontSize: 13 }}>Record money you’ve set aside. This won’t create a transaction or move money between accounts.</Text>
          <TextInput
            label={`Amount saved (${progress?.currencySymbol || ""})`}
            accessibilityLabel="Goal progress amount"
            value={addition}
            onChangeText={setAddition}
            keyboardType="decimal-pad"
            mode="outlined"
            style={fieldStyle}
          />
          {progress && Number.isFinite(Number(addition)) && Number(addition) > 0 ? <View style={{ padding: 16, borderRadius: 16, backgroundColor: c.surface, gap: 4 }}>
            <Text style={{ color: c.onSurfaceVariant, fontSize: 12 }}>Saved after this update</Text>
            <Text style={{ color: c.onSurface, fontWeight: "800", fontSize: 24 }}>{ledgerMoney(progress.saved + Number(addition), progress.currencyCode, progress.currencySymbol)}</Text>
          </View> : null}
          {!!formError && (
            <Text accessibilityRole="alert" style={{ color: c.error }}>
              {formError}
            </Text>
          )}
          <Button
            mode="contained"
            contentStyle={{ minHeight: 48 }}
            loading={busy}
            disabled={busy || !Number.isFinite(Number(addition)) || Number(addition) <= 0}
            onPress={addProgress}
          >
            Save progress
          </Button>
        </KeyboardAwareScrollView>
      </AnimatedPaperModal>
      <AlertModal
        isOpen={Boolean(deleting)}
        title="Delete goal?"
        message="This removes the goal and its recorded progress. Your transactions stay unchanged."
        destructive
        confirmLabel="Delete"
        cancelLabel="Keep goal"
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          try {
            await updateGoals((all) =>
              all.filter((g) => g.id !== deleting?.id),
            );
            setDeleting(null);
          } catch {
            toast.error("Could not delete goal. Try again.");
          }
        }}
      />
    </SettingsPage>
  );
}
