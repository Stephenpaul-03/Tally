export const DAY_ITEM_WIDTH = 46;
export const MONTH_ITEM_WIDTH = 48;
export const LIST_GAP = 10;
export const LABEL_ITEM_WIDTH = DAY_ITEM_WIDTH;

const REFERENCE_YEAR = new Date().getFullYear();
export const MAX_YEAR = REFERENCE_YEAR + 3;
export const MIN_YEAR = REFERENCE_YEAR - 3;

// --- Day strip row geometry ---
// weekday label  +  day pill
export const DOW_LABEL_HEIGHT = 20;
export const DOW_LABEL_MARGIN_BOTTOM = 10;

export const DAY_ROW_HEIGHT =
  DOW_LABEL_HEIGHT + DOW_LABEL_MARGIN_BOTTOM + DAY_ITEM_WIDTH;

// --- Month strip row geometry ---
// just the month pill
export const MONTH_PILL_HEIGHT = 40;
export const MONTH_ROW_HEIGHT = MONTH_PILL_HEIGHT;
