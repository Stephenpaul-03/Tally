import { useAccountManagement } from "@/hooks/use-account-manangement";

export type Screen = "list" | "edit" | "delete";

export interface AccountManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  management: ReturnType<typeof useAccountManagement>;
  selectedAccount?: string;
  onSelectAccount?: (account: string) => void;
}
