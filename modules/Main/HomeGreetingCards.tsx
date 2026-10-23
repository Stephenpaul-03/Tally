import { homeCardShape, homeCardTone } from "./homeCardAppearance";
import React from "react";
import { AppState, View, useWindowDimensions } from "react-native";
import { useTheme } from "react-native-paper";
import { DesignText as Text } from "@/components/DesignText";
import { HomeWelcome } from "./HomeWelcome";

export function HomeGreetingCards({ active }: { active: boolean }) {
  const { dark } = useTheme();
  const [greetingBackground] = homeCardTone("greeting", dark);
  const [dateBackground, dateForeground] = homeCardTone("date", dark);
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
          backgroundColor: greetingBackground,
          justifyContent: "center",
        }}
      >
        <HomeWelcome active={active} hour={now.getHours()} />
      </View>
      <View
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
          backgroundColor: dateBackground,
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
            color: dateForeground,
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
            color: dateForeground,
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
            color: dateForeground,
          }}
        >
          {now.toLocaleDateString(undefined, {
            month: "short",
            year: "numeric",
          })}
        </Text>
      </View>
    </View>
  );
}
