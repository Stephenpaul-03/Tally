import { useFadeSlide } from "@/components/animations/UseFadeSlide";
import { useStagger } from "@/components/animations/UseStagger";
import { withOpacity } from "@/utils/Helpers";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { ReactNode } from "react";
import { Animated, Pressable, View } from "react-native";
import { Text } from "react-native-paper";

// ─── Row data shape ────────────────────────────────────────────────────────────

export type BreakdownRowItem = {
  key: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  accent: string;
  label: string;
  amount: number;
  percentage: number;
};

// ─── Shared row constants ─────────────────────────────────────────────────────

const ROW_ICON_BOX = 20;
const ROW_ICON_SIZE = 20;

// ─── Border header ────────────────────────────────────────────────────────────

type BorderHeaderProps = {
  title: string;
  muted: string;
  accentColor: string;
  surfaceColor: string;
  hasData: boolean;
  outline: string;
  viewAllLabel: string;
  onViewAll: () => void;
};

function BorderHeader({
  title,
  muted,
  outline,
  accentColor,
  surfaceColor,
  hasData,
  viewAllLabel,
  onViewAll,
}: BorderHeaderProps) {
  return (
    <View
      style={{
        position: "absolute",
        top: -12,
        left: 0,
        right: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
      }}
      pointerEvents="box-none"
    >
      <View
        style={{
          backgroundColor: surfaceColor,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 20,
          borderColor: outline,
          borderWidth: 0.5,
        }}
      >
        <Text
          style={{
            fontSize: 10,
            lineHeight: 16,
            fontWeight: "600",
            letterSpacing: 0.8,
            color: accentColor,
            textTransform: "uppercase",
          }}
        >
          {title}
        </Text>
      </View>

      {hasData ? (
        <Pressable
          onPress={onViewAll}
          hitSlop={20}
          style={({ pressed }) => ({
            backgroundColor: surfaceColor,
            borderRadius: 20,
            borderColor: outline,
            borderWidth: 0.5,
            paddingHorizontal: 8,
            paddingVertical: 4,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text
            style={{
              fontSize: 9,
              lineHeight: 16,
              fontWeight: "400",
              letterSpacing: 0.8,
              color: muted,
              textTransform: "uppercase",
            }}
          >
            {viewAllLabel}
          </Text>
          <MaterialCommunityIcons name="arrow-right" size={12} color={muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

type RowProps = {
  item: BreakdownRowItem;
  outline: string;
  textColor: string;
  muted: string;
  iconNode: ReactNode;
  formatAmount: (amount: number) => string;
  onPress: () => void;
};

function BreakdownRow({
  item,
  textColor,
  muted,
  iconNode,
  formatAmount,
  onPress,
}: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: withOpacity(textColor, pressed ? "08" : "00"),
        opacity: pressed ? 0.85 : 1,
        paddingVertical: 6,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {iconNode}
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 14,
              fontWeight: "500",
              letterSpacing: 0.2,
              color: textColor,
            }}
          >
            {item.label}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 2 }}>
          <Text style={{ fontSize: 14, fontWeight: "500", color: textColor }}>
            {formatAmount(Math.round(item.amount))}
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={26}
          color={withOpacity(muted, "CC")}
        />
      </View>
    </Pressable>
  );
}

// ─── Default icon box ─────────────────────────────────────────────────────────

export type DefaultIconBoxProps = {
  item: BreakdownRowItem;
  resolvedAccent: string;
};

export function DefaultIconBox({ item, resolvedAccent }: DefaultIconBoxProps) {
  return (
    <View
      style={{
        width: ROW_ICON_BOX,
        height: ROW_ICON_BOX,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <MaterialCommunityIcons
        name={item.icon}
        size={ROW_ICON_SIZE}
        color={resolvedAccent}
      />
    </View>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export type CardPadding = {
  horizontal?: number;
  top?: number;
  bottom?: number;
};

const DEFAULT_PADDING: Required<CardPadding> = {
  horizontal: 20,
  top: 25,
  bottom: 15,
};

export type GenericBreakdownCardProps = {
  title: string;
  viewAllLabel?: string;
  bg: string;
  outline: string;
  textColor: string;
  accentColor: string;
  muted: string;
  formatAmount: (amount: number) => string;
  emptyMessage?: string;
  showViewAll?: boolean;
  /** Override card padding. Unspecified keys fall back to defaults (horizontal: 20, top: 25, bottom: 15). */
  padding?: CardPadding;
};

type GenericBreakdownCardRowRendererProps<T extends BreakdownRowItem> = {
  item: T;
  index: number;
  outline: string;
  textColor: string;
  accentColor: string;
  muted: string;
  formatAmount: (amount: number) => string;
  iconNode: ReactNode;
  onPress: () => void;
};

export type GenericBreakdownCardTypedProps<T extends BreakdownRowItem> =
  GenericBreakdownCardProps & {
    title: string;
    items: T[];
    onRowPress: (item: T) => void;
    renderSheet: (props: {
      visible: boolean;
      onDismiss: () => void;
    }) => ReactNode | null;
    buildIcon: (item: T) => ReactNode;
    renderRow?: (props: GenericBreakdownCardRowRendererProps<T>) => ReactNode;
  };

export function GenericBreakdownCard<T extends BreakdownRowItem>({
  title,
  viewAllLabel = "View All",
  items,
  bg,
  outline,
  textColor,
  accentColor,
  muted,
  formatAmount,
  emptyMessage = "Add transactions to see a breakdown.",
  showViewAll = true,
  padding,
  onRowPress,
  renderSheet,
  buildIcon,
  renderRow,
}: GenericBreakdownCardTypedProps<T>) {
  const [sheetVisible, setSheetVisible] = React.useState(false);

  const { animStyle } = useFadeSlide({
    from: "bottom",
    distance: 20,
    duration: 750,
  });

  const topItems = items.slice(0, 3);
  const hasData = topItems.length > 0;

  const { getAnimStyle } = useStagger({
    count: topItems.length,
    stagger: 100,
    distance: 20,
    duration: 750,
    dataKey: topItems.map((i) => i.key).join("|"),
  });

  const resolvedPadding: Required<CardPadding> = {
    horizontal: padding?.horizontal ?? DEFAULT_PADDING.horizontal,
    top: padding?.top ?? DEFAULT_PADDING.top,
    bottom: padding?.bottom ?? DEFAULT_PADDING.bottom,
  };

  return (
    <>
      <Animated.View
        style={{
          backgroundColor: bg,
          marginTop: 30,
          borderRadius: 20,
          borderWidth: 0.5,
          borderColor: outline,
          overflow: "visible",
          paddingHorizontal: resolvedPadding.horizontal,
          paddingTop: resolvedPadding.top,
          paddingBottom: resolvedPadding.bottom,
          gap: 0,
          position: "relative",
          opacity: animStyle.opacity,
          transform: animStyle.transform,
        }}
      >
        <BorderHeader
          title={title}
          muted={muted}
          outline={outline}
          surfaceColor={bg}
          accentColor={accentColor}
          hasData={hasData && showViewAll}
          viewAllLabel={viewAllLabel}
          onViewAll={() => setSheetVisible(true)}
        />

        {hasData ? (
          <View style={{ gap: 0 }}>
            {topItems.map((item, index) => (
              <Animated.View key={item.key} style={[getAnimStyle(index)]}>
                {renderRow ? (
                  renderRow({
                    item,
                    index,
                    outline,
                    textColor,
                    accentColor,
                    muted,
                    formatAmount,
                    iconNode: buildIcon(item),
                    onPress: () => onRowPress(item),
                  })
                ) : (
                  <BreakdownRow
                    item={item}
                    outline={outline}
                    textColor={textColor}
                    muted={muted}
                    iconNode={buildIcon(item)}
                    formatAmount={formatAmount}
                    onPress={() => onRowPress(item)}
                  />
                )}
              </Animated.View>
            ))}
          </View>
        ) : (
          <Text
            style={{
              fontSize: 13,
              color: muted,
              textAlign: "center",
              paddingVertical: 22,
              lineHeight: 20,
            }}
          >
            {emptyMessage}
          </Text>
        )}
      </Animated.View>

      {renderSheet({
        visible: sheetVisible,
        onDismiss: () => setSheetVisible(false),
      })}
    </>
  );
}
