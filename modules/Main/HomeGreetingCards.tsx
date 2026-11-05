import { useClassicHome, useHomeCardShape } from "./HomeCardContext";
import { homeCardTone } from "./homeCardAppearance";
import React from "react";
import { AppState, Pressable, View, useWindowDimensions } from "react-native";
import { useTheme } from "react-native-paper";
import { HomeDateText as Text } from "./HomeText";
import { HomeWelcome } from "./HomeWelcome";

export function HomeGreetingCards({
  active,
  onChooseMonth,
}: {
  active: boolean;
  onChooseMonth: () => void;
}) {
  const theme = useTheme();
  const { colors: c } = theme;
  const classic = useClassicHome();
  const homeCardShape = useHomeCardShape();
  const [greetingBackground] = homeCardTone("greeting", theme);
  const [dateBackground, dateForeground] = homeCardTone("date", theme);
  const { width } = useWindowDimensions();
  const [rowWidth, setRowWidth] = React.useState(width - 32);
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    if (!active) return;
    const refresh = () => setNow(new Date());
    refresh();
    const timer = setInterval(refresh, 60000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [active]);
  if (classic)
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 16,
          paddingVertical: 6,
        }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <HomeWelcome active={active} hour={now.getHours()} />
        </View>
        <Pressable
          onPress={onChooseMonth}
          accessibilityRole="button"
          accessibilityHint="Choose the month shown on Home"
          accessible
          accessibilityLabel={now.toLocaleDateString(undefined, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          style={{
            width: 76,
            minHeight: 78,
            alignItems: "center",
            justifyContent: "center",
            padding: 8,
            gap: 1,
            backgroundColor: c.surface,
            borderRadius: 12,
            borderWidth: 0.5,
            borderColor: c.outlineVariant,
          }}
        >
          <Text style={{ fontSize: 11, color: c.onSurfaceVariant }}>
            {now.toLocaleDateString(undefined, { weekday: "short" })}
          </Text>
          <Text
            style={{
              fontSize: 26,
              lineHeight: 30,
              fontWeight: "700",
              color: c.primary,
            }}
          >
            {now.getDate()}
          </Text>
          <Text style={{ fontSize: 10, color: c.onSurfaceVariant }}>
            {now.toLocaleDateString(undefined, {
              month: "short",
              year: "numeric",
            })}
          </Text>
        </Pressable>
      </View>
    );
  return (
    <View
      onLayout={(event) => setRowWidth(event.nativeEvent.layout.width)}
      style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}
    >
      <View
        style={{
          width: (rowWidth - 10) * 0.7,
          minHeight: (rowWidth - 10) * 0.3,
          padding: 14,
          ...homeCardShape("greeting"),
          backgroundColor: classic ? c.surface : greetingBackground,
          justifyContent: "center",
        }}
      >
        <HomeWelcome active={active} hour={now.getHours()} />
      </View>
      <Pressable
        onPress={onChooseMonth}
        accessibilityRole="button"
        accessibilityHint="Choose the month shown on Home"
        accessible
        accessibilityLabel={now.toLocaleDateString(undefined, {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        style={{
          width: (rowWidth - 10) * 0.3,
          aspectRatio: 1,
          ...homeCardShape("date"),
          backgroundColor: classic ? c.surface : dateBackground,
          alignItems: "center",
          justifyContent: "center",
          padding: 8,
          gap: 1,
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: classic ? c.onSurface : dateForeground,
          }}
        >
          {now.toLocaleDateString(undefined, { weekday: "short" })}
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            fontSize: 32,
            fontWeight: "800",
            color: classic ? c.onSurface : dateForeground,
            lineHeight: 38,
          }}
        >
          {now.getDate()}
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            fontSize: 11,
            fontWeight: "600",
            color: classic ? c.onSurface : dateForeground,
          }}
        >
          {now.toLocaleDateString(undefined, {
            month: "short",
            year: "numeric",
          })}
        </Text>
      </Pressable>
    </View>
  );
}
