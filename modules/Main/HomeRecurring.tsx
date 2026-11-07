import { Gesture, GestureDetector, ScrollView } from "react-native-gesture-handler";
import React from "react";
import { View } from "react-native";
import { useAppSelector } from "@/hooks/Redux";
import { selectActiveWorkspace } from "@/modules/Core/Slices/WorkspaceSlice";
import { useRecurring } from "@/modules/Recurring/useRecurring";
import { skipRecurring } from "@/modules/Recurring/repository";
import { RecurringActions, type RecurringSelection } from "@/modules/Recurring/RecurringActions";
import { RecurringCard } from "@/modules/Recurring/RecurringCard";
import { toast } from "@/components/toast/ToastProvider";

export function HomeRecurring({ active, pagePan }: { active: boolean; pagePan: ReturnType<typeof Gesture.Pan> }) {
  const workspace = useAppSelector(selectActiveWorkspace);
  const data = useRecurring(workspace?.id || "", active);
  const [selection, setSelection] = React.useState<RecurringSelection | null>(null);
  const [skipping, setSkipping] = React.useState<string | null>(null);
  return <>
    {!!data.actionable.length && <GestureDetector gesture={Gesture.Native().blocksExternalGesture(pagePan)}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }} nestedScrollEnabled>
        {data.actionable.slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map(occurrence => {
          const template = data.templates.find(item => item.id === occurrence.templateId)!;
          const key = `${template.id}:${occurrence.dueDate}`;
          return <View key={key} style={{ width: 290 }}>
            <RecurringCard compact template={template} occurrence={occurrence} busy={skipping === key}
              onPress={() => setSelection({ template, occurrence })} onAdd={() => setSelection({ template, occurrence, quick: true })}
              onSkip={async () => {
                setSkipping(key);
                try { await skipRecurring(template.workspaceId, template.id, occurrence.dueDate); toast.success("Occurrence skipped"); }
                catch (error) { toast.error(error instanceof Error ? error.message : String(error)); }
                finally { setSkipping(null); }
              }} />
          </View>;
        })}
      </ScrollView>
    </GestureDetector>}
    <RecurringActions selection={selection} onClose={() => setSelection(null)} occurrences={data.occurrences} />
  </>;
}
