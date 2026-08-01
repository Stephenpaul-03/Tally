import { ActionRow } from "@/components/ActionRow";
import { AlertModal } from "@/components/alert/AlertModal";
import { SheetCard } from "@/components/SheetCard";
import { toast } from "@/components/toast/ToastProvider";
import { useAppDispatch, useAppSelector } from "@/hooks/Redux";
import { useBiomettricLock } from "@/hooks/use-biometric-lock";
import { useWorkspaceDefaults } from "@/hooks/use-workspace-defaults";
import {
  clearAllTransactionsAsync,
  deleteUnusedAccountsAsync,
  deleteUnusedCategoriesAsync,
  resetWorkspaceDataAsync,
  selectActiveAccounts,
  selectActiveExpenseCategories,
  selectActiveIncomeCategories,
  selectNonDeletedTransactions,
} from "@/modules/Core/Slices/TransactionSlice";
import { fetchWorkspaces } from "@/modules/Core/Slices/WorkspaceSlice";
import { clearFirstRunOnboardingComplete } from "@/modules/Onboarding/storage";
import { CommonActions, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { SectionLabel } from "../Components/SectionLabel";
import { SettingsSearchHeader } from "../Components/SettingsSearchHeader";
import type { SettingsStackParamList } from "../Navigation";
import { SettingsStyles } from "../Styles";

export function DataScreen() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const { enabled: biometricEnabled, unlock } = useBiomettricLock();
  const { clearWorkspaceDefaults } = useWorkspaceDefaults();
  const transactions = useAppSelector(selectNonDeletedTransactions);
  const activeAccounts = useAppSelector(selectActiveAccounts);
  const activeIncomeCategories = useAppSelector(selectActiveIncomeCategories);
  const activeExpenseCategories = useAppSelector(selectActiveExpenseCategories);
  const [query, setQuery] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [dangerAction, setDangerAction] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const usedCategories = new Set(
    transactions.map(
      (transaction) => `${transaction.type}:${transaction.category}`,
    ),
  );
  const unusedCategoryCount =
    activeIncomeCategories.filter(
      (name) => !usedCategories.has(`income:${name}`),
    ).length +
    activeExpenseCategories.filter(
      (name) => !usedCategories.has(`expense:${name}`),
    ).length;
  const usedAccounts = new Set(
    transactions.map((transaction) => transaction.account),
  );
  const unusedAccountCount = activeAccounts.filter(
    (name) => !usedAccounts.has(name),
  ).length;

  const runDangerAction = React.useCallback(async () => {
    if (isDeleting) return false;
    if (!dangerAction) return false;

    try {
      setIsDeleting(true);

      if (biometricEnabled) {
        const unlocked = await unlock();
        if (!unlocked) {
          toast.info("Biometric verification was canceled");
          return false;
        }
      }

      if (dangerAction === "clear-all") {
        await dispatch(clearAllTransactionsAsync()).unwrap();
        toast.success("All transactions cleared");
      } else if (dangerAction === "unused-categories") {
        const result = await dispatch(deleteUnusedCategoriesAsync()).unwrap();
        toast.success(
          `${result.income + result.expense} unused categories deleted`,
        );
      } else if (dangerAction === "unused-accounts") {
        const count = await dispatch(deleteUnusedAccountsAsync()).unwrap();
        toast.success(`${count} unused accounts deleted`);
      } else if (dangerAction === "reset-app") {
        await dispatch(resetWorkspaceDataAsync()).unwrap();
        await dispatch(fetchWorkspaces()).unwrap();
        clearWorkspaceDefaults();
        await clearFirstRunOnboardingComplete();
        toast.success("Tally reset");
        navigation.getParent()?.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "OnboardingGate" }],
          }),
        );
      }

      setDangerAction(null);
      return true;
    } catch (e) {
      toast.error("Couldn't complete action");
      console.log("", e);
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [
    biometricEnabled,
    clearWorkspaceDefaults,
    dangerAction,
    dispatch,
    isDeleting,
    navigation,
    unlock,
  ]);

  const dataRows = React.useMemo(
    () => [
      {
        section: "Backup & Restore",
        icon: "cloud-upload-outline",
        label: "Create Backup",
        description: "Export your transactions as a backup file",
        onPress: () => navigation.navigate("BackupExport"),
        iconColor: theme.colors.primary,
      },
      {
        section: "Backup & Restore",
        icon: "cloud-download-outline",
        label: "Restore Backup",
        description: "Choose a backup file and review it before restoring",
        onPress: () => navigation.navigate("BackupImport"),
        iconColor: theme.colors.secondary,
      },
      {
        section: "Manage & Maintain",
        icon: "tag-remove-outline",
        label: "Delete Unused Categories",
        description: `${unusedCategoryCount} categories have no transactions`,
        onPress: () => setDangerAction("unused-categories"),
        iconColor: theme.colors.tertiary,
      },
      {
        section: "Manage & Maintain",
        icon: "account-remove-outline",
        label: "Delete Unused Accounts",
        description: `${unusedAccountCount} accounts have no transactions`,
        onPress: () => setDangerAction("unused-accounts"),
        iconColor: theme.colors.tertiary,
      },
      {
        section: "Danger Zone",
        icon: "trash-can-outline",
        label: "Delete All Transactions",
        description: "Permanently remove every transaction from this device",
        onPress: () => setDangerAction("clear-all"),
        destructive: true,
      },
      {
        section: "Danger Zone",
        icon: "restart",
        label: "Reset App",
        description:
          "Reset workspace data (including transactions) and return to onboarding",
        onPress: () => setDangerAction("reset-app"),
        destructive: true,
      },
    ],
    [navigation, theme, unusedAccountCount, unusedCategoryCount],
  );
  const visibleRows = normalizedQuery
    ? dataRows.filter((row) =>
        [row.section, row.label, row.description]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      )
    : dataRows;
  const backupRows = visibleRows.filter(
    (row) => row.section === "Backup & Restore",
  );
  const maintenanceRows = visibleRows.filter(
    (row) => row.section === "Manage & Maintain",
  );
  const dangerRows = visibleRows.filter((row) => row.section === "Danger Zone");

  return (
    <SafeAreaView
      style={[
        SettingsStyles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <SettingsSearchHeader
        title="Data"
        onBack={() => navigation.goBack()}
        query={query}
        onQueryChange={setQuery}
        searchOpen={searchOpen}
        onSearchOpenChange={setSearchOpen}
      />
      <ScrollView
        contentContainerStyle={SettingsStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {backupRows.length > 0 ? (
          <>
            <SectionLabel label="Backup & Restore" />
            <SheetCard theme={theme}>
              {backupRows.map((row) => (
                <ActionRow
                  key={row.label}
                  {...row}
                  theme={theme}
                  style={styles.dataRow}
                />
              ))}
            </SheetCard>
          </>
        ) : null}

        {maintenanceRows.length > 0 ? (
          <>
            <SectionLabel label="Manage & Maintain" />
            <SheetCard theme={theme}>
              {maintenanceRows.map((row) => (
                <ActionRow
                  key={row.label}
                  {...row}
                  theme={theme}
                  style={styles.dataRow}
                />
              ))}
            </SheetCard>
          </>
        ) : null}
        {dangerRows.length > 0 ? (
          <>
            <SectionLabel label="Danger Zone" />
            <SheetCard
              theme={theme}
              style={{
                backgroundColor: `${theme.colors.error}12`,
                borderColor: `${theme.colors.error}88`,
              }}
            >
              {dangerRows.map((row, index) => (
                <ActionRow
                  key={row.label}
                  {...row}
                  theme={theme}
                  labelColor={theme.colors.onSurface}
                  descriptionColor={theme.colors.onSurfaceVariant}
                  style={[
                    styles.dataRow,
                    index < dangerRows.length - 1 && {
                      borderBottomColor: `${theme.colors.error}33`,
                      borderBottomWidth: StyleSheet.hairlineWidth,
                    },
                  ]}
                />
              ))}
            </SheetCard>
          </>
        ) : null}

        {normalizedQuery && visibleRows.length === 0 ? (
          <View>
            <SheetCard theme={theme}>
              <ActionRow
                icon="magnify-close"
                label="No data settings found"
                description="Try searching for backup, restore, or delete."
                onPress={() => setQuery("")}
                theme={theme}
                showChevron={false}
              />
            </SheetCard>
          </View>
        ) : null}
      </ScrollView>

      {dangerAction ? (
        <AlertModal
          isOpen={Boolean(dangerAction)}
          title={
            dangerAction === "reset-app"
              ? "Reset Tally?"
              : dangerAction === "unused-categories"
                ? "Delete unused categories?"
                : dangerAction === "unused-accounts"
                  ? "Delete unused accounts?"
                  : "Delete all transactions?"
          }
          message={
            dangerAction === "reset-app"
              ? "This resets workspace data and sends you back to onboarding."
              : "This action cannot be undone. Backup before continuing."
          }
          confirmLabel="Slide to delete"
          cancelLabel="Cancel"
          tertiaryLabel="Backup Data"
          onConfirm={runDangerAction}
          onCancel={() => setDangerAction(null)}
          onTertiary={() => {
            setDangerAction(null);
            navigation.navigate("BackupExport");
          }}
          confirmDisabled={isDeleting}
          confirmMode="slide"
          destructive
          icon="delete-alert-outline"
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  dataRow: {
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
});
