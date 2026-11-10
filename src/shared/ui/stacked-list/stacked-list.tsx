import { createContext, useContext, type ComponentType, type ReactNode } from 'react';
import type { FlatListProps, LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  clamp,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

/** Distance from the top of the list where a card pins; matches the `py-4` list padding. */
const PIN_OFFSET = 16;
/** Scale a pinned card shrinks to once the next card has covered it. */
const COVERED_SCALE = 0.94;

// Reanimated's typings leave out `CellRendererComponent`, which the list itself supports.
const AnimatedFlatList = Animated.FlatList as unknown as ComponentType<FlatListProps<unknown>>;

const ScrollContext = createContext<SharedValue<number> | null>(null);

interface StackedCellProps {
  index: number;
  style?: StyleProp<ViewStyle>;
  onLayout?: (event: LayoutChangeEvent) => void;
  children?: ReactNode;
}

/**
 * Replaces the list's cell wrapper, because the cell is what has the position in the list:
 * once it reaches the top it stays there and shrinks while the next cell slides over it.
 */
function StackedCell({ index, style, onLayout, children }: StackedCellProps) {
  const scrollY = useContext(ScrollContext);
  const reducedMotion = useReducedMotion();
  const top = useSharedValue(0);
  const height = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    // Negative scroll (pull to refresh) leaves the card alone.
    const past = Math.max(0, (scrollY?.get() ?? 0) + PIN_OFFSET - top.get());
    const progress = clamp(past / height.get(), 0, 1);
    return {
      transform: [{ translateY: past }, { scale: 1 - (1 - COVERED_SCALE) * progress }],
    };
  });

  return (
    <Animated.View
      // Later cells sit above earlier ones, so the card coming up covers the pinned one.
      style={[style, { zIndex: index }, reducedMotion ? undefined : animatedStyle]}
      onLayout={(event) => {
        top.set(event.nativeEvent.layout.y);
        height.set(Math.max(1, event.nativeEvent.layout.height));
        onLayout?.(event);
      }}>
      {children}
    </Animated.View>
  );
}

export type StackedListProps<T> = Omit<
  FlatListProps<T>,
  'CellRendererComponent' | 'onScroll' | 'scrollEventThrottle'
>;

/**
 * A `FlatList` whose cards pin to the top and shrink while the next card slides over them.
 * Every card in the list must have the same width; heights can differ.
 */
export function StackedList<T>(props: StackedListProps<T>) {
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
  });

  const listProps = {
    ...props,
    CellRendererComponent: StackedCell,
    onScroll,
    scrollEventThrottle: 16,
  } as FlatListProps<unknown>;

  return (
    <ScrollContext value={scrollY}>
      <AnimatedFlatList {...listProps} />
    </ScrollContext>
  );
}
