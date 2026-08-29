import type { ShellTab } from "@/components/AppShellContext";

export type RootParamList = {
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
        section?: "notification-reminders" | "workspaces" | "budget";
        source?: "notification";
      }
    | undefined;
};
