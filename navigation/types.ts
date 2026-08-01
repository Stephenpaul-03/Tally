import type { ShellTab } from "@/components/AppShellContext";

export type RootParamList = {
  OnboardingGate: undefined;
  Onboarding:
    | {
        mode?: "first-run" | "workspace";
        workspaceId?: string;
      }
    | undefined;
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
        section?: "notification-reminders" | "workspaces";
        source?: "notification";
      }
    | undefined;
};
