/** Settle interrupted and completed drags to one complete card. */
export function carouselTarget(
  offset: number,
  width: number,
  count: number,
  velocity = 0,
) {
  "worklet";
  if (width <= 0 || count <= 1) return 0;
  return Math.min(
    count - 1,
    Math.max(0, Math.round((offset + velocity * 0.12) / width)),
  );
}
