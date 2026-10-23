export type MainDesign = {
  layout: "sage" | "classic";
  style: "sage" | "classic";
};
/** A Classic theme may only be combined with the Classic layout. */
export function normalizeMainDesign(value: Partial<MainDesign>): MainDesign {
  const layout = value.layout === "classic" ? "classic" : "sage";
  return {
    layout,
    style:
      layout === "sage" ? "sage" : value.style === "sage" ? "sage" : "classic",
  };
}
