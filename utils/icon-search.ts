// Everyday names alongside the icon library's technical names.
const groups: readonly [string, readonly string[]][] = [
  ["food meals breakfast lunch dinner restaurant dining eating", ["food-outline", "silverware-fork-knife", "food-drumstick-outline", "rice", "noodles"]],
  ["groceries grocery supermarket shopping vegetables fruits provisions", ["basket-outline", "cart-outline", "cart-variant", "carrot", "food-apple-outline", "fruit-watermelon", "egg-outline", "bread-slice-outline"]],
  ["rent rental mortgage housing house apartment accommodation", ["home-outline", "home-city-outline", "home-account", "home-roof", "key-outline"]],
  ["bills utilities electricity power internet phone gas water", ["lightning-bolt-outline", "lightbulb-outline", "wifi", "cellphone", "gas-cylinder", "water-outline"]],
  ["family children kids childcare baby school education tuition fees", ["account-group-outline", "human-male-female", "baby", "baby-face-outline", "baby-carriage", "baby-bottle-outline", "school-outline", "book-education-outline", "bag-personal-outline"]],
  ["health healthcare doctor hospital medicine medical pharmacy dentist", ["medical-bag", "hospital-box-outline", "stethoscope", "pill", "tooth-outline", "glasses"]],
  ["travel transport commute fuel petrol diesel vehicle", ["car-outline", "bus", "train", "taxi", "bike", "gas-station-outline", "airplane"]],
  ["household cleaning repairs maintenance furniture appliances", ["broom", "vacuum-outline", "tools", "wrench-outline", "sofa-outline", "bed-outline", "fridge-outline", "stove", "washing-machine"]],
  ["donations charity offering church worship", ["hand-heart-outline", "hands-pray", "church", "gift-outline"]],
  ["salary income work wages job pension savings", ["briefcase-outline", "cash", "bank-outline", "piggy-bank-outline", "bank-transfer-in"]],
];

export function matchesIconSearch(icon: string, query: string): boolean {
  const terms = query.trim().toLowerCase().split(/[\s-]+/).filter(Boolean);
  const searchable = [icon.replace(/-/g, " "), ...groups.filter(([, icons]) => icons.includes(icon)).map(([words]) => words)].join(" ");
  return terms.every(term => searchable.includes(term));
}
