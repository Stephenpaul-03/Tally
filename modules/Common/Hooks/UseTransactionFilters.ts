import { useState } from "react";
import { createDefaultFilters, normalizeFilterPayload } from "../Utils/Filters";
import { TransactionFilters } from "../Utils/Types";

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
