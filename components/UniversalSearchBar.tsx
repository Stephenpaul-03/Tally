import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  Animated,
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Text, useTheme } from "react-native-paper";

type UniversalSearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  pillLabel?: string;
  bg: string;
  iconColor?: string;
  onPillPress?: () => void;
  autoFocus?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  animation?: {
    expanded: boolean;
    onExpandedChange: (expanded: boolean) => void;
    mode?: "center" | "right";
    collapsedWidth?: number;
    expandedWidth?: number;
    externalWidth?: boolean;
    duration?: number;
    clearOnCollapse?: boolean;
  };
};

export function UniversalSearchBar({
  value,
  bg,
  iconColor,
  onChangeText,
  placeholder,
  pillLabel,
  onPillPress,
  autoFocus = false,
  containerStyle,
  animation,
}: UniversalSearchBarProps) {
  const theme = useTheme();
  const inputRef = React.useRef<TextInput>(null);
  const [isFocused, setIsFocused] = React.useState(false);
  const { width: windowWidth } = useWindowDimensions();
  const progress = React.useRef(
    new Animated.Value(animation?.expanded ? 1 : 0),
  ).current;
  const animated = Boolean(animation);
  const collapsedWidth = animation?.collapsedWidth ?? 56;
  const expandedWidth =
    animation?.expandedWidth ?? Math.max(56, windowWidth - 40);
  const expanded = animation?.expanded ?? true;
  const mode = animation?.mode ?? "center";
  const surfaceColor = bg || theme.colors.elevation.level3;
  const animatedAlignSelf: ViewStyle["alignSelf"] =
    mode === "right" ? "flex-end" : "center";

  React.useEffect(() => {
    Animated.timing(progress, {
      toValue: expanded ? 1 : 0,
      duration: animation?.duration ?? 360,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && expanded && autoFocus) {
        inputRef.current?.focus();
      }
    });

    if (!expanded) {
      inputRef.current?.blur();
      Keyboard.dismiss();
    }
  }, [animated, animation?.duration, autoFocus, expanded, progress]);

  React.useEffect(() => {
    if (!autoFocus || !expanded) return;

    const animationFrame = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    const focusRetry = setTimeout(() => {
      inputRef.current?.focus();
    }, animation?.duration ?? 120);

    return () => {
      cancelAnimationFrame(animationFrame);
      clearTimeout(focusRetry);
    };
  }, [animation?.duration, autoFocus, expanded]);

  const inputOpacity = progress.interpolate({
    inputRange: [0, 0.82, 1],
    outputRange: [0, 0, 1],
  });
  const animatedContainerStyle = animated
    ? {
        alignSelf: animatedAlignSelf,
        marginHorizontal: 0,
        overflow: "hidden" as const,
        width: animation?.externalWidth
          ? ("100%" as const)
          : progress.interpolate({
              inputRange: [0, 1],
              outputRange: [collapsedWidth, expandedWidth],
            }),
      }
    : null;

  const collapse = React.useCallback(() => {
    inputRef.current?.blur();
    Keyboard.dismiss();
    if (animation?.clearOnCollapse) {
      onChangeText("");
    }
    animation?.onExpandedChange(false);
  }, [animation, onChangeText]);

  const showCloseButton = animated && expanded && isFocused;

  return (
    <Animated.View
      onTouchStart={() => {
        if (!animated || expanded) {
          inputRef.current?.focus();
        }
      }}
      style={[
        styles.container,
        {
          backgroundColor: surfaceColor,
        },
        animatedContainerStyle,
        containerStyle,
      ]}
    >
      <Animated.View
        style={[
          styles.searchIconSlot,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="magnify"
          size={18}
          color={theme.colors.onSurfaceVariant}
        />
      </Animated.View>

      {animated && !expanded ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search"
          onPress={() => animation?.onExpandedChange(true)}
          style={styles.collapsedButton}
        />
      ) : null}

      {animated ? (
        <Animated.View
          pointerEvents={expanded ? "auto" : "none"}
          style={[styles.animatedInputWrap, { opacity: inputOpacity }]}
        >
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            autoFocus={autoFocus}
            onBlur={() => setIsFocused(false)}
            onFocus={() => setIsFocused(true)}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            style={[styles.input, { color: theme.colors.onSurface }]}
          />
        </Animated.View>
      ) : (
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onBlur={() => setIsFocused(false)}
          onFocus={() => setIsFocused(true)}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          style={[styles.input, { color: theme.colors.onSurface }]}
        />
      )}

      {pillLabel && onPillPress ? (
        <Pressable
          accessibilityRole="button"
          onPress={onPillPress}
          style={({ pressed }) => ({
            borderRadius: 999,
            borderWidth: 1,
            borderColor: theme.colors.outline,
            backgroundColor: theme.colors.surface,
            paddingHorizontal: 10,
            paddingVertical: 7,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: theme.colors.primary,
              textTransform: "uppercase",
            }}
          >
            {pillLabel}
          </Text>
          <MaterialCommunityIcons
            name="tune-variant"
            size={14}
            color={theme.colors.primary}
          />
        </Pressable>
      ) : null}

      {showCloseButton ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close search"
          hitSlop={8}
          onPress={collapse}
          style={({ pressed }) => [
            styles.closeButton,
            pressed && { opacity: 0.62 },
          ]}
        >
          <MaterialCommunityIcons
            name="close"
            size={18}
            color={theme.colors.onSurfaceVariant}
          />
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animatedInputWrap: {
    flex: 1,
    minWidth: 0,
  },
  closeButton: {
    alignItems: "center",
    borderRadius: 17,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  collapsedButton: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  container: {
    alignItems: "center",
    borderRadius: 15,
    flexDirection: "row",
    gap: 10,
    height: 56,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
  },
  searchIconSlot: {
    alignItems: "center",
    borderRadius: 17,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
    zIndex: 2,
  },
});
