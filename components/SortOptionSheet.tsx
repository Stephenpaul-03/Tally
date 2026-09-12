import { AnimatedPaperModal } from "@/components/modal/modal";
import { withOpacity } from "@/utils/ColorHelpers";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
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

type SlidingPillToggleOption<T extends string> = {
  key: T;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
};

function darkenHex(hex: string, amount = 0.18) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;

  const value = parseInt(clean, 16);
  const r = Math.max(0, Math.round(((value >> 16) & 255) * (1 - amount)));
  const g = Math.max(0, Math.round(((value >> 8) & 255) * (1 - amount)));
  const b = Math.max(0, Math.round((value & 255) * (1 - amount)));

  return `#${[r, g, b]
    .map((part) => part.toString(16).padStart(2, "0"))
    .join("")}`;
}

export function SlidingPillToggle<T extends string>({
  value,
  options,
  onChange,
  colorizeActive = true,
  neutralSlider = false,
}: {
  value: T;
  options: SlidingPillToggleOption<T>[];
  onChange: (value: T) => void;
  colorizeActive?: boolean;
  neutralSlider?: boolean;
}) {
  const theme = useTheme();
  const [trackWidth, setTrackWidth] = React.useState(0);
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const dragProgress = React.useRef(0);
  const hasInitialized = React.useRef(false);
  const trackPadding = 4;
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.key === value),
  );
  const tabWidth =
    options.length > 0 ? (trackWidth - trackPadding * 2) / options.length : 0;
  const activeColor = options[activeIndex]?.color ?? theme.colors.primary;

  const slideTo = React.useCallback(
    (nextValue: T) => {
      const nextIndex = Math.max(
        0,
        options.findIndex((option) => option.key === nextValue),
      );
      slideAnim.stopAnimation(() => {
        Animated.timing(slideAnim, {
          toValue: nextIndex,
          useNativeDriver: true,
          duration: 200,
          easing: Easing.out(Easing.quad),
        }).start();
      });
    },
    [options, slideAnim],
  );

  React.useEffect(() => {
    if (trackWidth === 0) return;

    if (!hasInitialized.current) {
      slideAnim.setValue(activeIndex);
      hasInitialized.current = true;
      return;
    }

    slideTo(value);
  }, [activeIndex, slideAnim, slideTo, trackWidth, value]);

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .onBegin(() => {
      dragProgress.current = activeIndex;
      slideAnim.stopAnimation();
    })
    .onUpdate((event) => {
      if (tabWidth <= 0) return;
      const maxIndex = Math.max(0, options.length - 1);
      const next = Math.max(
        0,
        Math.min(
          maxIndex,
          dragProgress.current + event.translationX / tabWidth,
        ),
      );
      slideAnim.setValue(next);
    })
    .onEnd((event) => {
      if (tabWidth <= 0) return;
      const maxIndex = Math.max(0, options.length - 1);
      const nextIndex = Math.max(
        0,
        Math.min(
          maxIndex,
          Math.round(dragProgress.current + event.translationX / tabWidth),
        ),
      );
      const nextValue = options[nextIndex]?.key ?? value;
      slideTo(nextValue);
      if (nextValue !== value) onChange(nextValue);
    });

  const tapGesture = Gesture.Tap()
    .runOnJS(true)
    .onEnd((event) => {
      if (trackWidth === 0 || options.length === 0) return;
      const nextIndex = Math.max(
        0,
        Math.min(
          options.length - 1,
          Math.floor(event.x / (trackWidth / options.length)),
        ),
      );
      const nextValue = options[nextIndex]?.key ?? value;
      slideTo(nextValue);
      if (nextValue !== value) onChange(nextValue);
    });

  return (
    <GestureHandlerRootView style={slidingStyles.root}>
      <GestureDetector gesture={Gesture.Race(panGesture, tapGesture)}>
        <View
          style={[
            slidingStyles.track,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
              padding: trackPadding,
            },
          ]}
          onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        >
          {trackWidth > 0 ? (
            <Animated.View
              style={[
                slidingStyles.slider,
                {
                  width: tabWidth,
                  top: trackPadding,
                  bottom: trackPadding,
                  left: trackPadding,
                  backgroundColor: neutralSlider
                    ? theme.colors.elevation.level2
                    : withOpacity(activeColor, 0.12),
                  borderColor: neutralSlider
                    ? theme.colors.outlineVariant
                    : withOpacity(darkenHex(activeColor), 0.45),
                  transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: [0, Math.max(1, options.length - 1)],
                        outputRange: [
                          0,
                          tabWidth * Math.max(1, options.length - 1),
                        ],
                      }),
                    },
                  ],
                },
              ]}
            />
          ) : null}
          {options.map((option) => {
            const selected = option.key === value;
            const contentColor =
              colorizeActive && selected
                ? option.color
                : theme.colors.onSurfaceVariant;

            return (
              <View key={option.key} style={slidingStyles.tab}>
                <MaterialCommunityIcons
                  name={option.icon}
                  size={15}
                  color={contentColor}
                />
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.78}
                  style={[slidingStyles.label, { color: contentColor }]}
                >
                  {option.label}
                </Text>
              </View>
            );
          })}
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

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
  onReset,
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
  onReset?: () => void;
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
              onReset?.();
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
        <SlidingPillToggle
          value={draftDirection}
          onChange={setDraftDirection}
          options={[
            {
              key: "asc",
              label: "Ascending",
              icon: "sort-ascending",
              color: "#14B8A6",
            },
            {
              key: "desc",
              label: "Descending",
              icon: "sort-descending",
              color: "#1D85E1",
            },
          ]}
        />
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
                    borderColor: "transparent",
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
                <View style={styles.optionContent}>
                  <View
                    style={[styles.iconShell, { backgroundColor: optionColor }]}
                  >
                    <MaterialCommunityIcons
                      name={icon as any}
                      size={22}
                      color="#FFFFFF"
                      style={styles.sortIcon}
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
                      style={[
                        styles.optionDescription,
                        { color: c.onSurfaceVariant },
                      ]}
                    >
                      {description}
                    </Text>
                  </View>
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

const slidingStyles = StyleSheet.create({
  root: {
    alignSelf: "stretch",
    width: "100%",
  },
  track: {
    alignSelf: "stretch",
    borderRadius: 999,
    borderWidth: 0.5,
    flexDirection: "row",
    position: "relative",
    width: "100%",
  },
  slider: {
    borderRadius: 999,
    borderWidth: 0.5,
    position: "absolute",
  },
  tab: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 38,
    minWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 8,
    zIndex: 1,
  },
  label: {
    fontSize: 11,
    lineHeight: 13,
  },
});

const styles = StyleSheet.create({
  modalContent: {
    width: "100%",
  },
  panel: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
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
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  option: {
    borderRadius: 18,
    borderWidth: 0.5,
    justifyContent: "center",
    aspectRatio: 1,
    paddingHorizontal: 6,
    paddingVertical: 10,
    position: "relative",
    width: "31.6%",
  },
  optionContent: {
    alignItems: "center",
    alignSelf: "stretch",
    gap: 8,
    justifyContent: "center",
  },
  iconShell: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 20,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  optionCopy: {
    minWidth: 0,
    width: "100%",
  },
  sortIcon: {
    textAlign: "center",
    textAlignVertical: "center",
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
