import { ActionRow } from "@/components/ActionRow";
import { AlertModal } from "@/components/alert/AlertModal";
import { SheetCard } from "@/components/SheetCard";
import { toast } from "@/components/toast/ToastProvider";
import { useAppDispatch } from "@/hooks/Redux";
import { useBiomettricLock } from "@/hooks/use-biometric-lock";
import { clearAllTransactionsAsync } from "@/modules/Data/Slices/TransactionSlice";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { ScrollView } from "react-native";
import { useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { SectionLabel } from "../Components/SectionLabel";
import { SettingsHeader } from "../Components/SettingsHeader";
import type { SettingsStackParamList } from "../Navigation";
import { SettingsStyles } from "../Styles";

export function DataScreen() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const { enabled: biometricEnabled, unlock } = useBiomettricLock();
  const [deletePromptOpen, setDeletePromptOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDeleteAllTransactions = React.useCallback(async () => {
    if (isDeleting) return false;

    try {
      setIsDeleting(true);

      if (biometricEnabled) {
        const unlocked = await unlock();
        if (!unlocked) {
          toast.info("Biometric verification was canceled");
          return false;
        }
      }

      await dispatch(clearAllTransactionsAsync()).unwrap();
      toast.success("All transactions cleared");
      setDeletePromptOpen(false);
      return true;
    } catch (e) {
      toast.error("Couldn't clear transactions");
      console.log("", e);
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [biometricEnabled, dispatch, isDeleting, unlock]);

  return (
    <SafeAreaView
      style={[
        SettingsStyles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <SettingsHeader title="Data" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={SettingsStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel label="Backup" />
        <SheetCard theme={theme}>
          <ActionRow
            icon="file-export-outline"
            label="Create Backup"
            description="Export your transactions as a backup file"
            onPress={() => navigation.navigate("BackupExport")}
            theme={theme}
          />
          <ActionRow
            icon="file-import-outline"
            label="Restore Backup"
            description="Choose a backup file and review it before restoring"
            onPress={() => navigation.navigate("BackupImport")}
            theme={theme}
          />
        </SheetCard>

        <SectionLabel label="Danger Zone" />
        <SheetCard theme={theme}>
          <ActionRow
            icon="delete-sweep-outline"
            label="Delete All Transactions"
            description="Permanently remove every transaction from this device"
            onPress={() => setDeletePromptOpen(true)}
            theme={theme}
            destructive
          />
        </SheetCard>
      </ScrollView>

      {deletePromptOpen ? (
        <AlertModal
          isOpen={deletePromptOpen}
          title="Delete all transactions?"
          message="This will permanently remove every transaction from this device. Backup before deleting."
          confirmLabel="Slide to delete"
          cancelLabel="Cancel"
          tertiaryLabel="Backup Data"
          onConfirm={handleDeleteAllTransactions}
          onCancel={() => setDeletePromptOpen(false)}
          onTertiary={() => {
            setDeletePromptOpen(false);
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
