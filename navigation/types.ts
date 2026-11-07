import type { ShellTab } from "@/components/AppShellContext";

export type RootParamList = {
  DatabaseSummary: undefined;
  OnboardingGate: undefined;
  Onboarding: { preview?: boolean } | undefined;
  Transactions:
    | {
        source?: "notification";
        transactionId?: string;
        date?: string;
        shellTab?: ShellTab;
      }
    | undefined;
  Settings:
    | {
        section?: "notification-reminders" | "workspaces" | "budget" | "goals" | "recurring";
        source?: "notification";
      }
    | undefined;
};
