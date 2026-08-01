export type OnboardingPresetItem = {
  name: string;
  icon: string;
  color: string;
};

export type OnboardingPresetConfig = {
  accounts: OnboardingPresetItem[];
  incomeCategories: OnboardingPresetItem[];
  expenseCategories: OnboardingPresetItem[];
};

export type OnboardingRouteParams = {
  mode?: "first-run" | "workspace";
  workspaceId?: string;
};
