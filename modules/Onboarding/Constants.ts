import type { OnboardingStepId } from "./Types";

export const APP_NAME = "Tally";

export const ONBOARDING_STEPS: {
  id: OnboardingStepId;
  title: string;
  analyticsName: string;
}[] = [
  { id: "welcome", title: "Welcome", analyticsName: "welcome" },
  { id: "appearance", title: "Appearance", analyticsName: "appearance" },
  { id: "workspace", title: "Workspace", analyticsName: "workspace" },
  { id: "quick-start", title: "Quick Start", analyticsName: "quick_start" },
  { id: "complete", title: "Complete", analyticsName: "complete" },
];
