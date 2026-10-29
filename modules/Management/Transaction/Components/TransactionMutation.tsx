import React from "react";
import { View } from "react-native";
import Animated, { cancelAnimation, Easing, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { useMotionEnabled } from "@/components/animations/Motion";
import type { Transaction, TransactionDraft } from "@/utils/Types";
import { initialPresence, reconcilePresence, settlePresence, presenceDeadline, settleExpiredPresence, mutationFrame, MUTATION_DURATION, type PresenceRecord } from "./mutationPresence";

const MutationDelay = React.createContext(220);
export function TransactionMutationScope({ children }: { children: React.ReactNode }) {
  return <MutationDelay.Provider value={220}>{children}</MutationDelay.Provider>;
}
export function useTransactionPresence<T>(items: T[], keyOf: (item: T) => string) {
  const [records, setRecords] = React.useState(() => initialPresence(items, keyOf));
  const latestKey = React.useRef(keyOf);
  latestKey.current = keyOf;
  const delay = React.useContext(MutationDelay);
  const mounted = React.useRef(new Set<string>());
  React.useLayoutEffect(() => {
    setRecords((previous) => reconcilePresence(previous, items, latestKey.current, Date.now()));
  }, [items]);
  const complete = React.useCallback((key: string, version: number) => {
    setRecords((previous) => settlePresence(previous, key, version));
  }, []);
  const register = React.useCallback((key: string, version: number) => {
    const token = `${key}:${version}`;
    mounted.current.add(token);
    return () => {
      mounted.current.delete(token);
      setRecords((previous) => settlePresence(previous, key, version));
    };
  }, []);
  // A missing native measurement/completion must never keep a saved row hidden.
  React.useEffect(() => {
    const pending = records.filter((record) => record.phase !== "steady");
    if (!pending.length) return;
    const deadline = Math.min(...pending.map((record) => presenceDeadline(record.changedAt, delay, mounted.current.has(`${record.key}:${record.version}`))));
    const timer = setTimeout(() => {
      setRecords((current) => settleExpiredPresence(current, mounted.current, delay, Date.now()));
    }, Math.max(1, deadline - Date.now()));
    return () => clearTimeout(timer);
  }, [records, delay]);
  return { records, complete, register };
}

/** One native height/opacity progress drives the row, its card and every sibling below it. */
export function TransactionPresenceItem<T>({ record, complete, register, children }: {
  record: PresenceRecord<T>;
  complete: (key: string, version: number) => void;
  register: (key: string, version: number) => () => void;
  children: React.ReactNode;
}) {
  const enabled = useMotionEnabled();
  const delay = React.useContext(MutationDelay);
  const progress = useSharedValue(record.phase === "enter" ? 0 : 1);
  const height = useSharedValue(0);
  const flowing = useSharedValue(record.phase === "steady");
  const started = React.useRef("");
  React.useLayoutEffect(() => register(record.key, record.version), [register, record.key, record.version]);
  const animate = React.useCallback((measured?: number) => {
    if (record.phase === "steady") { flowing.value = true; progress.value = 1; return; }
    if (!enabled) { complete(record.key, record.version); return; }
    const token = `${record.phase}:${record.version}`;
    if (!(measured ?? height.value) || started.current === token) return;
    started.current = token;
    cancelAnimation(progress);
    flowing.value = false;
    const leaving = record.phase === "leave";
    progress.value = withDelay(delay, withTiming(leaving ? 0 : 1,
      { duration: MUTATION_DURATION, easing: Easing.out(Easing.cubic) }, (finished) => {
        if (!finished) return;
        if (!leaving) flowing.value = true;
        runOnJS(complete)(record.key, record.version);
      }));
  }, [record.phase, record.version, record.key, enabled, complete, delay, flowing, height, progress]);
  React.useLayoutEffect(() => { animate(); return () => { cancelAnimation(progress); started.current = ""; }; }, [animate, progress]);
  const settled = record.phase === "steady";
  const frame = useAnimatedStyle(() => mutationFrame(progress.value, height.value, flowing.value, settled));
  const content = useAnimatedStyle(() => ({ position: settled || flowing.value ? "relative" : "absolute" }));
  return <Animated.View collapsable={false} pointerEvents={record.phase === "leave" ? "none" : "auto"}
    accessibilityElementsHidden={record.phase === "leave"}
    importantForAccessibility={record.phase === "leave" ? "no-hide-descendants" : "auto"}
    style={[{ overflow: "hidden", width: "100%" }, frame]}>
    <Animated.View collapsable={false} style={[{ top: 0, left: 0, right: 0, width: "100%" }, content]}
      onLayout={(event) => { height.value = event.nativeEvent.layout.height; animate(event.nativeEvent.layout.height); }}>
      {children}
    </Animated.View>
  </Animated.View>;
}

type Row = Transaction | TransactionDraft;
export function TransactionRowsPresence<T extends Row>({ rows, renderRow }: {
  rows: T[];
  renderRow: (row: T, index: number, count: number) => React.ReactNode;
}) {
  const presence = useTransactionPresence(rows, (row) => row.id);
  return <View>{presence.records.map((record, index) => (
    <TransactionPresenceItem key={record.key} record={record} complete={presence.complete} register={presence.register}>
      {renderRow(record.item, index, presence.records.length)}
    </TransactionPresenceItem>
  ))}</View>;
}
export type { PresenceRecord } from "./mutationPresence";
