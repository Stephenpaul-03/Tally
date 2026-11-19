import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const zeroInsets = { top: 0, bottom: 0, left: 0, right: 0 };

/** Centered tablet cards clear system UI outside their frame, not inside it. */
export function useModalInsets(modal = true) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  return modal && Math.min(width, height) >= 600 && width >= 768 ? zeroInsets : insets;
}
