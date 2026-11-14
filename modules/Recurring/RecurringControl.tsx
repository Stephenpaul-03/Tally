import React from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import { useTheme } from "react-native-paper";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import Animated, { cancelAnimation, Easing, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { DesignText as Text } from "@/components/DesignText";
import { useMotionEnabled } from "@/components/animations/Motion";
import { tonalButtonSurface } from "@/theme/surfaceTreatment";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { frequencyLabel, type Frequency } from "./model";

const ICONS = { off: "repeat-off", weekly: "calendar-week", monthly: "calendar-month-outline", yearly: "calendar-range" } as const;
export const RECURRING_PILL_WIDTH = 120;

/** Expands horizontally beside the calculator; one UI-thread pill follows taps and drags. */
export function RecurringControl({ open, enabled, frequency, required, disabled, availableWidth, onToggle, onSelect, visible = true }: {
  visible?: boolean;
  availableWidth: number; open: boolean; enabled: boolean; frequency: Frequency; required: boolean; disabled: boolean;
  onToggle: () => void; onSelect: (frequency: Frequency | null) => void;
}) {
  const theme = useTheme<ExtendedMD3Theme>(), c = theme.colors;
  const motion = useMotionEnabled();
  const options: (Frequency | null)[] = required ? ["weekly", "monthly", "yearly"] : [null, "weekly", "monthly", "yearly"];
  const { width } = useWindowDimensions();
  // Use the measured inner row, not screen width: the editor has nested padding.
  const budget = availableWidth || Math.min(width - 132, 300);
  const closeWidth = 38;
  const showAllLabels = budget >= options.length * 72 + closeWidth;
  const selected = Math.max(0, options.indexOf(enabled ? frequency : null));
  const expansion = useSharedValue(0), position = useSharedValue(selected), start = useSharedValue(selected), dragging = useSharedValue(false);
  const compactWidth = useSharedValue(enabled ? RECURRING_PILL_WIDTH : 44);
  React.useEffect(() => {
    compactWidth.value = withTiming(enabled ? RECURRING_PILL_WIDTH : 44, { duration: motion ? 200 : 0 });
  }, [enabled, motion, compactWidth]);
  const compactFrame = useAnimatedStyle(() => ({ width: compactWidth.value }));
  const visibility = useSharedValue(visible ? 1 : 0);
  React.useEffect(() => { visibility.value = withTiming(visible ? 1 : 0, { duration: motion ? 220 : 0 }); }, [visible, motion, visibility]);
  React.useEffect(() => {
    expansion.value = withTiming(open ? 1 : 0, { duration: motion ? 200 : 0, easing: Easing.out(Easing.cubic) });
  }, [open, motion, expansion]);
  React.useEffect(() => {
    if (!dragging.value) position.value = withTiming(selected, { duration: motion ? 160 : 0 });
  }, [selected, motion, position, dragging]);
  const slot = Math.min(82, (budget - closeWidth) / options.length);
  const widths = options.map((_, index) => showAllLabels ? slot : index === selected ? Math.max(44, Math.min(88, budget - closeWidth - (options.length - 1) * 44)) : 44);
  const offsets = widths.map((_, index) => widths.slice(0, index).reduce((sum, value) => sum + value, 0));
  const centers = widths.map((value, index) => offsets[index] + value / 2);
  const indexes = options.map((_, index) => index);
  const expandedWidth = widths.reduce((sum, value) => sum + value, 0) + closeWidth;
  const frame = useAnimatedStyle(() => ({ width: (compactWidth.value + (expandedWidth - compactWidth.value) * expansion.value) * visibility.value, opacity: visibility.value }));
  const compact = useAnimatedStyle(() => ({ opacity: Math.max(0, 1 - expansion.value * 2) }));
  const expanded = useAnimatedStyle(() => ({ opacity: expansion.value }));
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: interpolate(position.value, indexes, offsets) }], width: interpolate(position.value, indexes, widths) }));
  const choose = (index: number) => onSelect(options[index]);
  const pan = Gesture.Pan().enabled(open && !disabled).activeOffsetX([-4, 4]).failOffsetY([-12, 12])
    .onStart(() => { cancelAnimation(position); start.value = interpolate(position.value,indexes,centers); dragging.value = true; })
    .onUpdate(event => { position.value = interpolate(Math.max(centers[0],Math.min(centers[centers.length-1],start.value+event.translationX)),centers,indexes); })
    .onEnd(() => {
      dragging.value = false;
      const next = Math.round(position.value);
      position.value = withTiming(next, { duration: motion ? 150 : 0 });
      runOnJS(choose)(next);
    }).onFinalize(() => {
      if (dragging.value) { dragging.value = false; position.value = withTiming(selected, { duration: motion ? 150 : 0 }); }
    });
  return <Animated.View pointerEvents={visible ? "auto" : "none"} style={[{ height: 50, overflow: "hidden", borderRadius: 25 }, frame]}>
    <Animated.View pointerEvents={open ? "none" : "auto"} accessibilityElementsHidden={open} importantForAccessibility={open ? "no-hide-descendants" : "auto"} style={[{ position: "absolute", top: 3, left: 0 }, compact, compactFrame]}>
      <Pressable accessibilityRole="button" accessibilityLabel={enabled ? `Repeat ${frequencyLabel(frequency).toLowerCase()}` : "Set recurrence"} accessibilityState={{ expanded: open, disabled }} disabled={disabled} onPress={onToggle}
        style={{ width: "100%", height: 44, borderRadius: 22, flexDirection: "row", gap: 8, paddingHorizontal: enabled ? 12 : 0, alignItems: "center", justifyContent: "center", backgroundColor: enabled ? c.secondaryContainer : tonalButtonSurface(theme), opacity: disabled ? 0.4 : 1 }}>
        <Icon name={enabled ? ICONS[frequency] : "repeat"} size={21} color={enabled ? c.onSecondaryContainer : c.onSurface} />
        {enabled ? <Text numberOfLines={1} style={{ flexShrink: 1, fontSize: 12, fontWeight: "600", color: c.onSecondaryContainer }}>{frequencyLabel(frequency)}</Text> : null}
      </Pressable>
    </Animated.View>
    <Animated.View pointerEvents={open ? "auto" : "none"} accessibilityElementsHidden={!open} importantForAccessibility={open ? "auto" : "no-hide-descendants"} style={[{ position: "absolute", left: 0, top: 0, width: expandedWidth, height: 50, flexDirection: "row", alignItems: "center" }, expanded]}>
      <GestureDetector gesture={pan}>
        <View accessibilityRole="tablist" style={{ height: 50, padding: 3, flexDirection: "row", borderRadius: 25, backgroundColor: tonalButtonSurface(theme) }}>
          <Animated.View pointerEvents="none" style={[{ position: "absolute", left: 3, top: 3, width: slot, height: 44, borderRadius: 22, backgroundColor: c.secondaryContainer }, pill]} />
          {options.map((value, index) => <Pressable key={value || "off"} accessibilityRole="tab" accessibilityLabel={value ? frequencyLabel(value) : "Do not repeat"} accessibilityState={{ selected: index === selected, disabled }} disabled={disabled} onPress={() => choose(index)}
            style={{ width: widths[index], height: 44, alignItems: "center", justifyContent: "center", flexDirection: "row", paddingHorizontal: 5, gap: 4 }}>
            <Icon name={ICONS[value || "off"]} size={16} color={index === selected ? c.onSecondaryContainer : c.onSurfaceVariant} />
            {(showAllLabels || index === selected) && <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} style={{ flexShrink: 1, fontSize: slot < 72 ? 10 : 12, fontWeight: index === selected ? "800" : "600", color: index === selected ? c.onSecondaryContainer : c.onSurfaceVariant }}>{value ? frequencyLabel(value) : "Off"}</Text>}
          </Pressable>)}
        </View>
      </GestureDetector>
      {closeWidth > 0 && <Pressable accessibilityRole="button" accessibilityLabel="Close recurrence choices" onPress={onToggle} style={{ width: 32, height: 44, alignItems: "center", justifyContent: "center" }}><Icon name="chevron-left" size={20} color={c.onSurfaceVariant} /></Pressable>}
    </Animated.View>
  </Animated.View>;
}
