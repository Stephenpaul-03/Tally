export type MainDesign = {
  layout: "sage" | "classic";
  style: "sage" | "classic";
};
/** Each layout owns its matching visual style, including migrated preferences. */
export function normalizeMainDesign(value: Partial<MainDesign>): MainDesign {
  const layout = value.layout === "classic" ? "classic" : "sage";
  return { layout, style: layout };
}
