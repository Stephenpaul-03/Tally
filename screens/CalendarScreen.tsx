import { PageHeader } from "@/components/pageheader/PageHeader";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export function CalendarScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <PageHeader variant="basic" title="Calendar" />
    </SafeAreaView>
  );
}
