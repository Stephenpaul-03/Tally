import type { OnboardingPresetConfig, OnboardingPresetItem } from "./types";

const presetConfig = require("./presets.json") as OnboardingPresetConfig;

function cleanItem(item: OnboardingPresetItem): OnboardingPresetItem {
  return {
    name: item.name.trim(),
    icon: item.icon.trim() || "tag-outline",
    color: item.color.trim() || "#6366F1",
  };
}

function uniqueItems(items: OnboardingPresetItem[]) {
  const seen = new Set<string>();
  return items.map(cleanItem).filter((item) => {
    if (!item.name) return false;
    const key = item.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const ONBOARDING_PRESETS: OnboardingPresetConfig = {
  accounts: uniqueItems(presetConfig.accounts),
  incomeCategories: uniqueItems(presetConfig.incomeCategories),
  expenseCategories: uniqueItems(presetConfig.expenseCategories),
};
