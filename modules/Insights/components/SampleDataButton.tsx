import React, { useRef, useState } from "react";
import { View } from "react-native";
import { useAppDispatch } from "@/hooks/Redux";
import { switchWorkspaceAndReload } from "@/modules/Core/Slices/WorkspaceSlice";
import { toast } from "@/components/toast/ToastProvider";
import { loadSampleData } from "../demo/loadSampleData";
import { Chip, Muted } from "./Primitives";

export function SampleDataButton() {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);
  const load = async () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    try {
      const id = await loadSampleData();
      await dispatch(switchWorkspaceAndReload(id));
      toast.success("Sample data ready in Insights Demo");
    } catch {
      toast.error("Could not load sample data. Please try again.");
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };
  if (!__DEV__) return null;
  return <View style={{ gap: 8, paddingVertical: 16 }}>
    <Chip label={loading ? "Loading sample data…" : "Load sample data"} disabled={loading} onPress={() => { void load(); }} />
    <Muted>Opens a separate demo workspace.</Muted>
  </View>;
}
