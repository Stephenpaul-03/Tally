import React from "react";
import { View } from "react-native";
import { CardWidthContext } from "./CardWidthContext";

/** Two equal columns, with each card measuring its actual available width. */
export function TabletCardGrid({ children, columns = false }: {
  children: React.ReactNode;
  columns?: boolean;
}) {
  const cards: React.ReactNode[] = [];
  const collect = (nodes: React.ReactNode) => React.Children.forEach(nodes, node => {
    if (React.isValidElement<{ children?: React.ReactNode }>(node) && node.type === React.Fragment) {
      collect(node.props.children);
    } else if (node != null && typeof node !== "boolean") cards.push(node);
  });
  collect(children);
  return <View style={{ flexDirection: "row", gap: 14 }}>
    {Array.from({ length: columns ? 2 : 1 }, (_, column) => <View key={column} style={{ flex: 1, minWidth: 0, gap: 14 }}>
      {cards.map((card, index) => !columns || index % 2 === column
        ? <CardCell key={React.isValidElement(card) ? card.key ?? index : index} columns={columns}>{card}</CardCell> : null)}
    </View>)}
  </View>;
}

function CardCell({ children, columns }: { children: React.ReactNode; columns: boolean }) {
  const [width, setWidth] = React.useState<number | null>(null);
  return <View style={{ minWidth: 0 }}>
    <View onLayout={event => setWidth(event.nativeEvent.layout.width)}>
      <CardWidthContext.Provider value={columns ? width : null}>{children}</CardWidthContext.Provider>
    </View>
  </View>;
}
