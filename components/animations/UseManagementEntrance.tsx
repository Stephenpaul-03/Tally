import React from "react";
import {
  NavigationContext,
  type ParamListBase,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMotionEnabled } from "./Motion";
import { useStagger } from "./UseStagger";

/** Reveal cards after the native route has placed its header and footer. */
export function useManagementEntranceReady() {
  const navigation = React.useContext(NavigationContext) as
    | NativeStackNavigationProp<ParamListBase>
    | undefined;
  const enabled = useMotionEnabled();
  const [ready, setReady] = React.useState(!navigation || !enabled);
  React.useEffect(() => {
    if (ready || !enabled) return;
    let frame: number | undefined;
    const reveal = () => {
      frame = requestAnimationFrame(() => setReady(true));
    };
    const unsubscribe = navigation?.addListener("transitionEnd", (event) => {
      if (!event.data.closing) reveal();
    });
    // Portals and routes with no transition may not emit transitionEnd.
    const fallback = setTimeout(reveal, 400);
    return () => {
      unsubscribe?.();
      clearTimeout(fallback);
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [navigation, enabled, ready]);
  return ready || !enabled;
}

export function useManagementEntrance(count: number) {
  const ready = useManagementEntranceReady();
  return useStagger({
    count,
    ready,
    stagger: 30,
    distance: 10,
    duration: 260,
    replayOnFocus: false,
    replayOnCountChange: false,
  });
}
