import React from "react";
import { useTheme } from "react-native-paper";
import { homeCardShape } from "./homeCardAppearance";
const ClassicHomeContext = React.createContext(false);
export function HomePresentation({
  classic,
  children,
}: {
  classic: boolean;
  children: React.ReactNode;
}) {
  return (
    <ClassicHomeContext.Provider value={classic}>
      {children}
    </ClassicHomeContext.Provider>
  );
}
export function useClassicHome() {
  return React.useContext(ClassicHomeContext);
}
export function useHomeCardShape() {
  const classic = useClassicHome();
  const { colors: c } = useTheme();
  return (role: Parameters<typeof homeCardShape>[0], radius?: number) =>
    classic
      ? { borderRadius: 12, borderWidth: 0.5, borderColor: c.outlineVariant }
      : homeCardShape(role, radius);
}
