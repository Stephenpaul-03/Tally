import React from "react";
import { View } from "react-native";
import { CardWidthContext, TabletCardStretchContext } from "@/components/CardWidthContext";

function Cell({ children, grow = 1, stretch = false }: { children: React.ReactNode; grow?: number; stretch?: boolean }) {
  const [width, setWidth] = React.useState<number | null>(null);
  return <View onLayout={event => setWidth(event.nativeEvent.layout.width)} style={{ flex: grow, minWidth: 0 }}>
    <CardWidthContext.Provider value={width}><TabletCardStretchContext.Provider value={stretch}>{children}</TabletCardStretchContext.Provider></CardWidthContext.Provider>
  </View>;
}

/** Shared tablet geometry; card content keeps each style's palette and typography. */
export function TabletInsightsDashboard({ landscape, spending, income, activity, accounts, summary, year, monthly, expressive = false }: {
  landscape: boolean; spending?: React.ReactNode; income?: React.ReactNode; activity?: React.ReactNode;
  accounts?: React.ReactNode; summary: React.ReactNode; year?: React.ReactNode;
  monthly?: React.ReactNode; expressive?: boolean;
}) {
  if (expressive) return <View style={{ gap: 18 }}>
    <View style={{ flexDirection: "row", gap: 18, alignItems: "stretch" }}>
      {monthly ? <Cell stretch>{monthly}</Cell> : null}<Cell stretch>{summary}</Cell>
    </View>
    {spending || income || accounts ? <View style={{ flexDirection: "row", gap: 18, alignItems: "stretch" }}>
      {spending ? <Cell stretch>{spending}</Cell> : null}{income ? <Cell stretch>{income}</Cell> : null}{accounts ? <Cell stretch>{accounts}</Cell> : null}
    </View> : null}
    {activity || year ? <View style={{ flexDirection: "row", gap: 18, alignItems: "stretch" }}>
      {activity ? <Cell stretch grow={2}>{activity}</Cell> : null}{year ? <Cell stretch grow={3}>{year}</Cell> : null}
    </View> : null}
  </View>;
  return <View style={{ gap: 18 }}>
    {spending || income ? <View style={{ flexDirection: "row", gap: 18, alignItems: "flex-start" }}>
      {spending ? <Cell grow={1.3}>{spending}</Cell> : null}
      {income ? <Cell>{income}</Cell> : null}
    </View> : null}
    <View style={{ flexDirection: "row", gap: 18, alignItems: "flex-start" }}>
      {activity ? <Cell grow={landscape ? 1.2 : 1.1}>{activity}</Cell> : null}
      {accounts ? <Cell>{accounts}</Cell> : null}
      {landscape ? <Cell>{summary}</Cell> : null}
    </View>
    {landscape ? year : <View style={{ flexDirection: "row", gap: 18, alignItems: "flex-start" }}>
      <Cell>{summary}</Cell>{year ? <Cell>{year}</Cell> : null}
    </View>}
  </View>;
}
