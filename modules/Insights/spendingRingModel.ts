import { sortCategories } from "@/utils/category-order";
import type { Group } from "./calculations";

export function spendingRingItems(groups: Group[]) {
  const rows = sortCategories(
    groups.filter((group) => group.count > 0),
    (group) => group.name,
  );
  const items = rows
    .slice(0, 3)
    .map((group) => ({
      label: group.name,
      amount: group.amount,
      group: group as Group | null,
    }));
  if (rows.length > 3)
    items.push({
      label: `${rows.length - 3} more`,
      amount: rows.slice(3).reduce((sum, row) => sum + row.amount, 0),
      group: null,
    });
  const total = items.reduce((sum, item) => sum + Math.max(0, item.amount), 0);
  return items.map((item) => ({
    ...item,
    share: total > 0 ? Math.max(0, item.amount) / total : 0,
  }));
}

/** Native half-plane clips draw arcs up to 180°, with no chart dependency. */
export function ringArcs(shares: number[]) {
  const valid = shares.map((share) =>
    Number.isFinite(share) ? Math.max(0, share) : 0,
  );
  const total = valid.reduce((sum, value) => sum + value, 0);
  const arcs: { index: number; start: number; sweep: number }[] = [];
  let start = 0;
  if (!total) return arcs;
  valid.forEach((value, index) => {
    let sweep = (value / total) * 360;
    while (sweep > 0.000001) {
      const part = Math.min(180, sweep);
      arcs.push({ index, start, sweep: part });
      start += part;
      sweep -= part;
    }
  });
  return arcs;
}
