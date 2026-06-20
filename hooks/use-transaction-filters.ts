import { createDefaultFilters, normalizeFilterPayload } from "@/utils/Filters";
import { TransactionFilters } from "@/utils/Types";
import { useState } from "react";

export function useTransactionFilters() {
  const [filters, setFilters] = useState<TransactionFilters>(() =>
    createDefaultFilters(),
  );

  const handleApplyFilters = (nextFilters: TransactionFilters) => {
    const next = normalizeFilterPayload(nextFilters);
    setFilters(next);
  };

  const handleResetFilters = () => {
    setFilters(createDefaultFilters());
  };

  return {
    filters,
    handleApplyFilters,
    handleResetFilters,
  };
}
