import type { PageHeaderProps } from "@/components/pageheader/types";
import type { RootParamList } from "@/navigation/types";
import { useRoute } from "@react-navigation/native";
import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { PageHeader } from "./PageHeader";
import { isDateHeader } from "./types";

type RouteName = keyof RootParamList;

type SharedTabHeaderContextValue = {
  setHeader: (routeName: RouteName, props: PageHeaderProps | null) => void;
};

const SharedTabHeaderContext =
  createContext<SharedTabHeaderContextValue | null>(null);

export function SharedTabHeaderProvider({
  activeRouteName,
  children,
}: {
  activeRouteName: RouteName | null;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const [headersByRoute, setHeadersByRoute] = useState<
    Partial<Record<RouteName, PageHeaderProps | null>>
  >({});

  const setHeader = useCallback(
    (routeName: RouteName, props: PageHeaderProps | null) => {
      setHeadersByRoute((current) => {
        if (areHeaderPropsEqual(current[routeName] ?? null, props)) {
          return current;
        }
        return { ...current, [routeName]: props };
      });
    },
    [],
  );

  const contextValue = useMemo(() => ({ setHeader }), [setHeader]);
  const activeHeader = activeRouteName
    ? headersByRoute[activeRouteName] ?? null
    : null;
  const headerBackground =
    activeHeader?.backgroundColor ?? theme.colors.elevation.level0;

  return (
    <SharedTabHeaderContext.Provider value={contextValue}>
      <View style={styles.container}>
        {activeHeader ? (
          <SafeAreaView
            edges={["top", "left", "right"]}
            style={[styles.headerArea, { backgroundColor: headerBackground }]}
          >
            <PageHeader
              {...activeHeader}
              resetKey={activeRouteName ?? "shared-header"}
            />
          </SafeAreaView>
        ) : null}
        <View style={styles.content}>{children}</View>
      </View>
    </SharedTabHeaderContext.Provider>
  );
}

export function useSharedTabHeader(props: PageHeaderProps | null) {
  const context = useContext(SharedTabHeaderContext);

  if (!context) {
    throw new Error(
      "useSharedTabHeader must be used within SharedTabHeaderProvider",
    );
  }

  const routeName = useCurrentRouteName();

  useLayoutEffect(() => {
    context.setHeader(routeName, props);
    return () => {
      context.setHeader(routeName, null);
    };
  }, [context, props, routeName]);
}

function useCurrentRouteName(): RouteName {
  const route = useRoute();
  return route.name as RouteName;
}

function areHeaderPropsEqual(
  current: PageHeaderProps | null,
  next: PageHeaderProps | null,
) {
  if (current === next) {
    return true;
  }

  if (!current || !next) {
    return false;
  }

  if (
    current.variant !== next.variant ||
    current.title !== next.title ||
    current.backgroundColor !== next.backgroundColor
  ) {
    return false;
  }

  if (isDateHeader(current) && isDateHeader(next)) {
    return (
      current.selectedDate === next.selectedDate &&
      current.initialPickerMode === next.initialPickerMode &&
      current.externalOverlayVisible === next.externalOverlayVisible &&
      current.onExternalOverlayClose === next.onExternalOverlayClose &&
      current.onDatePickerVisibilityChange ===
        next.onDatePickerVisibilityChange &&
      current.datePickerCloseRequestToken === next.datePickerCloseRequestToken &&
      current.onDateSelect === next.onDateSelect &&
      current.rightSlot === next.rightSlot &&
      current.bottomSlot === next.bottomSlot
    );
  }

  if (!isDateHeader(current) && !isDateHeader(next)) {
    return (
      current.rightSlot === next.rightSlot &&
      current.bottomSlot === next.bottomSlot
    );
  }

  return false;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerArea: {
    zIndex: 1,
  },
  content: {
    flex: 1,
  },
});
