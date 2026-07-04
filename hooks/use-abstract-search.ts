import { useMemo } from "react";

type SearchValue = string | number | null | undefined;

type AbstractSearchOptions<T> = {
  getSearchValues: (item: T) => SearchValue[];
};

function normalizeSearchText(value: SearchValue): string {
  if (value == null) return "";
  return String(value).trim().toLowerCase();
}

export function searchItems<T>(
  items: T[],
  query: string,
  options: AbstractSearchOptions<T>,
): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return items;

  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return items;

  return items.filter((item) => {
    const haystack = options
      .getSearchValues(item)
      .map(normalizeSearchText)
      .filter(Boolean)
      .join(" ");

    return terms.every((term) => haystack.includes(term));
  });
}

export function useAbstractSearch<T>(
  items: T[],
  query: string,
  options: AbstractSearchOptions<T>,
): T[] {
  const indexedItems = useMemo(
    () =>
      items.map((item) => ({
        item,
        haystack: options
          .getSearchValues(item)
          .map(normalizeSearchText)
          .filter(Boolean)
          .join(" "),
      })),
    [items, options],
  );

  return useMemo(
    () => {
      const normalizedQuery = query.trim().toLowerCase();
      if (!normalizedQuery) {
        return indexedItems.map(({ item }) => item);
      }

      const terms = normalizedQuery.split(/\s+/).filter(Boolean);
      if (terms.length === 0) {
        return indexedItems.map(({ item }) => item);
      }

      return indexedItems
        .filter(({ haystack }) => terms.every((term) => haystack.includes(term)))
        .map(({ item }) => item);
    },
    [indexedItems, query],
  );
}
