import { LazyModalContent } from "@/components/modal/LazyModalContent";
import React from "react";
import { useAccountManagement } from "@/hooks/use-account-manangement";
import { useCategoryManagement } from "@/hooks/use-category-manamgement";
import { AccountManagementModal } from "@/modules/Management/Account/Index";
import { CategoryManagementModal } from "@/modules/Management/Category/Index";
import type { TransactionType } from "@/utils/Types";

/** Do not rebuild the management screens for every keypad or note keystroke. */
const EntityPickerSession = React.memo(function EntityPickerSession({
  type,
  category,
  account,
  categoryOpen,
  accountOpen,
  onCategory,
  onAccount,
  onCloseCategory,
  onCloseAccount,
}: {
  type: TransactionType;
  category: string;
  account: string;
  categoryOpen: boolean;
  accountOpen: boolean;
  onCategory: (value: string) => void;
  onAccount: (value: string) => void;
  onCloseCategory: () => void;
  onCloseAccount: () => void;
}) {
  const accounts = useAccountManagement();
  const categories = useCategoryManagement(type);
  React.useEffect(() => {
    if (categories.selectedType !== type) categories.handleSelectType(type);
  }, [categories, type]);
  return (
    <>
      <AccountManagementModal
        isOpen={accountOpen}
        management={accounts}
        selectedAccount={account}
        onSelectAccount={onAccount}
        onClose={onCloseAccount}
      />
      <CategoryManagementModal
        isOpen={categoryOpen}
        management={categories}
        pickerMode
        selectedValue={category}
        onSelectCategory={onCategory}
        onClose={onCloseCategory}
      />
    </>
  );
});

export const TransactionEntityPickers = React.memo(
  function TransactionEntityPickers(
    props: React.ComponentProps<typeof EntityPickerSession>,
  ) {
    return (
      <LazyModalContent visible={props.accountOpen || props.categoryOpen}>
        <EntityPickerSession {...props} />
      </LazyModalContent>
    );
  },
);
