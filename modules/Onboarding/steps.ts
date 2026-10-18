export const SETUP_STEP = { intro: 0, appearance: 1, workspace: 2, income: 3, expense: 4, accounts: 5, review: 6 } as const;
export const SETUP_DRAFT_VERSION = 4;

/** Keep unfinished drafts on the same page after moving appearance before workspace. */
export function restoreSetupStep(step: unknown, version: unknown): number {
  if (typeof step !== "number" || !Number.isInteger(step) || step < 0 || step > SETUP_STEP.review) return SETUP_STEP.intro;
  if (version === SETUP_DRAFT_VERSION) return step;
  if (version !== 3 && step === 5) return SETUP_STEP.review;
  if (step >= 1 && step <= 4) return step + 1;
  if (step === 5) return SETUP_STEP.appearance;
  return step;
}
