import { useAccountManagement } from "@/hooks/use-account-manangement";
import { useBreakpoint } from "@/hooks/use-breakpoints";
import options from "@/data/management-options.json";
import { useEffect, useMemo, useState } from "react";
import type { Screen } from "./Types";

const NAME_LIMIT = 30;

export function useAccountModalState(
  management: ReturnType<typeof useAccountManagement>,
  onClose: () => void,
) {
  const { height, width, isMobileLayout: isMobile } = useBreakpoint();

  const [screen, setScreen] = useState<Screen>("list");
  const [localName, setLocalName] = useState("");
  const [localIcon, setLocalIcon] = useState(
    management.iconOptions[0] || "credit-card-outline",
  );
  const [localColor, setLocalColor] = useState(
    management.colorOptions[0] || "#6366F1",
  );
  const [localDest, setLocalDest] = useState("");

  const allColors = useMemo(() => {
    const merged = [...(management.colorOptions ?? [])];
    for (const color of options.colors) {
      if (!merged.includes(color)) merged.push(color);
    }
    return merged;
  }, [management.colorOptions]);

  const allIcons = useMemo(() => {
    const merged = [...(management.iconOptions ?? [])];
    for (const icon of options.accountIcons) {
      if (!merged.includes(icon)) merged.push(icon);
    }
    return merged;
  }, [management.iconOptions]);

  useEffect(() => {
    if (!management.isEditOpen) return;
    if (management.editingAccount) {
      setLocalName(management.editingAccount.name.slice(0, NAME_LIMIT));
      setLocalIcon(management.editingAccount.icon);
      setLocalColor(management.editingAccount.color);
    } else {
      setLocalName("");
      setLocalIcon(allIcons[0] || "credit-card-outline");
      setLocalColor(allColors[0] || "#6366F1");
    }
    setScreen("edit");
  }, [allColors, allIcons, management.editingAccount, management.isEditOpen]);

  useEffect(() => {
    if (management.isDeleteOpen) {
      setLocalDest("");
      setScreen("delete");
    }
  }, [management.isDeleteOpen]);

  useEffect(() => {
    if (!management.isEditOpen && !management.isDeleteOpen) setScreen("list");
  }, [management.isDeleteOpen, management.isEditOpen]);

  const deletingName = management.deletingAccount?.name ?? "";

  const deleteDestinations = useMemo(
    () =>
      management.activeAccounts.filter((account) => account !== deletingName),
    [deletingName, management.activeAccounts],
  );

  const canSubmitEdit =
    localName.trim().length > 0 &&
    localName.trim().length <= NAME_LIMIT &&
    localIcon.length > 0 &&
    localColor.length > 0;

  const canConfirmDelete = Boolean(localDest) && localDest !== deletingName;

  const modalMaxHeight = useMemo(() => Math.max(height * 0.96, 540), [height]);
  const modalWidth = useMemo(() => Math.min(680, width - 48), [width]);

  const iconGrid = useMemo(() => {
    const outerPaddingX = 12 * 2;
    const pickerPaddingX = 10 * 2;
    const edgeInset = 2;
    const contentWidth = (isMobile ? width : modalWidth) - outerPaddingX;
    const availableWidth = Math.max(
      240,
      contentWidth - pickerPaddingX - edgeInset * 2,
    );
    const spacing = 8;
    const minSize = 34;
    const targetSize = 40;
    const maxColumns = 9;
    const minColumns = 5;
    let columns = Math.max(
      minColumns,
      Math.min(
        maxColumns,
        Math.floor((availableWidth + spacing) / (targetSize + spacing)),
      ),
    );
    let itemSize = Math.floor(
      (availableWidth - spacing * (columns - 1)) / columns,
    );
    while (columns > 3 && itemSize < minSize) {
      columns -= 1;
      itemSize = Math.floor(
        (availableWidth - spacing * (columns - 1)) / columns,
      );
    }
    const iconSize = Math.max(17, Math.floor(itemSize * 0.46));
    return { columns, itemSize, iconSize, spacing, edgeInset };
  }, [isMobile, modalWidth, width]);

  const listHeight = useMemo(() => {
    const base = isMobile ? 400 : 480;
    return Math.min(base, Math.max(200, height * (isMobile ? 0.38 : 0.48)));
  }, [height, isMobile]);

  const handleClose = () => {
    management.handleCloseEdit();
    management.handleCancelDeleteAccount();
    setScreen("list");
    onClose();
  };

  const handleBack = () => {
    if (screen === "edit") management.handleCloseEdit();
    if (screen === "delete") management.handleCancelDeleteAccount();
    setScreen("list");
  };

  const handleSubmit = async () => {
    const saved = await management.handleSubmitAccount(
      localName.slice(0, NAME_LIMIT),
      localIcon,
      localColor,
    );
    if (saved) setScreen("list");
  };

  const handleConfirmDelete = () => {
    management.handleConfirmDeleteAccount(localDest);
    setScreen("list");
  };

  return {
    // layout
    isMobile,
    modalMaxHeight,
    modalWidth,
    iconGrid,
    listHeight,
    // screen
    screen,
    // edit fields
    localName,
    localIcon,
    localColor,
    allColors,
    allIcons,
    canSubmitEdit,
    setLocalName,
    setLocalIcon,
    setLocalColor,
    // delete fields
    deletingName,
    deleteDestinations,
    localDest,
    canConfirmDelete,
    setLocalDest,
    // handlers
    handleClose,
    handleBack,
    handleSubmit,
    handleConfirmDelete,
  };
}
