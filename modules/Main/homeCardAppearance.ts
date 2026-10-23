import type { ViewStyle } from "react-native";
import { categoryTone } from "@/theme/sage";

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
export function homeCardTone(
  role: "greeting" | "date" | "drafts",
  dark: boolean,
) {
  return categoryTone(
    { greeting: "Other Expense", date: "Offerings", drafts: "Healthcare" }[
      role
    ],
    dark,
  );
}
