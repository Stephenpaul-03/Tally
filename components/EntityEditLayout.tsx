import {
  CurrencyPickerField,
  type WorkspaceCurrency,
} from "@/components/CurrencyPickerField";
import { MANAGEMENT_NAME_LIMIT } from "@/components/ManagementOptions";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { useAddonPrefs } from "@/hooks/use-addon-prefs";
import { palette } from "@/theme/color_palette";
import { typography } from "@/theme/typography";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  setStatusBarBackgroundColor,
  setStatusBarStyle,
  setStatusBarTranslucent,
} from "expo-status-bar";
import React from "react";
import {
  Platform,
  Pressable,
  TextInput as RNTextInput,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Text, type MD3Theme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type IconGrid = {
  columns: number;
  itemSize: number;
  iconSize: number;
  spacing: number;
  edgeInset: number;
};

export type EntityEditLayoutProps = {
  // Field values
  localName: string;
  localIcon: string;
  localColor: string;
  localOwnerName?: string;
  localCurrency?: WorkspaceCurrency;

  // Field setters
  onChangeName: (v: string) => void;
  onChangeIcon: (v: string) => void;
  onChangeColor: (v: string) => void;
  onChangeOwnerName?: (v: string) => void;
  onChangeCurrency?: (v: WorkspaceCurrency) => void;

  // Options
  allColors: string[];
  allIcons: string[];
  iconGrid: IconGrid;

  // Labels / copy
  namePlaceholder?: string;
  nameLabel?: string;
  emptyPreviewLabel?: string;
  headerSubtitle?: string;
  iconPickerVariant?: "category" | "account";
  showHeader?: boolean;
  showPreview?: boolean;
  showPreviewName?: boolean;
  presentation?: "screen" | "modal";
  visible?: boolean;
  dismissable?: boolean;

  // Submit
  canSubmit: boolean;
  isEditing: boolean;
  submitLabelCreate?: string;
  submitLabelEdit?: string;
  onSubmit: () => void;

  // Navigation
  onBack: () => void;

  // Optional delete button content (caller decides guard logic)
  deleteAccessory?: React.ReactNode;

  // Slot for a custom footer (replaces default save button)
  footer?: React.ReactNode;

  // Theme
  theme: MD3Theme;
  background: string;

  // Optional name char limit (defaults to MANAGEMENT_NAME_LIMIT)
  nameLimit?: number;
  ownerNameLimit?: number;

  // How many icons/colors to show before "See all" opens the full picker
  iconPreviewCount?: number;
  colorPreviewCount?: number;
};

function darkenHex(hex: string, amount = 0.18) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;
  const num = parseInt(clean, 16);
  const r = Math.max(0, Math.round(((num >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((num >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((num & 0xff) * (1 - amount)));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export function EntityEditLayout({
  localName,
  localIcon,
  localColor,
  localOwnerName,
  localCurrency,
  onChangeName,
  onChangeIcon,
  onChangeColor,
  onChangeOwnerName,
  onChangeCurrency,
  allColors,
  allIcons,
  iconGrid,
  namePlaceholder = "Enter a name",
  emptyPreviewLabel = "Name",
  headerSubtitle,
  showHeader = true,
  showPreview = true,
  showPreviewName = true,
  presentation = "modal",
  visible = true,
  dismissable = true,
  canSubmit,
  isEditing,
  submitLabelCreate = "Add",
  submitLabelEdit = "Save changes",
  onSubmit,
  onBack,
  deleteAccessory,
  footer,
  theme,
  background,
  nameLimit = MANAGEMENT_NAME_LIMIT,
  ownerNameLimit = MANAGEMENT_NAME_LIMIT,
}: EntityEditLayoutProps) {
  const { minimalIconsEnabled } = useAddonPrefs();
  const { bottom, top } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const c = theme.colors;

  const previewColor = minimalIconsEnabled
    ? c.primary
    : localColor || c.primary;
  const visiblePickerRows = 2;
  const uniqueIcons = [...new Set(allIcons)];
  const uniqueColors = [...new Set(allColors)];
  const iconItemSize = 44;
  const iconGap = 10;
  const colorItemSize = 36;
  const colorGap = 10;
  const iconScrollRef = React.useRef<ScrollView>(null);
  const colorScrollRef = React.useRef<ScrollView>(null);
  const iconScrollYRef = React.useRef(0);
  const colorScrollYRef = React.useRef(0);
  const [outerViewportHeight, setOuterViewportHeight] = React.useState(0);
  const [outerContentHeight, setOuterContentHeight] = React.useState(0);
  const colorColumns = Math.max(
    1,
    Math.floor((width - 40 + colorGap) / (colorItemSize + colorGap)),
  );
  const iconHasMore = uniqueIcons.length > iconGrid.columns * visiblePickerRows;
  const colorHasMore = uniqueColors.length > colorColumns * visiblePickerRows;
  const outerScrollEnabled = outerContentHeight > outerViewportHeight + 1;
  const scrollPickerByRow = React.useCallback((picker: "icons" | "colors") => {
    const rowHeight =
      picker === "icons" ? iconItemSize + iconGap : colorItemSize + colorGap;
    const scrollRef = picker === "icons" ? iconScrollRef : colorScrollRef;
    const yRef = picker === "icons" ? iconScrollYRef : colorScrollYRef;
    const nextY = yRef.current + rowHeight;
    yRef.current = nextY;
    scrollRef.current?.scrollTo({ y: nextY, animated: true });
  }, []);
  const previewBlock = (
    <View
      style={{
        alignItems: "center",
        marginTop: 8,
      }}
    >
      <View
        style={{
          alignItems: "center",
          backgroundColor: minimalIconsEnabled
            ? c.background
            : darkenHex(previewColor),
          borderColor: minimalIconsEnabled ? c.elevation.level1 : "transparent",
          borderRadius: 12,
          borderWidth: minimalIconsEnabled ? 1 : 0,
          height: 54,
          justifyContent: "center",
          marginBottom: 12,
          width: 54,
        }}
      >
        <MaterialCommunityIcons
          name={(localIcon || "tag-outline") as any}
          size={28}
          color={minimalIconsEnabled ? previewColor : "#FFFFFF"}
        />
      </View>
      {showPreviewName ? (
        <Text
          style={{
            color: c.onSurface,
            fontSize: 18,
            fontWeight: "700",
            textAlign: "center",
          }}
          numberOfLines={1}
        >
          {localName.trim() || emptyPreviewLabel}
        </Text>
      ) : null}
      {headerSubtitle ? (
        <Text
          style={{
            color: c.onSurfaceVariant,
            fontSize: 13,
            marginTop: 2,
            textAlign: "center",
          }}
          numberOfLines={1}
        >
          {headerSubtitle}
        </Text>
      ) : null}
    </View>
  );

  React.useEffect(() => {
    if (!showHeader) return undefined;

    setStatusBarStyle("light");
    if (Platform.OS === "android") {
      setStatusBarTranslucent(false);
      setStatusBarBackgroundColor(background, true);
    }

    return () => {
      setStatusBarStyle("auto");
      if (Platform.OS === "android") {
        setStatusBarBackgroundColor(background, true);
      }
    };
  }, [background, previewColor, showHeader]);

  const content = (
    <>
      {showHeader ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: -top,
            left: 0,
            right: 0,
            height: top,
            backgroundColor: background,
            zIndex: 10,
          }}
        />
      ) : null}
      <KeyboardAwareScrollView
        bounces={outerScrollEnabled}
        bottomOffset={bottom + 50}
        contentContainerStyle={{
          flexGrow: presentation === "screen" ? 1 : 0,
        }}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={(_contentWidth, contentHeight) =>
          setOuterContentHeight(contentHeight)
        }
        onLayout={(event) =>
          setOuterViewportHeight(event.nativeEvent.layout.height)
        }
        overScrollMode={outerScrollEnabled ? "auto" : "never"}
        scrollEnabled={outerScrollEnabled}
        showsVerticalScrollIndicator={false}
        style={{
          ...(presentation === "screen" ? { flex: 1 } : {}),
          backgroundColor: background,
        }}
      >
        <View style={{ flex: 1, justifyContent: "flex-start" }}>
          {showHeader ? (
            <View
              style={{
                paddingTop: 12,
                paddingBottom: 20,
                paddingHorizontal: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Pressable
                  accessibilityLabel="Go back"
                  hitSlop={12}
                  onPress={onBack}
                  style={({ pressed }) => ({
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: c.surfaceVariant,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <MaterialCommunityIcons
                    name="chevron-left"
                    size={24}
                    color={c.onSurface}
                  />
                </Pressable>

                {deleteAccessory ?? <View style={{ width: 36, height: 36 }} />}
              </View>

              {previewBlock}
            </View>
          ) : showPreview ? (
            <View
              style={{
                alignItems: "center",
                paddingTop: 20,
                paddingHorizontal: 16,
              }}
            >
              {previewBlock}
            </View>
          ) : null}

          <View style={{ paddingHorizontal: 20 }}>
            {/* Name */}
            <View style={{ marginTop: showHeader ? 20 : showPreview ? 16 : 4 }}>
              <Text
                style={{
                  ...typography.editorial.sectionLabel,
                  fontSize: 14,
                  letterSpacing: 0.6,
                  color: c.onSurface,
                  marginBottom: 8,
                }}
              >
                Name
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: c.surfaceVariant,
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}
              >
                <RNTextInput
                  maxLength={nameLimit}
                  onChangeText={(value) =>
                    onChangeName(value.slice(0, nameLimit))
                  }
                  placeholder={namePlaceholder}
                  placeholderTextColor={c.onSurfaceVariant}
                  style={{
                    flex: 1,
                    fontSize: 15,
                    color: c.onSurface,
                    paddingVertical: 0,
                  }}
                  value={localName}
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: c.onSurfaceVariant,
                    marginLeft: 8,
                  }}
                >
                  {localName.length}/{nameLimit}
                </Text>
              </View>

              {minimalIconsEnabled ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 8,
                  }}
                >
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={14}
                    color={c.primary}
                  />
                  <Text style={{ fontSize: 11, color: c.onSurfaceVariant }}>
                    Minimal Icons is on.
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={{ marginVertical: 20 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    ...typography.editorial.sectionLabel,
                    fontSize: 14,
                    letterSpacing: 0.6,
                    color: c.onSurface,
                  }}
                >
                  Icons
                </Text>
              </View>
              <ScrollView
                ref={iconScrollRef}
                nestedScrollEnabled
                showsVerticalScrollIndicator
                onScroll={(event) => {
                  iconScrollYRef.current = event.nativeEvent.contentOffset.y;
                }}
                scrollEventThrottle={16}
                style={{ maxHeight: 98 }}
                contentContainerStyle={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 10,
                  paddingBottom: 2,
                }}
              >
                {uniqueIcons.map((icon) => {
                  const selected = icon === localIcon;
                  return (
                    <Pressable
                      key={icon}
                      onPress={() => onChangeIcon(icon)}
                      style={({ pressed }) => ({
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: c.background,
                        borderWidth: selected ? 2 : 1,
                        borderColor: selected ? previewColor : c.outlineVariant,
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <MaterialCommunityIcons
                        name={icon as any}
                        size={22}
                        color={selected ? previewColor : c.onSurfaceVariant}
                      />
                    </Pressable>
                  );
                })}
              </ScrollView>
              {iconHasMore ? (
                <Pressable
                  accessibilityLabel="Show more icons"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => scrollPickerByRow("icons")}
                  style={({ pressed }) => ({
                    alignItems: "center",
                    opacity: pressed ? 0.55 : 1,
                    paddingTop: 4,
                  })}
                >
                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={16}
                    color={c.onSurfaceVariant}
                    style={{ opacity: 0.7 }}
                  />
                </Pressable>
              ) : null}
            </View>

            <View style={{ marginBottom: 4 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    ...typography.editorial.sectionLabel,
                    fontSize: 14,
                    letterSpacing: 0.6,
                    color: c.onSurface,
                  }}
                >
                  Colors
                </Text>
              </View>
              <ScrollView
                ref={colorScrollRef}
                nestedScrollEnabled
                showsVerticalScrollIndicator
                onScroll={(event) => {
                  colorScrollYRef.current = event.nativeEvent.contentOffset.y;
                }}
                scrollEventThrottle={16}
                style={{ maxHeight: 82 }}
                contentContainerStyle={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 10,
                  paddingBottom: 2,
                }}
              >
                {uniqueColors.map((color) => {
                  const selected = color === localColor;
                  return (
                    <Pressable
                      key={color}
                      onPress={() => onChangeColor(color)}
                      style={({ pressed }) => ({
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: color,
                        borderWidth: selected ? 2.5 : 0,
                        borderColor: c.onSurface,
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      {selected && (
                        <MaterialCommunityIcons
                          name="check"
                          size={16}
                          color="#fff"
                        />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
              {colorHasMore ? (
                <Pressable
                  accessibilityLabel="Show more colors"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => scrollPickerByRow("colors")}
                  style={({ pressed }) => ({
                    alignItems: "center",
                    opacity: pressed ? 0.55 : 1,
                    paddingTop: 4,
                  })}
                >
                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={16}
                    color={c.onSurfaceVariant}
                    style={{ opacity: 0.7 }}
                  />
                </Pressable>
              ) : null}
            </View>

            {/* Details */}
            {onChangeOwnerName || (localCurrency && onChangeCurrency) ? (
              <>
                <Text
                  style={{
                    ...typography.editorial.sectionLabel,
                    fontSize: 14,
                    letterSpacing: 0.6,
                    color: c.onSurface,
                    marginTop: 24,
                    marginBottom: 12,
                  }}
                >
                  DETAILS
                </Text>

                <View
                  style={{
                    backgroundColor: c.surfaceVariant,
                    borderRadius: 14,
                    overflow: "hidden",
                  }}
                >
                  {onChangeOwnerName ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        borderTopWidth:
                          localCurrency && onChangeCurrency ? 1 : 0,
                        borderTopColor: `${c.onSurface}12`,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: c.onSurface,
                        }}
                      >
                        Owner
                      </Text>
                      <RNTextInput
                        maxLength={ownerNameLimit}
                        onChangeText={(value) =>
                          onChangeOwnerName(value.slice(0, ownerNameLimit))
                        }
                        placeholder="e.g. Stephen"
                        placeholderTextColor={c.onSurfaceVariant}
                        style={{
                          flex: 1,
                          marginLeft: 12,
                          fontSize: 14,
                          textAlign: "right",
                          color: c.onSurface,
                          paddingVertical: 0,
                        }}
                        value={localOwnerName ?? ""}
                      />
                    </View>
                  ) : null}

                  {localCurrency && onChangeCurrency ? (
                    <View
                      style={{
                        borderTopWidth: onChangeOwnerName ? 1 : 0,
                        borderTopColor: `${c.onSurface}12`,
                      }}
                    >
                      <CurrencyPickerField
                        currency={localCurrency}
                        label="Currency"
                        onChange={onChangeCurrency}
                        theme={theme}
                        variant="editorial"
                      />
                    </View>
                  ) : null}
                </View>
              </>
            ) : null}
          </View>

          <View style={{ marginTop: "auto" }}>
            {footer ?? (
              <View style={{ flexDirection: "row", margin: 16, marginTop: 24 }}>
                <Pressable
                  disabled={!canSubmit}
                  onPress={onSubmit}
                  style={({ pressed }) => ({
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    paddingVertical: 14,
                    borderRadius: 14,
                    backgroundColor: previewColor,
                    opacity: pressed ? 0.65 : !canSubmit ? 0.4 : 1,
                  })}
                >
                  <MaterialCommunityIcons
                    color={palette.white}
                    name={isEditing ? "content-save-outline" : "plus"}
                    size={18}
                  />
                  <Text
                    style={{
                      ...typography.editorial.sectionLabel,
                      fontSize: 14,
                      color: palette.white,
                    }}
                  >
                    {isEditing ? submitLabelEdit : submitLabelCreate}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </KeyboardAwareScrollView>
    </>
  );

  if (presentation === "modal") {
    return (
      <AnimatedPaperModal
        contentContainerStyle={{
          backgroundColor: background,
          borderTopLeftRadius: 40,
          borderTopRightRadius: 40,
          maxHeight: "94%",
          overflow: "hidden",
          width: "100%",
        }}
        dismissable={dismissable}
        onDismiss={onBack}
        presentation="sheet"
        visible={visible}
      >
        <View
          accessibilityLabel="Drag handle"
          style={{
            alignItems: "center",
            backgroundColor: background,
            paddingBottom: 6,
            paddingTop: 10,
          }}
        >
          <View
            style={{
              backgroundColor: c.onSurfaceVariant,
              borderRadius: 3,
              height: 5,
              opacity: 0.55,
              width: 42,
            }}
          />
        </View>
        {content}
      </AnimatedPaperModal>
    );
  }

  return content;
}
