import { StackActions } from "@react-navigation/native";
import { useAppShell } from "@/components/AppShellContext";
import { workspaceRepository } from "@/modules/Core/Repository/Index";
import { flushPendingNavigationTargets, navigationRef } from "@/navigation/RootNavigation";
import { typography } from "@/theme/typography";
import React from "react";
import { AccessibilityInfo, Keyboard, Modal, Platform, ScrollView, StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from "react-native";
import { ActivityIndicator, Button, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { setSpotlightTourActive } from "./tourNavigation";
import { fitSpotlightRect, tooltipTop, TOUR_STEPS, type SpotlightRect, type TourTarget } from "./tourSteps";

type Measure = () => Promise<SpotlightRect | null>;
type TourApi = {
  start: (options?: { preview?: boolean }) => void;
  resume: (step: number) => void;
  register: (id: TourTarget, measure: Measure) => () => void;
};
const TourContext = React.createContext<TourApi | null>(null);
export function useOnboardingTour() {
  const api = React.useContext(TourContext);
  if (!api) throw new Error("Onboarding tour provider is missing");
  return api;
}

export function useSpotlightTarget(id: TourTarget) {
  const api = React.useContext(TourContext);
  const ref = React.useRef<View>(null);
  const register = api?.register;
  React.useLayoutEffect(() => register?.(id, () => new Promise(resolve => {
    if (!ref.current) { resolve(null); return; }
    const timeout = setTimeout(() => resolve(null), 200);
    ref.current.measureInWindow((x, y, width, height) => {
      clearTimeout(timeout);
      resolve(width > 0 && height > 0 ? { x, y, width, height } : null);
    });
  })), [register, id]);
  return ref;
}

export function SpotlightTarget({ id, children, style }: { id: TourTarget; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const ref = useSpotlightTarget(id);
  return <View ref={ref} collapsable={false} style={style}>{children}</View>;
}

export function SpotlightTourProvider({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { activeTab, requestTab } = useAppShell();
  const registry = React.useRef(new Map<TourTarget, Measure>());
  const preview = React.useRef(false);
  const moving = React.useRef(false);
  const [index, setIndex] = React.useState<number | null>(null);
  const [routeName, setRouteName] = React.useState<string | undefined>();
  const [measurement, setMeasurement] = React.useState<{ index: number; rect: SpotlightRect | null } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [cardHeight, setCardHeight] = React.useState(300);
  const step = index === null ? null : TOUR_STEPS[index];

  const register = React.useCallback((id: TourTarget, measure: Measure) => {
    registry.current.set(id, measure);
    return () => { if (registry.current.get(id) === measure) registry.current.delete(id); };
  }, []);
  const start = React.useCallback((options?: { preview?: boolean }) => {
    Keyboard.dismiss();
    preview.current = options?.preview === true;
    setSpotlightTourActive(true);
    setError(null);
    setIndex(0);
  }, []);
  const resume = React.useCallback((savedStep: number) => {
    if (!Number.isInteger(savedStep) || savedStep < 0 || savedStep >= TOUR_STEPS.length) return;
    preview.current = false;
    setSpotlightTourActive(true);
    setIndex(savedStep);
  }, []);
  const api = React.useMemo(() => ({ register, start, resume }), [register, start, resume]);

  React.useEffect(() => {
    const update = () => {
      if (!navigationRef.isReady()) return;
      const state = navigationRef.getRootState();
      setRouteName(state.routes[state.index ?? 0]?.name);
    };
    update();
    const unsubscribe = navigationRef.addListener("state", update);
    return unsubscribe;
  }, []);
  React.useEffect(() => () => setSpotlightTourActive(false), []);

  React.useEffect(() => {
    if (!step || !navigationRef.isReady() || routeName === "Onboarding" || routeName === "OnboardingGate") return;
    if (step.page === "settings") {
      if (routeName !== "Settings") navigationRef.navigate("Settings");
    } else {
      if (routeName !== "Transactions") navigationRef.dispatch(StackActions.popTo("Transactions"));
      requestTab(step.page);
    }
  }, [requestTab, routeName, step]);
  const eligible = Boolean(step && (step.page === "settings" ? routeName === "Settings" : routeName === "Transactions" && activeTab === step.page));

  React.useEffect(() => {
    if (index === null || !step || !eligible) return;
    let canceled = false;
    let timer: ReturnType<typeof setTimeout>;
    let previous: SpotlightRect | null = null;
    let stable = 0;
    const started = Date.now();
    setMeasurement(null);
    const measure = async () => {
      const rect = await registry.current.get(step.target)?.() ?? null;
      if (canceled) return;
      if (rect && previous && Math.abs(rect.x - previous.x) < 1 && Math.abs(rect.y - previous.y) < 1
        && Math.abs(rect.height - previous.height) < 1 && Math.abs(rect.width - previous.width) < 1) stable++;
      else stable = 0;
      previous = rect;
      if ((rect && stable >= 3) || Date.now() - started > 2500) {
        // Android measureInWindow excludes the status bar; the translucent
        // native modal includes it. Translate into the overlay's coordinates.
        const overlayRect = rect ? { ...rect, y: rect.y + (Platform.OS === "android" ? insets.top : 0) } : null;
        setMeasurement({ index, rect: overlayRect ? fitSpotlightRect(overlayRect, width, height) : null });
        AccessibilityInfo.announceForAccessibility(`${step.title}. ${step.description}`);
      } else timer = setTimeout(measure, 100);
    };
    // Wait for the native screen transition before sampling the target.
    timer = setTimeout(measure, step.target.includes("controls") ? 1200 : 350);
    return () => { canceled = true; clearTimeout(timer); };
  }, [eligible, height, index, insets.top, step, width]);

  const move = async (next: number | null) => {
    if (moving.current) return;
    moving.current = true; setBusy(true); setError(null);
    try {
      if (!preview.current) await workspaceRepository.saveOnboardingTourProgress(next);
      if (next === null) {
        setIndex(null); setSpotlightTourActive(false);
        requestTab("transactions");
        if (navigationRef.isReady()) navigationRef.dispatch(StackActions.popTo("Transactions"));
        requestAnimationFrame(flushPendingNavigationTargets);
      } else { setMeasurement(null); setIndex(next); }
    } catch {
      setError("Couldn’t save your tour progress. Please try again.");
    } finally { moving.current = false; setBusy(false); }
  };
  const ready = index !== null && measurement?.index === index;
  const rect = ready ? measurement.rect : null;
  const maskColor = "rgba(0,0,0,0.76)";
  const maxTooltipHeight = rect ? Math.min(height * 0.65, Math.max(200,
    rect.y - insets.top - 72, height - insets.bottom - rect.y - rect.height - 28)) : height * 0.65;
  const compact = step?.page === "settings";
  const label = { ...typography.editorial.sectionLabel, fontSize: 18, lineHeight: 24 };
  return <TourContext.Provider value={api}>
    {children}
    <Modal transparent visible={index !== null && eligible} animationType="fade" statusBarTranslucent navigationBarTranslucent
      onRequestClose={() => { void move(index !== null && index > 0 ? index - 1 : null); }}>
      <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
        {rect ? <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: rect.y, backgroundColor: maskColor }} />
          <View style={{ position: "absolute", top: rect.y + rect.height, left: 0, right: 0, bottom: 0, backgroundColor: maskColor }} />
          <View style={{ position: "absolute", top: rect.y, left: 0, width: rect.x, height: rect.height, backgroundColor: maskColor }} />
          <View style={{ position: "absolute", top: rect.y, left: rect.x + rect.width, right: 0, height: rect.height, backgroundColor: maskColor }} />
          <View style={{ position: "absolute", width: rect.width, height: rect.height, left: rect.x, top: rect.y, borderWidth: 2, borderColor: theme.colors.primary, borderRadius: 18 }} />
        </View> : <View style={[StyleSheet.absoluteFill, { backgroundColor: maskColor }]} />}
        {!ready ? <View style={s.loading}><ActivityIndicator color={theme.colors.primary} /></View> : null}
        <View style={{ position: "absolute", top: insets.top + 8, right: 16 }}>
          <Button onPress={() => { void move(null); }} disabled={busy} textColor="#FFFFFF">Skip tour</Button>
        </View>
        {ready && step && index !== null ? <View onLayout={event => {
          const nextHeight = event.nativeEvent.layout.height;
          setCardHeight(current => Math.abs(current - nextHeight) > 0.5 ? nextHeight : current);
        }}
          style={[s.card, compact && { padding: 16, gap: 12 }, { top: tooltipTop(rect, height, insets.top + 44, insets.bottom, cardHeight), maxHeight: maxTooltipHeight,
            backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
          <ScrollView showsVerticalScrollIndicator contentContainerStyle={{ gap: compact ? 8 : 12 }}>
            <Text style={{ ...typography.body, fontSize: 12, color: theme.colors.onSurfaceVariant }}>{preview.current ? "Preview · " : ""}{index + 1} of {TOUR_STEPS.length}</Text>
            <Text accessibilityRole="header" style={[label, { color: theme.colors.onSurface }]}>{step.title}</Text>
            {!compact ? <Text style={{ ...typography.body, fontSize: 14, lineHeight: 21, color: theme.colors.onSurfaceVariant }}>{step.description}</Text> : null}
            {step.points.map(point => <View key={point} style={{ flexDirection: "row", gap: 10 }}>
              <Text style={{ color: theme.colors.primary }}>•</Text>
              <Text style={{ ...typography.body, fontSize: compact ? 12 : 13, lineHeight: compact ? 18 : 20, color: theme.colors.onSurface, flex: 1 }}>{point}</Text>
            </View>)}
            {error ? <Text accessibilityRole="alert" style={{ color: theme.colors.error }}>{error}</Text> : null}
          </ScrollView>
          <View style={s.actions}>
            {index > 0 ? <Button disabled={busy} onPress={() => { void move(index - 1); }}>Back</Button> : <View />}
            <Button mode="contained" loading={busy} disabled={busy} labelStyle={label}
              onPress={() => { void move(index + 1 < TOUR_STEPS.length ? index + 1 : null); }}>{index === TOUR_STEPS.length - 1 ? "Done" : "Next"}</Button>
          </View>
        </View> : null}
      </View>
    </Modal>
  </TourContext.Provider>;
}
const s = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: { position: "absolute", left: 16, right: 16, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, padding: 20, gap: 18 },
  actions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
});
