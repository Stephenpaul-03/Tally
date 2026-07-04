import { ActionRow } from "@/components/ActionRow";
import { toast } from "@/components/toast/ToastProvider";
import {
    selectActiveAccounts,
    selectActiveExpenseCategories,
    selectActiveIncomeCategories,
} from "@/modules/Core/Slices/TransactionSlice";
import { AppDispatch, RootState } from "@/modules/Core/Store";
import React, { useState } from "react";
import type { MD3Theme } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { SeedConfigModal } from "./SeedConfigModal";
import { SeedConfig, seedTestData } from "./seedGenerator";

export function SeedDataButton({ theme }: { theme: MD3Theme }) {
  const dispatch = useDispatch<AppDispatch>();
  const [modalOpen, setModalOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const userCategories = useSelector((s: RootState) => [
    ...selectActiveIncomeCategories(s).map((name) => ({
      name,
      type: "income" as const,
    })),
    ...selectActiveExpenseCategories(s).map((name) => ({
      name,
      type: "expense" as const,
    })),
  ]);
  const userAccounts = useSelector((s: RootState) =>
    selectActiveAccounts(s).map((name) => ({ name })),
  );

  const handleConfirm = async (config: SeedConfig) => {
    setModalOpen(false);
    setSeeding(true);
    try {
      await seedTestData(dispatch, config);
      toast.success("Seed data generated");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <>
      <ActionRow
        icon="database-plus-outline"
        label={seeding ? "Seeding…" : "Seed Test Data"}
        description="Generate configurable sample transactions"
        onPress={() => setModalOpen(true)}
        theme={theme}
        // disabled={seeding}
      />
      <SeedConfigModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirm}
        userCategories={userCategories}
        userAccounts={userAccounts}
      />
    </>
  );
}
