import type { RootParamList } from "@/navigation/types";
import { typography } from "@/theme/typography";
import { headerInsetCollapseAnimValue } from "@/components/toast/ToastProvider";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { NavigationProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import React from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

type HeaderShellProps = {
  title: string;
  right?: React.ReactNode;
  bottom?: React.ReactNode;
  backgroundColor?: string;
};

/**
 * Shared chrome for both the basic and date-aware page headers.
 * Per product requirement, every header always shows the settings
 * icon on the left and always navigates to the Settings screen —
 * there is no longer a configurable "left slot".
 */
export function HeaderShell({
  title,
  right,
  bottom,
  backgroundColor,
}: HeaderShellProps) {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp<RootParamList>>();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: backgroundColor ?? theme.colors.elevation.level0 },
      ]}
    >
      <Animated.View
        style={[
          styles.navRow,
          {
            paddingTop: headerInsetCollapseAnimValue.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 0],
            }),
          },
        ]}
      >
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate("Settings");
          }}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          hitSlop={8}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <MaterialCommunityIcons
            name="cog-outline"
            size={22}
            color={theme.colors.onSurface}
          />
        </Pressable>

        <View style={styles.navTitleWrap} pointerEvents="none">
          <Text style={[styles.navTitle, { color: theme.colors.primary }]}>
            {title}
          </Text>
        </View>

        <View style={styles.rightSlot}>{right}</View>
      </Animated.View>
      {bottom ? <View style={styles.bottomSlot}>{bottom}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 1,
    paddingBottom: 6,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  navTitleWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  navTitle: {
    ...typography.editorial.sectionLabel,
    fontSize: 24,
    lineHeight: 24,
    letterSpacing: 0.6,
  },
  rightSlot: {
    minWidth: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  bottomSlot: {
    paddingBottom: 6,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
