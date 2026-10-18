import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

type Icon = React.ComponentProps<typeof MaterialCommunityIcons>["name"];
export function OnboardingIntro() {
  const { colors: c, dark } = useTheme();
  const accents = dark ? ["#73D6B1", "#F0B86E", "#B9A7F4"] : ["#167A58", "#A65D19", "#7650B5"];
  const motion = React.useRef(Array.from({ length: 20 }, () => new Animated.Value(0))).current;
  React.useEffect(() => {
    let active = true;
    let animation: Animated.CompositeAnimation | undefined;
    const play = (reduced: boolean) => {
      animation?.stop();
      if (!active) return;
      if (reduced) { motion.forEach(value => value.setValue(1)); return; }
      motion.forEach(value => value.setValue(0));
      const enter = (index: number, delay: number, duration = 540) => Animated.timing(motion[index], {
        toValue: 1, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      });
      animation = Animated.parallel([
        enter(0, 0), enter(1, 120),
        ...[2, 3, 4].map((index, i) => enter(index, 400 + i * 100)),
        ...[5, 6, 7].map((index, i) => enter(index, 380 + i * 80)),
        ...Array.from({ length: 12 }, (_, i) => enter(8 + i, 220 + i * 28, 680)),
      ]);
      animation.start();
    };
    void AccessibilityInfo.isReduceMotionEnabled().then(play);
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", play);
    return () => { active = false; animation?.stop(); subscription.remove(); };
  }, [motion]);
  const reveal = (index: number) => ({ opacity: motion[index], transform: [{ translateY: motion[index].interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] });
  return <View style={s.root}>
    <Animated.View style={[{ gap: 12 }, reveal(0)]}>
      <Text style={[s.eyebrow, { color: c.primary }]}>A little more clarity.</Text>
      <Text accessibilityRole="header" style={[s.title, { color: c.onSurface }]}>Keep tabs.{"\n"}<Text style={[s.title, { color: c.primary }]}>Find your calm.</Text></Text>
      <Text style={[s.description, { color: c.onSurfaceVariant }]}>For the everyday money that’s easy to lose track of.</Text>
    </Animated.View>
    <Animated.View accessible accessibilityLabel="Record the little things. See the bigger picture." style={[s.illustration, { backgroundColor: c.elevation.level1, borderColor: c.outlineVariant }, reveal(1)]}>
      <View style={s.cardTop}><View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}><View style={{ flexDirection: "row", gap: 4 }}>{accents.map(color => <View key={color} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />)}</View><Text style={[s.eyebrow, { color: c.onSurfaceVariant }]}>The little things add up.</Text></View>
        <MaterialCommunityIcons name="chart-timeline-variant" size={20} color={c.primary} /></View>
      <View style={s.chart}>
        {[28, 44, 35, 60, 48, 72, 58, 88, 76, 100, 86, 112].map((height, index) => <Animated.View key={index} style={{ flex: 1, height: height * 0.55, borderRadius: 4, backgroundColor: accents[Math.floor(index / 4)], opacity: motion[8 + index],
          transform: [{ translateY: motion[8 + index].interpolate({ inputRange: [0, 1], outputRange: [height * 0.275, 0] }) }, { scaleY: motion[8 + index] }] }} />)}
      </View>
      <View style={s.tags}>{([['coffee-outline', 'Morning coffee'], ['shopping-outline', 'Groceries'], ['briefcase-outline', 'Payday']] as const).map(([icon, name], index) => <Animated.View key={name} style={[s.tag, { backgroundColor: `${accents[index]}18` }, reveal(5 + index)]}><MaterialCommunityIcons name={icon} size={14} color={accents[index]} /><Text style={[s.tagLabel, { color: c.onSurface }]}>{name}</Text></Animated.View>)}</View>
    </Animated.View>
    <View style={{ gap: 14 }}>
      <Animated.View style={reveal(2)}><Point color={accents[0]} icon="pencil-plus-outline" text="Log income and expenses. No bank connection needed." /></Animated.View>
      <Animated.View style={reveal(3)}><Point color={accents[1]} icon="shape-outline" text="Your categories. Your payment methods. Your kind of order." /></Animated.View>
      <Animated.View style={reveal(4)}><Point color={accents[2]} icon="shield-check-outline" text="Records stay on your device. Backups live in Settings." /></Animated.View>
    </View>
  </View>;
}
function Point({ icon, text, color }: { icon: Icon; text: string; color: string }) {
  const { colors } = useTheme();
  return <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}><MaterialCommunityIcons name={icon} size={19} color={color} /><Text style={[s.point, { color: colors.onSurfaceVariant }]}>{text}</Text></View>;
}
const s = StyleSheet.create({
  root: { gap: 26 },
  eyebrow: { ...typography.editorial.sectionLabel, fontSize: 13, lineHeight: 18, letterSpacing: 0.6 },
  title: { ...typography.editorial.sectionLabel, fontSize: 44, lineHeight: 49 },
  description: { ...typography.body, fontSize: 15, lineHeight: 23, maxWidth: 300 },
  illustration: { padding: 18, borderRadius: 26, borderWidth: 0.5, gap: 14 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  chart: { flexDirection: "row", alignItems: "flex-end", gap: 6, height: 68 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  tag: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 9, paddingHorizontal: 8, paddingVertical: 6 },
  tagLabel: { ...typography.body, fontSize: 10, lineHeight: 14 },
  point: { ...typography.body, fontSize: 13, lineHeight: 19, flex: 1 },
});
