import React from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import { useTheme } from "react-native-paper";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import Animated, { cancelAnimation, Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { DesignText as Text } from "@/components/DesignText";
import { useMotionEnabled } from "@/components/animations/Motion";
import { tonalButtonSurface } from "@/theme/surfaceTreatment";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { frequencyLabel, type Frequency } from "./model";

const ICONS = { off: "repeat-off", weekly: "calendar-week", monthly: "calendar-month-outline", yearly: "calendar-range" } as const;

/** Expands horizontally beside the calculator; one UI-thread pill follows taps and drags. */
export function RecurringControl({ open, enabled, frequency, required, disabled, onToggle, onSelect }: {
  open: boolean; enabled: boolean; frequency: Frequency; required: boolean; disabled: boolean;
  onToggle: () => void; onSelect: (frequency: Frequency | null) => void;
}) {
  const theme = useTheme<ExtendedMD3Theme>(), c = theme.colors;
  const motion = useMotionEnabled();
  const options: (Frequency | null)[] = required ? ["weekly", "monthly", "yearly"] : [null, "weekly", "monthly", "yearly"];
  const { width } = useWindowDimensions();
  // Reserve the editor padding, calculator, gap, and close button on this row.
  const slot = Math.min(82, Math.max(44, (Math.min(width, 600) - 40 - 52 - 38) / options.length));
  const selected = Math.max(0, options.indexOf(enabled ? frequency : null));
  const expansion = useSharedValue(0), position = useSharedValue(selected), start = useSharedValue(selected), dragging = useSharedValue(false);
  React.useEffect(() => {
    expansion.value = withTiming(open ? 1 : 0, { duration: motion ? 200 : 0, easing: Easing.out(Easing.cubic) });
  }, [open, motion, expansion]);
  React.useEffect(() => {
    if (!dragging.value) position.value = withTiming(selected, { duration: motion ? 160 : 0 });
  }, [selected, motion, position, dragging]);
  const expandedWidth = options.length * slot + 38;
  const frame = useAnimatedStyle(() => ({ width: 44 + (expandedWidth - 44) * expansion.value }));
  const compact = useAnimatedStyle(() => ({ opacity: Math.max(0, 1 - expansion.value * 2) }));
  const expanded = useAnimatedStyle(() => ({ opacity: expansion.value }));
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: position.value * slot }] }));
  const choose = (index: number) => onSelect(options[index]);
  const pan = Gesture.Pan().enabled(open && !disabled).activeOffsetX([-4, 4]).failOffsetY([-12, 12])
    .onStart(() => { cancelAnimation(position); start.value = position.value; dragging.value = true; })
    .onUpdate(event => { position.value = Math.max(0, Math.min(options.length - 1, start.value + event.translationX / slot)); })
    .onEnd(() => {
      dragging.value = false;
      const next = Math.round(position.value);
      position.value = withTiming(next, { duration: motion ? 150 : 0 });
      runOnJS(choose)(next);
    }).onFinalize(() => {
      if (dragging.value) { dragging.value = false; position.value = withTiming(selected, { duration: motion ? 150 : 0 }); }
    });
  return <Animated.View style={[{ height: 50, overflow: "hidden", borderRadius: 25 }, frame]}>
    <Animated.View pointerEvents={open ? "none" : "auto"} accessibilityElementsHidden={open} importantForAccessibility={open ? "no-hide-descendants" : "auto"} style={[{ position: "absolute", top: 3, left: 0 }, compact]}>
      <Pressable accessibilityRole="button" accessibilityLabel={enabled ? `Repeat ${frequencyLabel(frequency).toLowerCase()}` : "Set recurrence"} accessibilityState={{ expanded: open, disabled }} disabled={disabled} onPress={onToggle}
        style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: enabled ? c.secondaryContainer : tonalButtonSurface(theme), opacity: disabled ? 0.4 : 1 }}>
        <Icon name={enabled ? ICONS[frequency] : "repeat"} size={21} color={enabled ? c.onSecondaryContainer : c.onSurface} />
      </Pressable>
    </Animated.View>
    <Animated.View pointerEvents={open ? "auto" : "none"} accessibilityElementsHidden={!open} importantForAccessibility={open ? "auto" : "no-hide-descendants"} style={[{ position: "absolute", left: 0, top: 0, width: expandedWidth, height: 50, flexDirection: "row", alignItems: "center" }, expanded]}>
      <GestureDetector gesture={pan}>
        <View accessibilityRole="tablist" style={{ height: 50, padding: 3, flexDirection: "row", borderRadius: 25, backgroundColor: tonalButtonSurface(theme) }}>
          <Animated.View pointerEvents="none" style={[{ position: "absolute", left: 3, top: 3, width: slot, height: 44, borderRadius: 22, backgroundColor: c.secondaryContainer }, pill]} />
          {options.map((value, index) => <Pressable key={value || "off"} accessibilityRole="tab" accessibilityLabel={value ? frequencyLabel(value) : "Do not repeat"} accessibilityState={{ selected: index === selected, disabled }} disabled={disabled} onPress={() => choose(index)}
            style={{ width: slot, height: 44, alignItems: "center", justifyContent: "center", flexDirection: "row", paddingHorizontal: 5, gap: 4 }}>
            <Icon name={ICONS[value || "off"]} size={16} color={index === selected ? c.onSecondaryContainer : c.onSurfaceVariant} />
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} style={{ flexShrink: 1, fontSize: slot < 72 ? 10 : 12, fontWeight: index === selected ? "800" : "600", color: index === selected ? c.onSecondaryContainer : c.onSurfaceVariant }}>{value ? frequencyLabel(value) : "Off"}</Text>
          </Pressable>)}
        </View>
      </GestureDetector>
      <Pressable accessibilityRole="button" accessibilityLabel="Close recurrence choices" onPress={onToggle} style={{ width: 32, height: 44, alignItems: "center", justifyContent: "center" }}><Icon name="chevron-left" size={20} color={c.onSurfaceVariant} /></Pressable>
    </Animated.View>
  </Animated.View>;
}
