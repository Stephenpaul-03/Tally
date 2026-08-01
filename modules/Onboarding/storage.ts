import AsyncStorage from "@react-native-async-storage/async-storage";

const FIRST_RUN_STORAGE_KEY = "tallyOnboardingFirstRunComplete";
const WORKSPACE_STORAGE_KEY = "tallyOnboardingCompletedWorkspaces";

export async function isFirstRunOnboardingComplete() {
  return (await AsyncStorage.getItem(FIRST_RUN_STORAGE_KEY)) === "true";
}

export async function markFirstRunOnboardingComplete() {
  await AsyncStorage.setItem(FIRST_RUN_STORAGE_KEY, "true");
}

export async function clearFirstRunOnboardingComplete() {
  await AsyncStorage.removeItem(FIRST_RUN_STORAGE_KEY);
}

export async function markWorkspaceOnboardingComplete(workspaceId: string) {
  const stored = await AsyncStorage.getItem(WORKSPACE_STORAGE_KEY);
  const ids = stored ? (JSON.parse(stored) as string[]) : [];
  if (ids.includes(workspaceId)) return;
  await AsyncStorage.setItem(
    WORKSPACE_STORAGE_KEY,
    JSON.stringify([...ids, workspaceId]),
  );
}
