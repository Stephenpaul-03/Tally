import { ledgerMoney } from "@/modules/Main/presentation";
import { GoalCard, GoalsEmptyCard } from "./GoalCard";
import { tonalButtonSurface } from "@/theme/surfaceTreatment";
import React from "react";
import { Keyboard, Pressable, ScrollView, TextInput as NativeTextInput, View } from "react-native";
import { Button, SegmentedButtons, TextInput, useTheme } from "react-native-paper";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { InlineDatePicker } from "@/components/datepicker/DatePickerModal";
import { useBreakpoint } from "@/hooks/use-breakpoints";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { DesignText as Text } from "@/components/DesignText";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { AlertModal } from "@/components/alert/AlertModal";
import { SettingsPage } from "@/modules/Settings/Components/SettingsPage";
import { SettingsHeader } from "@/modules/Settings/Components/SettingsHeader";
import { useAppSelector } from "@/hooks/Redux";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import { EntityEditLayout } from "@/components/EntityEditLayout";
import options from "@/data/management-options.json";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { toast } from "@/components/toast/ToastProvider";
import { adjustGoalProgress, type Goal } from "./model";
import { updateGoals, useGoals } from "./store";
export function GoalsScreen() {
  const theme = useTheme<ExtendedMD3Theme>();
  const c = theme.colors;
  const { width, height, isMobileLayout } = useBreakpoint();
  const { bottom, top } = useSafeAreaInsets();
  const navigation = useNavigation();
  const workspace = useAppSelector(selectActiveWorkspace);
  const workspaceId = workspace?.id ?? "personal";
  const { goals, error } = useGoals(workspaceId);
  const [editing, setEditing] = React.useState<Goal | "new" | null>(null);
  const [progress, setProgress] = React.useState<Goal | null>(null);
  const progressScroll = React.useRef<ScrollView>(null);
  const [keyboardTop, setKeyboardTop] = React.useState<number | null>(null);
  const progressKeyboardInset = keyboardTop === null ? 0 : Math.max(0, height - keyboardTop);
  React.useEffect(() => {
    if (!progress) { setKeyboardTop(null); return; }
    const show = Keyboard.addListener("keyboardDidShow", event => setKeyboardTop(event.endCoordinates.screenY));
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardTop(null);
      progressScroll.current?.scrollTo({ y: 0, animated: false });
    });
    return () => { show.remove(); hide.remove(); };
  }, [progress]);
  const [deleting, setDeleting] = React.useState<Goal | null>(null);
  const [name, setName] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [icon, setIcon] = React.useState<string>("target");
  const [color, setColor] = React.useState(options.colors[0]);
  const [amount, setAmount] = React.useState("");
  const [date, setDate] = React.useState("");
  const [calendar, setCalendar] = React.useState(false);
  const [calendarMonth, setCalendarMonth] = React.useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = React.useState(new Date().getFullYear());
  const openCalendar = () => {
    Keyboard.dismiss();
    const parsed = new Date(`${date}T12:00:00`);
    const selected = date && Number.isFinite(parsed.getTime()) ? parsed : new Date();
    setCalendarMonth(selected.getMonth());
    setCalendarYear(selected.getFullYear());
    setCalendar(true);
  };
  const [progressDirection, setProgressDirection] = React.useState<"add" | "remove">("add");
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
  const projection = React.useMemo(() => {
    if (!progress || !addition.trim()) return { value: null, error: "" };
    try { return { value: adjustGoalProgress(progress.saved, Number(addition), progressDirection), error: "" }; }
    catch (error) { return { value: null, error: error instanceof Error ? error.message : "Check the amount." }; }
  }, [progress, addition, progressDirection]);
  const closeProgress = () => {
    if (busy) return;
    Keyboard.dismiss();
    setProgress(null);
  };
  const addProgress = async () => {
    if (!progress || projection.value === null) {
      setFormError(projection.error || "Enter an amount greater than zero.");
      return;
    }
    setBusy(true);
    try {
      await updateGoals(all => {
        if (!all.some(goal => goal.id === progress.id)) throw new Error("This goal no longer exists. Close this sheet and reopen Goals.");
        return all.map(goal => goal.id === progress.id ? {
          ...goal, saved: adjustGoalProgress(goal.saved, Number(addition), progressDirection), updatedAt: new Date().toISOString(),
        } : goal);
      });
      Keyboard.dismiss();
      setProgress(null);
      toast.success(progressDirection === "add" ? "Progress added" : "Progress removed");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not save progress");
    } finally { setBusy(false); }
  };
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
    if (calendar) { setCalendar(false); return; }
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
        contentContainerStyle={{ flexGrow: 1, padding: 16, gap: 14, paddingBottom: goals.length ? 40 : 16, justifyContent: goals.length ? "flex-start" : "center" }}
      >
        {!!error && <Text style={{ color: c.error }}>{error}</Text>}
        {!goals.length && <GoalsEmptyCard active={!editing && !progress && !deleting} onCreate={() => open("new")} />}
        {goals.map(goal => <GoalCard key={goal.id} goal={goal} onEdit={() => open(goal)} onProgress={() => {
          setProgress(goal); setProgressDirection("add"); setAddition(""); setFormError("");
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
        dismissable={!busy && !calendar}
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
        pickerLayout="columns"
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
        afterNameFields={
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
              <View style={{ flex: 1, minWidth: 0, gap: 8 }}>
                <Text style={{ color: c.onSurface, fontWeight: "700", fontSize: 14 }}>Target amount</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, height: 48, paddingHorizontal: 14, borderRadius: theme.expressive ? 24 : 14, backgroundColor: tonalButtonSurface(theme) }}>
                  <Text style={{ color: c.onSurfaceVariant }}>{editing && editing !== "new" ? editing.currencySymbol : workspace?.currencySymbol || "₹"}</Text>
                  <NativeTextInput accessibilityLabel="Goal target amount" editable={!busy} value={amount} onChangeText={setAmount}
                    keyboardType="decimal-pad" placeholder="Amount" placeholderTextColor={c.onSurfaceVariant}
                    style={{ flex: 1, minWidth: 0, fontSize: 15, paddingVertical: 0, color: c.onSurface }} />
                </View>
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 8 }}>
                <Text style={{ color: c.onSurface, fontWeight: "700", fontSize: 14 }}>Target date</Text>
                <View style={{ flexDirection: "row", alignItems: "center", height: 48, borderRadius: theme.expressive ? 24 : 14, backgroundColor: tonalButtonSurface(theme), overflow: "hidden" }}>
                  <Pressable accessibilityRole="button" accessibilityLabel={date ? `Change target date, ${date}` : "Choose optional target date"} disabled={busy} onPress={openCalendar}
                    style={({ pressed }) => ({ flex: 1, minWidth: 0, height: 48, flexDirection: "row", alignItems: "center", gap: 6, paddingLeft: 14, paddingRight: date ? 0 : 14, opacity: pressed ? 0.65 : 1 })}>
                    <Icon name="calendar-blank-outline" size={18} color={c.onSurfaceVariant} />
                    <Text numberOfLines={1} adjustsFontSizeToFit style={{ flex: 1, fontSize: 13, color: date ? c.onSurface : c.onSurfaceVariant }}>{date ? new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "2-digit" }) : "Optional"}</Text>
                  </Pressable>
                  {date ? <Pressable accessibilityRole="button" accessibilityLabel="Clear target date" disabled={busy} onPress={() => setDate("")} style={{ width: 44, height: 48, alignItems: "center", justifyContent: "center" }}><Icon name="close" size={16} color={c.onSurfaceVariant} /></Pressable> : null}
                </View>
              </View>
            </View>
            {!!formError && <Text accessibilityRole="alert" style={{ color: c.error }}>{formError}</Text>}
          </View>
        }
      />
      <InlineDatePicker visible={calendar} onDismiss={() => setCalendar(false)} date={date} onDateChange={setDate}
        isMobileLayout={isMobileLayout} width={width} bottom={bottom} calendarMonth={calendarMonth} calendarYear={calendarYear}
        onMonthChange={setCalendarMonth} onYearChange={setCalendarYear} showSummaryCard />
      <AnimatedPaperModal
        visible={Boolean(progress)}
        onDismiss={closeProgress}
        presentation="sheet"
        style={{ bottom: progressKeyboardInset }}
        includeBottomInset={progressKeyboardInset === 0}
        dismissable={!busy}
        contentContainerStyle={{
          backgroundColor: c.background,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          maxHeight: Math.max(180, (height - progressKeyboardInset - top) * 0.9),
        }}
      >
        <View style={{ paddingTop: 12, paddingHorizontal: 4 }}>
          <SettingsHeader
            title="Update progress"
            modal
            onBack={closeProgress}
          />
        </View>
        <ScrollView ref={progressScroll} style={{ flexShrink: 1 }}
          keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
          onLayout={() => { if (progressKeyboardInset > 0) progressScroll.current?.scrollToEnd({ animated: true }); }}
          onContentSizeChange={() => { if (progressKeyboardInset > 0) progressScroll.current?.scrollToEnd({ animated: true }); }}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 16, paddingTop: 12, paddingBottom: 16 }}>
          {progress ? <GoalCard goal={progress} compact /> : null}
          <Text style={{ color: c.onSurfaceVariant, fontSize: 13 }}>Record money you’ve set aside. This won’t create a transaction or move money between accounts.</Text>
          <SegmentedButtons value={progressDirection} onValueChange={value => { setProgressDirection(value as "add" | "remove"); setFormError(""); }}
            buttons={[{ value: "add", label: "Add", icon: "plus", disabled: busy }, { value: "remove", label: "Remove", icon: "minus", disabled: busy || !progress?.saved }]} />
          <TextInput
            label={`${progressDirection === "add" ? "Amount to add" : "Amount to remove"} (${progress?.currencySymbol || ""})`}
            accessibilityLabel="Goal progress amount"
            value={addition}
            onChangeText={value => { setAddition(value); setFormError(""); }}
            keyboardType="decimal-pad"
            mode="outlined"
            style={[fieldStyle, { borderRadius: theme.expressive ? 28 : 24 }]}
            outlineStyle={{ borderRadius: theme.expressive ? 28 : 24 }}
            contentStyle={{ paddingHorizontal: 18 }}
          />
          {progress && projection.value !== null ? <View style={{ padding: 16, borderRadius: 16, backgroundColor: c.surface, gap: 4 }}>
            <Text style={{ color: c.onSurfaceVariant, fontSize: 12 }}>Saved after this update</Text>
            <Text style={{ color: c.onSurface, fontWeight: "800", fontSize: 24 }}>{ledgerMoney(projection.value, progress.currencyCode, progress.currencySymbol)}</Text>
          </View> : null}
          {!!(formError || projection.error) && (
            <Text accessibilityRole="alert" style={{ color: c.error }}>
              {formError || projection.error}
            </Text>
          )}
        </ScrollView>
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
          <Button
            mode="contained"
            contentStyle={{ minHeight: 48 }}
            loading={busy}
            disabled={busy || projection.value === null}
            onPress={addProgress}
          >
            Save progress
          </Button>
        </View>

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
