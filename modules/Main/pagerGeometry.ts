/** Shared by native page scrolling and the draggable navigation indicator. */
export function clampTabPosition(position: number) {
  "worklet";
  return Math.max(0, Math.min(2, position));
}
export function snapTabIndex(position: number, velocity = 0) {
  "worklet";
  return Math.round(clampTabPosition(position + velocity * 0.12));
}
/** A single gesture can move only to a neighbor of the page it began on. */
export function clampSwipePosition(position: number, origin: number) {
  "worklet";
  const page = snapTabIndex(origin);
  return Math.max(
    Math.max(0, page - 1),
    Math.min(Math.min(2, page + 1), position),
  );
}
export function snapSwipeIndex(
  position: number,
  velocity: number,
  origin: number,
) {
  "worklet";
  return clampSwipePosition(snapTabIndex(position, velocity), origin);
}
export function tabBarGeometry(width: number, position: number, labels = true) {
  "worklet";
  const gap = 8;
  const base = Math.max(0, width - gap * 2) / 3;
  const extra = 0;
  void labels;
  const offset = clampTabPosition(position);
  return {
    base,
    extra,
    gap,
    step: base + gap,
    pillWidth: base + extra,
    pillLeft: offset * (base + gap),
  };
}
export function tabWeight(position: number, index: number) {
  "worklet";
  return Math.max(0, 1 - Math.abs(clampTabPosition(position) - index));
}

/** Ignore completion events left over from an interrupted programmatic scroll. */
export function settledTabIndex(position: number, requested: number) {
  "worklet";
  const index = snapTabIndex(position);
  if (Math.abs(position - index) > 0.02) return null;
  return requested >= 0 && index !== requested ? null : index;
}
