import {
  ACCOUNT_ICON_GROUPS,
  CATEGORY_ICON_GROUPS,
} from "@/components/ManagementOptions";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Text, TouchableRipple, type MD3Theme } from "react-native-paper";

type IconGrid = {
  columns: number;
  itemSize: number;
  iconSize: number;
  spacing: number;
  edgeInset: number;
};

function unique(values: string[]) {
  return [...new Set(values)];
}

function buildGroups(
  variant: "category" | "account",
  availableIcons: string[],
) {
  const available = new Set(availableIcons);
  const baseGroups =
    variant === "account" ? ACCOUNT_ICON_GROUPS : CATEGORY_ICON_GROUPS;
  const suggested = unique(availableIcons).slice(0, 18);
  const grouped = new Set<string>();

  const groups = baseGroups
    .map((group) => {
      const icons = unique(group.icons.filter((icon) => available.has(icon)));
      icons.forEach((icon) => grouped.add(icon));
      return { ...group, icons };
    })
    .filter((group) => group.icons.length > 0);

  const more = availableIcons.filter((icon) => !grouped.has(icon));

  return [
    { key: "suggested", label: "All", icons: suggested },
    ...groups,
    ...(more.length > 0 ? [{ key: "other", label: "More", icons: more }] : []),
  ].filter((group) => group.icons.length > 0);
}

export function IconCategoryPicker({
  allIcons,
  selectedIcon,
  onSelectIcon,
  iconGrid,
  background,
  theme,
  variant,
}: {
  allIcons: string[];
  selectedIcon: string;
  onSelectIcon: (icon: string) => void;
  iconGrid: IconGrid;
  background: string;
  theme: MD3Theme;
  variant: "category" | "account";
}) {
  const c = theme.colors;
  const groups = useMemo(
    () => buildGroups(variant, allIcons),
    [allIcons, variant],
  );
  const [selectedGroupKey, setSelectedGroupKey] = useState(
    groups[0]?.key ?? "suggested",
  );
  const selectedGroup =
    groups.find((group) => group.key === selectedGroupKey) ?? groups[0];
  const visibleRowCount = 3;
  const iconScrollHeight =
    iconGrid.itemSize * visibleRowCount +
    iconGrid.spacing * (visibleRowCount - 1) +
    2;

  return (
    <View style={{ gap: 10 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
      >
        {groups.map((group) => {
          const isSelected = group.key === selectedGroup?.key;
          return (
            <Pressable
              key={group.key}
              onPress={() => setSelectedGroupKey(group.key)}
              style={({ pressed }) => ({
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: isSelected
                  ? c.primaryContainer
                  : c.elevation.level1,
                borderWidth: 0.5,
                borderColor: isSelected ? c.primary : c.outlineVariant,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: isSelected ? c.primary : c.onSurfaceVariant,
                }}
              >
                {group.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator
        nestedScrollEnabled
        style={{
          minHeight: iconScrollHeight,
          maxHeight: iconScrollHeight,
          width: "100%",
        }}
        contentContainerStyle={{
          paddingLeft: iconGrid.edgeInset,
          paddingRight: iconGrid.edgeInset,
          paddingBottom: 2,
        }}
      >
        {Array.from({
          length: Math.ceil(
            (selectedGroup?.icons ?? []).length / iconGrid.columns,
          ),
        }).map((_, rowIndex) => {
          const icons = selectedGroup?.icons ?? [];
          const totalRows = Math.ceil(icons.length / iconGrid.columns);
          return (
            <View
              key={rowIndex}
              style={{
                flexDirection: "row",
                marginBottom: rowIndex < totalRows - 1 ? iconGrid.spacing : 0,
              }}
            >
              {Array.from({ length: iconGrid.columns }).map((_, colIndex) => {
                const iconName = icons[rowIndex * iconGrid.columns + colIndex];
                if (!iconName) {
                  return (
                    <View
                      key={`empty-${colIndex}`}
                      style={{
                        flex: 1,
                        marginLeft: colIndex > 0 ? iconGrid.spacing : 0,
                      }}
                    />
                  );
                }
                const isSelected = selectedIcon === iconName;
                return (
                  <TouchableRipple
                    key={iconName}
                    onPress={() => onSelectIcon(iconName)}
                    borderless
                    style={{
                      flex: 1,
                      aspectRatio: 1,
                      marginLeft: colIndex > 0 ? iconGrid.spacing : 0,
                      borderRadius: Math.max(
                        10,
                        Math.floor(iconGrid.itemSize * 0.28),
                      ),
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1.5,
                      borderColor: isSelected ? c.primary : background,
                      backgroundColor: isSelected
                        ? c.primaryContainer
                        : background,
                    }}
                  >
                    <MaterialCommunityIcons
                      name={iconName as any}
                      size={iconGrid.iconSize}
                      color={isSelected ? c.primary : c.onSurfaceVariant}
                    />
                  </TouchableRipple>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
