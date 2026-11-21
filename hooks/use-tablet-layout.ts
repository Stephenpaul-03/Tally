import { Dimensions, Platform, useWindowDimensions } from "react-native";

export function useTabletLayout() {
  // Subscribe to dimension changes, but classify native devices using their
  // full display. Insets, the keyboard and a resized app window are not a
  // change of device type. Web layouts follow the browser's available space.
  const window = useWindowDimensions();
  if (Platform.OS === "ios" && Platform.isPad) return true;
  const { width, height } = Platform.OS === "web" ? window : Dimensions.get("screen");
  return Math.min(width, height) >= 600;
}
