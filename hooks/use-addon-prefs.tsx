import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ReactNode } from "react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AddonPrefsContextValue = {
  guidedChatEnabled: boolean;
  betterAnalyticsEnabled: boolean;
  minimalIconsEnabled: boolean;
  animationsEnabled: boolean;
  labsNoticeDismissed: boolean;
  isHydrated: boolean;
  insightsCardOrder: InsightCardId[];
  setGuidedChatEnabled: (next: boolean) => void;
  setBetterAnalyticsEnabled: (next: boolean) => void;
  setMinimalIconsEnabled: (next: boolean) => void;
  setAnimationsEnabled: (next: boolean) => void;
  setLabsNoticeDismissed: (next: boolean) => void;
  setInsightsCardOrder: (next: InsightCardId[]) => void;
  toggleGuidedChatEnabled: () => void;
  toggleBetterAnalyticsEnabled: () => void;
  toggleMinimalIconsEnabled: () => void;
  toggleAnimationsEnabled: () => void;
};

const GUIDED_CHAT_STORAGE_KEY = "addonsGuidedChatEnabled";
const BETTER_ANALYTICS_STORAGE_KEY = "addonsBetterAnalyticsEnabled";
const MINIMAL_ICONS_STORAGE_KEY = "addonsMinimalIconsEnabled";
const ANIMATIONS_STORAGE_KEY = "addonsAnimationsEnabled";
const INSIGHTS_CARD_ORDER_STORAGE_KEY = "addonsInsightsCardOrder";
const LABS_NOTICE_DISMISSED_STORAGE_KEY = "addonsLabsNoticeDismissed";

export const DEFAULT_INSIGHTS_CARD_ORDER = [
  "budgetSummary",
  "spendingByCategory",
  "spendingByPaymentMethod",
  "categoryTrends",
  "weeklySpending",
] as const;

export type InsightCardId = (typeof DEFAULT_INSIGHTS_CARD_ORDER)[number];

const KNOWN_CARD_IDS = new Set<string>(DEFAULT_INSIGHTS_CARD_ORDER);

function normalizeInsightsCardOrder(value: unknown): InsightCardId[] | null {
  if (!Array.isArray(value)) return null;
  const filtered = value.filter(
    (item): item is InsightCardId =>
      typeof item === "string" && KNOWN_CARD_IDS.has(item),
  );
  if (filtered.length === 0) return null;
  const deduped = [...new Set(filtered)];
  return [
    ...deduped,
    ...DEFAULT_INSIGHTS_CARD_ORDER.filter((id) => !deduped.includes(id)),
  ];
}

function parseStoredBoolean(value: string | null): boolean | null {
  if (value == null) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  return null;
}

const AddonPrefsContext = createContext<AddonPrefsContextValue | null>(null);

export function AddonPrefsProvider({ children }: { children: ReactNode }) {
  const [guidedChatEnabled, setGuidedChatEnabledState] = useState(false);
  const [betterAnalyticsEnabled, setBetterAnalyticsEnabledState] =
    useState(false);
  const [minimalIconsEnabled, setMinimalIconsEnabledState] = useState(false);
  const [animationsEnabled, setAnimationsEnabledState] = useState(true);
  const [labsNoticeDismissed, setLabsNoticeDismissedState] = useState(false);
  const [insightsCardOrder, setInsightsCardOrderState] = useState<
    InsightCardId[]
  >([...DEFAULT_INSIGHTS_CARD_ORDER]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [
          storedGuidedChat,
          storedBetterAnalytics,
          storedMinimalIcons,
          storedLabsNoticeDismissed,
          storedInsightsCardOrder,
        ] = await Promise.all([
          AsyncStorage.getItem(GUIDED_CHAT_STORAGE_KEY),
          AsyncStorage.getItem(BETTER_ANALYTICS_STORAGE_KEY),
          AsyncStorage.getItem(MINIMAL_ICONS_STORAGE_KEY),
          AsyncStorage.getItem(LABS_NOTICE_DISMISSED_STORAGE_KEY),
          AsyncStorage.getItem(INSIGHTS_CARD_ORDER_STORAGE_KEY),
        ]);

        const parsedGuidedChat = parseStoredBoolean(storedGuidedChat);
        const parsedBetterAnalytics = parseStoredBoolean(storedBetterAnalytics);
        const parsedMinimalIcons = parseStoredBoolean(storedMinimalIcons);
        const parsedLabsNoticeDismissed = parseStoredBoolean(
          storedLabsNoticeDismissed,
        );
        let parsedInsightsCardOrder: InsightCardId[] | null = null;
        if (storedInsightsCardOrder) {
          try {
            parsedInsightsCardOrder = normalizeInsightsCardOrder(
              JSON.parse(storedInsightsCardOrder),
            );
          } catch {
            parsedInsightsCardOrder = null;
          }
        }

        if (!isMounted) return;
        if (parsedGuidedChat != null)
          setGuidedChatEnabledState(parsedGuidedChat);
        if (parsedBetterAnalytics != null)
          setBetterAnalyticsEnabledState(parsedBetterAnalytics);
        if (parsedMinimalIcons != null)
          setMinimalIconsEnabledState(parsedMinimalIcons);
        if (parsedLabsNoticeDismissed != null)
          setLabsNoticeDismissedState(parsedLabsNoticeDismissed);
        setAnimationsEnabledState(true);
        if (parsedInsightsCardOrder != null)
          setInsightsCardOrderState(parsedInsightsCardOrder);
      } finally {
        if (isMounted) setIsHydrated(true);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const id = setTimeout(() => {
      void AsyncStorage.setItem(
        GUIDED_CHAT_STORAGE_KEY,
        guidedChatEnabled ? "true" : "false",
      );
    }, 150);
    return () => clearTimeout(id);
  }, [guidedChatEnabled, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    const id = setTimeout(() => {
      void AsyncStorage.setItem(
        BETTER_ANALYTICS_STORAGE_KEY,
        betterAnalyticsEnabled ? "true" : "false",
      );
    }, 150);
    return () => clearTimeout(id);
  }, [betterAnalyticsEnabled, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    const id = setTimeout(() => {
      void AsyncStorage.setItem(
        MINIMAL_ICONS_STORAGE_KEY,
        minimalIconsEnabled ? "true" : "false",
      );
    }, 150);
    return () => clearTimeout(id);
  }, [minimalIconsEnabled, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    const id = setTimeout(() => {
      void AsyncStorage.setItem(ANIMATIONS_STORAGE_KEY, "true");
    }, 150);
    return () => clearTimeout(id);
  }, [animationsEnabled, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    const id = setTimeout(() => {
      void AsyncStorage.setItem(
        LABS_NOTICE_DISMISSED_STORAGE_KEY,
        labsNoticeDismissed ? "true" : "false",
      );
    }, 150);
    return () => clearTimeout(id);
  }, [isHydrated, labsNoticeDismissed]);

  useEffect(() => {
    if (!isHydrated) return;
    const id = setTimeout(() => {
      void AsyncStorage.setItem(
        INSIGHTS_CARD_ORDER_STORAGE_KEY,
        JSON.stringify(insightsCardOrder),
      );
    }, 150);
    return () => clearTimeout(id);
  }, [insightsCardOrder, isHydrated]);

  const setGuidedChatEnabled = useCallback((next: boolean) => {
    setGuidedChatEnabledState(next);
  }, []);

  const setBetterAnalyticsEnabled = useCallback((next: boolean) => {
    setBetterAnalyticsEnabledState(next);
  }, []);

  const setMinimalIconsEnabled = useCallback((next: boolean) => {
    setMinimalIconsEnabledState(next);
  }, []);

  const setAnimationsEnabled = useCallback((_next: boolean) => {
    setAnimationsEnabledState(true);
  }, []);

  const setLabsNoticeDismissed = useCallback((next: boolean) => {
    setLabsNoticeDismissedState(next);
  }, []);

  const setInsightsCardOrder = useCallback((next: InsightCardId[]) => {
    const normalized = normalizeInsightsCardOrder(next);
    setInsightsCardOrderState(normalized ?? [...DEFAULT_INSIGHTS_CARD_ORDER]);
  }, []);

  const toggleGuidedChatEnabled = useCallback(() => {
    setGuidedChatEnabledState((prev) => !prev);
  }, []);

  const toggleBetterAnalyticsEnabled = useCallback(() => {
    setBetterAnalyticsEnabledState((prev) => !prev);
  }, []);

  const toggleMinimalIconsEnabled = useCallback(() => {
    setMinimalIconsEnabledState((prev) => !prev);
  }, []);

  const toggleAnimationsEnabled = useCallback(() => {
    setAnimationsEnabledState(true);
  }, []);

  const value = useMemo(
    () => ({
      guidedChatEnabled,
      betterAnalyticsEnabled,
      minimalIconsEnabled,
      animationsEnabled,
      labsNoticeDismissed,
      isHydrated,
      insightsCardOrder,
      setGuidedChatEnabled,
      setBetterAnalyticsEnabled,
      setMinimalIconsEnabled,
      setAnimationsEnabled,
      setLabsNoticeDismissed,
      setInsightsCardOrder,
      toggleGuidedChatEnabled,
      toggleBetterAnalyticsEnabled,
      toggleMinimalIconsEnabled,
      toggleAnimationsEnabled,
    }),
    [
      guidedChatEnabled,
      betterAnalyticsEnabled,
      minimalIconsEnabled,
      animationsEnabled,
      labsNoticeDismissed,
      isHydrated,
      insightsCardOrder,
      setGuidedChatEnabled,
      setBetterAnalyticsEnabled,
      setMinimalIconsEnabled,
      setAnimationsEnabled,
      setLabsNoticeDismissed,
      setInsightsCardOrder,
      toggleGuidedChatEnabled,
      toggleBetterAnalyticsEnabled,
      toggleMinimalIconsEnabled,
      toggleAnimationsEnabled,
    ],
  );

  return (
    <AddonPrefsContext.Provider value={value}>
      {children}
    </AddonPrefsContext.Provider>
  );
}

export function useAddonPrefs() {
  const context = useContext(AddonPrefsContext);
  if (!context) {
    throw new Error("useAddonPrefs must be used within AddonPrefsProvider");
  }
  return context;
}
