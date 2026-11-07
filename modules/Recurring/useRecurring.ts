import React from "react";
import { AppState } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { useAppSelector } from "@/hooks/Redux";
import { selectTransactions } from "@/modules/Core/Slices/TransactionSlice";
import { subscribeRecurring } from "./events";
import { loadRecurring } from "./repository";
import { localDate, type RecurringOccurrence, type RecurringTemplate } from "./model";
export function useRecurring(workspaceId: string, active = true) {
  const focused = useIsFocused();
  const transactions = useAppSelector(selectTransactions);
  const [revision, refresh] = React.useReducer(value => value + 1,0);
  const [data,setData] = React.useState<{ workspaceId: string; templates: RecurringTemplate[]; occurrences: RecurringOccurrence[] }>({workspaceId,templates:[],occurrences:[]});
  const [loading,setLoading] = React.useState(true), [error,setError] = React.useState("");
  React.useEffect(() => subscribeRecurring(refresh),[]);
  React.useEffect(() => {
    if (!active || !focused) return;
    const app = AppState.addEventListener("change",state => { if (state === "active") refresh(); });
    const now = new Date(), midnight = new Date(now.getFullYear(),now.getMonth(),now.getDate()+1);
    const timer = setTimeout(refresh,midnight.getTime()-now.getTime()+100);
    return () => { app.remove(); clearTimeout(timer); };
  },[active,focused,revision]);
  React.useEffect(() => {
    if (!active || !focused || !workspaceId) return;
    let alive = true;
    setLoading(true);
    void loadRecurring(workspaceId,localDate()).then(next => { if (alive) { setData({workspaceId,...next}); setError(""); } })
      .catch(reason => { if (alive) setError(reason instanceof Error ? reason.message : "Could not load recurring transactions"); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive=false; };
  },[workspaceId,active,focused,revision,transactions]);
  const scoped = data.workspaceId === workspaceId ? data : { templates:[], occurrences:[] };
  const actionable = scoped.occurrences.filter(occurrence => occurrence.status === "pending" && scoped.templates.some(template => template.id === occurrence.templateId && !template.paused));
  return { ...scoped, actionable, loading, error, refresh };
}
