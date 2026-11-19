import { useWindowDimensions } from "react-native";
import { useTabletLayout } from "./use-tablet-layout";

export function useTabletLandscape() {
  const tablet = useTabletLayout();
  const { width, height } = useWindowDimensions();
  return tablet && width > height;
}
