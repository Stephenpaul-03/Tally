import React from "react";
import { View } from "react-native";
import { CardWidthContext, TabletCardStretchContext } from "@/components/CardWidthContext";

function Cell({ children, grow = 1, stretch = false, column = false }: { children: React.ReactNode; grow?: number; stretch?: boolean; column?: boolean }) {
  const [width, setWidth] = React.useState<number | null>(null);
  return <View onLayout={event => setWidth(event.nativeEvent.layout.width)} style={{ flex: column ? undefined : grow, minWidth: 0 }}>
    <CardWidthContext.Provider value={width}><TabletCardStretchContext.Provider value={stretch}>{children}</TabletCardStretchContext.Provider></CardWidthContext.Provider>
  </View>;
}

/** Shared tablet geometry; card content keeps each style's palette and typography. */
export function TabletInsightsDashboard({ spending, income, activity, accounts, summary, year, monthly }: {
  landscape: boolean; spending?: React.ReactNode; income?: React.ReactNode; activity?: React.ReactNode;
  accounts?: React.ReactNode; summary: React.ReactNode; year?: React.ReactNode;
  monthly?: React.ReactNode; expressive?: boolean;
}) {
  return <View style={{ gap: 16 }}>
    <View style={{ flexDirection: "row", gap: 16, alignItems: "stretch" }}>
      {monthly ? <Cell stretch>{monthly}</Cell> : null}<Cell stretch>{summary}</Cell>
    </View>
    <View style={{ flexDirection: "row", gap: 16, alignItems: "flex-start" }}>
      <View style={{ flex: 1, minWidth: 0, gap: 16 }}>
        {spending ? <Cell column>{spending}</Cell> : null}
        {activity ? <Cell column>{activity}</Cell> : null}
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 16 }}>
        {income ? <Cell column>{income}</Cell> : null}
        {accounts ? <Cell column>{accounts}</Cell> : null}
        {year ? <Cell column>{year}</Cell> : null}
      </View>
    </View>
  </View>;
}
