import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

/** Isolate View's exiting portal/animation from the next Edit presentation. */
export function useTransactionPresentation({
  isOpen,
  mode,
  transactionId,
  onEdit,
}: {
  isOpen: boolean;
  mode: "add" | "view" | "edit";
  transactionId: string | null;
  onEdit: (id: string) => void;
}) {
  const [phase, setPhase] = useState<"ready" | "closing-view" | "waiting-edit">(
    "ready",
  );
  const [presentationId, setPresentationId] = useState(0);
  const pendingId = useRef<string | null>(null);
  useEffect(() => {
    if (!isOpen) {
      pendingId.current = null;
      setPhase("ready");
    }
  }, [isOpen]);
  const requestEdit = useCallback(() => {
    if (!isOpen || mode !== "view" || !transactionId || pendingId.current)
      return;
    pendingId.current = transactionId;
    setPhase("closing-view");
  }, [isOpen, mode, transactionId]);
  const onHidden = useCallback(() => {
    if (phase !== "closing-view") return;
    const id = pendingId.current;
    if (!isOpen || mode !== "view" || !id || transactionId !== id) {
      pendingId.current = null;
      setPhase("ready");
      return;
    }
    // A fresh instance owns fresh shared values. The old portal can never
    // respond to Edit's entrance, even if its native removal is still pending.
    setPresentationId((value) => value + 1);
    setPhase("waiting-edit");
    onEdit(id);
  }, [isOpen, mode, transactionId, phase, onEdit]);
  useLayoutEffect(() => {
    if (
      phase === "waiting-edit" &&
      mode === "edit" &&
      transactionId === pendingId.current
    ) {
      pendingId.current = null;
      setPhase("ready");
    }
  }, [phase, mode, transactionId]);
  return {
    visible: isOpen && phase === "ready",
    presentationId,
    requestEdit,
    onHidden,
  };
}
