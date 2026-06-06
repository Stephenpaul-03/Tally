import React from "react";

export type FloatingTabRoute = {
  key: string;
  name: string;
  title: string;
  icon: (props: { color: string; size: number }) => React.ReactNode;
};

export const BAR_HEIGHT = 52;
export const BAR_PADDING = 5;
export const TAB_SLOT = 60;
export const PILL_INSET = 6;
export const EDGE_MARGIN = 16;
export const DRAG_THRESHOLD = 4;
export const BAR_BOTTOM_OFFSET = 12;
