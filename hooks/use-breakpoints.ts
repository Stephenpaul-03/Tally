import { Platform, useWindowDimensions } from "react-native";

export function useBreakpoint() {
  const { width, height } = useWindowDimensions();
  const isMobileLayout = Platform.OS !== "web" || width < 768;
  const isCompact = width < 768;
  const isLandscape = width > height;

  return { width, height, isMobileLayout, isCompact, isLandscape };
}

