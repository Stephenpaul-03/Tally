import { AnimatedPaperModal } from "@/components/modal/modal";
import { withOpacity } from "@/utils/ColorHelpers";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SORT_OPTION_COLORS: Record<string, string> = {
  date: "#0EA5E9",
  amount: "#059669",
  title: "#7C3AED",
  category: "#F97316",
  account: "#D97706",
  type: "#0891B2",
  name: "#7C3AED",
  usage: "#059669",
  budget: "#0EA5E9",
  spent: "#F97316",
  remaining: "#D97706",
};

export type SortOption = {
  id: string;
  label: string;
  description: string;
  icon: string;
};

export function SortOptionSheet({
  visible,
  title,
  subtitle,
  options,
  value,
  direction,
  resetDirection = "asc",
  onChange,
  onDirectionChange,
  onDismiss,
  applyLabel = "Apply sort",
  onApply,
}: {
  visible: boolean;
  title: string;
  subtitle: string;
  options: SortOption[];
  value: string;
  direction: "asc" | "desc";
  resetDirection?: "asc" | "desc";
  onChange: (value: string) => void;
  onDirectionChange?: (direction: "asc" | "desc") => void;
  onDismiss: () => void;
  applyLabel?: string;
  onApply?: (value: string, direction: "asc" | "desc") => void;
}) {
  const theme = useTheme();
  const c = theme.colors;
  const { bottom } = useSafeAreaInsets();
  const [draftValue, setDraftValue] = React.useState(value);
  const [draftDirection, setDraftDirection] = React.useState(direction);

  React.useEffect(() => {
    if (visible) {
      setDraftValue(value);
      setDraftDirection(direction);
    }
  }, [direction, value, visible]);

  const handleApply = () => {
    onDirectionChange?.(draftDirection);
    if (onApply) onApply(draftValue, draftDirection);
    else onChange(draftValue);
    onDismiss();
  };

  return (
    <AnimatedPaperModal
      visible={visible}
      onDismiss={onDismiss}
      presentation="sheet"
      includeBottomInset={false}
      contentContainerStyle={styles.modalContent}
    >
      <View
        style={[
          styles.panel,
          {
            backgroundColor: c.background,
            borderColor: c.outlineVariant,
            paddingBottom: Math.max(18, bottom + 12),
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: c.outlineVariant }]} />
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Close ${title}`}
            onPress={onDismiss}
            style={({ pressed }) => [
              styles.headerButton,
              { backgroundColor: c.surface, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <MaterialCommunityIcons
              name="close"
              size={18}
              color={c.onSurfaceVariant}
            />
          </Pressable>
          <View style={styles.titleWrap}>
            <Text
              numberOfLines={1}
              style={[styles.title, { color: c.onSurface }]}
            >
              {title}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.subtitle, { color: c.onSurfaceVariant }]}
            >
              {subtitle}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reset sort"
            onPress={() => {
              setDraftValue(options[0]?.id ?? value);
              setDraftDirection(resetDirection);
            }}
            style={({ pressed }) => [
              styles.headerButton,
              { backgroundColor: c.surface, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <MaterialCommunityIcons
              name="restore"
              size={18}
              color={c.onSurfaceVariant}
            />
          </Pressable>
        </View>

        <Text style={[styles.sectionLabel, { color: c.onSurfaceVariant }]}>
          Direction
        </Text>
        <View
          style={[
            styles.directionTrack,
            { backgroundColor: c.elevation.level1, borderColor: c.outlineVariant },
          ]}
        >
          {(["asc", "desc"] as const).map((item) => {
            const selected = draftDirection === item;
            const directionColor = item === "asc" ? "#14B8A6" : "#1D85E1";
            return (
              <Pressable
                key={item}
                onPress={() => setDraftDirection(item)}
                style={[
                  styles.directionTab,
                  {
                    backgroundColor: selected
                      ? withOpacity(directionColor, 0.12)
                      : "transparent",
                    borderColor: selected
                      ? withOpacity(directionColor, 0.35)
                      : "transparent",
                    borderWidth: 0.5,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={item === "asc" ? "sort-ascending" : "sort-descending"}
                  size={16}
                  color={selected ? directionColor : c.onSurfaceVariant}
                />
                <Text style={{ color: selected ? directionColor : c.onSurfaceVariant, fontSize: 11, fontWeight: "700" }}>
                  {item === "asc" ? "Ascending" : "Descending"}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.sectionLabel, { color: c.onSurfaceVariant }]}>
          Sort types
        </Text>
        <View style={styles.optionGrid}>
          {options.map(({ id, label, description, icon }) => {
            const selected = draftValue === id;
            const optionColor = SORT_OPTION_COLORS[id] ?? c.primary;
            return (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setDraftValue(id)}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: c.elevation.level1,
                    borderColor: selected ? c.primary : "transparent",
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
                <View
                  style={[styles.iconShell, { backgroundColor: optionColor }]}
                >
                  <MaterialCommunityIcons
                    name={icon as any}
                    size={22}
                    color={c.onPrimary}
                  />
                </View>
                <View style={styles.optionCopy}>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.78}
                    style={[styles.optionTitle, { color: c.onSurface }]}
                  >
                    {label}
                  </Text>
                  <Text
                    numberOfLines={2}
                    style={[styles.optionDescription, { color: c.onSurfaceVariant }]}
                  >
                    {description}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name={selected ? "check-circle" : "circle-outline"}
                  size={17}
                  style={styles.optionCheck}
                  color={selected ? optionColor : c.onSurfaceVariant}
                />
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={applyLabel}
          onPress={handleApply}
          style={({ pressed }) => [
            styles.applyButton,
            { backgroundColor: c.primary, opacity: pressed ? 0.82 : 1 },
          ]}
        >
          <MaterialCommunityIcons name="check" size={18} color={c.onPrimary} />
          <Text style={[styles.applyText, { color: c.onPrimary }]}>
            {applyLabel}
          </Text>
        </Pressable>
      </View>
    </AnimatedPaperModal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    width: "100%",
  },
  panel: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 0.5,
    gap: 10,
    paddingBottom: 18,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  handle: {
    alignSelf: "center",
    borderRadius: 999,
    height: 4,
    width: 38,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  headerButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  titleWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 11,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
    marginTop: 2,
  },
  directionTrack: {
    borderRadius: 14,
    borderWidth: 0.5,
    flexDirection: "row",
    gap: 4,
    padding: 4,
  },
  directionTab: {
    alignItems: "center",
    borderRadius: 10,
    flex: 1,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 8,
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  option: {
    alignItems: "center",
    borderRadius: 15,
    borderWidth: 0.5,
    gap: 8,
    justifyContent: "center",
    minHeight: 100,
    paddingHorizontal: 6,
    paddingVertical: 10,
    position: "relative",
    width: "31.6%",
  },
  iconShell: {
    alignItems: "center",
    borderRadius: 12,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  optionCopy: {
    minWidth: 0,
    width: "100%",
  },
  optionTitle: {
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
    textAlign: "center",
  },
  optionDescription: {
    fontSize: 9,
    lineHeight: 12,
    textAlign: "center",
  },
  optionCheck: {
    position: "absolute",
    right: 8,
    top: 8,
  },
  applyButton: {
    alignItems: "center",
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 16,
  },
  applyText: {
    fontSize: 13,
    fontWeight: "800",
  },
});
