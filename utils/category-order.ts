/** Keep catch-all categories last, even when the remaining items are sorted descending. */
export function sortCategories<T>(items: readonly T[], nameOf: (item: T) => string, compare?: (a: T, b: T) => number): T[] {
  const isOther = (item: T) => /^other (income|expense)$/i.test(nameOf(item).trim());
  return [...items].sort((a, b) => Number(isOther(a)) - Number(isOther(b)) || (compare?.(a, b) ?? 0));
}
