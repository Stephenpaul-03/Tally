import { settingsShape } from "@/theme/settingsShape";
import { ManagementEntranceItem, useManagementEntranceProgress } from "@/components/animations/ManagementEntranceItem";
import { SettingsCardEntranceContext } from "@/components/animations/SettingsCardEntrance";
import type { SharedValue } from "react-native-reanimated";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { type MD3Theme } from "react-native-paper";

interface SheetCardProps {
  children: React.ReactNode;
  theme: MD3Theme;
  style?: StyleProp<ViewStyle>;
}

export function SheetCard(props: SheetCardProps) {
  const scope = React.useContext(SettingsCardEntranceContext);
  const id = React.useId();
  return scope
    ? <AnimatedSheetCard {...props} progress={scope.progress} cardIndex={scope.indexFor(id)} />
    : <StandaloneSheetCard {...props} />;
}
function StandaloneSheetCard(props: SheetCardProps) {
  const progress = useManagementEntranceProgress();
  return <AnimatedSheetCard {...props} progress={progress} cardIndex={0} />;
}
function flattenRows(children: React.ReactNode): React.ReactNode[] {
  return React.Children.toArray(children).flatMap(child =>
    React.isValidElement<{ children?: React.ReactNode }>(child) && child.type === React.Fragment
      ? flattenRows(child.props.children) : [child]);
}
function AnimatedSheetCard({ children, theme, style, progress, cardIndex }: SheetCardProps & { progress: SharedValue<number>; cardIndex: number }) {
  const expressive = (theme as ExtendedMD3Theme).expressive;
  const childItems = flattenRows(children);

  return (
    <ManagementEntranceItem progress={progress} index={cardIndex}
      style={[
        {
          marginHorizontal: 20,
          borderRadius: 20,
          overflow: "hidden",
          marginBottom: 20,
          backgroundColor: theme.colors.surface,
          borderWidth: 0.5,
          borderColor: theme.colors.outlineVariant,
        },
        expressive && {
          marginHorizontal: 16,
          borderRadius: 28,
          borderWidth: 0,
          padding: 4,
          marginBottom: 14,
        },
        style,
        settingsShape(theme as ExtendedMD3Theme, "group"),
      ]}
    >
      {childItems.map((child, index) => (
        <ManagementEntranceItem
          key={`${(child as React.ReactElement).key ?? "row"}:${index}`}
          progress={progress}
          index={cardIndex + index + 1}
        >
          {child}
        </ManagementEntranceItem>
      ))}
    </ManagementEntranceItem>
  );
}
