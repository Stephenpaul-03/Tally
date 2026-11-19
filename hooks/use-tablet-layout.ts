import { useWindowDimensions } from "react-native";

export function useTabletLayout() {
  const { width, height } = useWindowDimensions();
  return Math.min(width, height) >= 600 && width >= 768;
}
