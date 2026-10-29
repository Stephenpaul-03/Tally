export const MUTATION_DURATION = 200;
export type PresenceRecord<T> = {
  key: string;
  item: T;
  phase: "steady" | "enter" | "leave";
  version: number;
  changedAt: number;
};
export function initialPresence<T>(items: T[], keyOf: (item: T) => string): PresenceRecord<T>[] {
  return items.map((item) => ({ key: keyOf(item), item, phase: "steady", version: 0, changedAt: 0 }));
}
/** Retain deleted identities in their old slots while their height collapses. */
export function reconcilePresence<T>(previous: PresenceRecord<T>[], items: T[], keyOf: (item: T) => string, now: number): PresenceRecord<T>[] {
  const old = new Map(previous.map((record) => [record.key, record]));
  const active = new Set(items.map(keyOf));
  const next = items.map((item): PresenceRecord<T> => {
    const key = keyOf(item), record = old.get(key);
    if (!record) return { key, item, phase: "enter", version: 1, changedAt: now };
    if (record.phase === "leave") return { key, item, phase: "enter", version: record.version + 1, changedAt: now };
    return { ...record, item };
  });
  previous.forEach((record, index) => {
    if (active.has(record.key)) return;
    const leaving: PresenceRecord<T> = record.phase === "leave" ? record : {
      ...record, phase: "leave", version: record.version + 1, changedAt: now,
    };
    next.splice(Math.min(index, next.length), 0, leaving);
  });
  return next;
}
/** Ignore completion from an interrupted animation or an older identity revision. */
export function settlePresence<T>(records: PresenceRecord<T>[], key: string, version: number): PresenceRecord<T>[] {
  if (!records.some((record) => record.key === key && record.version === version && record.phase !== "steady")) return records;
  return records.flatMap((record) => {
    if (record.key !== key || record.version !== version || record.phase === "steady") return [record];
    return record.phase === "leave" ? [] : [{ ...record, phase: "steady" as const }];
  });
}

/** A mounted entrance must fail open if measurement/completion never arrives. */
export function presenceDeadline(changedAt: number, delay: number, mounted: boolean) {
  return changedAt + delay + MUTATION_DURATION + (mounted ? 350 : 60);
}
export function settleExpiredPresence<T>(records: PresenceRecord<T>[], mounted: Set<string>, delay: number, now: number) {
  let next = records;
  for (const record of records) {
    if (record.phase !== "steady" && now >= presenceDeadline(record.changedAt, delay, mounted.has(`${record.key}:${record.version}`)))
      next = settlePresence(next, record.key, record.version);
  }
  return next;
}
export function mutationFrame(progress: number, measuredHeight: number, flowing: boolean, settled: boolean) {
  "worklet";
  const value = Math.max(0, Math.min(1, progress));
  return {
    height: settled || flowing ? "auto" as const : Math.max(0, measuredHeight) * value,
    opacity: settled ? 1 : value,
  };
}
