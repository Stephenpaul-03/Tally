import { DrawerActions, useNavigation } from "@react-navigation/native";

export function useDrawerActions() {
  const navigation = useNavigation();

  return {
    openDrawer: () => navigation.dispatch(DrawerActions.openDrawer()),
    closeDrawer: () => navigation.dispatch(DrawerActions.closeDrawer()),
    toggleDrawer: () => navigation.dispatch(DrawerActions.toggleDrawer()),
  };
}
