import type { ThemeMode } from "@/hooks/use-theme-mode";
import type { ThemeId } from "@/theme/presets";
import type { TransactionType } from "@/modules/Common/Utils/Types";

export type OnboardingSetupType = "simple" | "advanced";

export type OnboardingThemePreference = ThemeMode | "system";
export type StarterSetupTab = TransactionType | "accounts";

export type OnboardingStepId =
  | "welcome"
  | "appearance"
  | "workspace"
  | "quick-start"
  | "complete";

export type StarterPill = {
  name: string;
  icon: string;
  color: string;
  protected?: boolean;
};

export type QuickStartSelection = {
  income: StarterPill[];
  expense: StarterPill[];
  accounts: StarterPill[];
};

export type OnboardingDraft = {
  setupType: OnboardingSetupType;
  workspaceName: string;
  workspaceIcon: string;
  workspaceColor: string;
  quickStart: QuickStartSelection;
  themePreference: OnboardingThemePreference;
  themeId: ThemeId;
};
