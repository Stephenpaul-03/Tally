import { MainEntrance } from "@/components/animations/MainEntrance";
import React from "react";
import {
  Keyboard,
  Pressable,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useTheme } from "react-native-paper";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import type { RootParamList } from "@/navigation/types";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { useAppShell } from "@/components/AppShellContext";
import {
  MotionEntranceScope,
  useMotionEnabled,
} from "@/components/animations/Motion";
import { DesignText as Text } from "@/components/DesignText";
import { SpotlightTarget } from "@/modules/Onboarding/SpotlightTour";
import { InsightsScreen } from "@/modules/Insights/InsightsScreen";
import type { Transaction } from "@/utils/Types";
import { typography } from "@/theme/typography";
import type { GestureControlButtonConfig } from "@/modules/Management/Transaction/Layouts/Views/GestureDualCardLayoutView";
import { HomePage } from "./HomePage";
import { EXPRESSIVE_TABS } from "./presentation";
import {
  clampSwipePosition,
  snapSwipeIndex,
  settledTabIndex,
} from "./pagerGeometry";
import { MonthPickerSheet } from "./MonthPickerSheet";

type Controls = {
  left?: GestureControlButtonConfig;
  leftMiddle?: GestureControlButtonConfig;
  middle?: GestureControlButtonConfig;
  rightMiddle?: GestureControlButtonConfig;
  right?: GestureControlButtonConfig;
};
export function ClassicMainScreen({
  raw,
  month,
  currency,
  symbol,
  onMonth,
  onEdit,
  children,
  controlButtons,
}: {
  raw: Transaction[];
  month: string;
  currency: string;
  symbol: string;
  onMonth: (month: string) => void;
  onEdit: (id: string) => void;
  children: React.ReactNode;
  controlButtons: Controls;
}) {
  const { colors: c } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const shell = useAppShell();
  const motion = useMotionEnabled();
  const focused = useIsFocused();
  const { registerDriver } = shell;
  const { width: fallbackWidth } = useWindowDimensions();
  const [width, setWidth] = React.useState(0);
  const [picker, setPicker] = React.useState(false);
  const [searchExpanded, setSearchExpanded] = React.useState(false);
  const [toolbarWidth, setToolbarWidth] = React.useState(fallbackWidth - 40);
  const searchRef = React.useRef<TextInput>(null);
  const searchProgress = useSharedValue(0);
  React.useEffect(() => {
    searchProgress.value = withTiming(searchExpanded ? 1 : 0, {
      duration: motion ? 180 : 0,
      easing: Easing.out(Easing.cubic),
    });
  }, [searchExpanded, motion, searchProgress]);
  const toolbarControls = useAnimatedStyle(() => ({
    width: Math.max(0, toolbarWidth - 50) * (1 - searchProgress.value),
    marginRight: 6 * (1 - searchProgress.value),
    opacity: 1 - searchProgress.value,
  }));
  const localPosition = useSharedValue(
    EXPRESSIVE_TABS.indexOf(shell.activeTab),
  );
  const localDriving = useSharedValue(false);
  const localTarget = useSharedValue(-1);
  const position = shell.classicPosition ?? localPosition;
  const driving = shell.classicDriving ?? localDriving;
  const target = shell.classicTarget ?? localTarget;
  const start = useSharedValue(1);
  const origin = useSharedValue(1);
  const dragging = useSharedValue(false);
  React.useLayoutEffect(() => {
    cancelAnimation(position);
    position.value = EXPRESSIVE_TABS.indexOf(shell.activeTab);
    target.value = position.value;
    driving.value = false;
    // Initialize only when the Classic pager mounts, including layout switches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  React.useEffect(() => {
    registerDriver((tab) => {
      const next = EXPRESSIVE_TABS.indexOf(tab);
      cancelAnimation(position);
      target.value = next;
      driving.value = false;
      if (Math.abs(position.value - next) < 0.001) position.value = next;
      else
        position.value = withTiming(next, {
          duration: motion ? 200 : 0,
          easing: Easing.out(Easing.cubic),
        });
    });
    return () => registerDriver(() => {});
  }, [registerDriver, position, target, driving, motion]);
  const commit = (index: number) => {
    if (settledTabIndex(position.value, target.value) !== index) return;
    shell.reportTab(EXPRESSIVE_TABS[index]);
  };
  const finish = (index: number) => {
    "worklet";
    target.value = index;
    position.value = withTiming(
      index,
      { duration: motion ? 180 : 0, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (!finished || target.value !== index) return;
        driving.value = false;
        runOnJS(commit)(index);
      },
    );
  };
  const pan = Gesture.Pan()
    .enabled(width > 0 && focused)
    .activeOffsetX([-18, 18])
    .failOffsetY([-14, 14])
    .onStart(() => {
      cancelAnimation(position);
      target.value = -1;
      start.value = position.value;
      origin.value = EXPRESSIVE_TABS.indexOf(shell.activeTab);
      dragging.value = true;
      driving.value = true;
    })
    .onUpdate((event) => {
      position.value = clampSwipePosition(
        start.value - event.translationX / Math.max(1, width),
        origin.value,
      );
    })
    .onEnd((event, success) => {
      dragging.value = false;
      finish(
        snapSwipeIndex(
          position.value,
          success ? -event.velocityX / Math.max(1, width) : 0,
          origin.value,
        ),
      );
    })
    .onFinalize(() => {
      if (!dragging.value) return;
      dragging.value = false;
      finish(origin.value);
    });
  const pages = useAnimatedStyle(() => ({
    transform: [{ translateX: -position.value * width }],
    opacity: width > 0 ? 1 : 0,
  }));
  const control = (button: GestureControlButtonConfig | undefined) =>
    button ? (
      <Pressable
        key={button.icon}
        onPress={button.onPress}
        disabled={button.disabled}
        accessibilityRole="button"
        accessibilityLabel={button.accessibilityLabel ?? button.label}
        accessibilityState={{ disabled: button.disabled }}
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          borderWidth: 0.5,
          borderColor: c.outlineVariant,
          backgroundColor: c.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={button.icon} size={20} color={c.primary} />
        {button.badgeCount || button.badgeIcon ? (
          <View
            style={{
              position: "absolute",
              top: 1,
              right: 1,
              minWidth: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: c.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {button.badgeIcon ? (
              <Icon name={button.badgeIcon} size={10} color={c.onPrimary} />
            ) : (
              <Text style={{ fontSize: 9, color: c.onPrimary }}>
                {button.badgeCount}
              </Text>
            )}
          </View>
        ) : null}
      </Pressable>
    ) : null;
  const search = controlButtons.rightMiddle?.search;
  const pageWidth = width || fallbackWidth;
  return (
    <MotionEntranceScope>
      <View
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={{ flex: 1, overflow: "hidden", backgroundColor: c.background }}
      >
        <GestureDetector gesture={pan}>
          <Animated.View
            style={[
              { flex: 1, flexDirection: "row", width: pageWidth * 3 },
              pages,
            ]}
          >
            {EXPRESSIVE_TABS.map((tab) => (
              <View
                key={tab}
                style={{
                  width: pageWidth,
                  flexShrink: 0,
                  flexGrow: 0,
                  overflow: "hidden",
                }}
                pointerEvents={shell.activeTab === tab ? "auto" : "none"}
                accessibilityElementsHidden={shell.activeTab !== tab}
                importantForAccessibility={
                  shell.activeTab === tab ? "auto" : "no-hide-descendants"
                }
              >
                {tab === "transactions" ? (
                  <HomePage
                    classic
                    active={shell.activeTab === tab && focused}
                    pagePan={pan}
                    raw={raw}
                    month={month}
                    currency={currency}
                    symbol={symbol}
                    onMonth={onMonth}
                    onEdit={onEdit}
                  />
                ) : tab === "insights" ? (
                  <MainEntrance distance={0} style={{ flex: 1 }}>
                    <InsightsScreen
                      standalone
                      pagePan={pan}
                      month={month}
                      onMonthChange={onMonth}
                    />
                  </MainEntrance>
                ) : (
                  <MainEntrance distance={0} style={{ flex: 1 }}>
                    <SpotlightTarget id="transaction-heading">
                      <View
                        style={{
                          paddingHorizontal: 20,
                          paddingTop: 8,
                          paddingBottom: 12,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 14,
                          }}
                        >
                          <Text
                            accessibilityRole="header"
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            style={{
                              ...typography.editorial.hero,
                              flex: 1,
                              color: c.onSurface,
                            }}
                          >
                            Transactions
                          </Text>
                          <Pressable
                            onPress={() => setPicker(true)}
                            accessibilityRole="button"
                            accessibilityLabel="Choose transaction month"
                            style={{
                              minHeight: 44,
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 5,
                              justifyContent: "center",
                              paddingHorizontal: 8,
                              borderRadius: 14,
                              borderWidth: 0.5,
                              borderColor: c.outlineVariant,
                              backgroundColor: c.surface,
                            }}
                          >
                            <Icon
                              name="calendar-month-outline"
                              size={20}
                              color={c.primary}
                            />
                            <Text
                              numberOfLines={1}
                              adjustsFontSizeToFit
                              style={{
                                ...typography.bodyMedium,
                                fontSize: 12,
                                color: c.onSurface,
                              }}
                            >
                              {new Date(
                                `${month}-01T12:00:00`,
                              ).toLocaleDateString(undefined, {
                                month: "short",
                                year: "numeric",
                              })}
                            </Text>
                            <Icon
                              name="chevron-down"
                              size={16}
                              color={c.onSurfaceVariant}
                            />
                          </Pressable>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Settings"
                            onPress={() => navigation.navigate("Settings")}
                            style={{
                              width: 44,
                              height: 44,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Icon
                              name="cog-outline"
                              size={21}
                              color={c.onSurface}
                            />
                          </Pressable>
                        </View>
                        <SpotlightTarget id="entry-controls">
                          <View
                            onLayout={(event) =>
                              setToolbarWidth(event.nativeEvent.layout.width)
                            }
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              height: 44,
                            }}
                          >
                            <Animated.View
                              pointerEvents={searchExpanded ? "none" : "auto"}
                              accessibilityElementsHidden={searchExpanded}
                              importantForAccessibility={
                                searchExpanded ? "no-hide-descendants" : "auto"
                              }
                              style={[{ overflow: "hidden" }, toolbarControls]}
                            >
                              <View
                                style={{
                                  width: Math.max(0, toolbarWidth - 50),
                                  flexDirection: "row",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                {control(controlButtons.left)}
                                {control(controlButtons.leftMiddle)}
                                {control(controlButtons.right)}
                              </View>
                            </Animated.View>
                            {search ? (
                              <View
                                style={{
                                  flex: 1,
                                  minWidth: 0,
                                  height: 44,
                                  flexDirection: "row",
                                  alignItems: "center",
                                  paddingHorizontal: searchExpanded ? 8 : 0,
                                  borderRadius: 14,
                                  backgroundColor: c.surface,
                                  borderWidth: 0.5,
                                  borderColor: c.outlineVariant,
                                }}
                              >
                                {searchExpanded ? (
                                  <>
                                    <Icon
                                      name="magnify"
                                      size={18}
                                      color={c.onSurfaceVariant}
                                    />
                                    <TextInput
                                      autoFocus
                                      ref={searchRef}
                                      value={search.value}
                                      onChangeText={search.onChangeText}
                                      onFocus={() => setSearchExpanded(true)}
                                      onBlur={() => setSearchExpanded(false)}
                                      accessibilityLabel="Search transactions"
                                      placeholder="Search"
                                      placeholderTextColor={c.onSurfaceVariant}
                                      returnKeyType="search"
                                      style={{
                                        flex: 1,
                                        minWidth: 0,
                                        height: 44,
                                        paddingHorizontal: 4,
                                        fontSize: 12,
                                        color: c.onSurface,
                                        fontFamily: typography.body.fontFamily,
                                      }}
                                    />
                                  </>
                                ) : (
                                  <Pressable
                                    onPress={() => setSearchExpanded(true)}
                                    accessibilityRole="button"
                                    accessibilityLabel="Open transaction search"
                                    style={{
                                      flex: 1,
                                      height: 44,
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <Icon
                                      name="magnify"
                                      size={20}
                                      color={c.primary}
                                    />
                                  </Pressable>
                                )}
                                {searchExpanded ? (
                                  <Pressable
                                    onPress={() => {
                                      if (search.value) search.onChangeText("");
                                      else {
                                        searchRef.current?.blur();
                                        Keyboard.dismiss();
                                      }
                                    }}
                                    accessibilityRole="button"
                                    accessibilityLabel={
                                      search.value
                                        ? "Clear transaction search"
                                        : "Close transaction search"
                                    }
                                    style={{
                                      width: 44,
                                      height: 44,
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <Icon
                                      name="close"
                                      size={16}
                                      color={c.onSurfaceVariant}
                                    />
                                  </Pressable>
                                ) : null}
                              </View>
                            ) : null}
                          </View>
                        </SpotlightTarget>
                      </View>
                    </SpotlightTarget>
                    {children}
                  </MainEntrance>
                )}
              </View>
            ))}
          </Animated.View>
        </GestureDetector>
        <MonthPickerSheet
          visible={picker}
          month={month}
          onChange={onMonth}
          onDismiss={() => setPicker(false)}
        />
      </View>
    </MotionEntranceScope>
  );
}
