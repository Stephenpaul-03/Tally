import { withOpacity } from "@/modules/Common/Utils/Helpers";
import React, { useRef, useState } from "react";
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  View,
  useWindowDimensions,
} from "react-native";

type AdvancedInsightsCarouselProps = {
  cards: { id: string; node: React.ReactNode }[];
  activeColor: string;
  inactiveColor: string;
  containerPadding?: number;
  cardGap?: number;
};

export function AdvancedInsightsCarousel({
  cards,
  activeColor,
  inactiveColor,
  containerPadding = 16,
  cardGap = 16,
}: AdvancedInsightsCarouselProps) {
  const { width: windowWidth } = useWindowDimensions();
  const pageWidth = windowWidth - containerPadding * 2;
  const snapInterval = pageWidth + cardGap;
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  if (cards.length === 0) return null;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(
          event.nativeEvent.contentOffset.x / snapInterval,
        );
        if (index !== activeIndex) setActiveIndex(index);
      },
    },
  );

  return (
    <View style={{ marginBottom: 4 }}>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        decelerationRate="fast"
        snapToInterval={snapInterval}
        snapToAlignment="start"
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={{ marginHorizontal: -containerPadding }}
        contentContainerStyle={{ paddingHorizontal: containerPadding }}
      >
        {cards.map((card, index) => (
          <View
            key={card.id}
            style={{
              width: pageWidth,
              marginRight: index < cards.length - 1 ? cardGap : 0,
            }}
          >
            {card.node}
          </View>
        ))}
      </Animated.ScrollView>

      {cards.length > 1 && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 6,
            marginTop: -4,
            marginBottom: 12,
          }}
        >
          {cards.map((card, index) => (
            <View
              key={card.id}
              style={{
                width: index === activeIndex ? 16 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor:
                  index === activeIndex
                    ? activeColor
                    : withOpacity(inactiveColor, "40"),
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}
