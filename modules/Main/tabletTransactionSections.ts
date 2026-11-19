type LedgerRow = { type: string; amount: number };
type LedgerSection = {
  key: string;
  transactions: LedgerRow[];
  total: number;
  totalLabel?: string;
  metric?: "earned" | "spent";
};

/** Partition within each existing group without changing its order or collapse key. */
export function tabletTransactionSections<S extends LedgerSection>(sections: S[], type: "income" | "expense"): S[] {
  return sections.flatMap(section => {
    const transactions = section.transactions.filter(row => row.type === type);
    if (!transactions.length) return [];
    return [{ ...section, transactions, total: transactions.reduce((sum, row) => sum + Math.abs(row.amount), 0),
      totalLabel: section.key === "draft" ? "Drafts" : undefined,
      metric: type === "income" ? "earned" : "spent" } as S];
  });
}
