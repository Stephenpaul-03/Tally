import { createContext, useContext } from "react";
import { useWindowDimensions } from "react-native";

export const CardWidthContext = createContext<number | null>(null);
export const TabletCardStretchContext = createContext(false);
export function useCardWidth() {
  const width = useContext(CardWidthContext);
  const window = useWindowDimensions();
  return width ?? window.width;
}
