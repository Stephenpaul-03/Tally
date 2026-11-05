import type { ViewStyle } from "react-native";
import Color from "color";
import type { MD3Theme } from "react-native-paper";
import { mixHex } from "@/theme/expressivePalette";

const roles = {
  greeting: 0,
  date: 1,
  balance: 2,
  drafts: 3,
  nudge: 4,
} as const;
const corners = [
  "borderTopLeftRadius",
  "borderTopRightRadius",
  "borderBottomRightRadius",
  "borderBottomLeftRadius",
] as const;
// One random rotation per app session; each card keeps its corner during updates.
const cornerRotation = Math.floor(Math.random() * corners.length);
export function homeCardShape(
  role: keyof typeof roles,
  radius = 28,
): ViewStyle {
  return {
    borderRadius: radius,
    ...Object.fromEntries(
      corners.map((corner, index) => [
        corner,
        index === (roles[role] + cornerRotation) % 4 ? 12 : radius,
      ]),
    ),
  };
}
/** Related shades of the active accent, rather than unrelated category palettes. */
export function homeCardTone(
  role: "greeting" | "date" | "drafts",
  theme: Pick<MD3Theme, "dark" | "colors">,
): [string, string] {
  const depth = { greeting: 0.12, date: 0.22, drafts: 0.3 }[role];
  const accent = Color(theme.colors.primary).contrast(Color(theme.colors.surface)) < 1.4
    ? mixHex(theme.colors.primary, theme.colors.onSurface, 0.25)
    : theme.colors.primary;
  const background = mixHex(theme.colors.surface, accent, theme.dark ? depth : depth * 0.6);
  const foregrounds = [theme.colors.onSurface, theme.colors.onPrimaryContainer, "#000000", "#FFFFFF"];
  const foreground = foregrounds.find(color => Color(color).contrast(Color(background)) >= 4.5)
    ?? theme.colors.onSurface;
  return [background, foreground];
}
