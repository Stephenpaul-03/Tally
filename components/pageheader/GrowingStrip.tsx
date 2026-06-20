import React, { useCallback, useMemo, useRef } from "react";
import { FlatList, View } from "react-native";
import { LIST_GAP } from "./constants";
import { clampIndex } from "./Dateutils";
import type { StripItem } from "./types";

export function GrowingStrip({
  items,
  selectedKey,
  listRef,
  rowHeight,
  onReachEnd,
  onReachStart,
  renderItem,
}: {
  items: StripItem[];
  selectedKey: string;
  listRef: React.RefObject<FlatList<StripItem> | null>;
  /** Fixed height for the strip row. Every item (pill or separator
   *  label) stretches to fill it, which keeps separators centered
   *  against the pills next to them regardless of their own content. */
  rowHeight: number;
  onReachEnd?: () => void;
  onReachStart?: () => void;
  renderItem: (item: StripItem, active: boolean) => React.ReactNode;
}) {
  const data = useMemo(() => items, [items]);
  const layoutMap = useMemo(() => {
    let offset = 0;
    return data.map((item, index) => {
      const layout = { length: item.width, offset, index };
      offset += item.width + LIST_GAP;
      return layout;
    });
  }, [data]);

  const selectedIndex = useMemo(
    () => data.findIndex((item) => item.key === selectedKey),
    [data, selectedKey],
  );
  const startGateRef = useRef(false);
  const endGateRef = useRef(false);

  const getItemLayout = useCallback(
    (_: ArrayLike<StripItem> | null | undefined, index: number) =>
      layoutMap[index],
    [layoutMap],
  );
  const separatorOffsets = useMemo(
    () =>
      data
        .map((item, index) => ({
          item,
          offset: layoutMap[index]?.offset ?? 0,
        }))
        .filter(({ item }) => item.type === "label")
        .map(({ offset }) => offset),
    [data, layoutMap],
  );

  const handleEndReached = useCallback(() => {
    onReachEnd?.();
  }, [onReachEnd]);

  const snapToSeparator = useCallback(
    (offsetX: number) => {
      if (!separatorOffsets.length) return;

      const threshold = 30;
      let nearestOffset = separatorOffsets[0];
      let nearestDistance = Math.abs(offsetX - nearestOffset);

      for (const separatorOffset of separatorOffsets) {
        const distance = Math.abs(offsetX - separatorOffset);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestOffset = separatorOffset;
        }
      }

      if (nearestDistance <= threshold) {
        listRef.current?.scrollToOffset({
          offset: nearestOffset,
          animated: true,
        });
      }
    },
    [listRef, separatorOffsets],
  );

  const handleScroll = useCallback(
    (event: {
      nativeEvent: {
        contentOffset: { x: number };
        layoutMeasurement: { width: number };
        contentSize: { width: number };
      };
    }) => {
      const { x } = event.nativeEvent.contentOffset;
      const visibleWidth = event.nativeEvent.layoutMeasurement.width;
      const contentWidth = event.nativeEvent.contentSize.width;
      const nearStart = x < 32;
      const nearEnd = contentWidth - (x + visibleWidth) < 32;

      if (nearStart && !startGateRef.current) {
        startGateRef.current = true;
        onReachStart?.();
      }
      if (!nearStart) {
        startGateRef.current = false;
      }

      if (nearEnd && !endGateRef.current) {
        endGateRef.current = true;
        onReachEnd?.();
      }
      if (!nearEnd) {
        endGateRef.current = false;
      }
    },
    [onReachEnd, onReachStart],
  );

  return (
    <FlatList
      ref={listRef}
      horizontal
      data={data}
      keyExtractor={(item) => item.key}
      getItemLayout={getItemLayout}
      initialScrollIndex={Math.max(0, selectedIndex)}
      showsHorizontalScrollIndicator={false}
      style={{ height: rowHeight }}
      contentContainerStyle={{
        paddingHorizontal: 12,
        alignItems: "stretch",
      }}
      ItemSeparatorComponent={() => <View style={{ width: LIST_GAP }} />}
      decelerationRate="normal"
      onScroll={handleScroll}
      scrollEventThrottle={16}
      onMomentumScrollEnd={(event) => {
        snapToSeparator(event.nativeEvent.contentOffset.x);
      }}
      onScrollEndDrag={(event) => {
        snapToSeparator(event.nativeEvent.contentOffset.x);
      }}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.2}
      maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
      onScrollToIndexFailed={(info) => {
        setTimeout(() => {
          listRef.current?.scrollToIndex({
            index: clampIndex(info.index, data.length),
            animated: false,
          });
        }, 50);
      }}
      renderItem={({ item }) => {
        const active = item.key === selectedKey;
        return <View>{renderItem(item, active)}</View>;
      }}
    />
  );
}
